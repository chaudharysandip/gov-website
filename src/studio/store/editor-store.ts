"use client";

/**
 * Editor session state.
 *
 * Deliberately *not* the website being edited. Puck owns the document while
 * the editor is open — it is what gives selection, drag and undo/redo for free
 * — and this store owns everything around it: which device is being previewed,
 * the zoom, whether there are unsaved changes, and the bridge to persistence.
 *
 * The one place the two meet is `bindPuck`. The editor shell registers Puck's
 * API here on mount, which lets a toolbar button dispatch into Puck without
 * every component having to sit inside Puck's tree.
 *
 * Components subscribe with the narrowest selector they can: reading the whole
 * store from a toolbar would re-render it on every keystroke in the inspector.
 */

import { create } from "zustand";
import {
  chromePartOf,
  CHROME_PREFIX,
  DEFAULT_DEVICE,
  MAX_ZOOM,
  MIN_ZOOM,
  ZOOM_STEPS,
} from "@/studio/lib/constants";
import {
  createDocument,
  documentToPuck,
  exportFileName,
  puckToDocument,
  reconcileDocument,
  serializeDocument,
} from "@/studio/lib/document";
import {
  loadWebsiteState,
  removeWebsiteState,
  saveDraftState,
  saveWebsiteState,
} from "@/studio/lib/storage";
import { migrateDocument, parseDocument } from "@/studio/lib/schema";
import type {
  ContentSource,
  DeviceId,
  EditorConfig,
  PuckData,
  ResponsiveStyle,
  Result,
  SectionState,
  SiteRecord,
  StudioDocument,
  StyleObject,
  StyleValue,
  TenantContent,
  ThemeDescriptor,
} from "@/studio/types";

const clampZoom = (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

/** Puck's API, as much of it as the studio drives. */
export interface PuckApi {
  // Puck's own `PuckAction` is a union over the config's component names, which
  // the studio builds at runtime; the studio only ever sends the four it knows.
  dispatch: (action: any) => void;
  history: { back: () => void; forward: () => void; hasPast?: boolean; hasFuture?: boolean };
}

export interface EditorState {
  /* -- What is open ------------------------------------------------------ */
  siteId: string | null;
  themeId: string | null;
  site: SiteRecord | null;
  theme: ThemeDescriptor | null;
  themes: ThemeDescriptor[];
  editorConfig: EditorConfig | null;
  document: StudioDocument | null;
  defaultContent: TenantContent | null;
  contentSource: ContentSource;

  /* -- The session ------------------------------------------------------- */
  selectedSectionId: string | null;
  activeDevice: DeviceId;
  zoom: number;
  inspectorTab: string;
  /**
   * Which inspector groups are open, by panel.
   *
   * Session state rather than component state, and that is the whole point:
   * an accordion that defaults per mount closes itself every time the operator
   * moves to the next section, so a pass down a fourteen-section page meant
   * opening Spacing fourteen times. The panel now stays as it was left.
   */
  openGroups: Record<string, string[]>;
  canvasPaneWidth: number;
  sectionsPanelOpen: boolean;
  inspectorPanelOpen: boolean;
  isCanvasFullscreen: boolean;
  motionPreview: boolean;
  motionPreviewStamp: number;
  isDirty: boolean;
  lastSavedAt: string | null;
  status: "idle" | "ready";
  error: string | null;
  puck: PuckApi | null;

  /* -- Opening ----------------------------------------------------------- */
  initializeEditor(input: {
    site: SiteRecord;
    theme: ThemeDescriptor;
    editorConfig: EditorConfig;
    content: TenantContent;
    contentSource?: ContentSource;
    themes?: ThemeDescriptor[];
  }): void;
  bindPuck(puck: PuckApi): void;
  syncFromPuck(puckData: Partial<PuckData>): void;

  /* -- Chrome ------------------------------------------------------------ */
  toggleSectionsPanel(): void;
  toggleInspectorPanel(): void;
  toggleCanvasFullscreen(): void;
  toggleMotionPreview(): void;

  /* -- Selection and view ------------------------------------------------ */
  selectSection(sectionId: string | null): void;
  clearSelection(): void;
  setInspectorTab(inspectorTab: string): void;
  setOpenGroups(panel: string, groups: string[]): void;
  setDevice(activeDevice: DeviceId): void;
  setZoom(zoom: number): void;
  zoomIn(): void;
  zoomOut(): void;

  /* -- Editing ----------------------------------------------------------- */
  updateContent(slice: string, value: unknown): void;
  updateStyles(sectionId: string, device: DeviceId, patch: StyleObject): void;
  updateStyle(sectionId: string, device: DeviceId, key: string, value: StyleValue): void;
  resetStyle(sectionId: string, device: DeviceId): void;
  updateGlobalStyle(cssVar: string, value: string): void;
  updateGlobalElement(key: string, value: StyleValue): void;
  toggleSection(sectionId: string): void;
  moveSection(fromIndex: number, toIndex: number): void;
  removeSection(sectionId: string): void;
  addSection(sectionId: string): void;

  /* -- History and persistence ------------------------------------------- */
  undo(): void;
  redo(): void;
  save(): Result;
  reset(): void;
  exportDocument(): { json: string; fileName: string } | null;
  importDocument(raw: string | unknown, applyToPuck?: (document: StudioDocument) => void): Result;
  dismissError(): void;
}

/**
 * One breakpoint of a style object, with a patch applied.
 *
 * Empty values clear the property, and a breakpoint left with nothing is
 * removed rather than kept as an empty object — an empty override would compile
 * to an empty rule and, worse, read as "overridden" in the responsive panel.
 */
function withPatch(styles: ResponsiveStyle, device: DeviceId, patch: StyleObject): ResponsiveStyle {
  const breakpoint = { ...(styles?.[device] ?? {}) };
  for (const [key, value] of Object.entries(patch)) {
    if (value === "" || value === null || value === undefined) delete breakpoint[key];
    else breakpoint[key] = value;
  }

  const next = { ...(styles ?? {}), [device]: breakpoint };
  if (!Object.keys(breakpoint).length) delete next[device];
  return next;
}

/**
 * Writes one part of the site chrome.
 *
 * The header and the footer are the theme's, not the template's: they are not
 * Puck components, so their visibility and styles ride on Puck's root beside
 * the content and the global styles. Going through `replaceRoot` rather than a
 * store `set` is what puts a chrome edit on the same undo stack as everything
 * else, and what gets it saved without a second persistence path.
 */
function writeChrome(
  puck: PuckApi,
  document: StudioDocument,
  part: string,
  patch: Partial<SectionState>,
) {
  const current = document.chrome?.[part] ?? {
    id: `${CHROME_PREFIX}${part}`,
    visible: true,
    styles: {},
  };

  puck.dispatch({
    type: "replaceRoot",
    root: {
      props: {
        content: document.content,
        globalStyles: document.globalStyles,
        chrome: { ...(document.chrome ?? {}), [part]: { ...current, ...patch } },
      },
    },
  });
}

export const useEditorStore = create<EditorState>()((set, get) => ({
  siteId: null,
  themeId: null,
  site: null,
  theme: null,
  /** Every template, for the header's switcher. */
  themes: [],
  editorConfig: null,

  /** The document as last seen. Puck is the live copy; this mirrors it. */
  document: null,

  /** The untouched content the site started from, so Reset has a place to go back to. */
  defaultContent: null,

  /** Where that content came from: "live" from WMS, or "sample". */
  contentSource: "live",

  selectedSectionId: null,
  activeDevice: DEFAULT_DEVICE,
  zoom: 100,
  inspectorTab: "content",
  openGroups: { design: ["colors"], site: ["identity", "colors"] },

  /** The canvas pane's own width, published by the shell for the toolbar. */
  canvasPaneWidth: 0,

  /** Which side panels are open, and whether the canvas is on its own. */
  sectionsPanelOpen: true,
  inspectorPanelOpen: true,
  isCanvasFullscreen: false,

  /**
   * Motion preview: the canvas swapped for the preview route in a real iframe.
   * The stamp is both the draft's version and the iframe's cache-buster, so
   * turning it on again after an edit reloads rather than showing the old run.
   */
  motionPreview: false,
  motionPreviewStamp: 0,

  isDirty: false,
  lastSavedAt: null,
  status: "idle",
  error: null,

  /** Puck's API, registered by the shell. Never rendered from. */
  puck: null,

  initializeEditor({ site, theme, editorConfig, content, contentSource = "live", themes = [] }) {
    const fresh = createDocument({ site, editorConfig, content });
    const saved = loadWebsiteState(site.id);

    let document = fresh;
    let error = null;
    let lastSavedAt = null;

    if (!saved.ok) {
      // A corrupt save must not block editing. Say so, and start from defaults.
      error = saved.error;
    } else if (saved.data) {
      if (saved.data.site.themeId !== site.themeId) {
        // The site's theme changed under a saved document. Its content is
        // still good; its section list belongs to a template that is gone.
        document = reconcileDocument(
          { ...saved.data, site: fresh.site, sections: fresh.sections },
          editorConfig,
        );
      } else {
        document = reconcileDocument({ ...saved.data, site: fresh.site }, editorConfig);
      }
      lastSavedAt = saved.data.savedAt ?? null;
    }

    set({
      siteId: site.id,
      themeId: site.themeId,
      site,
      theme,
      themes,
      editorConfig,
      document,
      defaultContent: content,
      contentSource,
      selectedSectionId: null,
      activeDevice: DEFAULT_DEVICE,
      zoom: 100,
      inspectorTab: "content",
      openGroups: { design: ["colors"], site: ["identity", "colors"] },
      sectionsPanelOpen: true,
      inspectorPanelOpen: true,
      isCanvasFullscreen: false,
      motionPreview: false,
      isDirty: false,
      lastSavedAt,
      status: "ready",
      error,
    });
  },

  toggleSectionsPanel() {
    set((state) => ({ sectionsPanelOpen: !state.sectionsPanelOpen }));
  },

  toggleInspectorPanel() {
    set((state) => ({ inspectorPanelOpen: !state.inspectorPanelOpen }));
  },

  toggleCanvasFullscreen() {
    set((state) => ({ isCanvasFullscreen: !state.isCanvasFullscreen }));
  },

  /**
   * Play the page's animations.
   *
   * Puck mounts the canvas through a portal, so a theme's components run in
   * this window while their DOM scrolls inside the frame — every library that
   * reads the scroll position from `window` or `document` therefore reads the
   * editor's, which never moves. The way out is not to teach each library about
   * the canvas but to give the page a browsing context of its own: the preview
   * route, in a real iframe, running its own JavaScript against its own scroll.
   *
   * The document goes to the draft key rather than the saved one, so playing
   * the animations never overwrites the last save.
   */
  toggleMotionPreview() {
    const { document, siteId, motionPreview } = get();
    if (motionPreview) {
      set({ motionPreview: false });
      return;
    }
    if (!document || !siteId) return;

    const stamp = Date.now();
    const written = saveDraftState(siteId, {
      ...document,
      savedAt: new Date(stamp).toISOString(),
    });
    if (!written.ok) {
      set({ error: written.error });
      return;
    }
    set({ motionPreview: true, motionPreviewStamp: stamp });
  },

  bindPuck(puck: PuckApi) {
    set({ puck });
  },

  /** Called from Puck's `onChange`. */
  syncFromPuck(puckData: Partial<PuckData>) {
    const { document } = get();
    if (!document) return;
    const next = puckToDocument(puckData, document);
    set({ document: next, isDirty: true });
  },

  selectSection(sectionId: string | null) {
    const { puck } = get();
    set({ selectedSectionId: sectionId });
    if (!puck || !sectionId) {
      if (puck && !sectionId) puck.dispatch({ type: "setUi", ui: { itemSelector: null } });
      return;
    }
    const index = get().document?.sections.findIndex((section) => section.id === sectionId);
    if (index === undefined || index < 0) return;
    puck.dispatch({ type: "setUi", ui: { itemSelector: { index, zone: "root:default-zone" } } });
  },

  clearSelection() {
    get().selectSection(null);
  },

  setInspectorTab(inspectorTab: string) {
    set({ inspectorTab });
  },

  setOpenGroups(panel: string, groups: string[]) {
    set((state) => ({ openGroups: { ...state.openGroups, [panel]: groups } }));
  },

  setDevice(activeDevice: DeviceId) {
    set({ activeDevice });
  },

  setZoom(zoom: number) {
    set({ zoom: clampZoom(Math.round(zoom)) });
  },

  zoomIn() {
    const { zoom } = get();
    const next = ZOOM_STEPS.find((step) => step > zoom) ?? MAX_ZOOM;
    set({ zoom: next });
  },

  zoomOut() {
    const { zoom } = get();
    const next = [...ZOOM_STEPS].reverse().find((step) => step < zoom) ?? MIN_ZOOM;
    set({ zoom: next });
  },

  /* ---------------------------------------------------------------- */
  /*  Document edits. Each one goes through Puck so history covers it. */
  /* ---------------------------------------------------------------- */

  /**
   * Replaces a slice of website content, e.g. `slider` or `aboutUs`.
   * Content lives on Puck's root, so this is a root replace.
   */
  updateContent(slice: string, value: unknown) {
    const { puck, document } = get();
    if (!puck || !document) return;
    puck.dispatch({
      type: "replaceRoot",
      root: {
        props: {
          content: { ...(document.content ?? {}), [slice]: value },
          globalStyles: document.globalStyles,
          chrome: document.chrome,
        },
      },
    });
  },

  /**
   * Sets several style properties for one section at one breakpoint, in one
   * dispatch. An empty value removes the override.
   *
   * Batched deliberately: linking the four sides of a padding box, or copying a
   * breakpoint down, is one action to the person doing it, and should be one
   * press of undo to reverse.
   */
  updateStyles(sectionId: string, device: DeviceId, patch: StyleObject) {
    const { puck, document } = get();
    if (!puck || !document) return;

    const part = chromePartOf(sectionId);
    if (part) {
      const chrome = document.chrome?.[part];
      writeChrome(puck, document, part, {
        styles: withPatch(chrome?.styles ?? {}, device, patch),
      });
      return;
    }

    const index = document.sections.findIndex((section) => section.id === sectionId);
    if (index < 0) return;

    const current = document.sections[index];
    const styles = withPatch(current.styles ?? {}, device, patch);

    puck.dispatch({
      type: "replace",
      destinationIndex: index,
      destinationZone: "root:default-zone",
      data: {
        type: sectionId,
        props: { id: `section-${sectionId}`, sectionId, visible: current.visible !== false, styles },
      },
    });
  },

  /** Sets one style property for one section at one breakpoint. */
  updateStyle(sectionId: string, device: DeviceId, key: string, value: StyleValue) {
    get().updateStyles(sectionId, device, { [key]: value });
  },

  /** Clears every override a section has at one breakpoint. */
  resetStyle(sectionId: string, device: DeviceId) {
    const { puck, document } = get();
    if (!puck || !document) return;

    const part = chromePartOf(sectionId);
    if (part) {
      const styles = { ...(document.chrome?.[part]?.styles ?? {}) };
      delete styles[device];
      writeChrome(puck, document, part, { styles });
      return;
    }

    const index = document.sections.findIndex((section) => section.id === sectionId);
    if (index < 0) return;
    const current = document.sections[index];
    const styles = { ...(current.styles ?? {}) };
    delete styles[device];

    puck.dispatch({
      type: "replace",
      destinationIndex: index,
      destinationZone: "root:default-zone",
      data: {
        type: sectionId,
        props: { id: `section-${sectionId}`, sectionId, visible: current.visible !== false, styles },
      },
    });
  },

  updateGlobalStyle(cssVar: string, value: string) {
    const { puck, document } = get();
    if (!puck || !document) return;
    const tokens = { ...(document.globalStyles?.tokens ?? {}) };
    if (value === "" || value === null || value === undefined) {
      delete tokens[cssVar];
    } else {
      tokens[cssVar] = value;
    }
    puck.dispatch({
      type: "replaceRoot",
      root: {
        props: {
          content: document.content,
          globalStyles: { ...document.globalStyles, tokens },
          chrome: document.chrome,
        },
      },
    });
  },

  /**
   * A site-wide text or button colour. The keys are a section's own style keys,
   * so the same controls drive both and one function compiles the CSS.
   */
  updateGlobalElement(key: string, value: StyleValue) {
    const { puck, document } = get();
    if (!puck || !document) return;

    const elements = { ...(document.globalStyles?.elements ?? {}) };
    if (value === "" || value === null || value === undefined) delete elements[key];
    else elements[key] = value;

    puck.dispatch({
      type: "replaceRoot",
      root: {
        props: {
          content: document.content,
          globalStyles: { ...document.globalStyles, elements },
          chrome: document.chrome,
        },
      },
    });
  },

  toggleSection(sectionId: string) {
    const { puck, document } = get();
    if (!puck || !document) return;

    const part = chromePartOf(sectionId);
    if (part) {
      writeChrome(puck, document, part, {
        visible: document.chrome?.[part]?.visible === false,
      });
      return;
    }

    const index = document.sections.findIndex((section) => section.id === sectionId);
    if (index < 0) return;
    const current = document.sections[index];

    puck.dispatch({
      type: "replace",
      destinationIndex: index,
      destinationZone: "root:default-zone",
      data: {
        type: sectionId,
        props: {
          id: `section-${sectionId}`,
          sectionId,
          visible: current.visible === false,
          styles: current.styles ?? {},
        },
      },
    });
  },

  moveSection(fromIndex: number, toIndex: number) {
    const { puck, document } = get();
    if (!puck || !document) return;
    if (toIndex < 0 || toIndex >= document.sections.length || fromIndex === toIndex) return;
    puck.dispatch({
      type: "reorder",
      sourceIndex: fromIndex,
      destinationIndex: toIndex,
      destinationZone: "root:default-zone",
    });
  },

  removeSection(sectionId: string) {
    const { puck, document } = get();
    if (!puck || !document) return;
    const index = document.sections.findIndex((section) => section.id === sectionId);
    if (index < 0) return;
    puck.dispatch({ type: "remove", index, zone: "root:default-zone" });
    if (get().selectedSectionId === sectionId) set({ selectedSectionId: null });
  },

  /** Puts a template section the user removed back at the end of the page. */
  addSection(sectionId: string) {
    const { puck, document } = get();
    if (!puck || !document) return;
    puck.dispatch({
      type: "insert",
      componentType: sectionId,
      destinationIndex: document.sections.length,
      destinationZone: "root:default-zone",
      id: `section-${sectionId}`,
    });
  },

  /*
   * There is deliberately no `duplicateSection`.
   *
   * A section is identified by the template section it renders, and every
   * lookup here — move, hide, style — finds it by that id. Two copies of
   * "Testimonials" would share an id, so hiding one would hide whichever came
   * first and both would take the same styles. They would also render
   * identically, because both read the same slice of content. An action that
   * cannot behave correctly is worse than one that is not offered.
   */

  undo() {
    get().puck?.history.back();
  },

  redo() {
    get().puck?.history.forward();
  },

  /* ---------------------------------------------------------------- */
  /*  Persistence                                                      */
  /* ---------------------------------------------------------------- */

  save() {
    const { document } = get();
    if (!document) return { ok: false, error: "Nothing to save yet." };

    const savedAt = new Date().toISOString();
    const result = saveWebsiteState(document.site.id, { ...document, savedAt });
    if (!result.ok) {
      set({ error: result.error });
      return result;
    }
    set({ isDirty: false, lastSavedAt: savedAt, error: null });
    return { ok: true };
  },

  /** Discards local edits and reloads the site's defaults. */
  reset() {
    const { site, editorConfig, defaultContent, puck } = get();
    if (!site || !editorConfig) return;
    removeWebsiteState(site.id);
    // `defaultContent` is set beside `editorConfig`; the guard above covers both.
    const fresh = createDocument({ site, editorConfig, content: defaultContent ?? {} });
    set({ document: fresh, isDirty: false, lastSavedAt: null, error: null, selectedSectionId: null });
    puck?.dispatch({ type: "setData", data: documentToPuck(fresh) });
  },

  exportDocument() {
    const { document } = get();
    if (!document) return null;
    return { json: serializeDocument(document), fileName: exportFileName(document) };
  },

  /**
   * Replaces the open document with an imported one.
   * @returns {{ok: true} | {ok: false, error: string}}
   */
  importDocument(raw: string | unknown, applyToPuck?: (document: StudioDocument) => void) {
    const { editorConfig, site } = get();
    if (!editorConfig || !site) return { ok: false, error: "The editor is not ready yet." };

    let value;
    try {
      value = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      return { ok: false, error: "That file is not valid JSON." };
    }

    const parsed = parseDocument(value);
    if (!parsed.ok) return { ok: false, error: `That file is not a website export — ${parsed.error}` };

    const migrated = migrateDocument(parsed.data);
    if (!migrated.ok) return migrated;

    if (migrated.data.site.themeId !== site.themeId) {
      return {
        ok: false,
        error: `That export was made for ${migrated.data.site.themeId}, and this site uses ${site.themeId}.`,
      };
    }

    const document = reconcileDocument({ ...migrated.data, site: { ...migrated.data.site, id: site.id } }, editorConfig);
    set({ document, isDirty: true, error: null, selectedSectionId: null });
    applyToPuck?.(document);
    return { ok: true };
  },

  dismissError() {
    set({ error: null });
  },
}));

/*
 * Selectors that need a stable identity for their empty case live in
 * `./selectors`. Everything else is read inline at the point of use, where a
 * one-line arrow is clearer than an import.
 */
