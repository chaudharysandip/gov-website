"use client";

/**
 * The breakpoint chain: the responsive model, drawn.
 *
 * Desktop is the base and the two narrower breakpoints store only what differs,
 * inheriting the rest by not emitting anything. That is the single fact an
 * operator has to hold in their head to edit a phone layout without wrecking
 * the desktop one, and it used to be a sentence of prose in one tab and the
 * word "mobile" in a grey pill in another.
 *
 * Here it is a chain: three nodes, an arrow between them pointing the way
 * inheritance actually flows, the live node lit, and a count on any node
 * carrying something of its own. Clicking a node moves the canvas to it, so the
 * thing that explains the model is also the thing that drives it.
 */

import type { LucideIcon } from "lucide-react";
import type { DeviceId, ResponsiveStyle } from "@/studio/types";
import { ChevronRight, Monitor, Smartphone, Tablet } from "lucide-react";
import { cn } from "@edn/site-themes/lib/utils";
import { DEVICES } from "@/studio/lib/constants";
import { useEditorStore } from "@/studio/store/editor-store";
import { Placard, Readout } from "@/studio/components/bay";

const ICONS: Record<string, LucideIcon> = { Monitor, Tablet, Smartphone };

/** How many overrides a breakpoint holds of its own. */
export const ownCount = (styles: ResponsiveStyle | undefined, device: DeviceId): number =>
  Object.keys(styles?.[device] ?? {}).length;

export function BreakpointChain({ styles }: { styles?: ResponsiveStyle }) {
  const activeDevice = useEditorStore((state) => state.activeDevice);
  const setDevice = useEditorStore((state) => state.setDevice);

  return (
    <div
      className="flex items-stretch rounded-[3px] border border-studio-line bg-studio-deep p-1"
      role="group"
      aria-label="Breakpoint being edited"
    >
      {DEVICES.map((device, index) => {
        const Icon = ICONS[device.icon];
        const count = ownCount(styles, device.id);
        const isActive = activeDevice === device.id;

        return (
          <div key={device.id} className="flex min-w-0 flex-1 items-center">
            {index > 0 ? (
              <ChevronRight
                className="size-3 shrink-0 text-studio-edge"
                aria-hidden
              />
            ) : null}

            <button
              type="button"
              onClick={() => setDevice(device.id)}
              aria-pressed={isActive}
              title={
                device.id === "desktop"
                  ? `Desktop is the base — ${count || "no"} value${count === 1 ? "" : "s"} set`
                  : count
                    ? `${device.label} overrides ${count} value${count === 1 ? "" : "s"}`
                    : `${device.label} inherits everything`
              }
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[2px] px-1 py-1.5 transition-colors duration-150",
                "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                isActive
                  ? "bg-studio-hi shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--studio-live)_38%,transparent)]"
                  : "hover:bg-studio-surface",
              )}
            >
              <Icon
                className={cn(
                  "size-3.5 shrink-0",
                  isActive ? "text-studio-live" : "text-studio-faint",
                )}
                aria-hidden
              />
              <Placard className={isActive ? "text-studio-ink" : undefined}>
                {device.label}
              </Placard>
              {count ? (
                <Readout className="text-[10px] text-studio-live">{count}</Readout>
              ) : (
                <Readout className="text-[10px] text-studio-edge">—</Readout>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
