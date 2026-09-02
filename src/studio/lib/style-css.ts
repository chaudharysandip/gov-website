/**
 * Compiles the studio's style objects to CSS text.
 *
 * Two rules shape everything here:
 *
 * 1. No Tailwind class is ever assembled from a user value. A class like
 *    `text-[${size}px]` cannot exist in any source file, so Tailwind never
 *    generates it and it silently does nothing. Arbitrary values become plain
 *    declarations on a scoped selector instead.
 *
 * 2. Responsive overrides are real media queries, not a value picked in JS for
 *    the device you happen to be previewing. A breakpoint with no override
 *    inherits the one above it because it emits no declaration at all, and the
 *    exported CSS behaves the same in a browser as it does in the canvas.
 */

import { DEVICE_MEDIA, ELEMENT_SELECTORS, SHADOW_PRESETS } from "./constants";
import type { DeviceId, GlobalStyles, ResponsiveStyle, StyleObject, StyleValue } from "@/studio/types";

/**
 * The breakpoint table, with the device keys typed.
 *
 * `Object.entries` widens its keys to `string`, and a `string` cannot index a
 * responsive style. Reading it through one helper is a single place to say what
 * the table already is, rather than a cast at every loop.
 */
const deviceMedia = (): Array<[DeviceId, string | null]> =>
  Object.entries(DEVICE_MEDIA) as Array<[DeviceId, string | null]>;

const shadowCss = (value: StyleValue) =>
  SHADOW_PRESETS.find((preset) => preset.value === value)?.css ?? null;

/** A style value that should not produce a declaration. */
const empty = (value: StyleValue): boolean =>
  value === undefined || value === null || value === "";

/** Number-ish values get `px`; anything with a unit or function is left alone. */
function len(value: StyleValue): string | null {
  if (empty(value)) return null;
  if (typeof value === "number") return `${value}px`;
  const trimmed = String(value).trim();
  if (trimmed === "") return null;
  return /^-?\d*\.?\d+$/.test(trimmed) ? `${trimmed}px` : trimmed;
}

/**
 * One breakpoint's worth of a section's style, as CSS declarations.
 *
 * @param {object} style a flat style object for a single device
 * @returns {string[]} `prop: value` strings
 */
function declarationsFor(style: StyleObject = {}): string[] {
  const out: string[] = [];
  const push = (prop: string, value: StyleValue) => {
    if (!empty(value)) out.push(`${prop}: ${value}`);
  };

  // Typography
  push("font-family", style.fontFamily);
  push("font-size", len(style.fontSize));
  push("font-weight", style.fontWeight);
  push("line-height", style.lineHeight);
  push("letter-spacing", len(style.letterSpacing));
  push("text-align", style.textAlign);
  push("text-transform", style.textTransform);

  // Colour
  push("color", style.textColor);
  if (!empty(style.accentColor)) {
    // Themes read `--primary` for their accent, so recolouring one section
    // means shadowing the token inside it rather than restyling its internals.
    push("--primary", style.accentColor);
    push("--ring", style.accentColor);
  }

  // Spacing
  push("padding-top", len(style.paddingTop));
  push("padding-right", len(style.paddingRight));
  push("padding-bottom", len(style.paddingBottom));
  push("padding-left", len(style.paddingLeft));
  push("margin-top", len(style.marginTop));
  push("margin-right", len(style.marginRight));
  push("margin-bottom", len(style.marginBottom));
  push("margin-left", len(style.marginLeft));
  push("gap", len(style.gap));

  // Layout
  push("width", len(style.width));
  push("max-width", len(style.maxWidth));
  push("min-height", len(style.minHeight));

  // Border
  if (!empty(style.borderStyle) && style.borderStyle !== "none") {
    push("border-style", style.borderStyle);
    push("border-width", len(style.borderWidth) ?? "1px");
    push("border-color", style.borderColor ?? "currentColor");
  }
  push("border-radius", len(style.borderRadius));

  // Shadow
  if (!empty(style.shadow)) push("box-shadow", shadowCss(style.shadow));

  // Background
  push("background-color", style.backgroundColor);
  if (!empty(style.backgroundImage)) {
    push("background-image", `url("${style.backgroundImage}")`);
    push("background-size", style.backgroundSize ?? "cover");
    push("background-position", style.backgroundPosition ?? "center");
    push("background-repeat", style.backgroundRepeat ?? "no-repeat");
  }

  return out;
}

/**
 * Rules for the elements inside a scope: its text and its buttons.
 *
 * Separate from `declarationsFor` because these cannot be declarations on the
 * section itself — a colour set there is only inherited, and inheritance loses
 * to the utility class the theme put on the heading. These are rules of their
 * own, on selectors specific enough to win.
 *
 * @param {string} scope the section or canvas selector the rules hang off
 * @returns {string[]} complete CSS rules
 */
function elementRules(scope: string, style: StyleObject = {}): string[] {
  const rules: string[] = [];
  const rule = (selector: string, declarations: string[]) => {
    if (declarations.length) rules.push(`${scope} ${selector} { ${declarations.join("; ")} }`);
  };
  const colour = (value: StyleValue): string[] => (empty(value) ? [] : [`color: ${value}`]);

  // "Text" first, so the three below win the tie on source order: they are the
  // finer control, and a reader who sets both means the finer one.
  rule(ELEMENT_SELECTORS.text, colour(style.textColor));

  // The section's own `background-color` is set as a declaration too — this is
  // the copy that reaches the element the theme actually painted.
  if (!empty(style.backgroundColor)) {
    rule(ELEMENT_SELECTORS.ground, [
      "background-image: none",
      `background-color: ${style.backgroundColor}`,
    ]);
  }

  rule(ELEMENT_SELECTORS.heading, colour(style.headingColor));
  rule(ELEMENT_SELECTORS.body, colour(style.bodyColor));
  rule(ELEMENT_SELECTORS.link, colour(style.linkColor));

  const button = [];
  if (!empty(style.buttonBackground)) {
    // A theme's call to action is usually painted with a gradient, and a
    // gradient is a `background-image`: a colour on its own would sit behind
    // one and never be seen.
    button.push("background-image: none", `background-color: ${style.buttonBackground}`);
  }
  button.push(...colour(style.buttonTextColor));
  if (!empty(style.buttonBorderColor)) {
    button.push(
      "border-style: solid",
      `border-width: ${len(style.buttonBorderWidth) ?? "1px"}`,
      `border-color: ${style.buttonBorderColor}`,
    );
  }
  const radius = len(style.buttonRadius);
  if (!empty(radius)) button.push(`border-radius: ${radius}`);
  rule(ELEMENT_SELECTORS.button, button);

  if (!empty(style.buttonHoverBackground)) {
    rule(`${ELEMENT_SELECTORS.button}:hover`, [
      "background-image: none",
      `background-color: ${style.buttonHoverBackground}`,
    ]);
  }

  return rules;
}

/**
 * The CSS for one section across every breakpoint.
 *
 * @param {string} selector e.g. `[data-studio-section="hero"]`
 * @param {{desktop?: object, tablet?: object, mobile?: object}} responsive
 */
export function sectionCss(selector: string, responsive: ResponsiveStyle = {}): string {
  const blocks: string[] = [];

  for (const [device, media] of deviceMedia()) {
    const declarations = declarationsFor(responsive[device]);
    if (!declarations.length) continue;

    const rule = `${selector} { ${declarations.join("; ")} }`;
    blocks.push(media ? `@media ${media} { ${rule} }` : rule);
  }

  // The text and the buttons inside the section, per breakpoint and on their
  // own selectors — see `elementRules`.
  for (const [device, media] of deviceMedia()) {
    const rules = elementRules(selector, responsive[device]);
    if (!rules.length) continue;
    blocks.push(media ? `@media ${media} { ${rules.join("\n")} }` : rules.join("\n"));
  }

  // An overlay is its own layer rather than a blend on the background, so it
  // sits over a background image without tinting the section's own content.
  const overlays: string[] = [];
  for (const [device, media] of deviceMedia()) {
    const overlay = responsive[device]?.overlay;
    if (empty(overlay)) continue;
    const rule = `${selector} { position: relative; isolation: isolate }
${selector}::before { content: ""; position: absolute; inset: 0; z-index: 0; pointer-events: none; background: ${overlay} }
${selector} > * { position: relative; z-index: 1 }`;
    overlays.push(media ? `@media ${media} { ${rule} }` : rule);
  }

  return [...blocks, ...overlays].join("\n");
}

/**
 * Global design tokens as a single rule on the canvas scope.
 *
 * The themes already read `--primary`, `--background`, `--radius` and the rest
 * from the cascade, so redefining the tokens on an ancestor is all a global
 * palette change takes — no theme knows the studio exists.
 *
 * @param {string} scope selector the rule is written for, e.g. `.studio-canvas`
 */
export function globalTokenCss(scope: string, globalStyles?: Partial<GlobalStyles>): string {
  const declarations: string[] = [];
  for (const [cssVar, value] of Object.entries(globalStyles?.tokens ?? {})) {
    if (!empty(value)) declarations.push(`${cssVar}: ${value}`);
  }
  return declarations.length ? `${scope} { ${declarations.join("; ")} }` : "";
}

/**
 * The site-wide text and button colours.
 *
 * The same rules a section can set, hung off the canvas instead — so "every
 * button on this site is this colour" is one control rather than one per band.
 * A section's own rule is the more specific of the two, so it still wins
 * wherever it is set.
 */
export function globalElementCss(scope: string, globalStyles?: Partial<GlobalStyles>): string {
  return elementRules(scope, globalStyles?.elements ?? {}).join("\n");
}

/**
 * Resolves the value shown in an inspector control for the active device.
 * Falls back up the chain — mobile to tablet to desktop — so a field the user
 * has not overridden shows what will actually render, not a blank.
 */
export function resolveStyleValue(
  responsive: ResponsiveStyle = {},
  device: DeviceId,
  key: string,
): { value: StyleValue; inheritedFrom: DeviceId | null } {
  const chain: DeviceId[] =
    device === "mobile"
      ? ["mobile", "tablet", "desktop"]
      : device === "tablet"
        ? ["tablet", "desktop"]
        : ["desktop"];
  for (const step of chain) {
    const value = responsive[step]?.[key];
    if (!empty(value)) return { value, inheritedFrom: step === device ? null : step };
  }
  return { value: "", inheritedFrom: null };
}

/** True when this device has its own override for the key. */
export function hasOwnValue(responsive: ResponsiveStyle = {}, device: DeviceId, key: string): boolean {
  return !empty(responsive[device]?.[key]);
}
