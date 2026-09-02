/**
 * Resolves a theme id to the pieces the studio needs: its section manifest,
 * its frame, and the whole-page component for themes that are not composable.
 *
 * A registry rather than a switch, so adding a twentieth theme is one entry in
 * `MANIFESTS` plus a run of `scripts/generate-studio-manifests.mjs`.
 */

import type { ComponentType } from "react";
import type { ThemeChrome, ThemeManifest, ThemeTemplate } from "@/studio/types";
import theme1 from "./sections/theme-1";
import theme2 from "./sections/theme-2";
import theme3 from "./sections/theme-3";
import theme4 from "./sections/theme-4";
import theme5 from "./sections/theme-5";
import theme6 from "./sections/theme-6";
import theme7 from "./sections/theme-7";
import theme8 from "./sections/theme-8";
import theme9 from "./sections/theme-9";
import theme10 from "./sections/theme-10";
import theme11 from "./sections/theme-11";
import theme12 from "./sections/theme-12";
import theme13 from "./sections/theme-13";
import theme14 from "./sections/theme-14";
import theme15 from "./sections/theme-15";
import theme16 from "./sections/theme-16";
import theme17 from "./sections/theme-17";
import theme18 from "./sections/theme-18";
import theme19 from "./sections/theme-19";

const MANIFESTS: Record<string, ThemeManifest> = {
  "theme-1": theme1,
  "theme-2": theme2,
  "theme-3": theme3,
  "theme-4": theme4,
  "theme-5": theme5,
  "theme-6": theme6,
  "theme-7": theme7,
  "theme-8": theme8,
  "theme-9": theme9,
  "theme-10": theme10,
  "theme-11": theme11,
  "theme-12": theme12,
  "theme-13": theme13,
  "theme-14": theme14,
  "theme-15": theme15,
  "theme-16": theme16,
  "theme-17": theme17,
  "theme-18": theme18,
  "theme-19": theme19,
};

/**
 * Whole-page loaders, used for themes the studio does not decompose and for
 * the "open the untouched theme" escape hatch.
 */
const PAGES: Record<string, () => Promise<{ default: ComponentType<any> }>> = {
  "theme-1": () => import("@edn/site-themes/Theme/Theme-1"),
  "theme-2": () => import("@edn/site-themes/Theme/Theme-2"),
  "theme-3": () => import("@edn/site-themes/Theme/Theme-3"),
  "theme-4": () => import("@edn/site-themes/Theme/Theme-4"),
  "theme-5": () => import("@edn/site-themes/Theme/Theme-5"),
  "theme-6": () => import("@edn/site-themes/Theme/Theme-6"),
  "theme-7": () => import("@edn/site-themes/Theme/Theme-7"),
  "theme-8": () => import("@edn/site-themes/Theme/Theme-8"),
  "theme-9": () => import("@edn/site-themes/Theme/Theme-9"),
  "theme-10": () => import("@edn/site-themes/Theme/Theme-10"),
  "theme-11": () => import("@edn/site-themes/Theme/Theme-11"),
  "theme-12": () => import("@edn/site-themes/Theme/Theme-12"),
  "theme-13": () => import("@edn/site-themes/Theme/Theme-13"),
  "theme-14": () => import("@edn/site-themes/Theme/Theme-14"),
  "theme-15": () => import("@edn/site-themes/Theme/Theme-15"),
  "theme-16": () => import("@edn/site-themes/Theme/Theme-16"),
  "theme-17": () => import("@edn/site-themes/Theme/Theme-17"),
  "theme-18": () => import("@edn/site-themes/Theme/Theme-18"),
  "theme-19": () => import("@edn/site-themes/Theme/Theme-19"),
};

/**
 * Header and footer come from the theme; the studio never rebuilds site chrome.
 * Written out rather than templated, because a bundler cannot follow an import
 * whose path is computed — and because Theme-1 and Theme-12 do not follow the
 * convention, exactly as `src/Theme/registry.tsx` records for the live site.
 */
const CHROME: Record<string, ThemeChrome> = {
  "theme-1": {
    header: () => import("@edn/site-themes/Theme/Theme-1/components/Header/1/Header").then((m) => m.Header),
    footer: () => import("@edn/site-themes/Theme/Theme-1/components/Footer/Footer").then((m) => m.Footer),
  },
  "theme-2": {
    header: () => import("@edn/site-themes/Theme/Theme-2/components/Header/Header").then((m) => m.Header),
    footer: () => import("@edn/site-themes/Theme/Theme-2/components/Footer/Footer").then((m) => m.Footer),
  },
  "theme-3": {
    header: () => import("@edn/site-themes/Theme/Theme-3/components/Header/Header").then((m) => m.Header),
    footer: () => import("@edn/site-themes/Theme/Theme-3/components/Footer/Footer").then((m) => m.Footer),
  },
  "theme-4": {
    header: () => import("@edn/site-themes/Theme/Theme-4/components/Header/Header").then((m) => m.Header),
    footer: () => import("@edn/site-themes/Theme/Theme-4/components/Footer/Footer").then((m) => m.Footer),
  },
  "theme-5": {
    header: () => import("@edn/site-themes/Theme/Theme-5/components/Header/Header").then((m) => m.Header),
    footer: () => import("@edn/site-themes/Theme/Theme-5/components/Footer/Footer").then((m) => m.Footer),
  },
  "theme-6": {
    header: () => import("@edn/site-themes/Theme/Theme-6/components/Header/Header").then((m) => m.Header),
    footer: () => import("@edn/site-themes/Theme/Theme-6/components/Footer/Footer").then((m) => m.Footer),
  },
  "theme-7": {
    header: () => import("@edn/site-themes/Theme/Theme-7/components/Header/Header").then((m) => m.Header),
    footer: () => import("@edn/site-themes/Theme/Theme-7/components/Footer/Footer").then((m) => m.Footer),
  },
  "theme-8": {
    header: () => import("@edn/site-themes/Theme/Theme-8/components/Header/Header").then((m) => m.Header),
    footer: () => import("@edn/site-themes/Theme/Theme-8/components/Footer/Footer").then((m) => m.Footer),
  },
  "theme-9": {
    header: () => import("@edn/site-themes/Theme/Theme-9/components/Header/Header").then((m) => m.Header),
    footer: () => import("@edn/site-themes/Theme/Theme-9/components/Footer/Footer").then((m) => m.Footer),
  },
  "theme-10": {
    header: () => import("@edn/site-themes/Theme/Theme-10/components/Header/Header").then((m) => m.Header),
    footer: () => import("@edn/site-themes/Theme/Theme-10/components/Footer/Footer").then((m) => m.Footer),
  },
  "theme-11": {
    header: () => import("@edn/site-themes/Theme/Theme-11/components/Header/Header").then((m) => m.Header),
    footer: () => import("@edn/site-themes/Theme/Theme-11/components/Footer/Footer").then((m) => m.Footer),
  },
  "theme-12": {
    // Theme-12 ships a toggle-only header and reuses Theme-1's footer.
    header: () => import("@edn/site-themes/Theme/Theme-12/components/layout/Header").then((m) => m.Header),
    footer: () => import("@edn/site-themes/Theme/Theme-1/components/Footer/Footer").then((m) => m.Footer),
  },
  "theme-13": {
    header: () => import("@edn/site-themes/Theme/Theme-13/components/Header/Header").then((m) => m.Header),
    footer: () => import("@edn/site-themes/Theme/Theme-13/components/Footer/Footer").then((m) => m.Footer),
  },
  "theme-14": {
    header: () => import("@edn/site-themes/Theme/Theme-14/components/Header/Header").then((m) => m.Header),
    footer: () => import("@edn/site-themes/Theme/Theme-14/components/Footer/Footer").then((m) => m.Footer),
  },
  "theme-15": {
    header: () => import("@edn/site-themes/Theme/Theme-15/components/Header/Header").then((m) => m.Header),
    footer: () => import("@edn/site-themes/Theme/Theme-15/components/Footer/Footer").then((m) => m.Footer),
  },
  "theme-16": {
    header: () => import("@edn/site-themes/Theme/Theme-16/components/Header/Header").then((m) => m.Header),
    footer: () => import("@edn/site-themes/Theme/Theme-16/components/Footer/Footer").then((m) => m.Footer),
  },
  "theme-17": {
    header: () => import("@edn/site-themes/Theme/Theme-17/components/Header/Header").then((m) => m.Header),
    footer: () => import("@edn/site-themes/Theme/Theme-17/components/Footer/Footer").then((m) => m.Footer),
  },
  "theme-18": {
    header: () => import("@edn/site-themes/Theme/Theme-18/components/Header/Header").then((m) => m.Header),
    footer: () => import("@edn/site-themes/Theme/Theme-18/components/Footer/Footer").then((m) => m.Footer),
  },
  "theme-19": {
    header: () => import("@edn/site-themes/Theme/Theme-19/components/Header/Header").then((m) => m.Header),
    footer: () => import("@edn/site-themes/Theme/Theme-19/components/Footer/Footer").then((m) => m.Footer),
  },
};

export function hasTemplate(themeId: string): boolean {
  return Boolean(MANIFESTS[themeId]);
}

/** The manifest for a theme, resolved against its page and its chrome. */
export function getTemplate(themeId: string): ThemeTemplate | null {
  const manifest = MANIFESTS[themeId];
  if (!manifest) return null;

  // A theme that does not decompose into a run of sections — Theme-12 is a
  // self-contained gallery with its own filters and modal — is presented as one
  // section: the whole page. Content and global styling still apply; only
  // reordering and per-section hiding stop making sense, and with a single
  // section they are moot rather than broken.
  const composable = manifest.sections.length > 1;

  const sections = composable
    ? manifest.sections
    : [
        {
          id: "page",
          kind: "page",
          label: "Whole page",
          component: "Page",
          slices: manifest.sections[0]?.slices ?? [],
          className: "",
          load: () => PAGES[themeId]().then((m) => m.default),
        },
      ];

  return {
    ...manifest,
    sections,
    composable,
    loadPage: PAGES[themeId],
    chrome: CHROME[themeId],
  };
}
