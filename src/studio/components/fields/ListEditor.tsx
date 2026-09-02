"use client";

/**
 * The editor for a list of content items — slides, programmes, notices, staff.
 *
 * Most of the editable content in these themes is a list, so this carries a
 * fair share of the studio's usefulness. It stays deliberately plain: one
 * collapsible row per item, arrows to reorder, and a nested list where an item
 * contains one (album images, submenu entries).
 *
 * Reordering uses buttons rather than drag. Dragging inside a panel that is
 * itself inside a drag-and-drop canvas is a reliable way to fight the canvas
 * for the pointer, and two buttons are faster for a list of six.
 */

import type { ContentField, ContentList } from "@/studio/types";
import { useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { cn } from "@edn/site-themes/lib/utils";
import { Button } from "@edn/site-themes/components/ui/button";
import { Separator } from "@edn/site-themes/components/ui/separator";
import { Field, ColorControl, ImageControl, LinkControl, NumberControl, TextControl, TextareaControl } from "./controls";

/** Sets one field on one item, by index. */
type ItemPatch = (index: number, name: string, value: unknown) => void;

/** Sets one field on the item a row is showing. */
type FieldPatch = (name: string, value: unknown) => void;

function controlFor(
  field: ContentField,
  value: any,
  onChange: (next: any) => void,
  id: string,
) {
  switch (field.kind) {
    case "textarea":
      return <TextareaControl id={id} value={value} rows={field.rows ?? 3} onChange={onChange} placeholder={field.placeholder} />;
    case "image":
      return <ImageControl id={id} value={value} onChange={onChange} module={field.module} />;
    case "link":
      return <LinkControl id={id} value={value} onChange={onChange} />;
    case "color":
      return <ColorControl id={id} value={value} onChange={onChange} />;
    case "number":
      return <NumberControl id={id} value={value} onChange={onChange} unit={field.unit} />;
    default:
      return <TextControl id={id} value={value} onChange={onChange} placeholder={field.placeholder} />;
  }
}

/** A single field inside an item, including a nested list. */
function ItemField({
  field,
  item,
  path,
  onPatch,
}: {
  field: ContentField;
  item: any;
  path: string;
  onPatch: FieldPatch;
}) {
  const id = `${path}-${field.name}`;
  const value = item?.[field.name];

  if (field.kind === "list") {
    return (
      <div className="space-y-2 rounded-md border border-dashed p-2">
        <ListEditor
          label={field.label}
          items={Array.isArray(value) ? value : []}
          definition={field}
          path={id}
          onChange={(next) => onPatch(field.name, next)}
          dense
        />
      </div>
    );
  }

  return (
    <Field label={field.label} htmlFor={id}>
      {controlFor(field, value, (next) => onPatch(field.name, next), id)}
    </Field>
  );
}

function ListItem({
  item,
  index,
  total,
  definition,
  path,
  onPatch,
  onMove,
  onRemove,
  defaultOpen,
  dense,
}: {
  item: any;
  index: number;
  total: number;
  definition: ContentList | ContentField;
  path: string;
  onPatch: ItemPatch;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  defaultOpen?: boolean;
  dense?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const label = definition.itemLabel?.(item) ?? `Item ${index + 1}`;

  return (
    <li className="rounded-md border bg-card">
      <div className="flex items-center gap-1 px-1.5 py-1">
        <GripVertical className="size-3.5 shrink-0 text-muted-foreground/60" aria-hidden />
        <button
          type="button"
          onClick={() => setOpen((state) => !state)}
          aria-expanded={open}
          className="min-w-0 flex-1 truncate rounded px-1 py-1 text-left text-xs font-medium focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {label}
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onMove(index, index - 1)}
          disabled={index === 0}
          aria-label={`Move ${label} up`}
        >
          <ChevronUp className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onMove(index, index + 1)}
          disabled={index === total - 1}
          aria-label={`Move ${label} down`}
        >
          <ChevronDown className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onRemove(index)}
          aria-label={`Remove ${label}`}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {open ? (
        <div className={cn("space-y-3 border-t px-2.5 py-3", dense && "space-y-2 py-2")}>
          {(definition.fields ?? []).map((field) => (
            <ItemField
              key={field.name}
              field={field}
              item={item}
              path={`${path}-${index}`}
              onPatch={(name, value) => onPatch(index, name, value)}
            />
          ))}
        </div>
      ) : null}
    </li>
  );
}

export function ListEditor({
  label,
  items,
  definition,
  path,
  onChange,
  dense = false,
}: {
  label?: string;
  items: any;
  definition: ContentList | ContentField;
  path: string;
  onChange: (next: any[]) => void;
  dense?: boolean;
}) {
  const list = Array.isArray(items) ? items : [];

  const patch: ItemPatch = (index, name, value) => {
    const next = list.map((item, i) => (i === index ? { ...item, [name]: value } : item));
    onChange(next);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= list.length) return;
    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const remove = (index: number) => onChange(list.filter((_, i) => i !== index));

  const add = () => {
    const template = definition.template ?? {};
    // `id` keeps React keys and the theme's own `key={item.id}` stable for the
    // new row; the rest of the shape comes from the slice's template.
    onChange([...list, { ...structuredClone(template), id: Date.now() }]);
  };

  return (
    <div className="space-y-2">
      {label ? (
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
          <span className="text-[11px] tabular-nums text-muted-foreground/70">{list.length}</span>
        </div>
      ) : null}

      {list.length ? (
        <ul className="space-y-1.5">
          {list.map((item, index) => (
            <ListItem
              key={item?.id ?? index}
              item={item}
              index={index}
              total={list.length}
              definition={definition}
              path={path}
              onPatch={patch}
              onMove={move}
              onRemove={remove}
              defaultOpen={list.length === 1 && !dense}
              dense={dense}
            />
          ))}
        </ul>
      ) : (
        <p className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
          Nothing here yet.
        </p>
      )}

      {definition.template ? (
        <Button type="button" variant="outline" size="sm" onClick={add} className="w-full">
          <Plus className="size-3.5" />
          {definition.addLabel ?? "Add item"}
        </Button>
      ) : null}
    </div>
  );
}

/** An object slice — a fixed set of fields rather than a list. */
export function ObjectEditor({
  value,
  definition,
  path,
  onChange,
}: {
  value: any;
  definition: { fields?: ContentField[] };
  path: string;
  onChange: (next: any) => void;
}) {
  const object = value ?? {};
  return (
    <div className="space-y-3">
      {(definition.fields ?? []).map((field, index) => (
        <div key={field.name} className="space-y-3">
          {index > 0 && field.kind === "list" ? <Separator /> : null}
          <ItemField
            field={field}
            item={object}
            path={path}
            onPatch={(name, next) => onChange({ ...object, [name]: next })}
          />
        </div>
      ))}
    </div>
  );
}
