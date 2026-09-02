/**
 * Shared constants for the studio. Everything here is UI-facing configuration,
 * not content: content lives in `src/studio/data`.
 */

/** Editor document version. Bump when the saved shape changes. */
export const DOCUMENT_VERSION = 1;

export const STORAGE_PREFIX = "editor-site-";

/**
 * Where the canvas's motion preview reads from.
 *
 * A separate prefix, not a suffix on the saved key: `listSavedSiteIds` scans by
 * prefix, and a draft under the same one would show up in the gallery as a
 * seventh website called "draft-site-001".
 */
export const DRAFT_PREFIX = "editor-draft-";

/**
 * Canvas viewports. The widths are real device widths, and the canvas renders
 * in an iframe, so the theme's own `md:` / `lg:` breakpoints resolve exactly as
 * they would on the device rather than being simulated.
 */
import type { DeviceDescriptor, DeviceId } from "@/studio/types";

export const DEVICES: DeviceDescriptor[] = [
  { id: "desktop", label: "Desktop", width: 1440, icon: "Monitor" },
  { id: "tablet", label: "Tablet", width: 768, icon: "Tablet" },
  { id: "mobile", label: "Mobile", width: 375, icon: "Smartphone" },
];

export const DEFAULT_DEVICE: DeviceId = "desktop";

/**
 * The device the canvas renders at the pane's own width instead of a fixed one.
 *
 * A 1440 frame inside a wider pane is a gutter down both sides, and inside a
 * narrower one a horizontal scrollbar — and neither is anything a desktop
 * visitor sees. Tablet and mobile stay exact, because a breakpoint that is
 * approximately 768 is no breakpoint at all. The width above is still the
 * nominal desktop, and is what the preview route's device frames use.
 */
export const FLUID_DEVICE: DeviceId = "desktop";

export const DEVICE_IDS = DEVICES.map((device) => device.id);

/**
 * Breakpoints used when a section's responsive overrides are compiled to CSS.
 * Desktop is the base declaration; the others are max-width queries, so a
 * breakpoint with no override inherits the one above it.
 */
export const DEVICE_MEDIA: Record<DeviceId, string | null> = {
  desktop: null,
  tablet: "(max-width: 1023px)",
  mobile: "(max-width: 767px)",
};

export const ZOOM_STEPS = [25, 50, 75, 90, 100, 125, 150];
export const MIN_ZOOM = 25;
export const MAX_ZOOM = 150;

/**
 * What the studio means by a heading, a paragraph, a link and a button when it
 * recolours the things *inside* a section rather than the section itself.
 *
 * Element selectors on purpose. A theme paints its own text with utility
 * classes — `text-white` on a hero, `text-slate-900` on a card — and a rule on
 * the section alone only ever loses to those: it sets a colour to inherit that
 * the class on the element then overrides. A rule on
 * `.studio-canvas [data-studio-section="hero"] :is(h1…h6)` outranks a single
 * class, so the control does what it says it does.
 *
 * A button is whatever the app already marks as one: a `<button>`, anything
 * with `role="button"`, and every `data-slot="button"` — the attribute the
 * shared Button component stamps on, including the links it renders through
 * `asChild`. Guessing at anchors by their classes would catch half the nav.
 */
export const ELEMENT_SELECTORS = {
  /**
   * Everything that carries text. This is what "Text" sets, and it has to be a
   * rule on the elements for the same reason the rest do: a colour on the
   * section is only inherited, and inheritance loses to the `text-white` a
   * theme put on its own heading.
   */
  text:
    ":is(h1, h2, h3, h4, h5, h6, p, li, blockquote, span, a, strong, em, small," +
    " dd, dt, figcaption, label, td, th, button)",
  /**
   * The band's own ground. A theme rarely paints it on the element the studio
   * wraps: Theme-1's hero is a `<section class="hero-stage">` three levels in,
   * and a colour on the wrapper sits behind it, invisible. Sectioning elements
   * only — a `div` here would repaint content wrappers and cards as well.
   */
  ground: ":is(section, header, footer, main)",
  heading: ":is(h1, h2, h3, h4, h5, h6)",
  body: ":is(p, li, blockquote, dd, dt)",
  button: ':is(button, [role="button"], [data-slot="button"])',
  link: ':is(a):not([data-slot="button"]):not([role="button"])',
};

/** The text colours, offered per section and for the whole site. */
export const TEXT_STYLE_FIELDS = [
  { key: "headingColor", label: "Headings" },
  { key: "bodyColor", label: "Body text" },
  { key: "linkColor", label: "Links" },
];

/** The button colours, offered per section and for the whole site. */
export const BUTTON_STYLE_FIELDS = [
  { key: "buttonBackground", label: "Fill" },
  { key: "buttonTextColor", label: "Label" },
  { key: "buttonHoverBackground", label: "Fill on hover" },
  { key: "buttonBorderColor", label: "Border" },
];

/** Global design tokens the studio may rewrite. Keys are CSS custom properties. */
export const GLOBAL_COLOR_TOKENS = [
  { key: "primary", label: "Primary", cssVar: "--primary" },
  { key: "primaryForeground", label: "On primary", cssVar: "--primary-foreground" },
  { key: "secondary", label: "Secondary", cssVar: "--secondary" },
  { key: "background", label: "Background", cssVar: "--background" },
  { key: "foreground", label: "Foreground", cssVar: "--foreground" },
  { key: "muted", label: "Muted", cssVar: "--muted" },
  { key: "mutedForeground", label: "Muted text", cssVar: "--muted-foreground" },
  { key: "accent", label: "Accent", cssVar: "--accent" },
  { key: "border", label: "Border", cssVar: "--border" },
];

export const GLOBAL_TYPOGRAPHY_TOKENS = [
  { key: "headingFont", label: "Heading font", cssVar: "--font-heading" },
  { key: "bodyFont", label: "Body font", cssVar: "--font-primary" },
];

export const GLOBAL_LAYOUT_TOKENS = [
  { key: "radius", label: "Corner radius", cssVar: "--radius", unit: "rem" },
  { key: "containerWidth", label: "Container width", cssVar: "--studio-container", unit: "px" },
  { key: "sectionSpacing", label: "Section spacing", cssVar: "--studio-section-gap", unit: "px" },
];

/**
 * Font stacks offered in the global panel. Local fonts already loaded by the
 * app come first so the studio does not pull a webfont the site will not have.
 */
export const FONT_STACKS = [
  { value: "var(--font-geist-sans)", label: "Geist Sans (site default)" },
  { value: "var(--font-geist-mono)", label: "Geist Mono" },
  { value: "Georgia, 'Times New Roman', serif", label: "Georgia (serif)" },
  { value: "'Segoe UI', system-ui, sans-serif", label: "System UI" },
  { value: "'Trebuchet MS', 'Helvetica Neue', sans-serif", label: "Trebuchet" },
  { value: "'Courier New', monospace", label: "Courier" },
];

export const FONT_WEIGHTS = [
  { value: "300", label: "Light" },
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semibold" },
  { value: "700", label: "Bold" },
  { value: "800", label: "Extrabold" },
];

export const TEXT_ALIGNMENTS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
  { value: "justify", label: "Justify" },
];

export const SHADOW_PRESETS = [
  { value: "none", label: "None", css: "none" },
  { value: "sm", label: "Small", css: "0 1px 2px 0 rgb(0 0 0 / 0.05)" },
  { value: "md", label: "Medium", css: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)" },
  { value: "lg", label: "Large", css: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)" },
  { value: "xl", label: "Extra large", css: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" },
];

export const BORDER_STYLES = [
  { value: "none", label: "None" },
  { value: "solid", label: "Solid" },
  { value: "dashed", label: "Dashed" },
  { value: "dotted", label: "Dotted" },
  { value: "double", label: "Double" },
];

export const BACKGROUND_SIZES = [
  { value: "cover", label: "Cover" },
  { value: "contain", label: "Contain" },
  { value: "auto", label: "Auto" },
];

export const BACKGROUND_REPEATS = [
  { value: "no-repeat", label: "No repeat" },
  { value: "repeat", label: "Repeat" },
  { value: "repeat-x", label: "Repeat X" },
  { value: "repeat-y", label: "Repeat Y" },
];

export const BACKGROUND_POSITIONS = [
  { value: "center", label: "Center" },
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
];

/* -------------------------------------------------------------------------- */
/*  Site chrome                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The header and footer are the theme's, not the template's: they sit outside
 * the section list Puck owns, on every page rather than on this one. They are
 * still editable, so they need ids — prefixed, because a template must never be
 * able to name a section that collides with one.
 */
export const CHROME_PREFIX = "chrome:";

export const HEADER_SECTION_ID = `${CHROME_PREFIX}header`;
export const FOOTER_SECTION_ID = `${CHROME_PREFIX}footer`;

/** `"chrome:header"` → `"header"`; anything else → null. */
export const chromePartOf = (sectionId?: string | null): string | null =>
  typeof sectionId === "string" && sectionId.startsWith(CHROME_PREFIX)
    ? sectionId.slice(CHROME_PREFIX.length)
    : null;
