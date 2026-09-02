/**
 * The studio's data-access layer.
 *
 * This is the only module that imports the static files under
 * `src/studio/data`. Everything else — routes, editor, inspector — calls these
 * functions, so pointing the studio at a real API is a change to the bodies
 * here and nowhere else. That is also why every accessor is async even though
 * nothing awaits anything yet.
 *
 * The return shapes are the shapes the API is expected to return:
 *
 *   GET /api/websites            -> listWebsites()
 *   GET /api/websites/:id        -> getWebsite(id)
 *   GET /api/websites/:id/content-> getWebsiteContent(id)
 *   GET /api/themes              -> listThemes()
 *   GET /api/themes/:id          -> getTheme(id)
 */

import { createApiService } from "@edn/site-themes/services";
import { getDomainConfig } from "@edn/site-themes/lib/getDomain";
import { getNormalizedThemeName } from "@edn/site-themes/util/normalizer";
import { websites } from "@/studio/data/websites";
import { themes } from "@/studio/data/themes";
import { createDefaultContent } from "@/studio/data/content/defaults";
import { getTemplate, hasTemplate } from "@/studio/templates/registry";
import { FOOTER_SECTION_ID, HEADER_SECTION_ID } from "@/studio/lib/constants";
import type {
  ContentSource,
  EditorBundle,
  EditorConfig,
  SiteRecord,
  TenantContent,
  ThemeDescriptor,
  ThemeTemplate,
} from "@/studio/types";

/** Thrown for a request the studio can answer with a specific message. */
export class StudioNotFound extends Error {
  readonly what: string;
  readonly id: string;

  constructor(what: string, id: string) {
    super(`${what} "${id}" does not exist.`);
    this.name = "StudioNotFound";
    this.what = what;
    this.id = id;
  }
}

/**
 * The theme WMS has assigned to a domain, as a studio theme id.
 *
 * `adminThemes.uniqueCode` is the assignment — "Theme-15" for Omega, "theme-1"
 * for EDN's own site — and it arrives in whatever case and punctuation it was
 * typed in. `getNormalizedThemeName` is the app's own reading of that field, so
 * the studio and the live site cannot disagree about which theme a domain runs.
 *
 * Returns null rather than a guess when WMS names no theme, or names one this
 * studio has no template for: the site record's `themeId` is the fallback.
 */
function themeIdFromLayout(layout: any): string | null {
  const code = layout?.adminThemes?.uniqueCode;
  if (!code) return null;

  const id = getNormalizedThemeName(code).replace(/^theme/, "theme-");
  return themes.some((theme) => theme.id === id) && hasTemplate(id) ? id : null;
}

/**
 * The list, as the static records have it.
 *
 * No API call per card. The list is every tenant the app serves, and asking
 * WMS which theme each one runs would be a hundred and fifty layout reads to
 * draw a hundred and fifty labels. The editor resolves the real theme when a
 * site is opened, out of the payload it fetches for the content anyway.
 */
export async function listWebsites(): Promise<SiteRecord[]> {
  return websites.map((site) => ({ ...site }));
}

export async function getWebsite(siteId: string): Promise<SiteRecord> {
  const site = websites.find((entry) => entry.id === siteId);
  if (!site) throw new StudioNotFound("Website", siteId);
  return { ...site };
}

export async function listThemes(): Promise<ThemeDescriptor[]> {
  return themes.map((theme) => ({ ...theme, available: hasTemplate(theme.id) }));
}

export async function getTheme(themeId: string): Promise<ThemeDescriptor> {
  const theme = themes.find((entry) => entry.id === themeId);
  if (!theme) throw new StudioNotFound("Theme", themeId);
  return { ...theme, available: hasTemplate(themeId) };
}

/**
 * The site's own content, from the same WMS endpoint the live site reads.
 *
 * The studio edits the payload the themes already consume, so there is nothing
 * to translate: `fetchLayoutData` returns the object `Providers` hands to
 * `useTenantStore` on the real site, and that is what the canvas is given.
 *
 * Failure is expected rather than exceptional — a demo domain with no tenant
 * behind it, or an API that is down while someone is working on a theme — and
 * neither may stop the editor opening. Both fall back to the sample content.
 */
async function fetchLiveContent(site: SiteRecord): Promise<TenantContent | null> {
  try {
    const { apiBaseUrl } = await getDomainConfig();
    const data = await createApiService(site.domain, apiBaseUrl).fetchLayoutData();

    // WMS answers 200 with `profile: null` for a domain it does not host, so
    // the profile rather than the status code is what says whether this is a
    // tenant at all.
    if (!data?.layout?.profile) return null;

    // `domain` is part of the payload on the live site — the blog, the banner
    // and the career forms all read it back out of the store to call the API.
    return { ...data, domain: site.domain };
  } catch (error) {
    console.warn(
      `[studio] no live content for ${site.domain}, using sample content:`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

/** A site's content: what WMS holds for it, or sample content if it holds none. */
export async function getWebsiteContent(siteId: string): Promise<TenantContent> {
  const site = await getWebsite(siteId);
  return (await fetchLiveContent(site)) ?? createDefaultContent(site);
}

/**
 * Normalizes a `?theme=` value to a theme id.
 *
 * The live site already accepts `?theme=7` to preview a tenant on another
 * theme (`themeKeyFromParam` in `src/Theme/registry.tsx`); the studio takes the
 * same shape so the habit carries over, and also accepts the full id.
 */
export function themeIdFromParam(param: string | string[] | undefined): string | null {
  const value = Array.isArray(param) ? param[0] : param;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const id = /^\d+$/.test(trimmed) ? `theme-${Number(trimmed)}` : trimmed;
  return themes.some((theme) => theme.id === id) ? id : null;
}

/**
 * What the studio needs to open an editor: the site, its theme, the template's
 * section manifest, and the default content.
 *
 * One call rather than four, because the editor route needs all of it and a
 * single API endpoint is the shape this will take on the server.
 *
 * The theme is the one WMS has assigned to the domain, so opening a site shows
 * what that site actually runs. `themeOverride` — `?theme=` — is how you ask
 * for a different one: the studio's answer to "what would this school look like
 * on Civic Portal", and the only practical way to reach all nineteen templates
 * from seven websites.
 */
export async function getEditorBundle(
  siteId: string,
  themeOverride: string | null = null,
): Promise<EditorBundle> {
  const record = await getWebsite(siteId);
  const live = await fetchLiveContent(record);

  // What the site actually runs, unless you asked for something else. `?theme=`
  // is a deliberate override and wins; WMS's assignment is the truth otherwise;
  // the record's `themeId` is what is left when WMS names no theme.
  const themeId = themeOverride ?? themeIdFromLayout(live?.layout) ?? record.themeId;
  const site = { ...record, themeId };
  const theme = await getTheme(themeId);
  const template = getTemplate(themeId);

  if (!template) throw new StudioNotFound("Template", themeId);

  return {
    site,
    theme,
    // Every template, so the editor can offer the switch without a round trip.
    // The list is nineteen static descriptors; fetching it again per keystroke
    // of a dropdown would be the only expensive thing about it.
    themes: await listThemes(),
    editorConfig: toEditorConfig(theme, template),
    content: live ?? createDefaultContent(site),
    // Which of the two the editor got. The header says so, because "this is
    // not your content" is not something anyone should have to infer from
    // reading the copy on the canvas.
    contentSource: (live ? "live" : "sample") as ContentSource,
  };
}

/**
 * The editor configuration for a template: which sections exist, what they are
 * called, what they read, and what may be done to them.
 *
 * Derived from the template manifest rather than hand-written per theme —
 * nineteen near-identical config files would be nineteen places for the list to
 * fall out of step with the theme it describes.
 */
export function toEditorConfig(theme: ThemeDescriptor, template: ThemeTemplate): EditorConfig {
  return {
    id: theme.id,
    name: theme.name,
    composable: template.composable && theme.composable !== false,
    frameClassName: template.frameClassName,
    mainClassName: template.mainClassName,
    // The theme's own chrome. It is on every page rather than in the page's
    // section list, so it is described here rather than in the manifest — and
    // kept out of `sections`, which is the list Puck renders.
    chrome: [
      {
        id: HEADER_SECTION_ID,
        kind: "header",
        label: "Header",
        component: "Header",
        slices: ["layout"],
        className: "",
        editable: true,
        removable: false,
      },
      {
        id: FOOTER_SECTION_ID,
        kind: "footer",
        label: "Footer",
        component: "Footer",
        slices: ["layout"],
        className: "",
        editable: true,
        removable: false,
      },
    ],
    sections: template.sections.map((section) => ({
      id: section.id,
      kind: section.kind,
      label: section.label,
      component: section.component,
      slices: section.slices ?? [],
      className: section.className ?? "",
      // Every section may be hidden, restyled and reordered. Nothing may be
      // nested, and nothing new may be inserted: the template owns the layout.
      editable: true,
      removable: false,
    })),
  };
}

/** Editor configuration for a theme on its own, without a site. */
export async function getEditorConfig(themeId: string): Promise<EditorConfig> {
  const theme = await getTheme(themeId);
  const template = getTemplate(themeId);
  if (!template) throw new StudioNotFound("Template", themeId);
  return toEditorConfig(theme, template);
}
