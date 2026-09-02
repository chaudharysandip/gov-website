"use client";

/**
 * The bar that floats over the selected section on the canvas.
 *
 * Puck draws it and positions it; this decides what is on it. The template owns
 * the layout, so there is no insert and no duplicate — what is left is the four
 * things you can do to a band of the page: open its design, move it, hide it,
 * take it off.
 *
 * The actions read the selection from the studio store rather than taking an id
 * as a prop, because Puck's override is given none. That is sound: the bar is
 * `pointer-events: none` until its own component is the selected one, so the
 * only bar that can be clicked is the one the store is pointing at.
 */

import type { ReactNode } from "react";
import { ActionBar } from "@puckeditor/core";
import { ChevronDown, ChevronUp, Eye, EyeOff, SlidersHorizontal } from "lucide-react";
import { useEditorStore } from "@/studio/store/editor-store";
import { selectSections } from "@/studio/store/selectors";

export function SectionActionBar({
  label,
  children,
  parentAction,
}: {
  label?: string;
  children?: ReactNode;
  parentAction?: ReactNode;
}) {
  const sections = useEditorStore(selectSections);
  const selectedSectionId = useEditorStore((state) => state.selectedSectionId);
  const moveSection = useEditorStore((state) => state.moveSection);
  const toggleSection = useEditorStore((state) => state.toggleSection);
  const setInspectorTab = useEditorStore((state) => state.setInspectorTab);

  const index = sections.findIndex((section) => section.id === selectedSectionId);
  const entry = index >= 0 ? sections[index] : null;
  const visible = entry?.visible !== false;

  return (
    <ActionBar label={label}>
      {parentAction}

      {entry ? (
        <>
        <ActionBar.Group>
          <ActionBar.Action label="Design this section" onClick={() => setInspectorTab("design")}>
            <SlidersHorizontal />
          </ActionBar.Action>
          <ActionBar.Action
            label="Move up"
            disabled={index === 0}
            onClick={() => moveSection(index, index - 1)}
          >
            <ChevronUp />
          </ActionBar.Action>
          <ActionBar.Action
            label="Move down"
            disabled={index === sections.length - 1}
            onClick={() => moveSection(index, index + 1)}
          >
            <ChevronDown />
          </ActionBar.Action>
          <ActionBar.Action
            label={visible ? "Hide on the page" : "Show on the page"}
            active={!visible}
            onClick={() => toggleSection(entry.id)}
          >
            {visible ? <Eye /> : <EyeOff />}
          </ActionBar.Action>
        </ActionBar.Group>
        {/* Only once there is something on the left of it to separate. */}
        <ActionBar.Separator />
        </>
      ) : null}

      {/* Puck's own actions — with insert and duplicate off, this is delete. */}
      {children}
    </ActionBar>
  );
}
