"use client";

/**
 * The Design tab.
 *
 * Every control writes into the *active breakpoint*, and shows where its value
 * came from when the breakpoint has no override of its own. That is the whole
 * responsive model in one place: editing on Mobile never touches Desktop, and a
 * field left alone is visibly inherited rather than mysteriously blank.
 *
 * The controls offered are the ones that cannot break a template. A section can
 * be recoloured, respaced, bordered and re-typed; its internal grid, its
 * animation and its markup are not on offer, because those are the theme.
 */

import type { DeviceId, ResponsiveStyle, SectionDefinition, StyleObject, StyleValue } from "@/studio/types";
import { useState } from "react";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, ChevronRight } from "lucide-react";
import { cn } from "@edn/site-themes/lib/utils";
import { Accordion, AccordionContent, AccordionItem } from "@edn/site-themes/components/ui/accordion";
import { Button } from "@edn/site-themes/components/ui/button";
import {
  BUTTON_STYLE_FIELDS,
  TEXT_STYLE_FIELDS,
  BACKGROUND_POSITIONS,
  BACKGROUND_REPEATS,
  BACKGROUND_SIZES,
  BORDER_STYLES,
  FONT_STACKS,
  FONT_WEIGHTS,
  SHADOW_PRESETS,
} from "@/studio/lib/constants";
import { hasOwnValue, resolveStyleValue } from "@/studio/lib/style-css";
import { useEditorStore } from "@/studio/store/editor-store";
import { selectSectionStyles } from "@/studio/store/selectors";
import {
  BoxControl,
  ColorControl,
  Field,
  GroupTrigger,
  ImageControl,
  NumberControl,
  SegmentedControl,
  SelectControl,
  TextControl,
} from "@/studio/components/fields/controls";
import { Placard } from "@/studio/components/bay";
import { BreakpointChain } from "@/studio/components/BreakpointChain";

const ALIGN_OPTIONS = [
  { value: "left", label: "Left", icon: <AlignLeft className="size-3.5" /> },
  { value: "center", label: "Center", icon: <AlignCenter className="size-3.5" /> },
  { value: "right", label: "Right", icon: <AlignRight className="size-3.5" /> },
  { value: "justify", label: "Justify", icon: <AlignJustify className="size-3.5" /> },
];

/**
 * Binds style keys to the active breakpoint.
 *
 * `bind(key)` returns the value to display, the breakpoint it was inherited
 * from (or null), a setter and a reset — the four things every control in this
 * panel needs. `bindMany` does the same for a group that moves together, in one
 * dispatch, so a linked padding box is one press of undo rather than four.
 */
interface Binding {
  value: StyleValue;
  inherited: DeviceId | null;
  set: (next: StyleValue) => void;
  reset: (() => void) | undefined;
}

function useStyleBinding(
  sectionId: string | undefined,
  styles: ResponsiveStyle,
  device: DeviceId,
) {
  const updateStyle = useEditorStore((state) => state.updateStyle);
  const updateStyles = useEditorStore((state) => state.updateStyles);

  const bind = (key: string): Binding => {
    const { value, inheritedFrom } = resolveStyleValue(styles, device, key);
    return {
      value: value ?? "",
      inherited: hasOwnValue(styles, device, key) ? null : inheritedFrom,
      set: (next: StyleValue) => updateStyle(sectionId as string, device, key, next),
      reset: hasOwnValue(styles, device, key)
        ? () => updateStyle(sectionId as string, device, key, "")
        : undefined,
    };
  };

  const bindMany = (patch: StyleObject) => updateStyles(sectionId as string, device, patch);

  return { bind, bindMany };
}

export function DesignPanel({ section }: { section: SectionDefinition | null }) {
  const device = useEditorStore((state) => state.activeDevice);
  const resetStyle = useEditorStore((state) => state.resetStyle);
  const styles = useEditorStore((state) => selectSectionStyles(state, section?.id));

  const openGroups = useEditorStore((state) => state.openGroups.design);
  const setOpenGroups = useEditorStore((state) => state.setOpenGroups);
  const { bind, bindMany } = useStyleBinding(section?.id, styles ?? {}, device);
  const [textDetail, setTextDetail] = useState(false);

  // Open on its own when one of the three is set: an override the reader
  // cannot see is an override they cannot undo.
  const showTextDetail = textDetail || TEXT_STYLE_FIELDS.some((field) => bind(field.key).value);

  if (!section) {
    return (
      <p className="rounded-[3px] border border-dashed border-studio-line px-4 py-10 text-center text-[12px] text-studio-faint">
        Select a section to style it.
      </p>
    );
  }

  const SIDES = ["Top", "Right", "Bottom", "Left"];

  /**
   * The four sides of a box property, resolved the same way every other control
   * here is: the value shown is what will render, and the breakpoint it came
   * from is named when this one has no override of its own.
   */
  const box = (prefix: string) => {
    const sides = SIDES.map((side) => bind(`${prefix}${side}`));
    const patch = (value: StyleValue): StyleObject =>
      Object.fromEntries(SIDES.map((side) => [`${prefix}${side}`, value]));

    return {
      values: Object.fromEntries(SIDES.map((side, i) => [side, sides[i].value])),
      // One badge for the group: they inherit together or not at all.
      inherited: sides.every((side) => side.inherited) ? sides[0].inherited : null,
      reset: sides.some((side) => side.reset) ? () => bindMany(patch("")) : undefined,
      set: (side: string, value: StyleValue) => bind(`${prefix}${side}`).set(value),
      setAll: (value: StyleValue) => bindMany(patch(value)),
    };
  };

  const padding = box("padding");
  const margin = box("margin");

  const hasAnyOverride = Boolean(styles?.[device] && Object.keys(styles[device]).length);

  const fontFamily = bind("fontFamily");
  const fontSize = bind("fontSize");
  const fontWeight = bind("fontWeight");
  const lineHeight = bind("lineHeight");
  const letterSpacing = bind("letterSpacing");
  const textAlign = bind("textAlign");
  const textColor = bind("textColor");
  const backgroundColor = bind("backgroundColor");
  const accentColor = bind("accentColor");
  const buttonRadius = bind("buttonRadius");
  const gap = bind("gap");
  const width = bind("width");
  const maxWidth = bind("maxWidth");
  const minHeight = bind("minHeight");
  const borderStyle = bind("borderStyle");
  const borderWidth = bind("borderWidth");
  const borderColor = bind("borderColor");
  const borderRadius = bind("borderRadius");
  const shadow = bind("shadow");
  const backgroundImage = bind("backgroundImage");
  const backgroundSize = bind("backgroundSize");
  const backgroundPosition = bind("backgroundPosition");
  const backgroundRepeat = bind("backgroundRepeat");
  const overlay = bind("overlay");

  /** A group's contents, said in the row that opens it. */
  const swatches = (...keys: string[]) =>
    keys
      .map((key) => bind(key).value)
      .filter((entry): entry is string => typeof entry === "string" && entry.length > 0)
      .map((color) => ({ color }));

  const spacingSummary = (prefix: string) => {
    const values = SIDES.map((side) => bind(`${prefix}${side}`).value).map((value) =>
      value === "" || value === undefined || value === null ? null : String(value),
    );
    if (values.every((value) => value === null)) return [];
    const unique = [...new Set(values.map((value) => value ?? "—"))];
    return [{ text: unique.length === 1 ? `${unique[0]}px` : values.map((v) => v ?? "—").join(" ") }];
  };

  const textSummary = () => {
    const size = fontSize.value;
    const weight = fontWeight.value;
    const family = FONT_STACKS.find((entry) => entry.value === fontFamily.value);
    const parts = [
      family ? family.label.replace(/\s*\(.*\)$/, "") : null,
      size ? `${size}px` : null,
      weight ? String(weight) : null,
    ].filter(Boolean);
    return parts.length ? [{ text: parts.join(" · ") }] : [];
  };

  const borderSummary = () => {
    const chips: Array<{ color?: string; text?: string }> = [];
    if (borderWidth.value) chips.push({ text: `${borderWidth.value}px` });
    if (typeof borderColor.value === "string" && borderColor.value)
      chips.push({ color: borderColor.value });
    if (borderRadius.value) chips.push({ text: `r${borderRadius.value}` });
    if (shadow.value && shadow.value !== "none") chips.push({ text: String(shadow.value) });
    return chips;
  };

  const layoutSummary = () => {
    const chips = [
      width.value ? `w ${width.value}` : null,
      maxWidth.value ? `max ${maxWidth.value}` : null,
      minHeight.value ? `h ${minHeight.value}` : null,
    ].filter(Boolean) as string[];
    return chips.length ? [{ text: chips.join(" · ") }] : [];
  };

  const backgroundSummary = () => {
    const chips: Array<{ color?: string; text?: string }> = [];
    if (backgroundImage.value) chips.push({ text: "image" });
    if (typeof overlay.value === "string" && overlay.value) chips.push({ color: overlay.value });
    return chips;
  };

  return (
    <div className="space-y-3.5">
      {/*
        The responsive model, in the one place every control in this panel
        writes into. It replaces a grey pill reading "Editing mobile", which
        said where you were but never what the other two breakpoints held.
      */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Placard>Editing</Placard>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 rounded-[2px] px-1.5 text-[11px] text-studio-faint hover:bg-studio-surface hover:text-studio-ink"
            disabled={!hasAnyOverride}
            onClick={() => resetStyle(section.id, device)}
          >
            Clear {device}
          </Button>
        </div>
        <BreakpointChain styles={styles} />
      </div>

      <Accordion
        type="multiple"
        value={openGroups}
        onValueChange={(next) => setOpenGroups("design", next)}
        className="w-full"
      >
        <AccordionItem value="colors">
          <GroupTrigger
            label="Colours"
            chips={[
              ...swatches("textColor", "backgroundColor", "accentColor"),
              ...swatches(...TEXT_STYLE_FIELDS.map((field) => field.key)),
            ]}
          />
          <AccordionContent className="space-y-3">
            <Field label="Text" inherited={textColor.inherited} onReset={textColor.reset}>
              <ColorControl value={textColor.value} onChange={textColor.set} />
            </Field>
            <Field
              label="Background"
              inherited={backgroundColor.inherited}
              onReset={backgroundColor.reset}
            >
              <ColorControl value={backgroundColor.value} onChange={backgroundColor.set} />
            </Field>
            <Field
              label="Accent"
              inherited={accentColor.inherited}
              onReset={accentColor.reset}
              hint="Shadows the theme's primary colour, here only."
            >
              <ColorControl value={accentColor.value} onChange={accentColor.set} />
            </Field>

            {/*
              "Text" above sets the colour the section passes down, which a
              theme's own `text-white` on a heading then overrides. These three
              are rules on the elements themselves, so they land on the heading,
              the paragraph and the link whatever the theme put there.
            */}
            <button
              type="button"
              onClick={() => setTextDetail((open) => !open)}
              aria-expanded={showTextDetail}
              className="ml-2.5 flex items-center gap-1 rounded-[2px] py-0.5 text-[11px] text-studio-faint transition-colors hover:text-studio-ink focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <ChevronRight
                className={cn("size-3 transition-transform", showTextDetail && "rotate-90")}
                aria-hidden
              />
              Headings, body and links
            </button>

            {showTextDetail
              ? TEXT_STYLE_FIELDS.map((field) => {
                  const control = bind(field.key);
                  return (
                    <Field
                      key={field.key}
                      label={field.label}
                      inherited={control.inherited}
                      onReset={control.reset}
                    >
                      <ColorControl value={control.value} onChange={control.set} />
                    </Field>
                  );
                })
              : null}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="buttons">
          <GroupTrigger label="Buttons" chips={[...swatches(...BUTTON_STYLE_FIELDS.map((field) => field.key)), ...(buttonRadius.value ? [{ text: `r${buttonRadius.value}` }] : [])]} />
          <AccordionContent className="space-y-3">
            {BUTTON_STYLE_FIELDS.map((field) => {
              const control = bind(field.key);
              return (
                <Field
                  key={field.key}
                  label={field.label}
                  inherited={control.inherited}
                  onReset={control.reset}
                >
                  <ColorControl value={control.value} onChange={control.set} />
                </Field>
              );
            })}
            <Field
              label="Corner radius"
              inherited={buttonRadius.inherited}
              onReset={buttonRadius.reset}
              hint="Every button in this section."
            >
              <NumberControl
                value={buttonRadius.value}
                onChange={buttonRadius.set}
                unit="px"
                placeholder="theme"
              />
            </Field>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="typography">
          <GroupTrigger label="Typography" chips={[...textSummary(), ...(textAlign.value ? [{ text: String(textAlign.value) }] : [])]} />
          <AccordionContent className="space-y-3">
            <Field label="Font family" inherited={fontFamily.inherited} onReset={fontFamily.reset}>
              <SelectControl value={fontFamily.value} onChange={fontFamily.set} options={FONT_STACKS} placeholder="Theme font" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Size" inherited={fontSize.inherited} onReset={fontSize.reset}>
                <NumberControl value={fontSize.value} onChange={fontSize.set} unit="px" placeholder="auto" />
              </Field>
              <Field label="Weight" inherited={fontWeight.inherited} onReset={fontWeight.reset}>
                <SelectControl value={fontWeight.value} onChange={fontWeight.set} options={FONT_WEIGHTS} placeholder="Theme" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Line height" inherited={lineHeight.inherited} onReset={lineHeight.reset}>
                <TextControl value={lineHeight.value} onChange={lineHeight.set} placeholder="1.5" />
              </Field>
              <Field label="Letter spacing" inherited={letterSpacing.inherited} onReset={letterSpacing.reset}>
                <TextControl value={letterSpacing.value} onChange={letterSpacing.set} placeholder="0.02em" />
              </Field>
            </div>
            <Field label="Alignment" inherited={textAlign.inherited} onReset={textAlign.reset}>
              <SegmentedControl value={textAlign.value as string} onChange={textAlign.set} options={ALIGN_OPTIONS} ariaLabel="Text alignment" />
            </Field>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="spacing">
          <GroupTrigger label="Spacing" chips={[...spacingSummary("padding"), ...spacingSummary("margin"), ...(gap.value ? [{ text: `gap ${gap.value}` }] : [])]} max={3} />
          <AccordionContent className="space-y-3">
            {/*
              Keyed by section so the linked/unlinked toggle is re-evaluated
              when you move to a section whose padding differs per side.
            */}
            <BoxControl
              key={`${section.id}-padding`}
              label="Padding"
              values={padding.values}
              inherited={padding.inherited}
              onReset={padding.reset}
              onChange={padding.set}
              onChangeAll={padding.setAll}
            />
            <BoxControl
              key={`${section.id}-margin`}
              label="Margin"
              values={margin.values}
              inherited={margin.inherited}
              onReset={margin.reset}
              onChange={margin.set}
              onChangeAll={margin.setAll}
            />
            <Field label="Gap" inherited={gap.inherited} onReset={gap.reset}>
              <NumberControl value={gap.value} onChange={gap.set} unit="px" placeholder="theme" />
            </Field>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="layout">
          <GroupTrigger label="Layout" chips={layoutSummary()} max={2} />
          <AccordionContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Width" inherited={width.inherited} onReset={width.reset}>
                <TextControl value={width.value} onChange={width.set} placeholder="auto" />
              </Field>
              <Field label="Max width" inherited={maxWidth.inherited} onReset={maxWidth.reset}>
                <TextControl value={maxWidth.value} onChange={maxWidth.set} placeholder="none" />
              </Field>
            </div>
            <Field label="Min height" inherited={minHeight.inherited} onReset={minHeight.reset}>
              <TextControl value={minHeight.value} onChange={minHeight.set} placeholder="auto" />
            </Field>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="border">
          <GroupTrigger label="Border &amp; shadow" chips={borderSummary()} max={4} />
          <AccordionContent className="space-y-3">
            <Field label="Style" inherited={borderStyle.inherited} onReset={borderStyle.reset}>
              <SelectControl value={borderStyle.value} onChange={borderStyle.set} options={BORDER_STYLES} placeholder="None" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Width" inherited={borderWidth.inherited} onReset={borderWidth.reset}>
                <NumberControl value={borderWidth.value} onChange={borderWidth.set} unit="px" placeholder="1" />
              </Field>
              <Field label="Radius" inherited={borderRadius.inherited} onReset={borderRadius.reset}>
                <NumberControl value={borderRadius.value} onChange={borderRadius.set} unit="px" placeholder="theme" />
              </Field>
            </div>
            <Field label="Border colour" inherited={borderColor.inherited} onReset={borderColor.reset}>
              <ColorControl value={borderColor.value} onChange={borderColor.set} />
            </Field>
            <Field label="Shadow" inherited={shadow.inherited} onReset={shadow.reset}>
              <SelectControl value={shadow.value} onChange={shadow.set} options={SHADOW_PRESETS} placeholder="None" />
            </Field>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="background">
          <GroupTrigger label="Background image" chips={backgroundSummary()} max={2} />
          <AccordionContent className="space-y-3">
            <Field label="Image" inherited={backgroundImage.inherited} onReset={backgroundImage.reset}>
              <ImageControl value={backgroundImage.value} onChange={backgroundImage.set} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Size" inherited={backgroundSize.inherited} onReset={backgroundSize.reset}>
                <SelectControl value={backgroundSize.value} onChange={backgroundSize.set} options={BACKGROUND_SIZES} placeholder="Cover" />
              </Field>
              <Field label="Position" inherited={backgroundPosition.inherited} onReset={backgroundPosition.reset}>
                <SelectControl value={backgroundPosition.value} onChange={backgroundPosition.set} options={BACKGROUND_POSITIONS} placeholder="Center" />
              </Field>
            </div>
            <Field label="Repeat" inherited={backgroundRepeat.inherited} onReset={backgroundRepeat.reset}>
              <SelectControl value={backgroundRepeat.value} onChange={backgroundRepeat.set} options={BACKGROUND_REPEATS} placeholder="No repeat" />
            </Field>
            <Field
              label="Overlay"
              inherited={overlay.inherited}
              onReset={overlay.reset}
              hint="Any CSS colour or gradient, painted over the background and under the content."
            >
              <TextControl value={overlay.value} onChange={overlay.set} placeholder="rgb(0 0 0 / 0.45)" />
            </Field>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
