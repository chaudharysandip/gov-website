"use client";

/**
 * Mounts Puck for one site.
 *
 * The order matters: the store has to be initialised — which is where a saved
 * document is read back out of localStorage — before Puck is handed its
 * initial data, because Puck treats `data` as the starting state and every
 * later change flows through dispatch. Doing it in a lazy initialiser rather
 * than an effect means Puck never mounts with the defaults and then jumps to
 * the saved version a frame later.
 */

import type {
  ContentSource,
  EditorConfig,
  SiteRecord,
  StudioDocument,
  TenantContent,
  ThemeDescriptor,
  ThemeTemplate,
} from "@/studio/types";
import { useMemo, useState } from "react";
import { Puck } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { getTemplate } from "@/studio/templates/registry";
import { buildPuckConfig } from "@/studio/editor/config";
import { documentToPuck } from "@/studio/lib/document";
import { DEVICES } from "@/studio/lib/constants";
import { useEditorStore } from "@/studio/store/editor-store";
import { EditorShell } from "@/studio/components/EditorShell";
import { SectionActionBar } from "@/studio/components/SectionActionBar";

/**
 * Puck renders whatever this returns *instead of* its own chrome. It takes no
 * props and never changes, so it lives at module scope: a new object here on
 * every render would remount the entire editor.
 *
 * `actionBar` is the floating bar over the selected section. Puck keeps the
 * positioning; the studio decides what is on it.
 */
const OVERRIDES = { puck: () => <EditorShell />, actionBar: SectionActionBar };

const VIEWPORTS = DEVICES.map((device) => ({
  width: device.width,
  height: "auto",
  label: device.label,
  icon: device.icon,
}));

export function StudioEditor({
  site,
  theme,
  editorConfig,
  content,
  contentSource,
  themes,
}: {
  site: SiteRecord;
  theme: ThemeDescriptor;
  editorConfig: EditorConfig;
  content: TenantContent;
  contentSource: ContentSource;
  themes: ThemeDescriptor[];
}) {
  const template = useMemo(() => getTemplate(site.themeId), [site.themeId]);

  // One initialisation, before the first render of Puck.
  const [initialData] = useState(() => {
    useEditorStore.getState().initializeEditor({ site, theme, editorConfig, content, contentSource, themes });
    return documentToPuck(useEditorStore.getState().document as StudioDocument);
  });

  const config = useMemo(
    () => buildPuckConfig({ template: template as ThemeTemplate, isEditing: true }),
    [template],
  );

  const syncFromPuck = useEditorStore((state) => state.syncFromPuck);

  return (
    <Puck
      // Puck's `Data` is generic over a config the studio builds at runtime,
      // one component per section of whichever theme is open, so these two
      // cross the boundary as the shape `lib/document.ts` guarantees.
      config={config as any}
      data={initialData as any}
      onChange={syncFromPuck as any}
      overrides={OVERRIDES}
      viewports={VIEWPORTS as any}
      iframe={{ enabled: true, waitForStyles: true, syncHostStyles: true }}
      permissions={{ insert: false, duplicate: false }}
      dnd={{ disableAutoScroll: false }}
      height="100vh"
    />
  );
}
