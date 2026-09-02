"use client";

/**
 * The bay's own parts.
 *
 * The editor is a grading suite, and a grading suite is built from four kinds
 * of thing: placards that name, readouts that measure, lamps that report, and
 * plates that hold. Everything else in the studio is assembled from these, so
 * the character lives in one file rather than in forty class attributes.
 *
 * The colour law is enforced here rather than remembered: teal is what is live
 * and actionable, amber is caution, red is stop, and white carries the
 * information. A component that wants a fifth colour has to come through this
 * file to get one, which is the point.
 */

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import type { DeviceId, ResponsiveStyle } from "@/studio/types";
import { cn } from "@edn/site-themes/lib/utils";
import { DEVICES, FLUID_DEVICE } from "@/studio/lib/constants";
import { useEditorStore } from "@/studio/store/editor-store";

/* -------------------------------------------------------------------------- */
/*  Naming and measuring                                                      */
/* -------------------------------------------------------------------------- */

/**
 * An engraved label. Ten pixels, but tracked and capitalised the way a panel
 * legend is, so it reads at a glance and never competes with the value beside
 * it. Placards name; they never carry the fact.
 */
export function Placard({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("studio-placard text-studio-faint", className)}>{children}</span>;
}

/**
 * A measurement. Mono and tabular, because a readout that reflows as its digits
 * change is a readout you have to re-find every time it moves.
 */
export function Readout({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("studio-readout text-[11px] leading-none", className)}>{children}</span>;
}

/**
 * The width the page is actually laying out at, for one breakpoint.
 *
 * Desktop is fluid — the canvas is the pane, so its nominal 1440 is a label
 * rather than a measurement. Every place that reports a width reads it from
 * here, because two readouts naming the same scope with different figures is
 * the confusion the operator was already complaining about.
 */
export function useRenderedWidth(device: DeviceId): { width: number; fluid: boolean } {
  const zoom = useEditorStore((state) => state.zoom);
  const pane = useEditorStore((state) => state.canvasPaneWidth);

  const entry = DEVICES.find((candidate) => candidate.id === device);
  const fluid = device === FLUID_DEVICE;
  const width = fluid && pane ? Math.round(pane / (zoom / 100)) : entry?.width ?? 0;

  return { width, fluid };
}

/**
 * A number that settles rather than jumps.
 *
 * The needle discipline: when the canvas is re-registered at another width, the
 * figure runs to the new one over the same beat the canvas takes to get there,
 * so the two read as one movement. Reduced motion gets the destination at once
 * — there is nothing to understand in the travel, only in the arrival.
 */
export function useSettledNumber(target: number, duration = 260): number {
  const [value, setValue] = useState(target);
  const frame = useRef(0);
  const from = useRef(target);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduced || from.current === target) {
      from.current = target;
      setValue(target);
      return;
    }

    const start = performance.now();
    const origin = from.current;
    from.current = target;

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // Exponential ease-out: fast off the mark, then damped into place.
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(origin + (target - origin) * eased));
      if (t < 1) frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration]);

  return value;
}

/* -------------------------------------------------------------------------- */
/*  Reporting                                                                 */
/* -------------------------------------------------------------------------- */

export type LampState = "live" | "caution" | "stop" | "off";

const LAMP_COLOR: Record<LampState, string> = {
  live: "var(--studio-live)",
  caution: "var(--studio-caution)",
  stop: "var(--studio-stop)",
  off: "var(--studio-ink-faint)",
};

/**
 * The only thing in the bay allowed to glow, and only because a lamp is the one
 * component whose whole job is to be seen lit from across a desk. An unlit lamp
 * keeps its housing, so the absence of light is itself readable.
 */
export function Lamp({
  state,
  className,
  size = 6,
}: {
  state: LampState;
  className?: string;
  size?: number;
}) {
  const color = LAMP_COLOR[state];
  const lit = state !== "off";

  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 rounded-full transition-[background,box-shadow] duration-200", className)}
      style={{
        width: size,
        height: size,
        background: lit ? color : "transparent",
        boxShadow: lit
          ? `0 0 0 2px color-mix(in oklab, ${color} 22%, transparent)`
          : `inset 0 0 0 1px var(--studio-line-hi)`,
      }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Holding                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * A plate of the console that has come off it — the strip under the canvas, the
 * cluster in full screen. Panel ground so it reads as apparatus against the
 * grey wall, and a cast shadow with a real offset because it is sitting in
 * front of the field rather than printed on it.
 */
export function Console({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-md border border-studio-edge bg-studio-deep/95 px-1.5 py-1 backdrop-blur-sm",
        "shadow-[0_1px_0_0_rgb(255_255_255/0.9)_inset,0_12px_26px_-12px_rgb(0_0_0/0.35)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A milled groove between two groups of controls on one plate. */
export function Groove({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "mx-1 h-4 w-px shrink-0 bg-studio-edge shadow-[1px_0_0_0_rgb(255_255_255/0.8)]",
        className,
      )}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  The node graph                                                            */
/* -------------------------------------------------------------------------- */

/** Which breakpoints hold an override of their own for one section. */
export function overriddenDevices(styles?: ResponsiveStyle): DeviceId[] {
  if (!styles) return [];
  return DEVICES.filter((device) => Object.keys(styles[device.id] ?? {}).length).map(
    (device) => device.id,
  );
}

/**
 * A section's overrides, drawn as three marks.
 *
 * This is the node graph made small enough to sit in a list row: desktop,
 * tablet, mobile, lit where that breakpoint carries something of its own. It is
 * the fact the operator otherwise has to open a panel to learn, and the reason
 * the column can be read rather than audited.
 */
export function OverrideMarks({
  styles,
  className,
  compact = false,
}: {
  styles?: ResponsiveStyle;
  className?: string;
  /** Laid flat, for the rail, where the row is the width of a thumbnail. */
  compact?: boolean;
}) {
  const lit = new Set(overriddenDevices(styles));

  // Unlit marks keep their housing, the same way an unlit lamp does. Returning
  // nothing when nothing is overridden makes "no overrides here" and "this row
  // has no marks" identical, and the column stops being readable as a graph.
  const named = DEVICES.filter((device) => lit.has(device.id)).map((device) => device.label);

  return (
    <span
      className={cn("flex shrink-0 items-center gap-[3px]", className)}
      title={
        named.length
          ? `Overridden on ${named.join(", ").toLowerCase()}`
          : "No overrides — this section takes the template's own styling"
      }
    >
      {DEVICES.map((device) => (
        <span
          key={device.id}
          aria-hidden
          className={cn(
            "rounded-[1px] transition-colors duration-150",
            compact ? "h-[3px] w-[5px]" : "h-[7px] w-[3px]",
          )}
          style={{
            background: lit.has(device.id) ? "var(--studio-live)" : "var(--studio-line-hi)",
          }}
        />
      ))}
      <span className="sr-only">
        {named.length ? `Overridden on ${named.join(", ")}` : "No breakpoint overrides"}
      </span>
    </span>
  );
}

/**
 * The reference patch.
 *
 * A grading room paints its wall to a known value so the eye has an anchor; a
 * wall with nothing to reference against is atmosphere. These three chips are
 * that anchor — paper white, the wall's own value, ink black — sitting on the
 * field beside the canvas, so a school's near-white section can be judged as
 * near-white rather than guessed at against a screen with its own ideas.
 */
export function ReferencePatch({ className }: { className?: string }) {
  const chips = [
    { fill: "#ffffff", label: "Paper white" },
    { fill: "var(--studio-field)", label: "The wall — an 18% neutral" },
    { fill: "#000000", label: "Ink black" },
  ];

  return (
    <div
      className={cn(
        "flex items-stretch overflow-hidden rounded-[3px] shadow-[0_0_0_1px_rgb(0_0_0/0.35)]",
        className,
      )}
      title="A reference for the eye: paper white, the wall, ink black"
    >
      {/* The tab is dark so its lettering is legible; the chips are not. They
          sit in a patch of the wall's own value, because a reference judged
          against the vignette's darkest corner is the exact error this whole
          surround exists to refuse — the ground has to be the known one. */}
      <span className="flex items-center bg-studio-surface px-1.5 py-1">
        <Placard className="text-studio-faint">Ref</Placard>
      </span>
      <span
        className="flex items-center gap-px px-1 py-1"
        style={{ background: "var(--studio-field)" }}
      >
        {chips.map((chip) => (
          <span
            key={chip.label}
            aria-hidden
            title={chip.label}
            className="block size-3 rounded-[1px]"
            style={{ background: chip.fill }}
          />
        ))}
      </span>
    </div>
  );
}
