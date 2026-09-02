"use client";

/**
 * Builds the Puck configuration for one theme.
 *
 * Puck supplies the editing infrastructure — canvas selection, drag and drop,
 * the component tree, history — and this is where the existing theme
 * components are handed to it. One Puck component per section the theme
 * renders, in the order the theme renders them.
 *
 * The `fields` are deliberately empty of UI. Puck's own field rendering is
 * replaced by the studio inspector (`src/studio/components/Inspector.jsx`),
 * because "Content, Design, Responsive" is a different shape from a flat field
 * list. What Puck still owns is the data: every edit is dispatched through it,
 * which is what makes undo and redo cover content, styles, visibility and
 * order alike.
 *
 * Build this once per theme and memoise it. Rebuilding on a render would give
 * every section a new component identity and remount the whole page.
 */

import type { ComponentType } from "react";
import type { ManifestSection, ThemeTemplate } from "@/studio/types";
import dynamic from "next/dynamic";
import { getFrame } from "@/studio/templates/frames";
import { propsBindingFor } from "@/studio/editor/section-props";
import { StudioRoot } from "@/studio/editor/components/StudioRoot";
import { StudioSection } from "@/studio/editor/components/StudioSection";

function SectionSkeleton({ label }: { label: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center bg-muted/40 text-sm text-muted-foreground">
      Loading {label}…
    </div>
  );
}

/**
 * A section that fails to load must not take the page with it. The themes pull
 * in WebGL, GSAP and carousels; one of them throwing should cost that band and
 * nothing else.
 */
function makeSectionComponent(section: ManifestSection) {
  return dynamic(
    () =>
      section
        .load()
        .then((component: ComponentType<any>) => ({ default: component }))
        .catch(() => ({
          default: function SectionFailed() {
            return (
              <div className="flex min-h-40 items-center justify-center bg-destructive/5 px-6 text-center text-sm text-destructive">
                “{section.label}” could not be loaded from this theme.
              </div>
            );
          },
        })),
    { loading: () => <SectionSkeleton label={section.label} /> },
  );
}

/**
 * @param {object} params
 * @param {object} params.template from `getTemplate(themeId)`
 * @param {boolean} params.isEditing false on the preview route
 */
export function buildPuckConfig({
  template,
  isEditing = false,
}: {
  template: ThemeTemplate;
  isEditing?: boolean;
}) {
  const Frame = getFrame(template.id, template);
  const Header = dynamic(
    () => template.chrome.header().then((c: ComponentType<any>) => ({ default: c })),
    { ssr: false },
  );
  const Footer = dynamic(
    () => template.chrome.footer().then((c: ComponentType<any>) => ({ default: c })),
    { ssr: false },
  );

  const components: Record<string, any> = {};

  for (const section of template.sections) {
    const Component = makeSectionComponent(section);
    const propsBinding = propsBindingFor(template.id, section.id);

    components[section.id] = {
      label: section.label,
      // Puck has to know these props exist so they survive a round trip. The
      // controls live in the studio inspector, so the fields render nothing.
      fields: {
        sectionId: { type: "custom", label: "Section", render: () => null },
        visible: { type: "custom", label: "Visible", render: () => null },
        styles: { type: "custom", label: "Styles", render: () => null },
      },
      defaultProps: {
        sectionId: section.id,
        visible: true,
        styles: {},
      },
      permissions: {
        // The template owns the layout. Sections move, hide and return; they do
        // not nest, and nothing new can be dropped between them.
        drag: true,
        duplicate: false,
        delete: true,
        edit: true,
        insert: false,
      },
      render: ({ sectionId, visible, styles }: any) => (
        <StudioSection
          Component={Component}
          sectionId={sectionId ?? section.id}
          label={section.label}
          className={section.className}
          styles={styles}
          visible={visible !== false}
          propsBinding={propsBinding}
          isEditing={isEditing}
        />
      ),
    };
  }

  return {
    components,
    root: {
      fields: {
        content: { type: "custom", label: "Content", render: () => null },
        globalStyles: { type: "custom", label: "Global styles", render: () => null },
        chrome: { type: "custom", label: "Header and footer", render: () => null },
      },
      defaultProps: { content: {}, globalStyles: { tokens: {} }, chrome: {} },
      render: ({ children, content, globalStyles, chrome }: any) => (
        <StudioRoot
          content={content}
          globalStyles={globalStyles}
          chrome={chrome}
          Frame={Frame}
          Header={Header}
          Footer={Footer}
          isEditing={isEditing}
        >
          {children}
        </StudioRoot>
      ),
    },
  };
}
