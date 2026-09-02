/**
 * Shared selector helpers.
 *
 * A Zustand selector runs on every store read and its result is compared by
 * identity. `state.document?.sections ?? []` therefore returns a brand new
 * array each time the document is missing, and `useSyncExternalStore` sees an
 * endlessly changing snapshot — React reports "the result of getServerSnapshot
 * should be cached to avoid an infinite loop" and re-renders forever.
 *
 * These frozen constants are the fix: one identity for every empty result.
 */

import type { ResponsiveStyle, SectionState, StyleObject } from "@/studio/types";
import { chromePartOf } from "@/studio/lib/constants";
import type { EditorState } from "./editor-store";

export const EMPTY_ARRAY = Object.freeze([]) as unknown as SectionState[];
export const EMPTY_OBJECT = Object.freeze({}) as Record<string, never>;

export const selectSections = (state: EditorState): SectionState[] =>
  state.document?.sections ?? EMPTY_ARRAY;

export const selectGlobalTokens = (state: EditorState): Record<string, string> =>
  state.document?.globalStyles?.tokens ?? EMPTY_OBJECT;

export const selectGlobalElements = (state: EditorState): StyleObject =>
  state.document?.globalStyles?.elements ?? EMPTY_OBJECT;

/**
 * A section's state by id, wherever it lives.
 *
 * The page's sections are Puck's; the header and the footer ride on the root.
 * Everything that reads "the selected thing's styles" or "is it visible" goes
 * through here so neither the panels nor the inspector has to know which.
 */
export const selectSectionState = (
  state: EditorState,
  sectionId?: string | null,
): SectionState | undefined => {
  if (!sectionId) return undefined;
  const part = chromePartOf(sectionId);
  if (part) return state.document?.chrome?.[part];
  return state.document?.sections.find((section) => section.id === sectionId);
};

/** The same, narrowed to the styles — with one identity for "none". */
export const selectSectionStyles = (
  state: EditorState,
  sectionId?: string | null,
): ResponsiveStyle => selectSectionState(state, sectionId)?.styles ?? EMPTY_STYLE;

export const EMPTY_STYLE = Object.freeze({}) as ResponsiveStyle;
