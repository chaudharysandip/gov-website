"use client";

/**
 * The scope strip: the canvas's own console, mounted to the canvas.
 *
 * These controls used to live in the top bar, three groups away from the thing
 * they act on. A grading bay puts a monitor's controls on the monitor, and the
 * move pays twice: the eye is already on the canvas when the hand reaches for
 * the width, and the top bar gets its middle third back for the title block.
 *
 * The strip is one component in every mode. Full screen used to grow a second,
 * differently-shaped cluster of its own; now the chrome around it goes and the
 * strip stays exactly where it was, which is both less code and one less thing
 * to relearn.
 */

import type { LucideIcon } from "lucide-react";
import type { DeviceId } from "@/studio/types";
import {
  Maximize2,
  Minimize2,
  Minus,
  Monitor,
  Play,
  Plus,
  Smartphone,
  Square,
  Tablet,
} from "lucide-react";
import { cn } from "@edn/site-themes/lib/utils";
import { Button } from "@edn/site-themes/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@edn/site-themes/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@edn/site-themes/components/ui/tooltip";
import { DEVICES } from "@/studio/lib/constants";
import { useEditorStore } from "@/studio/store/editor-store";
import {
  Console,
  Groove,
  Placard,
  Readout,
  useRenderedWidth,
  useSettledNumber,
} from "@/studio/components/bay";

const ICONS: Record<string, LucideIcon> = { Monitor, Tablet, Smartphone };

/** A control on the plate: milled, quiet at rest, lit when it is the live one. */
const KEY =
  "h-7 rounded-[3px] text-studio-dim transition-colors duration-150 " +
  "hover:bg-studio-hi hover:text-studio-ink " +
  "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none";

/**
 * The width the page is actually laying out at.
 *
 * On desktop the canvas is as wide as the pane, so the nominal 1440 would be a
 * lie: this is the number the theme's breakpoints are seeing. It settles rather
 * than snaps, on the same beat the canvas takes to re-register, so the two read
 * as one movement instead of two events.
 */
function WidthReadout() {
  const activeDevice = useEditorStore((state) => state.activeDevice);
  const { width, fluid } = useRenderedWidth(activeDevice);
  const shown = useSettledNumber(width);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="flex shrink-0 cursor-default items-baseline gap-1 px-1"
          aria-live="polite"
        >
          <Readout className="text-[12px] text-studio-ink">{shown}</Readout>
          {/* "fit" rather than nothing: on desktop this figure is the pane, not
              a device, and an unqualified number beside a panel calling desktop
              1440px is two readouts naming one scope. */}
          <Placard>{fluid ? "px fit" : "px"}</Placard>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {fluid
          ? "Desktop follows the pane, so this is the width the theme's breakpoints are actually seeing."
          : `Laid out at exactly ${width}px, as it would be on the device.`}
      </TooltipContent>
    </Tooltip>
  );
}

/** Device, width, motion, zoom and full screen — the canvas's whole console. */
export function ScopeStrip({ className }: { className?: string }) {
  const activeDevice = useEditorStore((state) => state.activeDevice);
  const setDevice = useEditorStore((state) => state.setDevice);
  const motionPreview = useEditorStore((state) => state.motionPreview);
  const toggleMotionPreview = useEditorStore((state) => state.toggleMotionPreview);
  const zoom = useEditorStore((state) => state.zoom);
  const setZoom = useEditorStore((state) => state.setZoom);
  const zoomIn = useEditorStore((state) => state.zoomIn);
  const zoomOut = useEditorStore((state) => state.zoomOut);
  const isFullscreen = useEditorStore((state) => state.isCanvasFullscreen);
  const toggleFullscreen = useEditorStore((state) => state.toggleCanvasFullscreen);

  // Two things at once, on purpose. Hiding the editor's own chrome is what
  // gives the canvas the room; asking the browser for its full screen is what
  // the icon promises. The request needs a user gesture, so it is made here in
  // the handler rather than in an effect, and a refusal — an embedded browser,
  // a policy — costs nothing: the layout still goes full screen.
  const handleFullscreen = () => {
    const root = document.documentElement;
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else root.requestFullscreen?.().catch(() => {});
    toggleFullscreen();
  };

  return (
    <Console className={className}>
      <ToggleGroup
        type="single"
        value={activeDevice}
        onValueChange={(value) => value && setDevice(value as DeviceId)}
        aria-label="Canvas width"
        className="gap-px rounded-[3px] bg-studio-surface p-px"
      >
        {DEVICES.map((entry) => {
          const Icon = ICONS[entry.icon];
          return (
            <ToggleGroupItem
              key={entry.id}
              value={entry.id}
              aria-label={`${entry.label} — ${entry.width}px`}
              className={cn(
                "h-6 gap-1.5 rounded-[2px] px-2 text-[11px] font-medium text-studio-faint",
                "hover:bg-studio-hi hover:text-studio-ink",
                "data-[state=on]:bg-studio-deep data-[state=on]:text-studio-live",
                "data-[state=on]:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--studio-live)_35%,transparent)]",
              )}
            >
              <Icon className="size-3.5" />
              <span className="hidden xl:inline">{entry.label}</span>
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>

      <Groove />
      <WidthReadout />
      <Groove />

      <Button variant="ghost" size="icon-sm" onClick={zoomOut} aria-label="Zoom out" className={cn(KEY, "size-7")}>
        <Minus className="size-3.5" />
      </Button>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => setZoom(100)}
            className={cn(KEY, "min-w-11 px-1 text-studio-ink")}
          >
            <Readout className="text-[12px]">{zoom}%</Readout>
          </button>
        </TooltipTrigger>
        <TooltipContent>Reset to 100%</TooltipContent>
      </Tooltip>
      <Button variant="ghost" size="icon-sm" onClick={zoomIn} aria-label="Zoom in" className={cn(KEY, "size-7")}>
        <Plus className="size-3.5" />
      </Button>

      <Groove />

      {/*
        The canvas cannot run the page's scroll animations — Puck renders it
        through a portal, so the theme's JavaScript is in this window while the
        DOM scrolls in the frame. This plays them in a frame that has a document
        of its own. See `toggleMotionPreview` in the store.
      */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMotionPreview}
            aria-pressed={motionPreview}
            className={cn(
              KEY,
              "gap-1.5 px-2 text-[11px] font-medium",
              motionPreview &&
                "bg-studio-panel text-studio-live shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--studio-live)_35%,transparent)]",
            )}
          >
            {motionPreview ? <Square className="size-3.5" /> : <Play className="size-3.5" />}
            {motionPreview ? "Editing" : "Play"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {motionPreview
            ? "Back to the editable canvas"
            : "Play the page's animations, as they run on the site"}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleFullscreen}
            aria-pressed={isFullscreen}
            aria-label={isFullscreen ? "Leave full screen" : "Full screen canvas"}
            className={cn(KEY, "size-7")}
          >
            {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isFullscreen ? "Leave full screen — Esc" : "Full screen canvas"}
        </TooltipContent>
      </Tooltip>
    </Console>
  );
}
