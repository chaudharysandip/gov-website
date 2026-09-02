"use client";

/**
 * The keyboard sheet.
 *
 * Every shortcut here already worked; none of them was written down anywhere
 * except two tooltips on the undo buttons. An expert tool that hides its own
 * fast path makes experts of nobody, so `?` says what it can do — and the sheet
 * is the only place in the studio that has to name a key, which is why the keys
 * are set as keys rather than as prose.
 */

import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@edn/site-themes/components/ui/dialog";
import { Placard } from "@/studio/components/bay";

/** A key as it is printed on one. */
function Key({ children }: { children: ReactNode }) {
  return (
    <kbd className="studio-readout inline-flex h-5 min-w-5 items-center justify-center rounded-[3px] border border-studio-edge bg-studio-deep px-1.5 text-[10px] text-studio-ink shadow-[0_1px_0_0_var(--studio-line-hi)]">
      {children}
    </kbd>
  );
}

function Row({ keys, children }: { keys: string[]; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-[12px] text-studio-dim">{children}</span>
      <span className="flex shrink-0 items-center gap-1">
        {keys.map((key, index) => (
          <span key={key} className="flex items-center gap-1">
            {index > 0 ? <span className="text-[10px] text-studio-faint">+</span> : null}
            <Key>{key}</Key>
          </span>
        ))}
      </span>
    </div>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section>
      <Placard className="block pb-1">{label}</Placard>
      <div className="divide-y divide-studio-line border-t border-studio-line">{children}</div>
    </section>
  );
}

/**
 * Opens on `?`, and from the overflow menu.
 *
 * The listener ignores anything typed into a field, the same way every other
 * shortcut in the editor does — `?` is a character before it is a command.
 */
export function Shortcuts({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const mod = useModifierName();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-5 rounded-[5px] border-studio-line bg-studio-panel">
        <DialogHeader>
          <DialogTitle className="text-[15px] font-medium text-studio-ink">Keyboard</DialogTitle>
          <DialogDescription className="text-[12px] text-studio-dim">
            Everything here works from the canvas or the panels, but never while you are typing in
            a field.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Group label="The document">
            <Row keys={[mod, "S"]}>Save to this browser</Row>
            <Row keys={[mod, "Z"]}>Undo</Row>
            <Row keys={[mod, "Shift", "Z"]}>Redo</Row>
          </Group>

          <Group label="The page">
            <Row keys={["/"]}>Filter the sections</Row>
            <Row keys={["Del"]}>Take the selected section off the page</Row>
            <Row keys={["Esc"]}>Leave Play, then full screen, then the selection</Row>
          </Group>

          <Group label="This sheet">
            <Row keys={["?"]}>Open and close it</Row>
          </Group>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * What the modifier is called on this machine.
 *
 * Printing "Ctrl" to someone on a Mac is printing the wrong key. Read after
 * mount rather than during render, because the server has no platform to
 * answer with and a guess would be a hydration mismatch.
 */
function useModifierName() {
  // "Have we hydrated yet" asked without an effect, so the name is derived on
  // the render that can answer rather than set into state a render later.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  if (!mounted) return "Ctrl";

  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
    navigator.platform ??
    "";
  return /mac|iphone|ipad/i.test(platform) ? "⌘" : "Ctrl";
}
