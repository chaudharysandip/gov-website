"use client";

/**
 * The Content tab.
 *
 * A section's editable content is whatever slices of the website payload it
 * reads — taken from the section's own `useTenantStore` selectors when the
 * manifests were generated, so the panel offers what the section renders and
 * nothing else.
 *
 * Three outcomes, and all three are honest answers:
 *   - the section reads content, so its fields appear;
 *   - the section reads only site-wide details, so it points at the Site panel;
 *   - the section renders fixed template copy, so it says so and offers Design.
 */

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { ContentList, SectionDefinition, TenantContent } from "@/studio/types";
import { Info, Settings2 } from "lucide-react";
import { Button } from "@edn/site-themes/components/ui/button";
import { Separator } from "@edn/site-themes/components/ui/separator";
import { CONTENT_MODEL, editableSlices, readsOnlySiteWide } from "@/studio/editor/content-model";
import { extraSlicesFor } from "@/studio/editor/section-props";
import { useEditorStore } from "@/studio/store/editor-store";
import { ListEditor, ObjectEditor } from "@/studio/components/fields/ListEditor";

function Notice({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[3px] border border-dashed border-studio-line px-4 py-6 text-center">
      <Icon className="mx-auto mb-2.5 size-4 text-studio-faint" aria-hidden />
      <p className="text-[13px] font-medium text-studio-ink">{title}</p>
      {children ? (
        <p className="mx-auto mt-1.5 max-w-[38ch] text-[11px] leading-relaxed text-studio-dim">{children}</p>
      ) : null}
      {action}
    </div>
  );
}

function SliceEditor({
  slice,
  content,
  onChange,
}: {
  slice: string;
  content: TenantContent;
  onChange: (slice: string, value: unknown) => void;
}) {
  const definition = CONTENT_MODEL[slice];
  if (!definition) return null;

  return (
    <section className="space-y-2">
      <h3 className="text-[12px] font-medium text-studio-ink">{definition.label}</h3>
      {definition.type === "object" ? (
        <ObjectEditor
          value={content?.[slice]}
          definition={definition}
          path={slice}
          onChange={(next) => onChange(slice, next)}
        />
      ) : (
        <ListEditor
          items={content?.[slice]}
          definition={definition as ContentList}
          path={slice}
          onChange={(next) => onChange(slice, next)}
        />
      )}
    </section>
  );
}

export function ContentPanel({ section }: { section: SectionDefinition | null }) {
  const content = useEditorStore((state) => state.document?.content);
  const themeId = useEditorStore((state) => state.themeId);
  const updateContent = useEditorStore((state) => state.updateContent);
  const setInspectorTab = useEditorStore((state) => state.setInspectorTab);

  if (!section) {
    return (
      <Notice icon={Info} title="No section selected">
        Pick a section from the list on the left, or click one on the canvas.
      </Notice>
    );
  }

  // A prop-driven section (Theme-1's hero) never names a store slice in its own
  // source, so the slices it really edits are declared alongside its props.
  const declared = [
    ...new Set([...(section.slices ?? []), ...extraSlicesFor(themeId ?? "", section.id)]),
  ];
  const slices = editableSlices({ ...section, slices: declared });

  if (!slices.length) {
    const siteWide = readsOnlySiteWide({ ...section, slices: declared });

    return (
      <Notice
        icon={siteWide ? Settings2 : Info}
        title={siteWide ? "Driven by site details" : "Fixed template content"}
        action={
          <Button
            variant="outline"
            size="sm"
            className="mt-3.5 h-7 rounded-[3px] text-[12px]"
            onClick={() => setInspectorTab(siteWide ? "site" : "design")}
          >
            {siteWide ? "Open site details" : "Open design"}
          </Button>
        }
      >
        {siteWide
          ? `“${section.label}” renders the institution's name, contact details and menu. Editing those changes it everywhere at once.`
          : `“${section.label}” is written into the theme rather than fed from content. Its colours, spacing and type are still yours to change.`}
      </Notice>
    );
  }

  return (
    <div className="space-y-5">
      {slices.map((slice, index) => (
        <div key={slice} className="space-y-5">
          {index > 0 ? <Separator /> : null}
          <SliceEditor slice={slice} content={content ?? {}} onChange={updateContent} />
        </div>
      ))}
    </div>
  );
}
