/**
 * localStorage persistence for studio documents.
 *
 * Every read is defensive: a browser that blocks storage, a quota failure, and
 * a key someone hand-edited into invalid JSON all have to end in the editor
 * opening on defaults rather than a blank screen.
 */

import { DRAFT_PREFIX, STORAGE_PREFIX } from "./constants";
import { migrateDocument, parseDocument } from "./schema";
import type { ReadResult, Result, StudioDocument } from "@/studio/types";

const keyFor = (siteId: string) => `${STORAGE_PREFIX}${siteId}`;
const draftKeyFor = (siteId: string) => `${DRAFT_PREFIX}${siteId}`;

function storage() {
  if (typeof window === "undefined") return null;
  try {
    // Accessing localStorage throws outright in some privacy modes, so the
    // probe has to be inside the try, not a truthiness check on the property.
    const probe = window.localStorage;
    probe.getItem(STORAGE_PREFIX);
    return probe;
  } catch {
    return null;
  }
}

export function saveWebsiteState(siteId: string, document: StudioDocument): Result {
  const store = storage();
  if (!store) return { ok: false, error: "This browser is not allowing local storage." };

  try {
    store.setItem(keyFor(siteId), JSON.stringify(document));
    return { ok: true };
  } catch (error) {
    const isQuota = error instanceof DOMException && error.name === "QuotaExceededError";
    return {
      ok: false,
      error: isQuota
        ? "Local storage is full. Export this site to a file, then clear saved sites."
        : "Could not write to local storage.",
    };
  }
}

/**
 * @returns {{ ok: true, data: object|null } | { ok: false, error: string }}
 *          `data: null` means nothing was saved, which is not an error.
 */
function readDocument(key: string): ReadResult<StudioDocument> {
  const store = storage();
  if (!store) return { ok: true, data: null };

  let raw;
  try {
    raw = store.getItem(key);
  } catch {
    return { ok: true, data: null };
  }
  if (!raw) return { ok: true, data: null };

  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    return { ok: false, error: "The saved copy of this site could not be read." };
  }

  const parsed = parseDocument(value);
  if (!parsed.ok) return { ok: false, error: `The saved copy of this site is not valid — ${parsed.error}` };

  return migrateDocument(parsed.data);
}

export function loadWebsiteState(siteId: string): ReadResult<StudioDocument> {
  return readDocument(keyFor(siteId));
}

/**
 * The canvas's motion preview loads the preview route in a real iframe, and
 * that route reads its document out of storage. Unsaved work has to reach it
 * without being written over the saved copy — that would turn "play the
 * animations" into "save", which is not what the button says — so it goes to a
 * key of its own that only the preview reads.
 */
export function saveDraftState(siteId: string, document: StudioDocument): Result {
  const store = storage();
  if (!store) return { ok: false, error: "This browser is not allowing local storage." };
  try {
    store.setItem(draftKeyFor(siteId), JSON.stringify(document));
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not write the preview draft to local storage." };
  }
}

export function loadDraftState(siteId: string): ReadResult<StudioDocument> {
  return readDocument(draftKeyFor(siteId));
}

export function removeWebsiteState(siteId: string): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(keyFor(siteId));
    store.removeItem(draftKeyFor(siteId));
  } catch {
    /* nothing to do — the key is already unreachable */
  }
}

export function clearAllWebsiteStates(): void {
  const store = storage();
  if (!store) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) keys.push(key);
    }
    keys.forEach((key) => store.removeItem(key));
  } catch {
    /* nothing to do */
  }
}

/** Site ids with a saved document, for the selector's "edited" badges. */
export function listSavedSiteIds(): string[] {
  const store = storage();
  if (!store) return [];
  try {
    const ids: string[] = [];
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) ids.push(key.slice(STORAGE_PREFIX.length));
    }
    return ids;
  } catch {
    return [];
  }
}
