/**
 * Converting between the studio document (what is saved, exported and one day
 * sent to an API) and Puck's in-editor data.
 *
 * The split is deliberate. Puck owns the editing session: selection, drag,
 * history. The document owns the thing being edited. Keeping the conversion in
 * one place means the export format is not hostage to Puck's internals, and
 * that a Puck upgrade cannot silently change what gets written to storage.
 *
 * Document shape:
 *
 *   { version, savedAt, site, content, sections: [{id, visible, styles}], globalStyles }
 *
 * Puck shape:
 *
 *   { root: { props: { content, globalStyles } }, content: [{type, props}], zones: {} }
 *
 * Content lives in root props rather than on the sections, because several
 * sections read the same slice — two bands both driven by `notice`, say — and
 * duplicating it per section would let the two drift apart.
 */

import { DOCUMENT_VERSION, FOOTER_SECTION_ID, HEADER_SECTION_ID } from "./constants";
import type {
  SectionState,
  EditorConfig,
  PuckData,
  SiteRecord,
  StudioDocument,
  TenantContent,
} from "@/studio/types";

/**
 * The header and footer as a new document has them: present, visible, plain.
 */
function defaultChrome(): Record<string, SectionState> {
  return {
    header: { id: HEADER_SECTION_ID, visible: true, styles: {} },
    footer: { id: FOOTER_SECTION_ID, visible: true, styles: {} },
  };
}

/**
 * A fresh document for a site, with every template section visible, in the
 * order the theme renders them, and no style overrides.
 */
export function createDocument({
  site,
  editorConfig,
  content,
}: {
  site: SiteRecord;
  editorConfig: EditorConfig;
  content: TenantContent;
}): StudioDocument {
  return {
    version: DOCUMENT_VERSION,
    site: {
      id: site.id,
      schoolName: site.schoolName,
      domain: site.domain,
      themeId: site.themeId,
    },
    content,
    sections: editorConfig.sections.map((section) => ({
      id: section.id,
      visible: true,
      styles: {},
    })),
    chrome: defaultChrome(),
    globalStyles: { tokens: {}, elements: {} },
  };
}

/**
 * Reconciles a saved document against the template it was saved from.
 *
 * A theme that gained or lost a section since the document was written must not
 * strand the editor: unknown sections are dropped, new ones are appended in
 * template order, and everything the user did to the sections that survived is
 * kept.
 */
export function reconcileDocument(
  document: StudioDocument,
  editorConfig: EditorConfig,
): StudioDocument {
  const known = new Set(editorConfig.sections.map((section) => section.id));
  const kept = document.sections.filter((section) => known.has(section.id));
  const present = new Set(kept.map((section) => section.id));

  const added = editorConfig.sections
    .filter((section) => !present.has(section.id))
    .map((section) => ({ id: section.id, visible: true, styles: {} }));

  // A document saved before the chrome was editable has none: give it the
  // default rather than leaving the header unselectable.
  return { ...document, sections: [...kept, ...added], chrome: document.chrome ?? defaultChrome() };
}

export function documentToPuck(document: StudioDocument): PuckData {
  return {
    root: {
      props: {
        content: document.content,
        globalStyles: document.globalStyles,
        chrome: document.chrome ?? defaultChrome(),
      },
    },
    content: document.sections.map((section) => ({
      type: section.id,
      props: {
        id: `section-${section.id}`,
        sectionId: section.id,
        visible: section.visible !== false,
        styles: section.styles ?? {},
      },
    })),
    zones: {},
  };
}

export function puckToDocument(
  puckData: Partial<PuckData> | undefined,
  previous: StudioDocument,
): StudioDocument {
  return {
    ...previous,
    version: DOCUMENT_VERSION,
    content: puckData?.root?.props?.content ?? previous.content,
    globalStyles: puckData?.root?.props?.globalStyles ?? previous.globalStyles,
    chrome: puckData?.root?.props?.chrome ?? previous.chrome ?? defaultChrome(),
    sections: (puckData?.content ?? []).map((item) => ({
      id: item.props.sectionId ?? item.type,
      visible: item.props.visible !== false,
      styles: item.props.styles ?? {},
    })),
  };
}

/** The document as it should be written to a file. */
export function serializeDocument(document: StudioDocument): string {
  return JSON.stringify(
    { ...document, version: DOCUMENT_VERSION, savedAt: new Date().toISOString() },
    null,
    2,
  );
}

export function exportFileName(document: StudioDocument): string {
  return `website-${document.site.id}.json`;
}
