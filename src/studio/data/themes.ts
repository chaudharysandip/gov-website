/**
 * Descriptors for the nineteen themes that already ship in `src/Theme`.
 *
 * This file describes them; it does not define them. The React implementation
 * stays where it is, and `src/studio/templates/registry.js` is what resolves a
 * theme id to the components. Descriptions are written from each theme's actual
 * section composition, not from marketing copy.
 *
 * Nothing outside `src/studio/lib/website.js` should import this directly —
 * going through the accessor is what lets the static layer become an API call.
 */

import type { ThemeDescriptor } from "@/studio/types";

/** `theme-1` here matches `theme1` in `src/Theme/registry.tsx`. */
export const themes: ThemeDescriptor[] = [
  {
    id: "theme-1",
    key: "theme1",
    name: "Aurora Platform",
    description:
      "Product marketing layout with a scroll-driven hero, module showcase and pricing-style panels.",
    category: "Product",
    preview: "/themes/theme1.jpg",
    accent: "#2876BD",
    demo: true,
  },
  {
    id: "theme-2",
    key: "theme2",
    name: "Scholar Modern",
    description:
      "Full-bleed slider hero, programme grid, faculty and gallery. The general-purpose school layout.",
    category: "School",
    preview: "/themes/theme2.jpg",
    accent: "#2563EB",
  },
  {
    id: "theme-3",
    key: "theme3",
    name: "Scholar Classic",
    description:
      "Bright, high-contrast take on the school layout with a dedicated notices and services band.",
    category: "School",
    preview: "/themes/theme3.jpg",
    accent: "#1D4ED8",
  },
  {
    id: "theme-4",
    key: "theme4",
    name: "Campus Slate",
    description:
      "Notice-first ordering on a slate palette, with dark mode carried through every section.",
    category: "School",
    preview: "/themes/theme4.jpg",
    accent: "#0F172A",
  },
  {
    id: "theme-5",
    key: "theme5",
    name: "Modular Campus",
    description:
      "Composes itself from a configurable section list — the closest existing theme to the studio's own model.",
    category: "School",
    preview: "/themes/theme5.jpg",
    accent: "#0EA5E9",
  },
  {
    id: "theme-6",
    key: "theme6",
    name: "Academy Blue",
    description:
      "Compact seven-section layout: hero, about, programmes, campus life, testimonials and news.",
    category: "School",
    preview: "/themes/theme6.jpg",
    accent: "#1E40AF",
  },
  {
    id: "theme-7",
    key: "theme7",
    name: "Verdant Academy",
    description:
      "Emerald palette with a leadership message band ahead of programmes and faculty.",
    category: "College",
    preview: "/themes/theme7.jpg",
    accent: "#059669",
  },
  {
    id: "theme-8",
    key: "theme8",
    name: "Heritage Indigo",
    description:
      "Warm paper background and indigo accents, with statistics and notices high on the page.",
    category: "College",
    preview: "/themes/theme8.jpg",
    accent: "#4F46E5",
  },
  {
    id: "theme-9",
    key: "theme9",
    name: "Civic Slate",
    description:
      "Nine-section layout pairing facilities and campus life with a combined notice-and-events board.",
    category: "College",
    preview: "/themes/theme9.jpg",
    accent: "#334155",
  },
  {
    id: "theme-10",
    key: "theme10",
    name: "Warm Campus",
    description:
      "Soft peach canvas with playful section transitions, aimed at primary and secondary schools.",
    category: "School",
    preview: "/themes/theme10.jpg",
    accent: "#F97316",
  },
  {
    id: "theme-11",
    key: "theme11",
    name: "Evergreen Kids",
    description:
      "Illustrated jungle backdrop over the same nine-section structure as Warm Campus.",
    category: "School",
    preview: "/themes/theme11.jpg",
    accent: "#10B981",
  },
  {
    id: "theme-12",
    key: "theme12",
    name: "Template Gallery",
    description:
      "Filterable showcase of website templates. Renders as a single page rather than editable sections.",
    category: "Utility",
    preview: null,
    accent: "#64748B",
    demo: true,
    composable: false,
  },
  {
    id: "theme-13",
    key: "theme13",
    name: "Editorial Grain",
    description:
      "Textured editorial layout that opens on statistics, with a restrained type-led rhythm.",
    category: "College",
    preview: null,
    accent: "#111827",
  },
  {
    id: "theme-14",
    key: "theme14",
    name: "University Prime",
    description:
      "The longest layout: admissions process, student life, notices, events, recruiters and FAQ.",
    category: "University",
    preview: null,
    accent: "#1D4ED8",
  },
  {
    id: "theme-15",
    key: "theme15",
    name: "Institute Pro",
    description:
      "Highlights band under the hero, then programmes, campus life, accreditation and a virtual tour.",
    category: "University",
    preview: null,
    accent: "#0F766E",
  },
  {
    id: "theme-16",
    key: "theme16",
    name: "Institute Pro Contrast",
    description:
      "Institute Pro's structure with a higher-contrast palette and a broader news and notice feed.",
    category: "University",
    preview: null,
    accent: "#7C3AED",
  },
  {
    id: "theme-17",
    key: "theme17",
    name: "Civic Portal",
    description:
      "Government-style portal: emergency alert, notice ticker, service tiles, officials and documents.",
    category: "Government",
    preview: null,
    accent: "#B91C1C",
    demo: true,
  },
  {
    id: "theme-18",
    key: "theme18",
    name: "Nebula Product",
    description:
      "Dark product site with an ecosystem map, dashboard preview, feature grid and timeline.",
    category: "Product",
    preview: null,
    accent: "#6366F1",
    demo: true,
  },
  {
    id: "theme-19",
    key: "theme19",
    name: "Linen Heritage",
    description:
      "Boarding-school layout on linen: provenance, programmes, houses, board and reservations.",
    category: "School",
    preview: null,
    accent: "#92400E",
  },
];

export const themeIds = themes.map((theme) => theme.id);
