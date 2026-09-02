"use client";

/**
 * One theme section as it appears on the studio canvas.
 *
 * The section itself is the theme's own component, rendered untouched. This
 * wrapper adds only what the editor needs around it: the hook the compiled
 * stylesheet targets (`data-studio-section`), the wrapper classes the theme's
 * own `index.tsx` had around it, its style overrides, and the ability to take
 * it off the page.
 *
 * Nothing here reaches inside the section. A customiser that rewrote a theme's
 * internals would be a page builder wearing the theme's name.
 */

import type { ComponentType } from "react";
import type { ResponsiveStyle } from "@/studio/types";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTenantStore } from "@edn/site-themes/store/useTenant.store";
import { sectionSelector } from "@/studio/editor/canvas";
import { sectionCss } from "@/studio/lib/style-css";

/** Sections that feed themselves from the store need no props at all. */
const NO_PROPS = () => null;

export function StudioSection({
  Component,
  sectionId,
  label,
  className,
  styles,
  visible = true,
  propsBinding,
  isEditing = false,
}: {
  Component: ComponentType<any>;
  sectionId: string;
  label: string;
  className?: string;
  styles?: ResponsiveStyle;
  visible?: boolean;
  propsBinding?: {
    select: (state: any) => Record<string, unknown>;
    build: (values: Record<string, unknown>) => Record<string, unknown>;
  } | null;
  isEditing?: boolean;
}) {
  // A handful of sections are passed their content as props by the theme's own
  // index rather than reading the store — Theme-1's hero is the only one today.
  // Reading it back out of the store here keeps that a detail of one section
  // instead of a channel every section has to be plumbed through.
  const values = useTenantStore(useShallow(propsBinding?.select ?? NO_PROPS));
  const componentProps = values && propsBinding ? propsBinding.build(values) : undefined;

  // Each section carries its own stylesheet, so the same component works under
  // Puck in the editor and under `Render` on the preview route without either
  // having to collect styles from anywhere else.
  const css = useMemo(() => sectionCss(sectionSelector(sectionId), styles), [sectionId, styles]);

  if (!visible) {
    // Outside the editor a hidden section renders nothing at all. Inside it,
    // leaving a marker is how you find the section again to switch it back on.
    if (!isEditing) return null;
    return (
      <div data-studio-section={sectionId} data-studio-hidden="true" className="studio-hidden-section">
        <span>{label} — hidden</span>
      </div>
    );
  }

  return (
    <div data-studio-section={sectionId} className={className || undefined}>
      {css ? <style data-studio-section-styles={sectionId}>{css}</style> : null}
      <Component {...(componentProps ?? {})} />
    </div>
  );
}
