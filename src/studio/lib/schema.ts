/**
 * The shape of a saved or exported studio document, and the validation that
 * guards every way one can enter the app — localStorage, an imported file, or
 * eventually an API response.
 *
 * Zod is used only where data crosses a trust boundary. Editor state built in
 * memory is not re-validated on every keystroke.
 */

import { z } from "zod";
import { DOCUMENT_VERSION } from "./constants";
import type { Parsed, StudioDocument } from "@/studio/types";

/** Style values are free-form strings or numbers; the CSS compiler sanitises use. */
const styleValue = z.union([z.string(), z.number()]).nullable().optional();
const styleObject = z.record(z.string(), styleValue);

const responsiveStyle = z
  .object({
    desktop: styleObject.optional(),
    tablet: styleObject.optional(),
    mobile: styleObject.optional(),
  })
  .partial();

const sectionSchema = z.object({
  id: z.string().min(1),
  visible: z.boolean().default(true),
  styles: responsiveStyle.default({}),
});

export const documentSchema = z.object({
  version: z.number().int().positive(),
  savedAt: z.string().optional(),
  site: z.object({
    id: z.string().min(1),
    schoolName: z.string().min(1),
    domain: z.string().min(1),
    themeId: z.string().min(1),
  }),
  /** Tenant-shaped website content. Free-form: the themes own its shape. */
  content: z.record(z.string(), z.unknown()).default({}),
  /** Section order, visibility and per-section styles. */
  sections: z.array(sectionSchema).default([]),
  /** The theme's header and footer, keyed by part. Absent in older files. */
  chrome: z.record(z.string(), sectionSchema).optional(),
  globalStyles: z
    .object({
      tokens: z.record(z.string(), z.string()).default({}),
      /** Site-wide text and button colours. Same keys as a section's style. */
      elements: styleObject.default({}),
    })
    .default({ tokens: {}, elements: {} }),
});

/**
 * Validates an unknown value as a studio document.
 *
 * @returns {{ ok: true, data: object } | { ok: false, error: string }}
 */
export function parseDocument(value: unknown): Parsed<StudioDocument> {
  const result = documentSchema.safeParse(value);
  if (result.success) return { ok: true, data: result.data };

  const issue = result.error.issues[0];
  const path = issue?.path?.length ? issue.path.join(".") : "document";
  return { ok: false, error: `${path}: ${issue?.message ?? "invalid"}` };
}

/**
 * Migrates an older document to the current version.
 *
 * There is only one version so far, so this is a passthrough with a guard —
 * but the guard is the point: a document from a future build should be
 * rejected loudly rather than half-read.
 */
export function migrateDocument(document: StudioDocument): Parsed<StudioDocument> {
  if (document.version > DOCUMENT_VERSION) {
    return {
      ok: false,
      error: `This file was saved by a newer version of the editor (v${document.version}).`,
    };
  }
  return { ok: true, data: { ...document, version: DOCUMENT_VERSION } };
}
