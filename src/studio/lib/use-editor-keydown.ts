"use client";

/**
 * A keydown listener that also hears the canvas.
 *
 * Clicking a band on the canvas is the most ordinary thing anyone does in this
 * editor, and it moves focus into Puck's iframe. From that moment every key the
 * studio owns went to the frame's document instead of this one, so Ctrl+S did
 * not save, Escape did not clear, Delete did not remove, and the shortcut sheet
 * was documenting keys that had quietly stopped working. Selecting from the
 * node column left focus in this document and everything worked, which is why
 * it survived so long: the failure only appears after the click people actually
 * make.
 *
 * So a shortcut registers on both documents. The frame is found by selector
 * rather than passed down, because the three registrations in the shell and the
 * one in the node column would otherwise all need the same ref threaded to
 * them.
 *
 * The frame is re-checked on a slow timer as well as on its own `load`. Puck
 * replaces it on a device change and the preview swap navigates it, and a
 * listener bound to a document that has gone is a shortcut that silently stops
 * again — the exact failure this exists to end. Two DOM reads a second is the
 * cheapest insurance in the file.
 */

import { useEffect, useRef } from "react";

export function useEditorKeydown(
  handler: (event: KeyboardEvent) => void,
  { capture = false }: { capture?: boolean } = {},
) {
  // The handler is read through a ref so a new closure on every render does not
  // tear down and rebuild the listeners. Written in an effect rather than during
  // render: a ref touched while rendering is a ref two concurrent renders can
  // disagree about.
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  });

  useEffect(() => {
    const listener = (event: Event) => latest.current(event as KeyboardEvent);

    window.addEventListener("keydown", listener, capture);

    let frame: HTMLIFrameElement | null = null;
    let doc: Document | null = null;
    let timer: number | undefined;

    const bind = () => {
      const found = document.querySelector<HTMLIFrameElement>(".studio-canvas-viewport iframe");

      if (found !== frame) {
        frame?.removeEventListener("load", rebind);
        frame = found;
        frame?.addEventListener("load", rebind);
      }

      // `contentDocument` is null across origins; the canvas is same-origin, so
      // this only ever means "not there yet".
      const next = frame?.contentDocument ?? null;
      if (next !== doc) {
        doc?.removeEventListener("keydown", listener, capture);
        doc = next;
        doc?.addEventListener("keydown", listener, capture);
      }

      timer = window.setTimeout(bind, 500);
    };

    const rebind = () => {
      doc = null;
      window.clearTimeout(timer);
      bind();
    };

    bind();

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", listener, capture);
      doc?.removeEventListener("keydown", listener, capture);
      frame?.removeEventListener("load", rebind);
    };
  }, [capture]);
}
