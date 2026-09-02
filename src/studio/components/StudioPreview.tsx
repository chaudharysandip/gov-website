"use client";

/**
 * The preview route's renderer.
 *
 * The same config that drives the editor canvas, rendered through Puck's
 * `Render` instead of `Puck` — so the page is the website and nothing else:
 * no selection overlays, no drag handles, no inspector. Hidden sections render
 * nothing at all here rather than leaving a marker, because this is what the
 * published site would be.
 *
 * The device frame is deliberately opt-in. At full width the page fills the
 * window exactly as the real site would; choosing a device drops it into an
 * iframe of that width, which is the only way `md:` and `lg:` breakpoints
 * resolve truthfully.
 */

import type { LucideIcon } from "lucide-react";
import type { EditorConfig, SiteRecord, TenantContent, ThemeTemplate } from "@/studio/types";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Render } from "@puckeditor/core";
import { Monitor, PencilLine, Smartphone, Tablet, X } from "lucide-react";
import { cn } from "@edn/site-themes/lib/utils";
import { Button } from "@edn/site-themes/components/ui/button";
import { DEVICES } from "@/studio/lib/constants";
import { buildPuckConfig } from "@/studio/editor/config";
import { createDocument, documentToPuck, reconcileDocument } from "@/studio/lib/document";
import { loadDraftState, loadWebsiteState } from "@/studio/lib/storage";
import { useDraftDocumentRaw, useSavedDocumentRaw } from "@/studio/lib/use-saved-state";
import { getTemplate } from "@/studio/templates/registry";

const ICONS: Record<string, LucideIcon> = { Monitor, Tablet, Smartphone };

function DeviceBar({
  device,
  onChange,
  siteId,
  onDismiss,
}: {
  device: string;
  onChange: (device: string) => void;
  siteId: string;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed bottom-4 left-1/2 z-9999 flex -translate-x-1/2 items-center gap-1 rounded-full border bg-background/95 p-1 shadow-lg backdrop-blur print:hidden">
      <Button
        variant={device === "full" ? "secondary" : "ghost"}
        size="sm"
        className="h-7 rounded-full px-3 text-[11px]"
        onClick={() => onChange("full")}
      >
        Full
      </Button>
      {DEVICES.map((entry) => {
        const Icon = ICONS[entry.icon];
        return (
          <Button
            key={entry.id}
            variant={device === entry.id ? "secondary" : "ghost"}
            size="icon-sm"
            className="size-7 rounded-full"
            onClick={() => onChange(entry.id)}
            aria-label={`${entry.label} — ${entry.width}px`}
            title={`${entry.label} — ${entry.width}px`}
          >
            <Icon className="size-3.5" />
          </Button>
        );
      })}
      <span className="mx-1 h-4 w-px bg-border" aria-hidden />
      <Button variant="ghost" size="icon-sm" className="size-7 rounded-full" asChild>
        <Link href={`/studio/editor/${siteId}`} aria-label="Back to the editor" title="Back to the editor">
          <PencilLine className="size-3.5" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        className="size-7 rounded-full"
        onClick={onDismiss}
        aria-label="Hide these controls"
        title="Hide these controls"
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}

export function StudioPreview({
  site,
  editorConfig,
  content,
  showControls = true,
  draft = false,
}: {
  site: SiteRecord;
  editorConfig: EditorConfig;
  content: TenantContent;
  showControls?: boolean;
  draft?: boolean;
}) {
  const [device, setDevice] = useState("full");
  const [controlsVisible, setControlsVisible] = useState(showControls);

  const template = useMemo(() => getTemplate(site.themeId), [site.themeId]);
  const config = useMemo(
    () => buildPuckConfig({ template: template as ThemeTemplate, isEditing: false }),
    [template],
  );

  // Saved edits live in the browser, so the server renders the defaults — which
  // is exactly what a visitor with no saved copy sees — and the client swaps in
  // the saved document on its first render.
  const savedRaw = useSavedDocumentRaw(site.id);
  const draftRaw = useDraftDocumentRaw(site.id);
  const raw = draft ? draftRaw : savedRaw;

  const document = useMemo(() => {
    const fresh = createDocument({ site, editorConfig, content });
    if (!raw) return fresh;

    const stored = draft ? loadDraftState(site.id) : loadWebsiteState(site.id);
    if (!stored.ok || !stored.data || stored.data.site.themeId !== site.themeId) return fresh;
    return reconcileDocument({ ...stored.data, site: fresh.site }, editorConfig);
  }, [raw, draft, site, editorConfig, content]);

  const data = useMemo(() => documentToPuck(document), [document]);

  const width = DEVICES.find((entry) => entry.id === device)?.width;

  return (
    <>
      {device === "full" ? (
        <Render config={config as any} data={data as any} />
      ) : (
        <div className="flex min-h-screen justify-center bg-neutral-200 py-8 dark:bg-neutral-900">
          {/*
            A real iframe rather than a fixed-width div. The themes are built on
            viewport media queries, and only a narrow viewport makes those fire
            — a narrow element inside a wide window still reports a wide screen.
          */}
          <iframe
            title={`${site.schoolName} at ${width}px`}
            src={`/studio/preview/${site.id}?chrome=off&theme=${site.themeId}${draft ? "&draft=1" : ""}`}
            style={{ width, height: "calc(100vh - 4rem)" }}
            className="rounded-xl border bg-background shadow-2xl"
          />
        </div>
      )}

      {/*
        `chrome=off` means *nothing*: not the bar, and not the pill that brings
        the bar back. That URL is what the device frames load in their iframe
        and what you open to see the page exactly as a visitor would.
      */}
      {!showControls ? null : controlsVisible ? (
        <DeviceBar
          device={device}
          onChange={setDevice}
          siteId={site.id}
          onDismiss={() => setControlsVisible(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setControlsVisible(true)}
          className={cn(
            "fixed bottom-4 left-1/2 z-9999 -translate-x-1/2 rounded-full border bg-background/90 px-3 py-1 text-[11px] text-muted-foreground shadow-md backdrop-blur",
            "print:hidden",
          )}
        >
          Preview controls
        </button>
      )}
    </>
  );
}
