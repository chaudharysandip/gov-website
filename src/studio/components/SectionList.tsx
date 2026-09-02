"use client";

/**
 * The node column.
 *
 * This is the page's outline: the sections the theme renders, in the order they
 * appear, with the two operations that cannot break a template — reorder and
 * hide. Nothing can be nested into anything, and nothing new can be inserted,
 * because the template owns the layout.
 *
 * What is new is the third mark on each row. A section that carries a style
 * override at a breakpoint lights that breakpoint's tick, so the column answers
 * "where have I actually changed something" without opening a single panel.
 * That fact used to cost a tab switch and a section-by-section walk.
 *
 * Reordering is a drag, with a line showing where the section will land.
 *
 * A section the user removed is not gone: it drops to "off the page" and can be
 * put back. Removal that cannot be undone except by undo is a trap.
 */

import type { DragEvent, ReactNode } from "react";
import type { SectionDefinition, SectionState } from "@/studio/types";
import { useRef, useState } from "react";
import {
  Eye,
  EyeOff,
  GripVertical,
  Layers,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Input } from "@edn/site-themes/components/ui/input";
import { cn } from "@edn/site-themes/lib/utils";
import { Button } from "@edn/site-themes/components/ui/button";
import { ScrollArea } from "@edn/site-themes/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@edn/site-themes/components/ui/tooltip";
import { useEditorStore } from "@/studio/store/editor-store";
import { useEditorKeydown } from "@/studio/lib/use-editor-keydown";
import { selectSections, selectSectionState } from "@/studio/store/selectors";
import { OverrideMarks, Placard, Readout } from "@/studio/components/bay";

/**
 * A section's shape, drawn at the size a list row can hold.
 *
 * There is no screenshot of a section to show — the themes render them, and
 * nothing renders one small. What *is* known before the page draws is the
 * manifest's `kind`, and the layouts behind those kinds fall into a handful of
 * arrangements: a hero is a headline over a button, a gallery is a grid of
 * tiles, statistics are columns of different heights. That arrangement is the
 * part you recognise at a glance, so it is the part the thumbnail draws.
 */
type Shape = keyof typeof SHAPES;

/** One block of a wireframe. Sizes are in device pixels: the drawing is 40×24. */
const bar = (className: string) => <span className={cn("block rounded-[1px]", className)} />;

const SHAPES = {
  /** Headline, sub-line, button — the shape of every hero. */
  hero: (
    <span className="flex size-full flex-col justify-center gap-0.5 px-0.75">
      {bar("h-[3px] w-4/5 bg-foreground/40")}
      {bar("h-[2px] w-3/5 bg-foreground/22")}
      {bar("mt-[1px] h-[3px] w-1/4 bg-primary/70")}
    </span>
  ),
  /** Text one side, picture the other. */
  split: (
    <span className="flex size-full items-center gap-0.75">
      <span className="flex flex-1 flex-col gap-0.5">
        {bar("h-[2px] w-full bg-foreground/34")}
        {bar("h-[2px] w-4/5 bg-foreground/22")}
        {bar("h-[2px] w-3/5 bg-foreground/22")}
      </span>
      {bar("h-full w-[13px] bg-foreground/28")}
    </span>
  ),
  /** Three cards across. */
  cards: (
    <span className="flex size-full items-stretch gap-0.5">
      {bar("flex-1 bg-foreground/28")}
      {bar("flex-1 bg-foreground/28")}
      {bar("flex-1 bg-foreground/28")}
    </span>
  ),
  /** A grid of pictures. */
  grid: (
    <span className="grid size-full grid-cols-3 grid-rows-2 gap-0.5">
      {bar("bg-foreground/28")}
      {bar("bg-foreground/34")}
      {bar("bg-foreground/22")}
      {bar("bg-foreground/22")}
      {bar("bg-foreground/28")}
      {bar("bg-foreground/34")}
    </span>
  ),
  /** Rows with a marker: notices, news, events, downloads, questions. */
  list: (
    <span className="flex size-full flex-col justify-center gap-0.75">
      <span className="flex items-center gap-0.75">
        {bar("size-[4px] bg-foreground/34")}
        {bar("h-[2px] flex-1 bg-foreground/22")}
      </span>
      <span className="flex items-center gap-0.75">
        {bar("size-[4px] bg-foreground/34")}
        {bar("h-[2px] flex-1 bg-foreground/22")}
      </span>
      <span className="flex items-center gap-0.75">
        {bar("size-[4px] bg-foreground/34")}
        {bar("h-[2px] flex-1 bg-foreground/22")}
      </span>
    </span>
  ),
  /** Columns of different heights. */
  stats: (
    <span className="flex size-full items-end gap-0.75">
      {bar("h-2/5 flex-1 bg-foreground/28")}
      {bar("h-4/5 flex-1 bg-primary/55")}
      {bar("h-3/5 flex-1 bg-foreground/28")}
      {bar("h-full flex-1 bg-foreground/22")}
    </span>
  ),
  /** A row of marks: partners, awards. */
  logos: (
    <span className="flex size-full items-center gap-0.75">
      {bar("h-[5px] flex-1 rounded-full bg-foreground/28")}
      {bar("h-[5px] flex-1 rounded-full bg-foreground/28")}
      {bar("h-[5px] flex-1 rounded-full bg-foreground/28")}
    </span>
  ),
  /** Faces over names. */
  people: (
    <span className="flex size-full items-center justify-center gap-1">
      {[0, 1, 2].map((n) => (
        <span key={n} className="flex flex-col items-center gap-0.5">
          {bar("size-[7px] rounded-full bg-foreground/34")}
          {bar("h-[2px] w-[7px] bg-foreground/22")}
        </span>
      ))}
    </span>
  ),
  /** One card, centred: a testimonial. */
  quote: (
    <span className="flex size-full items-center justify-center px-1">
      <span className="flex w-full flex-col items-center gap-0.5 rounded-[2px] bg-foreground/14 py-0.75">
        {bar("h-[2px] w-4/5 bg-foreground/34")}
        {bar("h-[2px] w-3/5 bg-foreground/22")}
      </span>
    </span>
  ),
  /** A line and a button: calls to action, admission, contact. */
  banner: (
    <span className="flex size-full flex-col items-center justify-center gap-0.75">
      {bar("h-[2px] w-3/5 bg-foreground/34")}
      {bar("h-[4px] w-1/3 bg-primary/70")}
    </span>
  ),
  /** The bar across the top of every page. */
  topbar: (
    <span className="flex size-full flex-col gap-0.75">
      {bar("h-[5px] w-full bg-foreground/40")}
      {bar("h-full w-full bg-foreground/12")}
    </span>
  ),
  /** And the one across the bottom. */
  bottombar: (
    <span className="flex size-full flex-col gap-0.75">
      {bar("h-full w-full bg-foreground/12")}
      {bar("h-[5px] w-full bg-foreground/40")}
    </span>
  ),
  /** Anything unclassified. */
  block: <span className="block size-full rounded-[2px] bg-foreground/22" />,
} as const;

const KIND_SHAPES: Record<string, Shape> = {
  hero: "hero",
  about: "split",
  programs: "cards",
  services: "cards",
  features: "cards",
  facilities: "cards",
  gallery: "grid",
  portfolio: "grid",
  testimonials: "quote",
  statistics: "stats",
  partners: "logos",
  team: "people",
  notices: "list",
  news: "list",
  events: "list",
  downloads: "list",
  faq: "list",
  admission: "banner",
  cta: "banner",
  contact: "banner",
  header: "topbar",
  footer: "bottombar",
  generic: "block",
};

/**
 * The section's shape, which becomes the grip on hover.
 *
 * One slot rather than two: the thumbnail says what the row is, and the moment
 * the pointer arrives it says what the row does instead. Nothing moves.
 */
function SectionThumb({
  kind,
  draggable = true,
  selected = false,
  className,
}: {
  kind?: string;
  draggable?: boolean;
  selected?: boolean;
  className?: string;
}) {
  const shape: ReactNode = SHAPES[KIND_SHAPES[kind ?? ""] ?? "block"];

  return (
    <span
      className={cn(
        // `block` on the drawing itself, not left to the parent: in a row it is
        // a flex item and sizes either way, but on the rail its parent is a
        // plain button, where an inline span would ignore its own dimensions
        // and collapse to the width of the marks inside it.
        "group/thumb relative block h-6 w-10 shrink-0 overflow-hidden rounded-[2px] border p-0.75 transition-colors duration-150",
        selected
          ? "border-[color-mix(in_oklab,var(--studio-live)_45%,transparent)] bg-studio-deep"
          : "border-studio-edge bg-studio-deep",
        className,
      )}
      aria-hidden
    >
      {shape}
      {draggable ? (
        <span className="absolute inset-0 flex items-center justify-center bg-studio-deep/80 opacity-0 transition-opacity group-hover:opacity-100">
          <GripVertical className="size-3 text-studio-dim" />
        </span>
      ) : null}
    </span>
  );
}

/** Shared row shell: the ground, the live tick, and the hover state. */
const rowShell = (selected: boolean) =>
  cn(
    "group relative flex items-center gap-1 rounded-[3px] pr-1 pl-1.5 transition-colors duration-150",
    selected
      ? "bg-studio-hi"
      : "hover:bg-studio-surface",
  );

/** The 2px bar that says this node is the live one. Nothing else is teal here. */
function LiveTick({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute inset-y-1 left-0 w-[2px] rounded-full transition-opacity duration-150",
        on ? "bg-studio-live opacity-100" : "opacity-0",
      )}
    />
  );
}

/** The eye, which is a lamp: lit while the section is on the page. */
function VisibilityToggle({
  visible,
  label,
  onToggle,
  always,
}: {
  visible: boolean;
  label: string;
  onToggle: () => void;
  always?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={cn(
        "size-6 shrink-0 rounded-[2px] transition-opacity hover:bg-studio-hi",
        visible && !always && "opacity-0 focus-visible:opacity-100 group-hover:opacity-100",
      )}
      onClick={onToggle}
      aria-label={visible ? `Hide ${label}` : `Show ${label}`}
      title={visible ? "On the page" : "Hidden"}
    >
      {visible ? (
        <Eye className="size-3.5 text-studio-dim" />
      ) : (
        <EyeOff className="size-3.5 text-studio-caution" />
      )}
    </Button>
  );
}

/**
 * The header or the footer.
 *
 * They select and hide like a section and are styled by the same panels, but
 * they are the theme's chrome rather than the page's content: they cannot be
 * reordered, and they cannot be taken off the page — so no grip, and no bin.
 */
function ChromeRow({ definition }: { definition: SectionDefinition }) {
  const selectSection = useEditorStore((state) => state.selectSection);
  const toggleSection = useEditorStore((state) => state.toggleSection);
  const isSelected = useEditorStore((state) => state.selectedSectionId === definition.id);
  const state = useEditorStore((store) => selectSectionState(store, definition.id));
  const visible = state?.visible !== false;

  return (
    <div className={rowShell(isSelected)}>
      <LiveTick on={isSelected} />
      <button
        type="button"
        onClick={() => selectSection(definition.id)}
        aria-current={isSelected ? "true" : undefined}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 rounded-[2px] py-1.5 text-left text-[13px]",
          "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
          isSelected ? "font-medium text-studio-ink" : "text-studio-dim",
          !visible && "line-through decoration-studio-faint/60",
        )}
      >
        <SectionThumb kind={definition.kind} draggable={false} selected={isSelected} />
        <span className="truncate">{definition.label}</span>
      </button>

      <OverrideMarks styles={state?.styles} />

      {/* The chrome rows cannot be taken off the page, so they have no bin —
          and without this they would hang their marks a bin's width further
          right than every section row, which is exactly the ragged edge that
          stops a column being scannable. */}
      <span className="size-6 shrink-0" aria-hidden />

      <VisibilityToggle
        visible={visible}
        label={definition.label.toLowerCase()}
        onToggle={() => toggleSection(definition.id)}
      />
    </div>
  );
}

/** What one row needs to know about a drag in progress. */
interface DragHandlers {
  /** The row being dragged, or null. */
  from: number | null;
  /** Where it would land: an insertion point between rows, 0 to `total`. */
  at: number | null;
  start: (index: number) => void;
  over: (index: number, event: DragEvent<HTMLElement>) => void;
  end: () => void;
}

function SectionRow({
  entry,
  label,
  kind,
  index,
  total,
  isSelected,
  drag,
  reorderable = true,
}: {
  entry: SectionState;
  label: string;
  kind?: string;
  index: number;
  total: number;
  isSelected: boolean;
  drag: DragHandlers;
  reorderable?: boolean;
}) {
  const selectSection = useEditorStore((state) => state.selectSection);
  const toggleSection = useEditorStore((state) => state.toggleSection);
  const removeSection = useEditorStore((state) => state.removeSection);

  const visible = entry.visible !== false;
  const dragging = drag.from === index;
  const isDrag = drag.from !== null;

  return (
    <li
      draggable={reorderable}
      onDragStart={(event) => {
        // A payload is required for the drag to start in Firefox, and the id is
        // the honest thing to carry.
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", entry.id);
        drag.start(index);
      }}
      onDragOver={(event) => drag.over(index, event)}
      onDragEnd={drag.end}
      className={cn("relative", dragging && "opacity-35")}
    >
      {/* The line lands between rows, so it is drawn on the row below the gap —
          and on the last row's underside for a drop at the end. */}
      {isDrag && drag.at === index ? (
        <span
          className="pointer-events-none absolute inset-x-0 -top-px z-10 h-0.5 rounded-full bg-studio-live shadow-[0_0_8px_0_color-mix(in_oklab,var(--studio-live)_70%,transparent)]"
          aria-hidden
        />
      ) : null}
      {isDrag && drag.at === total && index === total - 1 ? (
        <span
          className="pointer-events-none absolute inset-x-0 -bottom-px z-10 h-0.5 rounded-full bg-studio-live shadow-[0_0_8px_0_color-mix(in_oklab,var(--studio-live)_70%,transparent)]"
          aria-hidden
        />
      ) : null}

      <div className={rowShell(isSelected)}>
        <LiveTick on={isSelected} />

        {/* The glyph rides inside the label rather than beside it: a column of
            its own would push the last button past the edge of the panel. */}
        <button
          type="button"
          onClick={() => selectSection(entry.id)}
          aria-current={isSelected ? "true" : undefined}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 rounded-[2px] py-1.5 text-left text-[13px]",
            reorderable && "cursor-grab active:cursor-grabbing",
            "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
            isSelected ? "font-medium text-studio-ink" : "text-studio-dim",
            !visible && "line-through decoration-studio-faint/60",
          )}
        >
          <SectionThumb kind={kind} selected={isSelected} draggable={reorderable} />
          <span className="truncate">{label}</span>
        </button>

        <OverrideMarks styles={entry.styles} />

        <Button
          variant="ghost"
          size="icon-sm"
          className="size-6 shrink-0 rounded-[2px] opacity-0 transition-opacity hover:bg-studio-hi hover:text-studio-stop focus-visible:opacity-100 group-hover:opacity-100"
          onClick={() => removeSection(entry.id)}
          aria-label={`Take ${label} off the page (Del)`}
        >
          <Trash2 className="size-3.5" />
        </Button>

        <VisibilityToggle
          visible={visible}
          label={label}
          onToggle={() => toggleSection(entry.id)}
        />
      </div>
    </li>
  );
}

export function SectionList() {
  const editorConfig = useEditorStore((state) => state.editorConfig);
  const sections = useEditorStore(selectSections);
  const isOpen = useEditorStore((state) => state.sectionsPanelOpen);
  const toggleOpen = useEditorStore((state) => state.toggleSectionsPanel);
  const selectedSectionId = useEditorStore((state) => state.selectedSectionId);
  const selectSection = useEditorStore((state) => state.selectSection);
  const addSection = useEditorStore((state) => state.addSection);
  const moveSection = useEditorStore((state) => state.moveSection);

  // Where the drag started, and the insertion point it is currently over. Both
  // live here rather than in the row, because the line a row draws depends on
  // which *other* row the pointer is on.
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragAt, setDragAt] = useState<number | null>(null);

  // Typing narrows the column; it never reorders or hides anything. A filter
  // that changed the document would be a filter you had to undo.
  const [query, setQuery] = useState("");
  const filterInput = useRef<HTMLInputElement>(null);
  const needle = query.trim().toLowerCase();

  // `/` reaches for the filter from anywhere that is not already a field, which
  // is the one keystroke that turns a fourteen-row scan into a jump.
  useEditorKeydown((event) => {
    if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
    ) {
      return;
    }
    if (!useEditorStore.getState().sectionsPanelOpen) return;
    event.preventDefault();
    filterInput.current?.focus();
    filterInput.current?.select();
  });

  const drag: DragHandlers = {
    from: dragFrom,
    at: dragAt,
    start: setDragFrom,
    over: (index, event) => {
      if (dragFrom === null) return;
      // Without this the browser refuses the drop and runs its own animation
      // of the row snapping back.
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      const box = event.currentTarget.getBoundingClientRect();
      setDragAt(index + (event.clientY - box.top > box.height / 2 ? 1 : 0));
    },
    end: () => {
      setDragFrom(null);
      setDragAt(null);
    },
  };

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    if (dragFrom !== null && dragAt !== null) {
      // An insertion point after the dragged row counts one row that is about
      // to leave, so the destination index is one less than the gap.
      const to = dragAt > dragFrom ? dragAt - 1 : dragAt;
      if (to !== dragFrom) moveSection(dragFrom, to);
    }
    drag.end();
  };

  // The label and the kind both come from the template's manifest; the
  // document only carries which sections are on the page and in what order.
  const configFor = (id: string) => editorConfig?.sections.find((section) => section.id === id);

  const chrome = editorConfig?.chrome ?? [];

  const onPage = new Set(sections.map((section) => section.id));
  const removed = (editorConfig?.sections ?? []).filter((section) => !onPage.has(section.id));

  const matches = (label: string) => !needle || label.toLowerCase().includes(needle);
  const visibleSections = sections.filter((entry) =>
    matches(configFor(entry.id)?.label ?? entry.id),
  );
  const visibleRemoved = removed.filter((section) => matches(section.label));
  const visibleChrome = chrome.filter((entry) => matches(entry.label));
  const nothingMatches =
    Boolean(needle) && !visibleSections.length && !visibleRemoved.length && !visibleChrome.length;

  /** Enter takes the first match, so a filter is a jump rather than a shortlist. */
  const jumpToFirst = () => {
    const first = visibleSections[0] ?? visibleChrome[0];
    if (first) selectSection("id" in first ? first.id : (first as { id: string }).id);
  };

  /**
   * The rail: the same drawings, at the width of the drawings.
   *
   * A wireframe is what the eye recognises a section by, so collapsing the
   * column keeps every row reachable rather than leaving a button whose only
   * job is to undo the collapse. It is also what a window too narrow to hold
   * the column gets, whatever the store says — below 1536px the column and the
   * inspector together leave the canvas under 800px, which is not a desktop
   * preview of anything.
   */
  const rail = (
    <div
      className={cn(
        "flex h-full w-13 shrink-0 flex-col items-center gap-1 border-r border-studio-line bg-studio-panel py-2",
        isOpen && "2xl:hidden",
      )}
    >
      {/* The head names what the rail is, and the count sits under it rather
          than alone at the far edge, where a bare number belongs to nothing.
          The control to widen appears only when the rail is the user's own
          choice: when the window is what narrowed it, an offer to widen would
          be an offer that does nothing. */}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex flex-col items-center gap-0.5">
            {isOpen ? (
              <Layers className="size-4 shrink-0 text-studio-faint" aria-hidden />
            ) : (
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7 shrink-0 rounded-[3px] text-studio-dim hover:bg-studio-surface hover:text-studio-ink"
                onClick={toggleOpen}
                aria-label="Show the section list"
              >
                <PanelLeftOpen className="size-4" />
              </Button>
            )}
            <Readout className="text-studio-faint">{sections.length}</Readout>
          </span>
        </TooltipTrigger>
        <TooltipContent side="right">
          {sections.length} section{sections.length === 1 ? "" : "s"} on the page
        </TooltipContent>
      </Tooltip>

        <ScrollArea className="min-h-0 w-full flex-1">
          <div className="flex flex-col items-center gap-1 py-1">
            {sections.map((entry) => {
              const definition = configFor(entry.id);
              const label = definition?.label ?? entry.id;
              const isSelected = selectedSectionId === entry.id;
              return (
                <Tooltip key={entry.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => selectSection(entry.id)}
                      aria-current={isSelected ? "true" : undefined}
                      aria-label={label}
                      className={cn(
                        "relative flex flex-col items-center gap-[3px] rounded-[3px] p-1 transition-colors",
                        "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                        isSelected
                          ? "bg-studio-hi"
                          : "hover:bg-studio-surface",
                        entry.visible === false && "opacity-40",
                      )}
                    >
                      <LiveTick on={isSelected} />
                      <SectionThumb
                        kind={definition?.kind}
                        draggable={false}
                        selected={isSelected}
                      />
                      <OverrideMarks styles={entry.styles} compact />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </ScrollArea>

    </div>
  );

  if (!isOpen) return rail;

  return (
    <>
      {rail}
      <aside
        className="hidden h-full w-58 shrink-0 flex-col border-r border-studio-line bg-studio-panel 2xl:flex"
        aria-label="Sections"
      >
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-studio-line pr-1 pl-3">
        <Placard className="flex-1">Sections</Placard>
        <Readout className="text-studio-faint">{sections.length}</Readout>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-6 rounded-[2px] text-studio-faint hover:bg-studio-surface hover:text-studio-ink"
              onClick={toggleOpen}
              aria-label="Hide the section list"
            >
              <PanelLeftClose className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Collapse</TooltipContent>
        </Tooltip>
      </div>

      <div className="relative shrink-0 border-b border-studio-line px-2 py-2">
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-3 -translate-y-1/2 text-studio-faint"
          aria-hidden
        />
        <Input
          ref={filterInput}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") jumpToFirst();
            if (event.key === "Escape") {
              setQuery("");
              event.currentTarget.blur();
              // Escape belongs to the field while it has something to clear;
              // letting it through would also drop the canvas selection.
              event.stopPropagation();
            }
          }}
          placeholder="Filter  /"
          aria-label="Filter sections by name"
          className="h-7 rounded-[3px] border-studio-line bg-studio-deep pr-6 pl-7 text-[12px]"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear the filter"
            className="absolute top-1/2 right-4 -translate-y-1/2 rounded-[2px] p-0.5 text-studio-faint hover:text-studio-ink focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <X className="size-3" />
          </button>
        ) : null}
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="p-1.5">
          {/* The chrome brackets the page, in the column as on the screen: the
              header above the sections, the footer below them, and both set
              apart because they belong to every page rather than to this one. */}
          {chrome[0] && matches(chrome[0].label) ? (
            <div className="mb-1.5 border-b border-dashed border-studio-line pb-1.5">
              <ChromeRow definition={chrome[0]} />
            </div>
          ) : null}

          {sections.length ? (
            // The list takes the drop, not the row: releasing in the gap
            // beside a row is still a drop at the line that is showing.
            //
            // Every row carries its index in the *document*, not in the
            // filtered view, because that is what `moveSection` moves. Dragging
            // is off while a filter is on for the same reason: dropping between
            // two rows that are not adjacent on the page has no honest meaning.
            <ul
              className="space-y-px"
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              {visibleSections.map((entry) => (
                <SectionRow
                  key={entry.id}
                  entry={entry}
                  label={configFor(entry.id)?.label ?? entry.id}
                  kind={configFor(entry.id)?.kind}
                  index={sections.indexOf(entry)}
                  total={sections.length}
                  isSelected={selectedSectionId === entry.id}
                  drag={drag}
                  reorderable={!needle}
                />
              ))}
            </ul>
          ) : (
            <p className="px-2 py-8 text-center text-[12px] text-studio-faint">
              This template has no editable sections.
            </p>
          )}

          {nothingMatches ? (
            <p className="px-2 py-8 text-center text-[12px] text-studio-faint">
              Nothing here is called &ldquo;{query.trim()}&rdquo;.
            </p>
          ) : null}

          {chrome[1] && matches(chrome[1].label) ? (
            <div className="mt-1.5 border-t border-dashed border-studio-line pt-1.5">
              <ChromeRow definition={chrome[1]} />
            </div>
          ) : null}

          {visibleRemoved.length ? (
            <div className="mt-4 border-t border-studio-line pt-2.5">
              <div className="mb-1 flex items-center gap-2 px-1.5">
                <Placard className="flex-1">Off the page</Placard>
                <Readout className="text-studio-faint">{visibleRemoved.length}</Readout>
              </div>
              <ul className="space-y-px">
                {visibleRemoved.map((section) => (
                  <li key={section.id}>
                    <div className={rowShell(false)}>
                      <span className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-[13px] text-studio-faint">
                        <SectionThumb kind={section.kind} draggable={false} className="opacity-50" />
                        <span className="truncate">{section.label}</span>
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="size-6 shrink-0 rounded-[2px] hover:bg-studio-hi hover:text-studio-live"
                            onClick={() => addSection(section.id)}
                            aria-label={`Put ${section.label} back on the page`}
                          >
                            <Plus className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Add back at the end</TooltipContent>
                      </Tooltip>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          </div>
        </ScrollArea>
      </aside>
    </>
  );
}
