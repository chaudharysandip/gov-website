"use client";

/**
 * The Site tab: everything that is true of the whole website rather than of one
 * section — identity, contact details, navigation, and the global design
 * tokens.
 *
 * Global colours are written as CSS custom properties on the canvas root. The
 * themes already read `--primary`, `--background` and the rest from the
 * cascade, so changing one here recolours every section that uses that token —
 * with no theme knowing the studio exists, and without generating a single
 * dynamic Tailwind class.
 */

import type { ContentField } from "@/studio/types";
import { Accordion, AccordionContent, AccordionItem } from "@edn/site-themes/components/ui/accordion";
import { Button } from "@edn/site-themes/components/ui/button";
import {
  BUTTON_STYLE_FIELDS,
  TEXT_STYLE_FIELDS,
  FONT_STACKS,
  GLOBAL_COLOR_TOKENS,
  GLOBAL_LAYOUT_TOKENS,
  GLOBAL_TYPOGRAPHY_TOKENS,
} from "@/studio/lib/constants";
import { CONTENT_MODEL } from "@/studio/editor/content-model";
import { useEditorStore } from "@/studio/store/editor-store";
import { selectGlobalElements, selectGlobalTokens } from "@/studio/store/selectors";
import { ListEditor } from "@/studio/components/fields/ListEditor";
import {
  ColorControl,
  Field,
  GroupTrigger,
  ImageControl,
  LinkControl,
  SelectControl,
  TextControl,
  TextareaControl,
} from "@/studio/components/fields/controls";
import { Placard } from "@/studio/components/bay";

function controlFor(
  field: ContentField,
  value: any,
  onChange: (next: any) => void,
  id: string,
) {
  switch (field.kind) {
    case "textarea":
      return <TextareaControl id={id} value={value} rows={field.rows ?? 3} onChange={onChange} />;
    case "image":
      return <ImageControl id={id} value={value} onChange={onChange} module={field.module} />;
    case "link":
      return <LinkControl id={id} value={value} onChange={onChange} />;
    default:
      return <TextControl id={id} value={value} onChange={onChange} />;
  }
}

export function SitePanel() {
  const site = useEditorStore((state) => state.site);
  const content = useEditorStore((state) => state.document?.content);
  const tokens = useEditorStore(selectGlobalTokens);
  const elements = useEditorStore(selectGlobalElements);
  const updateContent = useEditorStore((state) => state.updateContent);
  const updateGlobalStyle = useEditorStore((state) => state.updateGlobalStyle);
  const updateGlobalElement = useEditorStore((state) => state.updateGlobalElement);
  const openGroups = useEditorStore((state) => state.openGroups.site);
  const setOpenGroups = useEditorStore((state) => state.setOpenGroups);

  const layout = content?.layout ?? {};
  const model = CONTENT_MODEL.layout;

  const patchProfile = (name: string, value: unknown) =>
    updateContent("layout", { ...layout, profile: { ...(layout.profile ?? {}), [name]: value } });

  return (
    <div className="space-y-3">
      <div className="rounded-[3px] border border-studio-line bg-studio-deep px-2.5 py-2">
        <p className="truncate text-[13px] font-medium text-studio-ink">{site?.schoolName}</p>
        <p className="mt-0.5 truncate">
          <Placard>{site?.domain}</Placard>
        </p>
      </div>

      <Accordion
        type="multiple"
        value={openGroups}
        onValueChange={(next) => setOpenGroups("site", next)}
        className="w-full"
      >
        {(model.groups ?? []).map((group) => (
          <AccordionItem key={group.label} value={group.label.toLowerCase()}>
            <GroupTrigger label={group.label} />
            <AccordionContent className="space-y-3">
              {group.fields.map((field) => (
                <Field key={field.name} label={field.label} htmlFor={`site-${field.name}`}>
                  {controlFor(
                    field,
                    layout.profile?.[field.name],
                    (next) => patchProfile(field.name, next),
                    `site-${field.name}`,
                  )}
                </Field>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}

        {(model.lists ?? []).map((list) => (
          <AccordionItem key={list.path} value={list.path}>
            <GroupTrigger
              label={list.label}
              chips={
                Array.isArray(layout[list.path])
                  ? [{ text: String((layout[list.path] as unknown[]).length) }]
                  : []
              }
            />
            <AccordionContent>
              <ListEditor
                items={layout[list.path]}
                definition={{ ...list, addLabel: `Add ${list.label.toLowerCase()}` }}
                path={`layout-${list.path}`}
                onChange={(next) => updateContent("layout", { ...layout, [list.path]: next })}
              />
            </AccordionContent>
          </AccordionItem>
        ))}

        <AccordionItem value="colors">
          <GroupTrigger
            label="Palette"
            chips={GLOBAL_COLOR_TOKENS.filter((token) => tokens[token.cssVar]).map((token) => ({
              color: tokens[token.cssVar],
            }))}
          />
          <AccordionContent className="space-y-3">
            <p className="text-[11px] leading-relaxed text-studio-dim">
              The theme&rsquo;s own tokens. Changing one updates every section that uses it.
            </p>
            {GLOBAL_COLOR_TOKENS.map((token) => (
              <Field
                key={token.key}
                label={token.label}
                htmlFor={`token-${token.key}`}
                onReset={tokens[token.cssVar] ? () => updateGlobalStyle(token.cssVar, "") : undefined}
              >
                <ColorControl
                  id={`token-${token.key}`}
                  value={tokens[token.cssVar] ?? ""}
                  onChange={(next) => updateGlobalStyle(token.cssVar, next)}
                />
              </Field>
            ))}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="text">
          <GroupTrigger
            label="Text"
            chips={TEXT_STYLE_FIELDS.filter((field) => elements[field.key]).map((field) => ({
              color: String(elements[field.key]),
            }))}
          />
          <AccordionContent className="space-y-3">
            <p className="text-[11px] leading-relaxed text-studio-dim">
              Set on the text itself, so it lands even where the theme painted its own. A
              section&rsquo;s own colour still wins.
            </p>
            {TEXT_STYLE_FIELDS.map((field) => (
              <Field
                key={field.key}
                label={field.label}
                htmlFor={`global-${field.key}`}
                onReset={elements[field.key] ? () => updateGlobalElement(field.key, "") : undefined}
              >
                <ColorControl
                  id={`global-${field.key}`}
                  value={elements[field.key] ?? ""}
                  onChange={(next) => updateGlobalElement(field.key, next)}
                />
              </Field>
            ))}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="buttons">
          <GroupTrigger
            label="Buttons"
            chips={[
              ...BUTTON_STYLE_FIELDS.filter((field) => elements[field.key]).map((field) => ({
                color: String(elements[field.key]),
              })),
              ...(elements.buttonRadius ? [{ text: String(elements.buttonRadius) }] : []),
            ]}
          />
          <AccordionContent className="space-y-3">
            <p className="text-[11px] leading-relaxed text-studio-dim">
              Every button on the site, gradients included.
            </p>
            {BUTTON_STYLE_FIELDS.map((field) => (
              <Field
                key={field.key}
                label={field.label}
                htmlFor={`global-${field.key}`}
                onReset={elements[field.key] ? () => updateGlobalElement(field.key, "") : undefined}
              >
                <ColorControl
                  id={`global-${field.key}`}
                  value={elements[field.key] ?? ""}
                  onChange={(next) => updateGlobalElement(field.key, next)}
                />
              </Field>
            ))}
            <Field
              label="Corner radius"
              htmlFor="global-buttonRadius"
              onReset={elements.buttonRadius ? () => updateGlobalElement("buttonRadius", "") : undefined}
            >
              <TextControl
                id="global-buttonRadius"
                value={elements.buttonRadius ?? ""}
                onChange={(next) => updateGlobalElement("buttonRadius", next)}
                placeholder="9999px"
              />
            </Field>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="typography">
          <GroupTrigger
            label="Typography"
            max={2}
            chips={GLOBAL_TYPOGRAPHY_TOKENS.filter((token) => tokens[token.cssVar]).map((token) => ({
              text: (
                FONT_STACKS.find((entry) => entry.value === tokens[token.cssVar])?.label ?? "set"
              ).replace(/s*(.*)$/, ""),
            }))}
          />
          <AccordionContent className="space-y-3">
            {GLOBAL_TYPOGRAPHY_TOKENS.map((token) => (
              <Field
                key={token.key}
                label={token.label}
                onReset={tokens[token.cssVar] ? () => updateGlobalStyle(token.cssVar, "") : undefined}
              >
                <SelectControl
                  value={tokens[token.cssVar] ?? ""}
                  onChange={(next) => updateGlobalStyle(token.cssVar, next)}
                  options={FONT_STACKS}
                  placeholder="Theme font"
                />
              </Field>
            ))}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="layout">
          <GroupTrigger
            label="Layout"
            max={3}
            chips={GLOBAL_LAYOUT_TOKENS.filter((token) => tokens[token.cssVar]).map((token) => ({
              text: String(tokens[token.cssVar]),
            }))}
          />
          <AccordionContent className="space-y-3">
            {GLOBAL_LAYOUT_TOKENS.map((token) => (
              <Field
                key={token.key}
                label={token.label}
                hint={token.key === "radius" ? "Applies to every rounded corner in the theme." : undefined}
                onReset={tokens[token.cssVar] ? () => updateGlobalStyle(token.cssVar, "") : undefined}
              >
                <TextControl
                  value={tokens[token.cssVar] ?? ""}
                  onChange={(next) => updateGlobalStyle(token.cssVar, next)}
                  placeholder={token.unit === "rem" ? "0.625rem" : "1280px"}
                />
              </Field>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button
        variant="outline"
        size="sm"
        className="h-8 w-full rounded-[3px] text-[12px]"
        onClick={() => {
          for (const token of [...GLOBAL_COLOR_TOKENS, ...GLOBAL_TYPOGRAPHY_TOKENS, ...GLOBAL_LAYOUT_TOKENS]) {
            updateGlobalStyle(token.cssVar, "");
          }
        }}
      >
        Reset global styles
      </Button>
    </div>
  );
}
