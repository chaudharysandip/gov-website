/**
 * The studio's vocabulary.
 *
 * One place for the shapes that cross module boundaries, so a document written
 * by the store, validated by the schema, compiled by the stylesheet and drawn
 * by the inspector is one type rather than four hopeful assumptions.
 *
 * Two things are deliberately loose. Website *content* is the WMS payload —
 * nineteen themes read it, the API owns its shape, and pretending otherwise
 * here would be a lie that the first new field breaks. Style *values* are
 * strings or numbers by the time they reach CSS; what makes them safe is the
 * compiler in `lib/style-css.ts`, not a union of every property name.
 */

import type { ComponentType } from "react";

/* -------------------------------------------------------------------------- */
/*  Devices and styles                                                        */
/* -------------------------------------------------------------------------- */

export type DeviceId = "desktop" | "tablet" | "mobile";

export interface DeviceDescriptor {
  id: DeviceId;
  label: string;
  width: number;
  icon: string;
}

export type StyleValue = string | number | null | undefined;

/** One breakpoint's overrides for one section: `{ paddingTop: 24, ... }`. */
export type StyleObject = Record<string, StyleValue>;

/** The same, per breakpoint. A device with no entry inherits the one above. */
export type ResponsiveStyle = Partial<Record<DeviceId, StyleObject>>;

export interface GlobalStyles {
  /** CSS custom properties redefined on the canvas root. */
  tokens: Record<string, string>;
  /** Site-wide text and button colours, keyed like a section's own style. */
  elements: StyleObject;
}

/* -------------------------------------------------------------------------- */
/*  Content                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * A tenant's website content, shaped exactly as WMS returns it and as
 * `useTenantStore` holds it: `layout`, `home`, `blog`, `notice` and the rest.
 * The themes own the reading of it; the studio only ever moves it around.
 */
export type TenantContent = Record<string, any>;

/** Whether the editor is showing the site's own content or sample copy. */
export type ContentSource = "live" | "sample";

/* -------------------------------------------------------------------------- */
/*  Sites and themes                                                          */
/* -------------------------------------------------------------------------- */

export interface SiteRecord {
  id: string;
  schoolName: string;
  domain: string;
  /** The fallback template — WMS's assignment wins where it has one. */
  themeId: string;
  estdYear?: string;
  address?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  slogan?: string;
}

export interface ThemeDescriptor {
  id: string;
  /** `theme1` — how `src/Theme/registry.tsx` names the same theme. */
  key: string;
  name: string;
  description: string;
  category: string;
  /** Cover image, or null for a theme that ships none. */
  preview: string | null;
  accent: string;
  composable?: boolean;
  /**
   * A showcase template rather than a school site — product, utility or
   * portal. Still openable by id; kept out of the gallery listing.
   */
  demo?: boolean;
  /** Whether this studio has a template for it. Added by the accessor. */
  available?: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Templates                                                                 */
/* -------------------------------------------------------------------------- */

/** A theme section as the generated manifests describe it. */
export interface ManifestSection {
  id: string;
  kind: string;
  label: string;
  component: string;
  /** Which content slices the section reads out of the store. */
  slices?: string[];
  className?: string;
  load: () => Promise<ComponentType<any>>;
}

export interface ThemeManifest {
  id: string;
  frameClassName?: string;
  mainClassName?: string;
  sections: ManifestSection[];
}

export interface ThemeChrome {
  header: () => Promise<ComponentType<any>>;
  footer: () => Promise<ComponentType<any>>;
}

/** A manifest resolved against the registry: what the editor renders from. */
export interface ThemeTemplate extends ThemeManifest {
  composable: boolean;
  /** The whole-page component, as its module — themes default-export them. */
  loadPage: () => Promise<{ default: ComponentType<any> }>;
  chrome: ThemeChrome;
}

/* -------------------------------------------------------------------------- */
/*  Editor configuration                                                      */
/* -------------------------------------------------------------------------- */

/** A section as the inspector and the section list see it. */
export interface SectionDefinition {
  id: string;
  kind: string;
  label: string;
  component: string;
  slices: string[];
  className: string;
  editable: boolean;
  removable: boolean;
}

export interface EditorConfig {
  id: string;
  name: string;
  composable: boolean;
  frameClassName?: string;
  mainClassName?: string;
  sections: SectionDefinition[];
  /**
   * The theme's own header and footer. Kept apart from `sections` because they
   * are not Puck components and must not be built into the page's section list
   * — everything that iterates `sections` would try to render them.
   */
  chrome?: SectionDefinition[];
}

/* -------------------------------------------------------------------------- */
/*  The document                                                              */
/* -------------------------------------------------------------------------- */

/** What a section carries in the document: order, visibility, overrides. */
export interface SectionState {
  id: string;
  visible: boolean;
  styles: ResponsiveStyle;
}

/** The site a document was made for, copied in so the file stands alone. */
export interface DocumentSite {
  id: string;
  schoolName: string;
  domain: string;
  themeId: string;
}

/** What is saved, exported, and one day sent to an API. */
export interface StudioDocument {
  version: number;
  savedAt?: string;
  site: DocumentSite;
  content: TenantContent;
  sections: SectionState[];
  /** The theme's header and footer, keyed by part: `{ header: {...} }`. */
  chrome?: Record<string, SectionState>;
  globalStyles: GlobalStyles;
}

/** Everything a route needs to open an editor or a preview. */
export interface EditorBundle {
  site: SiteRecord;
  theme: ThemeDescriptor;
  themes: ThemeDescriptor[];
  editorConfig: EditorConfig;
  content: TenantContent;
  contentSource: ContentSource;
}

/* -------------------------------------------------------------------------- */
/*  Puck                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Puck's in-editor data, as much of it as the studio reads or writes.
 *
 * Not Puck's own `Data` type: that is generic over a config the studio builds
 * at runtime, one component per section of whichever theme is open, so there is
 * no static shape to instantiate it with. This is the part the conversion in
 * `lib/document.ts` actually touches, and it is the only place that touches it.
 */
export interface PuckItem {
  type: string;
  props: Record<string, any>;
}

export interface PuckData {
  root: {
    props: {
      content: TenantContent;
      globalStyles: GlobalStyles;
      /** Header and footer state — see `StudioDocument.chrome`. */
      chrome?: Record<string, SectionState>;
    };
  };
  content: PuckItem[];
  zones: Record<string, unknown>;
}

/* -------------------------------------------------------------------------- */
/*  Content model                                                             */
/* -------------------------------------------------------------------------- */

/** One editable field in a content slice. */
export type ContentFieldKind =
  | "text"
  | "textarea"
  | "richtext"
  | "image"
  | "link"
  | "number"
  | "color"
  /** A field that is itself a list of items — a slide's bullet points. */
  | "list";

export interface ContentField {
  name: string;
  label: string;
  kind: ContentFieldKind;
  placeholder?: string;
  rows?: number;
  /** WMS directory a file name lives in, for `kind: "image"` — see `lib/file-path`. */
  module?: string;
  /** Suffix shown inside a number control: `px`, `rem`. */
  unit?: string;
  /** Set on `kind: "list"` fields: the shape of one item in the nested list. */
  itemLabel?: (item: any) => string;
  addLabel?: string;
  template?: Record<string, unknown>;
  fields?: ContentField[];
}

/** A slice of content, and what may be done to it. */
export interface ContentGroup {
  label: string;
  /** Where in the slice this group's fields live — `profile`, say. */
  path?: string;
  fields: ContentField[];
}

/** A list living at a path inside a slice: `layout.menu`, `layout.socialMedias`. */
export interface ContentList {
  path: string;
  label: string;
  itemLabel?: (item: any) => string;
  addLabel?: string;
  template?: Record<string, unknown>;
  fields: ContentField[];
}

export interface ContentSlice {
  label: string;
  /** `nested` is a slice with groups and lists rather than a flat field set. */
  type?: "list" | "object" | "nested";
  itemLabel?: (item: any) => string;
  addLabel?: string;
  template?: Record<string, unknown>;
  fields?: ContentField[];
  groups?: ContentGroup[];
  lists?: ContentList[];
  path?: string;
  /** Edited in the Site tab only, never in a section panel. */
  siteWide?: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Results                                                                   */
/* -------------------------------------------------------------------------- */

/** Every fallible boundary — storage, parsing, import — answers in this shape. */
export type Result<T = void> =
  | ({ ok: true } & (T extends void ? { data?: undefined } : { data: T }))
  | { ok: false; error: string };

/** A parse or a validation: it yields the value, or says why it could not. */
export type Parsed<T> = { ok: true; data: T } | { ok: false; error: string };

/** A read that can legitimately find nothing: `{ ok: true, data: null }`. */
export type ReadResult<T> = { ok: true; data: T | null } | { ok: false; error: string };
