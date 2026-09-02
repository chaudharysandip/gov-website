"use client";

/**
 * The canvas root: everything the theme's sections need in order to render as
 * they do on the live site.
 *
 * Three jobs, and only three:
 *
 *  1. Publish the edited content into `useTenantStore`, because that is where
 *     all nineteen themes read from. This is what lets the studio drive them
 *     without a single change to a theme.
 *  2. Emit the compiled stylesheet for global tokens and section overrides.
 *  3. Render the theme's own frame, header and footer around the sections.
 *
 * The same component serves the editor canvas and the preview route, so what
 * you see while editing is what the preview renders.
 */

import type { ComponentType, ReactNode } from "react";
import type { GlobalStyles, SectionState, TenantContent } from "@/studio/types";
import { useLayoutEffect, useMemo, useState } from "react";
import { useTenantStore } from "@edn/site-themes/store/useTenant.store";
import { CANVAS_CLASS } from "@/studio/editor/canvas";
import { FOOTER_SECTION_ID, HEADER_SECTION_ID } from "@/studio/lib/constants";
import { useEditorStore } from "@/studio/store/editor-store";
import { StudioSection } from "@/studio/editor/components/StudioSection";
import { CanvasScrollBridge } from "@/studio/editor/components/CanvasScrollBridge";
import { globalElementCss, globalTokenCss } from "@/studio/lib/style-css";

/**
 * Content is pushed into the tenant store rather than passed down, because the
 * sections read it from there. The first write happens during render — there
 * are no subscribers below us yet, and waiting for an effect would paint one
 * frame of empty theme first.
 */
function useTenantContent(content: TenantContent | undefined) {
  // The first write happens during the first render, in a lazy initialiser:
  // nothing below is subscribed yet, and waiting for an effect would paint one
  // frame of empty theme first.
  const [initial] = useState(() => {
    if (content) useTenantStore.getState().setAllData(content);
    return content;
  });

  // Every later change goes through a layout effect instead. By then the
  // sections *are* subscribed, and writing to the store mid-render would be
  // updating components while a different one renders.
  useLayoutEffect(() => {
    if (!content || content === initial) return;
    useTenantStore.getState().setAllData(content);
  }, [content, initial]);
}

/**
 * The header, made editable without being made a section.
 *
 * It goes through `StudioSection` like everything else — the same wrapper, the
 * same compiled stylesheet, the same "hidden" marker — so a padding set on the
 * header behaves exactly as one set on a band of the page. What it cannot have
 * is Puck's selection, because it is not a Puck component: the click handler
 * below is that, and it swallows the click so a nav link cannot navigate the
 * canvas away from the site being edited.
 */
function ChromeSlot({
  id,
  label,
  Component,
  state,
  isEditing,
}: {
  id: string;
  label: string;
  Component?: ComponentType<any> | null;
  state?: SectionState;
  isEditing: boolean;
}) {
  const selectSection = useEditorStore((store) => store.selectSection);
  const isSelected = useEditorStore((store) => store.selectedSectionId === id);

  if (!Component) return null;

  // Outside the editor, an untouched and visible header is rendered bare — the
  // wrapper would be a box of its own height, and a theme header that sticks
  // can only stick inside its containing block. Nothing to apply, nothing to
  // select: nothing to wrap it in.
  const untouched = state?.visible !== false && !Object.keys(state?.styles ?? {}).length;
  if (!isEditing && untouched) return <Component />;

  const section = (
    <StudioSection
      Component={Component}
      sectionId={id}
      label={label}
      styles={state?.styles}
      visible={state?.visible !== false}
      isEditing={isEditing}
    />
  );

  if (!isEditing) return section;

  return (
    <div
      data-studio-chrome={id}
      data-studio-selected={isSelected ? "true" : undefined}
      onClickCapture={(event) => {
        event.preventDefault();
        event.stopPropagation();
        selectSection(id);
      }}
    >
      {section}
    </div>
  );
}

export function StudioRoot({
  children,
  content,
  globalStyles,
  chrome,
  Frame,
  Header,
  Footer,
  isEditing = false,
}: {
  children?: ReactNode;
  content?: TenantContent;
  globalStyles?: GlobalStyles;
  chrome?: Record<string, SectionState>;
  Frame: ComponentType<{ children?: ReactNode; profile?: any }>;
  Header?: ComponentType<any> | null;
  Footer?: ComponentType<any> | null;
  isEditing?: boolean;
}) {
  useTenantContent(content);

  const css = useMemo(
    () =>
      [
        globalTokenCss(`.${CANVAS_CLASS}`, globalStyles),
        globalElementCss(`.${CANVAS_CLASS}`, globalStyles),
      ]
        .filter(Boolean)
        .join("\n"),
    [globalStyles],
  );

  const profile = content?.layout?.profile;

  return (
    <div className={CANVAS_CLASS} data-studio-editing={isEditing ? "true" : undefined}>
      {/*
        Styles are emitted as CSS rather than composed into Tailwind classes.
        A class built from a user value — `p-[${padding}px]` — never appears in
        any source file, so Tailwind never generates it and the control does
        nothing. Real declarations on a scoped selector always work, and the
        breakpoint overrides can be real media queries rather than a value
        picked in JavaScript for whichever device is being previewed.
      */}
      {css ? <style data-studio-styles="">{css}</style> : null}

      {/*
        Before the header and the sections, because it has to reach GSAP before
        the first `useGSAP` does. It renders nothing on the preview route.
      */}
      <CanvasScrollBridge />

      <div className="flex min-h-screen flex-col">
        <ChromeSlot
          id={HEADER_SECTION_ID}
          label="Header"
          Component={Header}
          state={chrome?.header}
          isEditing={isEditing}
        />
        <div className="grow">
          <Frame profile={profile}>{children}</Frame>
        </div>
        <ChromeSlot
          id={FOOTER_SECTION_ID}
          label="Footer"
          Component={Footer}
          state={chrome?.footer}
          isEditing={isEditing}
        />
      </div>
    </div>
  );
}
