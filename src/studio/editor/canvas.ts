/**
 * Constants shared by everything that renders on the canvas.
 *
 * Kept apart from the components so the stylesheet compiler, the section
 * wrapper and the root can agree on one scope without importing each other.
 */

/** Class on the canvas root. Every compiled rule is scoped under it. */
export const CANVAS_CLASS = "studio-canvas";

/** The selector a section's compiled styles target. */
export const sectionSelector = (sectionId: string) =>
  `.${CANVAS_CLASS} [data-studio-section="${sectionId}"]`;
