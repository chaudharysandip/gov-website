"use client";

/**
 * The Screens tab: the node chain in full.
 *
 * The Design tab already writes into whichever breakpoint is active, so this is
 * not a second set of controls — it is the view that makes the model visible.
 * Desktop is the base; the two narrower nodes hold only what differs and take
 * the rest from the node above. Drawn as a chain, with each node's own values
 * listed under it and the inheritance arrow between them, that is one reading
 * instead of six accordions and a paragraph of explanation.
 */

import type { LucideIcon } from "lucide-react";
import type { DeviceId, SectionDefinition } from "@/studio/types";
import { ArrowDownToLine, ChevronDown, Monitor, Smartphone, Tablet, Trash2 } from "lucide-react";
import { cn } from "@edn/site-themes/lib/utils";
import { Button } from "@edn/site-themes/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@edn/site-themes/components/ui/tooltip";
import { DEVICES } from "@/studio/lib/constants";
import { useEditorStore } from "@/studio/store/editor-store";
import { selectSectionStyles } from "@/studio/store/selectors";
import { Lamp, Placard, Readout, useRenderedWidth } from "@/studio/components/bay";

const ICONS: Record<string, LucideIcon> = { Monitor, Tablet, Smartphone };

/** `paddingTop` reads as "Padding top" in a summary list. */
function humanizeKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase())
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase());
}

/**
 * A breakpoint's width, as the canvas is actually laying it out.
 *
 * Desktop follows the pane, so printing its nominal 1440 here while the scope
 * strip printed the measured figure was two numbers for one scope. This is the
 * same hook the strip reads.
 */
function NodeWidth({ device }: { device: DeviceId }) {
  const { width, fluid } = useRenderedWidth(device);
  return (
    <Readout className="text-studio-faint">
      {width}px{fluid ? " fit" : ""}
    </Readout>
  );
}

/** The arrow between two nodes: what the one below takes from the one above. */
function InheritanceLink({ live }: { live: boolean }) {
  return (
    <div className="flex items-center gap-1.5 py-1 pl-3.5" aria-hidden>
      <ChevronDown
        className={cn("size-3 shrink-0", live ? "text-studio-live" : "text-studio-edge")}
      />
      <Placard className={live ? "text-studio-dim" : undefined}>inherits</Placard>
      <span className="h-px flex-1 bg-studio-line" />
    </div>
  );
}

export function ResponsivePanel({ section }: { section: SectionDefinition | null }) {
  const activeDevice = useEditorStore((state) => state.activeDevice);
  const setDevice = useEditorStore((state) => state.setDevice);
  const resetStyle = useEditorStore((state) => state.resetStyle);
  const updateStyles = useEditorStore((state) => state.updateStyles);
  const styles = useEditorStore((state) => selectSectionStyles(state, section?.id));

  if (!section) {
    return (
      <p className="rounded-[3px] border border-dashed border-studio-line px-4 py-10 text-center text-[12px] text-studio-faint">
        Select a section to see its breakpoints.
      </p>
    );
  }

  const overrides = styles ?? {};

  /**
   * Copies the breakpoint above into this one, as a starting point to tune.
   * One dispatch, so one press of undo puts it back.
   */
  const inheritInto = (device: DeviceId) => {
    const source = device === "mobile" ? overrides.tablet ?? overrides.desktop : overrides.desktop;
    if (!source) return;
    updateStyles(section.id, device, source);
  };

  return (
    <div className="space-y-1">
      {DEVICES.map((device, index) => {
        const Icon = ICONS[device.icon];
        const entries = Object.entries(overrides[device.id] ?? {});
        const isActive = activeDevice === device.id;
        const isBase = device.id === "desktop";

        return (
          <div key={device.id}>
            {index > 0 ? <InheritanceLink live={!entries.length} /> : null}

            <div
              className={cn(
                "rounded-[3px] border transition-colors duration-150",
                isActive
                  ? "border-[color-mix(in_oklab,var(--studio-live)_38%,transparent)] bg-studio-surface"
                  : "border-studio-line bg-studio-deep",
              )}
            >
              <div className="flex items-center gap-2 py-2 pr-1 pl-2.5">
                <Icon
                  className={cn(
                    "size-3.5 shrink-0",
                    isActive ? "text-studio-live" : "text-studio-faint",
                  )}
                  aria-hidden
                />
                <button
                  type="button"
                  onClick={() => setDevice(device.id)}
                  aria-pressed={isActive}
                  className="flex min-w-0 flex-1 items-baseline gap-1.5 text-left focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <span
                    className={cn(
                      "text-[12px] font-medium",
                      isActive ? "text-studio-ink" : "text-studio-dim",
                    )}
                  >
                    {device.label}
                  </span>
                  <NodeWidth device={device.id} />
                  {isBase ? <Placard className="ml-0.5">base</Placard> : null}
                </button>

                {entries.length ? (
                  <Lamp state="live" size={5} />
                ) : null}

                {!isBase ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="size-6 rounded-[2px] text-studio-faint hover:bg-studio-hi hover:text-studio-ink"
                        aria-label={`Copy inherited values into ${device.label}`}
                        onClick={() => inheritInto(device.id)}
                      >
                        <ArrowDownToLine className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy the values above into this breakpoint</TooltipContent>
                  </Tooltip>
                ) : null}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={!entries.length}
                        className="size-6 rounded-[2px] text-studio-faint hover:bg-studio-hi hover:text-studio-stop"
                        aria-label={`Clear ${device.label} overrides`}
                        onClick={() => resetStyle(section.id, device.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Clear {device.label.toLowerCase()} overrides</TooltipContent>
                </Tooltip>
              </div>

              {entries.length ? (
                <dl className="space-y-1 border-t border-studio-line px-2.5 py-2">
                  {entries.map(([key, value]) => (
                    <div key={key} className="flex items-baseline justify-between gap-3">
                      <dt className="truncate text-[11px] text-studio-dim">{humanizeKey(key)}</dt>
                      <dd className="shrink-0">
                        <Readout className="text-[11px] text-studio-ink">{String(value)}</Readout>
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="border-t border-studio-line px-2.5 py-1.5 text-[11px] text-studio-faint">
                  {isBase ? "Nothing set yet." : "Takes everything from above."}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
