"use client";

/**
 * The wrapper each theme paints its page on.
 *
 * The studio composes a theme from its sections so they can be hidden,
 * reordered and styled one at a time — which means something has to stand in
 * for the element the theme's own `index.tsx` wraps them in. For most themes
 * that is a `div` and a `main` with a class list, and the generated manifest
 * already carries both. A handful carry more: a hook that publishes the
 * theme's CSS custom properties, or a backdrop layer the sections sit over.
 * Those get a frame here, importing the theme's own hook or component rather
 * than restating it, so the canvas and the real site cannot drift.
 */

import type { ComponentType, CSSProperties, ReactNode } from "react";
import type { ThemeManifest } from "@/studio/types";
import dynamic from "next/dynamic";
import { cn } from "@edn/site-themes/lib/utils";
import { DeferredMount } from "@edn/site-themes/components/ui/DeferredMount";

/**
 * A theme rendered whole — see `composable` in the registry — already has its
 * own wrapper, so the frame must not add a second one.
 */
/** Every frame takes the composed sections, and some the tenant's profile. */
interface FrameProps {
  children?: ReactNode;
  profile?: any;
}

function PassthroughFrame({ children }: FrameProps) {
  return children;
}

/** Every theme's frame takes the composed sections as children. */
function makeDefaultFrame(manifest: ThemeManifest) {
  return function DefaultFrame({ children }: FrameProps) {
    return (
      <div className={manifest.frameClassName || "relative min-h-screen bg-background text-foreground"}>
        {manifest.mainClassName ? (
          <main className={manifest.mainClassName}>{children}</main>
        ) : (
          <main>{children}</main>
        )}
      </div>
    );
  };
}

const ThreeBackground = dynamic(
  () => import("@edn/site-themes/Theme/Theme-1/components/ThreeBackground").then((m) => m.ThreeBackground),
  { ssr: false },
);

function Theme1Frame({ children }: FrameProps) {
  return (
    <div className="theme1-wrapper relative">
      <DeferredMount>
        <ThreeBackground />
      </DeferredMount>
      <main className="relative z-10">{children}</main>
    </div>
  );
}

const Theme5Backdrop = dynamic(() =>
  import("@edn/site-themes/Theme/Theme-5/components/Backdrop").then((m) => m.Backdrop),
);

function Theme5Frame({ children }: FrameProps) {
  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 selection:bg-primary/30 selection:text-slate-900 overflow-x-hidden font-sans transition-colors duration-700">
      <Theme5Backdrop />
      <main className="relative z-10 flex flex-col w-full">{children}</main>
    </div>
  );
}

const Theme11Backdrop = dynamic(() =>
  import("@edn/site-themes/Theme/Theme-11/components/Backdrop").then((m) => m.Backdrop),
);

function Theme11Frame({ children, profile }: FrameProps) {
  const primaryColor = profile?.primaryColor || "#10B981";
  const secondaryColor = profile?.secondaryColor || "#F97316";

  return (
    <div
      className="relative min-h-screen bg-[#FDFCF6] dark:bg-emerald-950 text-slate-800 dark:text-emerald-50 overflow-x-hidden font-sans"
      style={{
        "--primary": primaryColor,
        "--secondary": secondaryColor,
        "--accent": "#D97706",
        "--safari-leaf": "#065F46",
        // Custom properties are outside React's `CSSProperties`; the theme reads
        // all four from the cascade.
      } as CSSProperties}
    >
      <Theme11Backdrop primaryColor={primaryColor} secondaryColor={secondaryColor} />
      <div className="theme11-wrapper relative z-10">
        <main>{children}</main>
      </div>
    </div>
  );
}

/**
 * Themes 13, 17, 18 and 19 publish their whole palette through a hook that
 * returns a `style` object of CSS custom properties. Rendering their sections
 * without it leaves every `var(--t13-*)` unresolved, so the frame has to call
 * the same hook the theme does.
 */
function makeScopedFrame({
  useBrand,
  scope,
  element = "main",
  Decoration,
}: {
  useBrand?: () => any;
  scope?: string | string[];
  element?: "main" | "div";
  Decoration?: ComponentType<any>;
}) {
  return function ScopedFrame({ children }: FrameProps) {
    const { vars } = useBrand!();
    const Element = element;
    return (
      <Element style={vars} className={cn(scope)}>
        {Decoration ? <Decoration /> : null}
        {children}
      </Element>
    );
  };
}

/**
 * Frames are looked up lazily: pulling every theme's design module in at
 * import time would drag nineteen themes into the studio bundle for the one
 * being edited.
 */
const CUSTOM_FRAMES = {
  "theme-1": () => Theme1Frame,
  "theme-5": () => Theme5Frame,
  "theme-11": () => Theme11Frame,
  "theme-13": () =>
    dynamic(async () => {
      const { T13Chrome, T13Grain, useT13Accent } = await import("@edn/site-themes/Theme/Theme-13/lib/design");
      return { default: makeScopedFrame({
        useBrand: useT13Accent,
        scope: "t13 relative min-h-screen overflow-x-hidden",
        element: "div",
        Decoration: function T13Decoration() {
          return (
            <>
              <T13Chrome />
              <T13Grain />
            </>
          );
        },
      }) };
    }),
  "theme-17": () =>
    dynamic(async () => {
      const { BRAND_SCOPE, SURFACE_SCOPE, useT17Brand } = await import("@edn/site-themes/Theme/Theme-17/lib/design");
      return { default: makeScopedFrame({
        useBrand: useT17Brand,
        scope: ["theme17-wrapper bg-(--t17-canvas)", SURFACE_SCOPE, BRAND_SCOPE],
      }) };
    }),
  "theme-18": () =>
    dynamic(async () => {
      const { NOISE, SCOPE, useT18Brand } = await import("@edn/site-themes/Theme/Theme-18/lib/design");
      return { default: makeScopedFrame({
        useBrand: useT18Brand,
        scope: ["theme18-wrapper relative isolate min-h-screen bg-(--t18-void)", SCOPE],
        Decoration: function T18Grain() {
          return (
            <div
              aria-hidden
              className="pointer-events-none fixed inset-0 -z-5 opacity-[0.035] mix-blend-overlay"
              style={{ backgroundImage: NOISE }}
            />
          );
        },
      }) };
    }),
  "theme-19": () =>
    dynamic(async () => {
      const { THEME_SCOPE, useT19Brand } = await import("@edn/site-themes/Theme/Theme-19/lib/design");
      return { default: makeScopedFrame({
        useBrand: useT19Brand,
        scope: ["theme19-wrapper bg-(--t19-linen)", THEME_SCOPE],
      }) };
    }),
};

const cache = new Map<string, ComponentType<FrameProps>>();

/** The frame a theme paints its page on, built once and cached. */
export function getFrame(themeId: string, manifest: ThemeManifest): ComponentType<FrameProps> {
  const cached = cache.get(themeId);
  if (cached) return cached;

  // A theme the registry does not decompose renders whole and brings its own
  // wrapper, so the frame must not add a second one.
  const custom = CUSTOM_FRAMES[themeId as keyof typeof CUSTOM_FRAMES];
  let frame: ComponentType<FrameProps>;
  if (manifest.sections.length <= 1) frame = PassthroughFrame;
  else if (custom) frame = custom() as ComponentType<FrameProps>;
  else frame = makeDefaultFrame(manifest);

  cache.set(themeId, frame);
  return frame;
}
