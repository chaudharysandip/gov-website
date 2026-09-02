"use client";

/**
 * The top rail: the title block, the transport, and the state of the document.
 *
 * It used to carry the canvas's controls in its middle third as well, which is
 * why what you were editing had to be whispered in eleven pixels off to one
 * side. Those controls now live on the canvas, in the scope strip, and the rail
 * spends the space it got back on the two things only it can say: which site
 * this is, and whether the work is safe.
 *
 * Every destination that leaves the editor — preview, the site list — is a real
 * link, so it works with a middle click and reads correctly to a screen reader.
 * Icon-only buttons all carry a tooltip and an accessible name.
 */

import type { ChangeEvent, ReactNode } from "react";
import type { ThemeDescriptor } from "@/studio/types";
import Link from "next/link";
import { useRef, useSyncExternalStore } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Download,
  Eye,
  Keyboard,
  MoreVertical,
  Redo2,
  RotateCcw,
  Save,
  Undo2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@edn/site-themes/lib/utils";
import { Button } from "@edn/site-themes/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@edn/site-themes/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@edn/site-themes/components/ui/dropdown-menu";
import { useEditorStore } from "@/studio/store/editor-store";
import { Groove, Lamp, Placard } from "@/studio/components/bay";

/**
 * A template by its number, the way WMS names it (`uniqueCode: "Theme-15"`) and
 * the way everyone here refers to it. The descriptive name is what the template
 * *is*; the number is which one it is, and the number is what you say out loud.
 */
const themeLabel = (id = "") => id.replace(/^theme-/i, "Theme-");

/**
 * A template's screenshot, at the size of a menu row.
 *
 * The ones that ship no screenshot get their own number over a wash of their
 * accent, mixed against the popover tokens so a near-black accent stays legible
 * in either palette — the same treatment the gallery gives them, in miniature.
 */
function ThemeThumb({ theme }: { theme: ThemeDescriptor }) {
  return (
    <span className="h-8 w-13 shrink-0 overflow-hidden rounded-[2px] border border-studio-edge bg-studio-surface">
      {theme.preview ? (
        // A static file in /public: not worth the optimiser round trip.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={theme.preview} alt="" loading="lazy" className="size-full object-cover object-top" />
      ) : (
        <span
          className="flex size-full items-center justify-center text-[10px] font-semibold tabular-nums"
          style={{
            background: `linear-gradient(140deg, color-mix(in oklab, ${theme.accent} 30%, var(--popover)), color-mix(in oklab, ${theme.accent} 10%, var(--popover)))`,
            color: `color-mix(in oklab, ${theme.accent} 70%, var(--popover-foreground))`,
          }}
          aria-hidden
        >
          {theme.id.replace(/\D+/g, "") || theme.key}
        </span>
      )}
    </span>
  );
}

/**
 * The template the site is open on, and the way to change it.
 *
 * A switch is a navigation — `?theme=` is the same override the live site and
 * the preview route already take — so the options are real links: middle-click
 * opens a template in its own tab, which is the quickest way to hold two of
 * them side by side.
 *
 * The document survives the move. Its content and its global styles belong to
 * the site, not to the template; only the section list belongs to a template,
 * and `initializeEditor` takes a fresh one whenever the two disagree. Unsaved
 * work is written first, because the switch is a page load and everything Puck
 * is holding would go with it.
 */
function TemplatePicker() {
  const site = useEditorStore((state) => state.site);
  const themes = useEditorStore((state) => state.themes);
  const isDirty = useEditorStore((state) => state.isDirty);
  const save = useEditorStore((state) => state.save);

  if (!site) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "-mx-1 flex min-w-0 items-center gap-0.5 rounded-[2px] px-1 py-0.5",
            "text-studio-dim transition-colors hover:bg-studio-surface hover:text-studio-ink",
            "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
          )}
          aria-label="Change template"
        >
          <Placard className="text-current">{site.themeId ? themeLabel(site.themeId) : "Template"}</Placard>
          <ChevronDown className="size-3 shrink-0" aria-hidden />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="max-h-[70vh] w-80 overflow-y-auto">
        <DropdownMenuLabel>
          <Placard>Template</Placard>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themes.map((entry) => {
          const isCurrent = entry.id === site.themeId;
          return (
            <DropdownMenuItem
              key={entry.id}
              asChild={entry.available}
              disabled={!entry.available}
              onSelect={() => {
                if (!isCurrent && isDirty) save();
              }}
            >
              {entry.available ? (
                <Link
                  href={`/studio/editor/${site.id}?theme=${entry.id}`}
                  className="flex w-full items-center gap-2.5"
                >
                  <Check
                    className={cn("size-3.5 shrink-0 text-studio-live", !isCurrent && "opacity-0")}
                    aria-hidden
                  />
                  <ThemeThumb theme={entry} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px]">{themeLabel(entry.id)}</span>
                    <span className="mt-0.5 block truncate">
                      <Placard>
                        {entry.name} · {entry.category}
                      </Placard>
                    </span>
                  </span>
                </Link>
              ) : (
                <span className="flex w-full items-center gap-2.5">
                  <Check className="size-3.5 shrink-0 opacity-0" aria-hidden />
                  <span className="opacity-40">
                    <ThemeThumb theme={entry} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] opacity-50">
                    {themeLabel(entry.id)} — not available
                  </span>
                </span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** A rail control: quiet at rest, lit on approach, never a box of its own. */
function IconAction({
  label,
  onClick,
  disabled,
  children,
  href,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
  href?: string;
}) {
  const className =
    "size-7 rounded-[3px] text-studio-dim hover:bg-studio-surface hover:text-studio-ink";

  const button = href ? (
    <Button variant="ghost" size="icon-sm" className={className} asChild>
      <Link href={href} aria-label={label}>
        {children}
      </Link>
    </Button>
  ) : (
    <Button
      variant="ghost"
      size="icon-sm"
      className={className}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
    >
      {children}
    </Button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={disabled ? "cursor-not-allowed" : undefined}>{button}</span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Whether the work is safe, said plainly and always.
 *
 * This was an eleven-pixel line behind a `lg:` breakpoint, which meant the one
 * fact with real consequences was the first thing a narrow window dropped. It
 * is a lamp now: amber while there is work the browser has not been told about,
 * out once it has. The clock only appears after mount, because a time formatted
 * on the server is a time in the wrong zone.
 */
function SaveState() {
  const isDirty = useEditorStore((state) => state.isDirty);
  const lastSavedAt = useEditorStore((state) => state.lastSavedAt);

  // The clock is client-only: a time formatted on the server is a time in the
  // wrong zone, and the difference would be a hydration mismatch. This is the
  // "have we hydrated yet" question asked without an effect, so the value is
  // simply derived rather than set into state a render late.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const at = lastSavedAt ? new Date(lastSavedAt) : null;
  const clock =
    mounted && at && !Number.isNaN(at.getTime())
      ? at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : null;

  const state = isDirty ? "caution" : lastSavedAt ? "live" : "off";
  const word = isDirty ? "Unsaved" : lastSavedAt ? "Saved" : "Not saved";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="flex shrink-0 cursor-default items-center gap-2 rounded-[3px] px-1.5 py-1"
          aria-live="polite"
        >
          <Lamp state={state} />
          <Placard
            className={cn(
              isDirty ? "text-studio-caution" : "text-studio-dim",
            )}
          >
            {word}
            {clock && !isDirty ? ` ${clock}` : ""}
          </Placard>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {isDirty
          ? "There are changes this browser has not stored yet. Ctrl+S."
          : "Stored in this browser only. Export a file to move this work to another machine."}
      </TooltipContent>
    </Tooltip>
  );
}

export function EditorHeader({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onImport,
  onSave,
  onShowShortcuts,
}: {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onImport: (raw: string) => void;
  onSave: () => void;
  onShowShortcuts: () => void;
}) {
  const site = useEditorStore((state) => state.site);
  const contentSource = useEditorStore((state) => state.contentSource);
  const reset = useEditorStore((state) => state.reset);
  const exportDocument = useEditorStore((state) => state.exportDocument);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    reset();
    toast.success("Reset to the template defaults", {
      description: "The saved copy of this site was discarded.",
    });
  };

  const handleExport = () => {
    const result = exportDocument();
    if (!result) return;
    const blob = new Blob([result.json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = result.fileName;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Exported", { description: result.fileName });
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    onImport(await file.text());
  };

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-studio-line bg-studio-deep pr-2 pl-1.5">
      <IconAction label="Back to all websites" href="/studio">
        <ArrowLeft className="size-4" />
      </IconAction>

      <Groove className="h-5" />

      {/* The title block: what this is, engraved, in the one place it belongs. */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] leading-tight font-medium text-studio-ink">
            {site?.schoolName}
          </p>
          {/* Only worth saying when it is *not* the site's own content: sample
              copy on a real domain otherwise reads as the editor losing data. */}
          {contentSource === "sample" ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex shrink-0 items-center gap-1.5 rounded-[2px] border border-[color-mix(in_oklab,var(--studio-caution)_35%,transparent)] px-1.5 py-0.5">
                  <Lamp state="caution" size={5} />
                  <Placard className="text-studio-caution">Sample</Placard>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                WMS has no content for {site?.domain}, so the canvas is showing sample copy.
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
          <TemplatePicker />
          <Placard className="truncate">· {site?.domain}</Placard>
        </div>
      </div>

      <div className="flex shrink-0 items-center">
        <IconAction label="Undo (Ctrl+Z)" onClick={onUndo} disabled={!canUndo}>
          <Undo2 className="size-4" />
        </IconAction>
        <IconAction label="Redo (Ctrl+Shift+Z)" onClick={onRedo} disabled={!canRedo}>
          <Redo2 className="size-4" />
        </IconAction>
      </div>

      <Groove className="h-5" />

      <SaveState />

      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={handleFile}
        aria-label="Import a website JSON file"
      />

      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 rounded-[3px] px-2.5 text-[12px] text-studio-dim hover:bg-studio-surface hover:text-studio-ink"
        asChild
      >
        <Link
          href={`/studio/preview/${site?.id}?theme=${site?.themeId}`}
          target="_blank"
          rel="noreferrer"
        >
          <Eye className="size-3.5" />
          Preview
        </Link>
      </Button>

      <Button
        size="sm"
        onClick={onSave}
        className="h-7 gap-1.5 rounded-[3px] px-3 text-[12px] font-medium shadow-[0_1px_0_0_color-mix(in_oklab,#fff_22%,transparent)_inset]"
      >
        <Save className="size-3.5" />
        Save
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="More actions"
            className="size-7 rounded-[3px] text-studio-dim hover:bg-studio-surface hover:text-studio-ink"
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuItem onSelect={onShowShortcuts}>
            <Keyboard className="size-3.5" />
            Keyboard shortcuts
            <span className="studio-readout ml-auto text-[10px] text-studio-faint">?</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => fileInput.current?.click()}>
            <Upload className="size-3.5" />
            Import a file
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleExport}>
            <Download className="size-3.5" />
            Export a file
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={handleReset}>
            <RotateCcw className="size-3.5" />
            Reset to template defaults
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
