/**
 * The websites the studio can open: every tenant this app already serves.
 *
 * Derived from `src/lib/domains.ts` rather than restated beside it. That map is
 * the one place a new client is added, and a second hand-written list would be
 * wrong the day after the next launch — which is exactly how the studio came to
 * offer six sites while the app served a hundred and fifty.
 *
 * A record carries only what the studio needs *before* it has spoken to WMS: an
 * id, a domain to ask about, and a name to show while it asks. Everything real
 * arrives with the layout payload when a site is opened — the institution's own
 * name, its content, and the theme it runs (`lib/website.ts`). `themeId` here is
 * only where a site opens when WMS names no theme for it.
 *
 * Import this only from that accessor.
 */

import { DOMAINS } from "@edn/site-themes/lib/domains";
import type { SiteRecord } from "@/studio/types";

/** Where a site opens when WMS has no theme assigned to its domain. */
const FALLBACK_THEME = "theme-1";

/**
 * Keys that are initialisms, not words.
 *
 * Title-casing every token would leave "Sxc Tu" and "Sos Gandaki" on the cards
 * until WMS answers with the real name. These are the tokens that stay shouted.
 */
const INITIALISMS = new Set([
  "edn", "sxc", "sos", "kws", "mts", "mca", "grs", "kbc", "spa", "tnk", "ribs",
  "aitm", "nasa", "ctevt", "nist", "jmssg", "lna", "rp", "it", "tu", "neb",
  "kdc", "wms", "acme",
]);

const humanize = (key: string): string =>
  key
    .toLowerCase()
    .split("_")
    .map((word) =>
      INITIALISMS.has(word) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");

/** `omegacollege.edu.np` → `omegacollege-edu-np`: stable, and readable in a URL. */
const idFor = (domain: string): string => domain.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

/**
 * One record per *domain*, in the order `DOMAINS` declares them.
 *
 * Several keys point at one host — `GANDAKI` and `GANDAKI_COLLEGE` are both
 * `gces.edu.np` — and the studio opens a site by domain, so the first key wins
 * and the rest would only be duplicate cards for the same website.
 */
const seen = new Set<string>();

export const websites: SiteRecord[] = Object.entries(DOMAINS).reduce<SiteRecord[]>(
  (records, [key, domain]) => {
    if (seen.has(domain)) return records;
    seen.add(domain);

    records.push({
      id: idFor(domain),
      schoolName: humanize(key),
      domain,
      themeId: FALLBACK_THEME,
    });
    return records;
  },
  [],
);

export const websiteIds = websites.map((site) => site.id);
