"use client";

/**
 * Tells GSAP where the canvas scrolls.
 *
 * Puck mounts the canvas with `createPortal` into an iframe, so a theme's
 * components *execute* in the editor's window and only their DOM lives in the
 * frame. ScrollTrigger therefore boots against the editor's own window — which
 * never scrolls, the shell is `h-screen overflow-hidden` — while the elements
 * it measures scroll inside the frame. Sections built on framer-motion's
 * `whileInView` come through it unharmed, because IntersectionObserver resolves
 * against the top-level viewport through the frame tree; every GSAP entrance is
 * left parked at its `from` state instead. On Theme-1 that is "Why choose us"
 * with 118 of its 130 elements at `opacity: 0`.
 *
 * A `scrollerProxy` is the seam GSAP publishes for exactly this — it is how
 * Lenis and friends drive ScrollTrigger — and `ScrollTrigger.update()` on the
 * frame's own scroll event supplies the clock. It is registered as the default
 * scroller rather than passed to each trigger because the themes create their
 * own triggers and know nothing about the studio.
 *
 * Rendered *before* the sections on purpose: React runs layout effects in tree
 * order, so this one lands before any section's `useGSAP`, and the sections
 * load lazily on top of that.
 */

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function CanvasScrollBridge() {
  const anchor = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const doc = anchor.current?.ownerDocument;
    const frame = doc?.defaultView;

    // Only Puck's portal splits the two. The preview route renders in the page
    // itself, and its device frames load a URL, so both already run in the
    // document they scroll and ScrollTrigger's own defaults are correct there.
    if (!doc || !frame || frame === window) return;

    const scroller = doc.documentElement;

    ScrollTrigger.scrollerProxy(scroller, {
      scrollTop(value?: number) {
        if (arguments.length) frame.scrollTo(0, value as number);
        return frame.scrollY;
      },
      // The proxy's rect and every element's own `getBoundingClientRect` are
      // both relative to the frame's viewport, so the two agree and the start
      // and end positions come out the same as they would on the real page.
      getBoundingClientRect: () => ({
        top: 0,
        left: 0,
        width: frame.innerWidth,
        height: frame.innerHeight,
      }),
      // The frame's scroller is its own document, so a pinned section can be
      // fixed to it exactly as it is on the site.
      pinType: "fixed",
    });
    ScrollTrigger.defaults({ scroller });

    const update = () => ScrollTrigger.update();
    frame.addEventListener("scroll", update, { passive: true });

    // Sections arrive lazily and grow as their images land, and every trigger's
    // start and end is a measurement taken once. The themes refresh on their
    // own `ResizeObserver`, but they watch this document's body — the editor's,
    // which never changes size — so the canvas needs its own.
    // The frame's own timer ids, not this window's: `frame.setTimeout` returns
    // the number the DOM defines rather than Node's `Timeout` object.
    let pending: number | undefined;
    const refresh = () => {
      frame.clearTimeout(pending);
      pending = frame.setTimeout(() => ScrollTrigger.refresh(), 150);
    };
    const observer = new frame.ResizeObserver(refresh);
    observer.observe(doc.body);

    return () => {
      frame.clearTimeout(pending);
      observer.disconnect();
      frame.removeEventListener("scroll", update);
      // The defaults and the proxy are global to GSAP, so leaving either behind
      // would follow the reader out of the studio and onto the next page.
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.scroller === scroller) trigger.kill();
      });
      ScrollTrigger.scrollerProxy(scroller);
      ScrollTrigger.defaults({ scroller: undefined });
    };
  }, []);

  return <span ref={anchor} hidden aria-hidden="true" />;
}
