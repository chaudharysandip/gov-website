"use client";

/**
 * Reading saved documents from the browser, the React way.
 *
 * The obvious version of this — read localStorage in an effect and call
 * `setState` — renders once with nothing and once with the answer, and misses
 * a save made in another tab entirely. `useSyncExternalStore` does both jobs
 * properly: the server snapshot is "nothing saved", the client snapshot is the
 * raw string, and the `storage` event is the subscription.
 *
 * Snapshots must be stable by identity or React re-renders forever, so both
 * hooks return a primitive and the caller parses it inside a `useMemo`.
 */

import { useSyncExternalStore } from "react";
import { DRAFT_PREFIX, STORAGE_PREFIX } from "./constants";
import { listSavedSiteIds } from "./storage";

/** `storage` fires in *other* tabs; a save in this one updates through the store. */
function subscribe(onChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

const NOTHING = null;

/** The raw saved document for a site, or null. */
export function useSavedDocumentRaw(siteId: string) {
  return useSyncExternalStore(
    subscribe,
    () => {
      try {
        return window.localStorage.getItem(`${STORAGE_PREFIX}${siteId}`);
      } catch {
        return NOTHING;
      }
    },
    () => NOTHING,
  );
}

/** The raw draft document the canvas's motion preview writes, or null. */
export function useDraftDocumentRaw(siteId: string) {
  return useSyncExternalStore(
    subscribe,
    () => {
      try {
        return window.localStorage.getItem(`${DRAFT_PREFIX}${siteId}`);
      } catch {
        return NOTHING;
      }
    },
    () => NOTHING,
  );
}

/**
 * Site ids with a saved document, as a comma-joined string.
 *
 * A joined string rather than an array because the snapshot is compared by
 * identity: a fresh array every read is an infinite render loop.
 */
export function useSavedSiteIdsKey() {
  return useSyncExternalStore(
    subscribe,
    () => listSavedSiteIds().sort().join(","),
    () => "",
  );
}
