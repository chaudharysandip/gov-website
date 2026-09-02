"use client";

/**
 * The editor layout, rendered inside Puck.
 *
 * Puck's own chrome is replaced wholesale (`overrides.puck`) rather than
 * decorated, because the studio's shape — nodes, canvas, four-tab inspector —
 * is not the shape of a general page builder. What is kept is everything
 * underneath: `Puck.Preview` is Puck's canvas, complete with selection
 * overlays, drag-to-reorder and the iframe that makes breakpoints real.
 *
 * This component is also the seam between Puck and the studio store: it
 * registers Puck's API, mirrors selection in both directions, and drives the
 * viewport from the device switcher.
 *
 * The room it builds is a grading bay. The canvas hangs on a neutral mid-grey
 * wall rather than on white or near-black, because the operator is judging a
 * school's colours against whatever surrounds them, and a tinted surround is a
 * thumb on that scale. The console is everything else: rails at the edges, and
 * the canvas's own controls on a plate at its foot.
 */

import type { CSSProperties } from "react";
import type { DeviceId, SectionState } from "@/studio/types";
import type { PuckApi } from "@/studio/store/editor-store";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Puck, createUsePuck } from "@puckeditor/core";
import { toast } from "sonner";
import Link from "next/link";
import { AlertTriangle, MonitorCog, X } from "lucide-react";
import { cn } from "@edn/site-themes/lib/utils";
import { Button } from "@edn/site-themes/components/ui/button";
import { TooltipProvider } from "@edn/site-themes/components/ui/tooltip";
import { DEVICES, FLUID_DEVICE } from "@/studio/lib/constants";
import { documentToPuck } from "@/studio/lib/document";
import { useEditorStore } from "@/studio/store/editor-store";
import { useEditorKeydown } from "@/studio/lib/use-editor-keydown";
import { selectSections } from "@/studio/store/selectors";
import { EditorHeader } from "@/studio/components/EditorHeader";
import { ScopeStrip } from "@/studio/components/CanvasControls";
import { Inspector } from "@/studio/components/Inspector";
import { SectionList } from "@/studio/components/SectionList";
import { Placard, ReferencePatch } from "@/studio/components/bay";
import { Shortcuts } from "@/studio/components/Shortcuts";

/**
 * Selector-based access to Puck's store.
 *
 * `usePuck()` with no selector re-renders this component — and therefore the
 * section list and the whole inspector — on every keystroke in a text field,
 * because the whole app state changed. Four narrow subscriptions instead mean a
 * content edit re-renders the canvas and nothing else.
 */
const usePuckState = createUsePuck();

/**
 * The direction this surface was built to, kept where it survives the build.
 *
 * Everything below reopens this file on every edit, and a contract that lives
 * only in a planning document is a contract nobody checks against the render.
 */
const DIRECTION_CONTRACT = `
  THESIS: the editor is a grading bay, not a page builder — the canvas is a
  reference monitor and the operator is grading it. It refuses the category's
  light three-pane builder and its near-black twin alike.
  OWN-WORLD: a genuine neutral mid-grey wall (#706F67, near the 18% reference
  a grading room is painted to) carrying a lit canvas; matte console rails in
  warm near-black; white as the information colour;
  teal for what is live and actionable, amber for caution, red for stop, and
  nothing else coloured. Mono tabular readouts, engraved 10px placards, 3-5px
  milled corners, hairline grooves. Lamps are the only thing that glows.
  STORY: the operator sees which site and template they hold, what is safe and
  what is not, where every override lives, and judges the school's colours
  against a surround that is not lying to them.
  FIRST VIEWPORT: a 48px title-block rail across the top; the node column left
  with wireframe thumbnails and per-breakpoint override marks; the canvas
  mounted centre on the grey wall with its own console strip floating at its
  foot; the inspector right, underline tabs, groups that report their contents
  while shut.
  FORM: the grading suite — candidate 1 of the grounded list, chosen by the
  user over the roll. Seed key 630160cc.
  FINISH: unreviewed and undocumented is unfinished; this build ends with the
  finish review, the verdict, DESIGN.md, and every shipping raster carrying its
  provenance.
`;

/** Keeps Puck's viewport in step with the device switcher. */
function useViewportSync(dispatch: PuckApi["dispatch"], device: DeviceId) {
  useEffect(() => {
    const entry = DEVICES.find((candidate) => candidate.id === device) ?? DEVICES[0];
    dispatch({
      type: "setUi",
      ui: { viewports: { current: { width: entry.width, height: "auto" } } },
      recordHistory: false,
    });
  }, [dispatch, device]);
}

/**
 * Selection is mirrored rather than owned by one side. Clicking the canvas is a
 * Puck event; clicking the node column is a studio event; both have to end with
 * the same section highlighted in both places.
 */
function useSelectionSync(
  itemSelector: { index?: number } | null | undefined,
  sections: SectionState[],
) {
  const selectedSectionId = useEditorStore((state) => state.selectedSectionId);
  const lastFromPuck = useRef<string | null>(null);

  useEffect(() => {
    const index = itemSelector?.index;
    const fromPuck = typeof index === "number" ? sections[index]?.id ?? null : null;
    if (fromPuck === lastFromPuck.current) return;
    lastFromPuck.current = fromPuck;
    if (fromPuck !== selectedSectionId) {
      useEditorStore.setState({ selectedSectionId: fromPuck });
    }
  }, [itemSelector, sections, selectedSectionId]);
}

/**
 * The bay's palette, applied to the document element rather than to a wrapper.
 *
 * Every menu, tooltip and popover in here is a Radix portal, and a portal lands
 * on `document.body` — outside any wrapper this component could paint. Putting
 * the world on the root is what stops a dropdown opening in the app's light
 * palette while the panel behind it is a console.
 *
 * An attribute rather than a class, and that is the whole point of it. Puck
 * mirrors the host `<html>` class list into the canvas iframe so the themes
 * inherit the app's fonts and `light`/`dark` — which means a class here would
 * be copied in too, and the bay would repaint `--primary`, `--background` and
 * `--radius` on the very site being edited. The tool would be grading its own
 * palette. `data-` attributes are not part of that copy, so the world stops at
 * the frame boundary, which is where it has to stop.
 */
function useBayPalette() {
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-studio-bay", "");
    return () => root.removeAttribute("data-studio-bay");
  }, []);
}

function useShortcuts({
  onSave,
  onUndo,
  onRedo,
}: {
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
}) {
  const removeSection = useEditorStore((state) => state.removeSection);
  const clearSelection = useEditorStore((state) => state.clearSelection);
  const toggleMotionPreview = useEditorStore((state) => state.toggleMotionPreview);
  const toggleFullscreen = useEditorStore((state) => state.toggleCanvasFullscreen);

  useEditorKeydown((event) => {
    const mod = event.metaKey || event.ctrlKey;
    const target = event.target;
    const typing =
      target instanceof HTMLElement &&
      (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

    if (mod && event.key.toLowerCase() === "s") {
      event.preventDefault();
      onSave();
      return;
    }
    if (mod && event.key.toLowerCase() === "z") {
      // Browsers already undo inside a text field. Taking that over would
      // make the inspector worse to type in, for no gain.
      if (typing) return;
      event.preventDefault();
      if (event.shiftKey) onRedo();
      else onUndo();
      return;
    }
    if (event.key === "Escape" && !typing) {
      // Escape undoes the most recent mode first. Clearing the selection from
      // under a full-screen canvas would look like the key did nothing.
      const state = useEditorStore.getState();
      if (state.motionPreview) toggleMotionPreview();
      else if (state.isCanvasFullscreen) toggleFullscreen();
      else clearSelection();
    }
  });

  /**
   * Delete, taken before Puck can also act on it.
   *
   * `removeSection` dispatches Puck's own `remove` by index, and Puck deletes
   * the selected item on Delete as well — so one keypress removed the section
   * *and* whichever section slid into its index, silently, two bands off the
   * page for one keystroke. This runs in the capture phase, where `window` is
   * the first node in the path, and stops the event there.
   *
   * Its own listener rather than a branch of the one above, because stopping
   * propagation is only ever right for this key: Escape has to keep reaching
   * Radix so an open popover still closes on it.
   */
  useEditorKeydown(
    (event) => {
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      const target = event.target;
      const typing =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      if (typing) return;

      const selected = useEditorStore.getState().selectedSectionId;
      if (!selected) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      removeSection(selected);
    },
    { capture: true },
  );
}

/**
 * The canvas, replaced by the preview route in a frame of its own.
 *
 * Not a second Puck canvas: the point is the browsing context. This frame
 * *navigates*, so the theme's JavaScript runs inside it against its own
 * document and its own scroll — which is the only way the scroll-driven
 * sections (Theme-1's solution showcase, every `useScroll` band) move at all.
 * It reads the draft the store wrote on the way in, and the stamp in the query
 * makes a second play reload rather than replay the version before the edit.
 */
function MotionPreviewFrame({ style }: { style: CSSProperties }) {
  const site = useEditorStore((state) => state.site);
  const stamp = useEditorStore((state) => state.motionPreviewStamp);
  if (!site) return null;

  return (
    <iframe
      title={`${site.schoolName} with its animations running`}
      src={`/studio/preview/${site.id}?chrome=off&theme=${site.themeId}&draft=${stamp}`}
      style={style}
      className="studio-mount mx-auto block border-0"
    />
  );
}

/**
 * What a window too narrow for the bay gets.
 *
 * The editor puts a whole website on the canvas with a node column on one side
 * and an inspector on the other; under about nine hundred pixels there is no
 * arrangement of those three that is worth using, and every one of them squeezes
 * out the canvas. Saying so is the honest answer, and it costs the operator
 * nothing: the preview route is the site itself and reads at any width.
 *
 * A media query rather than a measurement, so the layout underneath keeps its
 * state and comes straight back when the window does.
 */
function TooNarrow() {
  const site = useEditorStore((state) => state.site);

  return (
    <div className="fixed inset-0 z-60 hidden flex-col items-center justify-center gap-5 bg-studio-deep px-7 text-center max-[899px]:flex">
      <MonitorCog className="size-6 text-studio-faint" aria-hidden />
      <div>
        <h2 className="text-[15px] font-medium text-studio-ink">The studio needs a wider window</h2>
        <p className="mx-auto mt-2 max-w-[42ch] text-[13px] leading-relaxed text-studio-dim">
          The canvas holds a whole site, with the sections on one side and the inspector on the
          other. That wants about 900 pixels across; below it the page you are editing is the
          thing that gets squeezed out.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {site ? (
          <Button size="sm" className="h-8 rounded-[3px] text-[12px]" asChild>
            <Link href={`/studio/preview/${site.id}?theme=${site.themeId}`}>
              Open the preview instead
            </Link>
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 rounded-[3px] text-[12px] text-studio-dim hover:bg-studio-surface hover:text-studio-ink"
          asChild
        >
          <Link href="/studio">All websites</Link>
        </Button>
      </div>
    </div>
  );
}

/** Caution, not alarm: something did not land, and the work is still here. */
function ErrorBanner() {
  const error = useEditorStore((state) => state.error);
  const dismiss = useEditorStore((state) => state.dismissError);
  if (!error) return null;

  return (
    <div
      role="status"
      className="flex shrink-0 items-center gap-2 border-b border-studio-line bg-studio-panel px-3 py-2 text-[12px] text-studio-caution"
    >
      <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
      <span className="flex-1 text-studio-ink">{error}</span>
      <Button
        variant="ghost"
        size="icon-sm"
        className="size-6 rounded-[2px] text-studio-dim hover:bg-studio-surface hover:text-studio-ink"
        onClick={dismiss}
        aria-label="Dismiss"
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}

export function EditorShell() {
  const dispatch = usePuckState((state) => state.dispatch);
  const history = usePuckState((state) => state.history);
  const itemSelector = usePuckState((state) => state.appState.ui.itemSelector);
  const hasPast = usePuckState((state) => state.history.hasPast);
  const hasFuture = usePuckState((state) => state.history.hasFuture);

  const canvasViewport = useRef<HTMLDivElement>(null);
  const [pane, setPane] = useState({ width: 0, height: 0 });

  const device = useEditorStore((state) => state.activeDevice);
  const zoom = useEditorStore((state) => state.zoom);
  const isFullscreen = useEditorStore((state) => state.isCanvasFullscreen);
  const motionPreview = useEditorStore((state) => state.motionPreview);
  const selectedSectionId = useEditorStore((state) => state.selectedSectionId);
  const sections = useEditorStore(selectSections);
  const save = useEditorStore((state) => state.save);
  const importDocument = useEditorStore((state) => state.importDocument);

  useBayPalette();

  // Registering the API here rather than passing `dispatch` down means a
  // toolbar button, a keyboard shortcut and an inspector field all reach Puck
  // the same way, and none of them has to sit inside Puck's tree.
  useEffect(() => {
    useEditorStore.getState().bindPuck({ dispatch, history });
  }, [dispatch, history]);

  useViewportSync(dispatch, device);
  useSelectionSync(itemSelector, sections);

  // Leaving the browser's full screen — with Escape, or the browser's own
  // control — has to leave the editor's too, or the chrome stays hidden with
  // nothing left to have hidden it.
  const leaveFullscreen = useEditorStore((state) => state.toggleCanvasFullscreen);
  useEffect(() => {
    const sync = () => {
      if (!document.fullscreenElement && useEditorStore.getState().isCanvasFullscreen) {
        leaveFullscreen();
      }
    };
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, [leaveFullscreen]);

  const handleSave = useCallback(() => {
    const result = save();
    if (result?.ok) toast.success("Saved", { description: "Your changes are stored in this browser." });
    else if (result?.error) toast.error("Could not save", { description: result.error });
  }, [save]);

  const handleUndo = useCallback(() => history.back(), [history]);
  const handleRedo = useCallback(() => history.forward(), [history]);

  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  useShortcuts({ onSave: handleSave, onUndo: handleUndo, onRedo: handleRedo });

  // A question mark is a character before it is a command, so this never fires
  // while the operator is typing into a field.
  useEditorKeydown((event) => {
    if (event.key !== "?" || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
    ) {
      return;
    }
    event.preventDefault();
    setShortcutsOpen((open) => !open);
  });

  const handleImport = useCallback(
    (raw: string) => {
      const result = importDocument(raw, (document) => {
        dispatch({ type: "setData", data: documentToPuck(document) as any });
      });
      if (result.ok) toast.success("Imported", { description: "The file replaced the current design." });
      else toast.error("Could not import", { description: result.error });
    },
    [dispatch, importDocument],
  );

  const deviceWidth = (DEVICES.find((entry) => entry.id === device) ?? DEVICES[0]).width;
  const isFluid = device === FLUID_DEVICE;

  // Puck's preview iframe is `height: 100%`, so whatever holds it needs a size
  // of its own: against an auto-height parent that percentage resolves to auto
  // and the iframe falls back to its intrinsic 150px, which renders the whole
  // site into a letterbox. Both axes are measured here rather than left as
  // percentages, because a percentage under `zoom` resolves against the
  // unscaled parent and is then scaled with everything else — the canvas would
  // fill the pane at 100% and only three quarters of it at 75%.
  //
  // The observed element carries the field's padding, and a ResizeObserver's
  // content rect excludes it, so the canvas is measured against the room it
  // actually has rather than against the room plus its margins.
  useEffect(() => {
    const element = canvasViewport.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setPane({ width, height });
      useEditorStore.setState({ canvasPaneWidth: width });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  /**
   * The wall scrolls the page as well.
   *
   * A wheel over the surround did nothing before, because the surround has
   * nothing to scroll — which made the canvas feel like a small live area
   * inside a dead one. The frame is a separate document, so its own wheel
   * events never reach here; this handler only ever fires for the wall, and
   * forwards it.
   */
  const forwardWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    const frame = canvasViewport.current?.querySelector("iframe");
    frame?.contentWindow?.scrollBy({ top: event.deltaY, behavior: "auto" });
  }, []);

  /**
   * Selecting a section brings it into view.
   *
   * `selectSection` set Puck's selection and nothing else, so on a page thirty
   * thousand pixels tall, clicking Footer in the column highlighted something
   * nobody could see. This scrolls the frame to it — but only when it is not
   * already on screen, because the other way selection happens is a click on
   * the canvas, and yanking the view after someone clicks the thing they were
   * already looking at is worse than not scrolling at all.
   */
  useEffect(() => {
    if (!selectedSectionId || motionPreview) return;
    const frame = canvasViewport.current?.querySelector("iframe");
    const view = frame?.contentWindow;
    const doc = frame?.contentDocument;
    if (!view || !doc) return;

    const id = CSS.escape(selectedSectionId);
    const element =
      doc.querySelector(`[data-studio-section="${id}"]`) ??
      doc.querySelector(`[data-studio-chrome="${id}"]`);
    if (!element) return;

    const box = element.getBoundingClientRect();
    const height = view.innerHeight;
    // "On screen" is generous on purpose: a band whose top is just above the
    // fold is a band you can see.
    if (box.top < height * 0.75 && box.bottom > height * 0.15) return;

    const reduced = view.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    view.scrollTo({
      top: Math.max(0, view.scrollY + box.top - 24),
      behavior: reduced ? "auto" : "smooth",
    });
  }, [selectedSectionId, motionPreview]);

  const canvasStyle = useMemo(() => {
    // `zoom` rather than `transform: scale()`. A transform leaves the browser
    // hit-testing at the unscaled position, which breaks Puck's drag and every
    // click on the canvas; `zoom` scales hit-testing with the pixels.
    const scale = zoom / 100;
    const fit = (measured: number) => (measured ? measured / scale : "100%");
    return {
      // Desktop is the pane; tablet and mobile are exact, so the theme's own
      // breakpoints resolve inside the iframe as they do on the device.
      width: isFluid ? fit(pane.width) : deviceWidth,
      zoom: scale === 1 ? undefined : scale,
      height: fit(pane.height),
    };
  }, [zoom, deviceWidth, isFluid, pane.width, pane.height]);

  return (
    <TooltipProvider delayDuration={300}>
      {/* `dvh` rather than `vh`: where the two differ — an embedded browser, a
          toolbar that comes and goes — `vh` is the one that puts the bottom bar
          under the edge of the window. */}
      <div className="flex h-dvh flex-col overflow-hidden bg-studio-deep">
        <div hidden dangerouslySetInnerHTML={{ __html: `<!--${DIRECTION_CONTRACT}-->` }} />
        <TooNarrow />
        <Shortcuts open={shortcutsOpen} onOpenChange={setShortcutsOpen} />

        {/* Full screen is the canvas on its own: the rails go, and the scope
            strip — which is mounted to the canvas rather than to the chrome —
            simply stays where it already was. */}
        {isFullscreen ? null : (
          <>
            <EditorHeader
              canUndo={hasPast}
              canRedo={hasFuture}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onImport={handleImport}
              onSave={handleSave}
              onShowShortcuts={() => setShortcutsOpen(true)}
            />
            <ErrorBanner />
          </>
        )}

        <div className="flex min-h-0 flex-1">
          {isFullscreen ? null : <SectionList />}

          <div className="studio-field relative flex min-w-0 flex-1 flex-col">
            {/*
              The inset is the wall, so it is generous rather than a margin.
              Desktop stays fluid — the canvas is the pane, which is what makes
              the width readout honest about what the theme's breakpoints see —
              but a fluid canvas that runs to the pane's own edge leaves the
              surround as a hairline, and a hairline is not something a colour
              can be judged against. Giving the room back its walls costs about
              a hundred pixels of a twelve-hundred-pixel canvas.
            */}
            {/*
              Full screen exists to give the canvas the room, so the wall
              narrows to a matte there rather than keeping the inset it earns
              when the rails are up: a hundred and thirty pixels of surround is
              a surround worth having beside two panels and worth nothing
              beside none.
            */}
            {/*
              Walls at the sides only, and the canvas the full height of the
              pane. A canvas inset on all four edges reads as a card with a
              scroll of its own; the same canvas run to the top and bottom
              reads as a window onto the site. It hangs from the wall with an
              even margin on three sides and runs off the bottom, so the console
              strip has something to float over. The
              surround survives where it does the work — a page's content is
              centred horizontally, so that is the edge a colour is judged
              against.

              It cannot be given the whole document's height instead: these
              themes size sections in viewport units, so a frame as tall as its
              content makes `100vh` mean the whole page, which grows the page,
              which grows the frame. Measured on Theme-1: 36,557px becomes
              674,199px.
            */}
            <div
              ref={canvasViewport}
              onWheel={forwardWheel}
              className={cn(
                "studio-canvas-viewport min-h-0 flex-1 overflow-auto",
                isFullscreen ? "px-5 pt-5" : "px-10 pt-10 2xl:px-12 2xl:pt-12",
              )}
            >
              {/*
                Both canvases stay mounted and one is hidden, rather than
                swapping: remounting Puck's preview reloads its frame and every
                lazy section inside it, so a glance at the animations would cost
                a full rebuild of the editable canvas on the way back.

                The width eases rather than snapping, so moving between
                breakpoints reads as the same drawing re-registered at another
                size — one movement with the figure in the strip, which settles
                over the same beat — instead of two unrelated events.
              */}
              <div
                style={canvasStyle}
                className="studio-mount mx-auto motion-safe:transition-[width] motion-safe:duration-300 motion-safe:ease-out"
                hidden={motionPreview}
              >
                <Puck.Preview />
              </div>
              {motionPreview ? <MotionPreviewFrame style={canvasStyle} /> : null}
            </div>

            {/* The canvas's own console, at its foot. It sits in the padding
                the viewport reserves for it, so it never covers the page — and
                the reference patch keeps it company on the same line, on the
                wall rather than over the work. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-3.5 flex items-center justify-center px-4">
              <ReferencePatch className="pointer-events-auto absolute left-4 hidden xl:flex" />
              <ScopeStrip className="pointer-events-auto" />
            </div>

            {isFullscreen ? (
              <div className="pointer-events-none absolute top-3.5 right-4">
                <Placard className="rounded-[2px] border border-studio-edge bg-studio-deep/90 px-2 py-1">
                  Esc to leave
                </Placard>
              </div>
            ) : null}
          </div>

          {isFullscreen ? null : <Inspector />}
        </div>
      </div>
    </TooltipProvider>
  );
}
