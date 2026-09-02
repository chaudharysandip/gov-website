"use client";

/**
 * The inspector's controls.
 *
 * Small, uniform and built on shadcn primitives, because an inspector is read
 * as a column of rows: the moment two controls disagree about label position or
 * height, scanning it costs real effort. Every control here takes `value` and
 * `onChange` and nothing else structural.
 */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowUp, ImageIcon, Link2, RotateCcw } from "lucide-react";
import { cn } from "@edn/site-themes/lib/utils";
import { getFilePath, POST } from "@edn/site-themes/lib/file-path";
import { Button } from "@edn/site-themes/components/ui/button";
import { Placard } from "@/studio/components/bay";
import { useEditorStore } from "@/studio/store/editor-store";
import { selectGlobalTokens } from "@/studio/store/selectors";
import type { ReactNode } from "react";
import { HexColorPicker } from "react-colorful";
import { Input } from "@edn/site-themes/components/ui/input";
import { AccordionTrigger } from "@edn/site-themes/components/ui/accordion";
import { Popover, PopoverContent, PopoverTrigger } from "@edn/site-themes/components/ui/popover";
import { Textarea } from "@edn/site-themes/components/ui/textarea";
import { Label } from "@edn/site-themes/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@edn/site-themes/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@edn/site-themes/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@edn/site-themes/components/ui/tooltip";

/** Where the picker opens when the current value is not a hex it can read. */
const DEFAULT_PICKER_COLOR = "#2563EB";

/**
 * The row under the picker.
 *
 * Tokens rather than fixed colours, because a token keeps following the theme:
 * a section set to `var(--primary)` re-colours itself when the site's primary
 * changes, where a hex copied out of the palette quietly stops matching.
 */
const SWATCHES = [
  "var(--primary)",
  "var(--secondary)",
  "var(--accent)",
  "var(--background)",
  "var(--foreground)",
  "#ffffff",
  "#000000",
];

/**
 * One labelled row.
 *
 * `inherited` is the breakpoint a value is being borrowed from. Showing it is
 * what makes responsive editing legible: without it, a mobile field showing
 * "48px" looks like a mobile override when it is really the desktop value.
 */
/**
 * A labelled control.
 *
 * `inherited` names the breakpoint a value came from when this one has no
 * override of its own, and `onReset` is present only when it has.
 */
interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  inherited?: string | null;
  onReset?: (() => void) | undefined;
  children: ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, hint, inherited, onReset, children, className }: FieldProps) {
  // A value this breakpoint owns is live; one it is borrowing is not. The tick
  // is the whole distinction, in two pixels at the left edge, so a column of
  // twenty fields answers "what have I actually set here" by shape alone.
  const owned = Boolean(onReset);

  return (
    <div className={cn("relative space-y-1.5 pl-2.5", className)}>
      <span
        aria-hidden
        className={cn(
          "absolute top-0.5 bottom-0 left-0 w-[2px] rounded-full transition-colors duration-150",
          owned ? "bg-studio-live" : "bg-studio-line",
        )}
      />

      <div className="flex min-h-5 items-center justify-between gap-2">
        <Label
          htmlFor={htmlFor}
          className={cn("text-[12px] font-normal", owned ? "text-studio-ink" : "text-studio-dim")}
        >
          {label}
        </Label>
        <div className="flex items-center gap-1">
          {inherited ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex cursor-default items-center gap-1 rounded-[2px] border border-studio-line px-1.5 py-0.5">
                  <ArrowUp className="size-2.5 text-studio-faint" aria-hidden />
                  <Placard>{inherited}</Placard>
                </span>
              </TooltipTrigger>
              <TooltipContent>Inherited from {inherited}. Set a value here to override it.</TooltipContent>
            </Tooltip>
          ) : null}
          {onReset ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onReset}
                  className="rounded-[2px] p-0.5 text-studio-faint transition-colors hover:text-studio-live focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                  aria-label={`Clear ${label}`}
                >
                  <RotateCcw className="size-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Clear this override</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </div>
      {children}
      {hint ? <p className="text-[11px] leading-relaxed text-studio-faint">{hint}</p> : null}
    </div>
  );
}

/**
 * Text inputs are uncontrolled between commits.
 *
 * Every keystroke that reaches the store re-renders the canvas, and the canvas
 * is a whole website. Local state keeps typing smooth; the value is pushed on a
 * short idle, on blur, and on Enter.
 */
/**
 * A draft value that reaches the document a beat after the typing stops.
 *
 * Returns `[draft, change, commit]`: `change` is debounced, `commit` is not.
 */
function useDeferredValue(
  value: string | number | null | undefined,
  onChange: (next: any) => void,
  delay = 220,
): [any, (next: any) => void, (next: any) => void] {
  const [draft, setDraft] = useState(value ?? "");
  const [lastValue, setLastValue] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // A value that changes underneath us — undo, an import, a different section
  // selected — has to win over the draft. Adjusted during render rather than in
  // an effect, so the field never paints one frame of the stale draft first.
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value ?? "");
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  const commit = (next: any) => {
    clearTimeout(timer.current);
    onChange(next);
  };

  const change = (next: any) => {
    setDraft(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(next), delay);
  };

  return [draft, change, commit];
}

interface ValueControlProps {
  value?: string | number | null;
  onChange: (next: any) => void;
  id?: string;
  placeholder?: string;
}

export function TextControl({
  value,
  onChange,
  placeholder,
  id,
  ...props
}: ValueControlProps & Record<string, any>) {
  const [draft, change, commit] = useDeferredValue(value, onChange);
  return (
    <Input
      id={id}
      value={draft}
      placeholder={placeholder}
      onChange={(event) => change(event.target.value)}
      onBlur={(event) => commit(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") commit(event.currentTarget.value);
      }}
      className="h-8 text-[12px]"
      {...props}
    />
  );
}

export function TextareaControl({
  value,
  onChange,
  rows = 3,
  placeholder,
  id,
}: ValueControlProps & { rows?: number }) {
  const [draft, change, commit] = useDeferredValue(value, onChange);
  return (
    <Textarea
      id={id}
      value={draft}
      rows={rows}
      placeholder={placeholder}
      onChange={(event) => change(event.target.value)}
      onBlur={(event) => commit(event.target.value)}
      className="min-h-16 resize-y text-[12px]"
    />
  );
}

export function NumberControl({
  value,
  onChange,
  placeholder,
  unit,
  id,
  min,
  max,
  step = 1,
}: ValueControlProps & { unit?: string; min?: number; max?: number; step?: number }) {
  const [draft, change, commit] = useDeferredValue(value === 0 ? "0" : value ?? "", onChange);
  return (
    <div className="relative">
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        value={draft}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        onChange={(event) => change(event.target.value)}
        onBlur={(event) => commit(event.target.value)}
        className="h-8 pr-8 text-[12px]"
      />
      {unit ? (
        <span className="studio-readout pointer-events-none absolute inset-y-0 right-2 flex items-center text-[11px] text-studio-faint">
          {unit}
        </span>
      ) : null}
    </div>
  );
}

export function LinkControl({ value, onChange, id }: ValueControlProps) {
  const [draft, change, commit] = useDeferredValue(value, onChange);
  return (
    <div className="relative">
      <Link2 className="pointer-events-none absolute inset-y-0 left-2 my-auto size-3.5 text-studio-faint" />
      <Input
        id={id}
        value={draft}
        placeholder="/about-us or https://…"
        onChange={(event) => change(event.target.value)}
        onBlur={(event) => commit(event.target.value)}
        className="h-8 pl-7 text-[12px]"
      />
    </div>
  );
}

/**
 * A colour swatch plus the raw value.
 *
 * The native picker cannot represent `transparent`, a CSS variable or an
 * `oklch()`, all of which the themes use — so the text field is authoritative
 * and the swatch is a shortcut, never the only way in.
 */
/**
 * The swatch, the picker and the field are one control.
 *
 * `<input type="color">` hands the job to the operating system: a modal dialog
 * in its own window, over the page rather than beside the thing being coloured,
 * with a different shape on every platform. `react-colorful` is the picker in
 * the page — a popover next to the swatch, dismissable the way every other
 * popover here is.
 *
 * The field beside it stays authoritative. A studio colour is any CSS colour —
 * `rgb()`, `oklch()`, a `var(--token)` a theme already defines — and the
 * picker only speaks hex, so it edits the value when it can and shows a
 * starting point when it cannot, rather than overwriting what was typed.
 */
/**
 * What a swatch should actually paint.
 *
 * A token value is stored as the literal `var(--primary)` and resolves inside
 * the canvas, where `--primary` belongs to the school. In the inspector it
 * would resolve against the *bay's* palette and show the tool's own teal — a
 * swatch reporting a colour that appears nowhere on the page. So a token is
 * painted from the site's own value where one has been set, and where none has,
 * it is drawn as a token rather than faked as a colour.
 */
export interface Paint {
  background?: string;
  token?: string;
}

export function useColorPaint(): (raw: string) => Paint {
  const tokens = useEditorStore(selectGlobalTokens);
  return (raw: string) => {
    const token = /^var\(\s*(--[\w-]+)\s*\)$/.exec(raw ?? "")?.[1];
    if (!token) return { background: raw };
    const set = tokens[token];
    return set ? { background: set } : { token: token.replace(/^--/, "") };
  };
}

/**
 * A group's own row, reporting what it holds while it is shut.
 *
 * The inspector's failure was never the number of controls; it was that seven
 * closed accordions all look identical, so finding the one carrying a value
 * meant opening all seven. A closed group now shows its own swatches and
 * figures, which turns the panel from a search into a read.
 */
export function GroupTrigger({
  label,
  chips = [],
  max = 5,
}: {
  label: string;
  chips?: Array<{ color?: string; text?: string }>;
  max?: number;
}) {
  const paint = useColorPaint();
  const shown = chips.slice(0, max);
  const rest = chips.length - shown.length;

  return (
    <AccordionTrigger className="cursor-pointer py-2.5 hover:no-underline [&>svg]:text-studio-faint">
      <span className="flex min-w-0 flex-1 items-center justify-between gap-2 pr-2">
        <span className="shrink-0 text-[12px] font-medium text-studio-ink">{label}</span>
        {shown.length ? (
          <span className="flex min-w-0 items-center gap-1">
            {shown.map((chip, index) => {
              if (chip.color) {
                const swatch = paint(chip.color);
                return (
                  <span
                    key={index}
                    className="size-3 shrink-0 rounded-[2px] border border-studio-edge"
                    style={{
                      background: swatch.background,
                      backgroundImage: swatch.token
                        ? "repeating-linear-gradient(45deg, var(--studio-line-hi) 0 2px, transparent 2px 4px)"
                        : undefined,
                    }}
                    aria-hidden
                  />
                );
              }
              return (
                <span key={index} className="studio-readout truncate text-[10px] text-studio-faint">
                  {chip.text}
                </span>
              );
            })}
            {rest > 0 ? <Placard>+{rest}</Placard> : null}
          </span>
        ) : null}
      </span>
    </AccordionTrigger>
  );
}

export function ColorControl({ value, onChange, id }: ValueControlProps) {
  const [draft, change, commit] = useDeferredValue(value, onChange);
  const paint = useColorPaint();
  const isHex = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(draft ?? "");

  const current = paint(draft ?? "");

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Pick a colour"
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-[3px] border border-studio-edge shadow-xs focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            style={{
              background: current.background || undefined,
              // A slash rather than an empty box, so "nothing set" cannot be
              // read as "white".
              backgroundImage:
                draft && !current.token
                  ? undefined
                  : "linear-gradient(to top right, transparent calc(50% - 0.5px), var(--studio-ink-faint) calc(50% - 0.5px), var(--studio-ink-faint) calc(50% + 0.5px), transparent calc(50% + 0.5px))",
            }}
          >
            {current.token ? (
              <span className="studio-placard text-studio-dim">
                {current.token.slice(0, 3)}
              </span>
            ) : null}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-2.5">
          {/*
            Dragging fires this on every pointer move. `change` is the debounced
            half of the pair: the swatch and the canvas follow the cursor, and
            the document — and therefore the undo stack — takes one entry when
            the hand stops moving.
          */}
          <HexColorPicker color={isHex ? draft : DEFAULT_PICKER_COLOR} onChange={change} />
          <p className="mt-2.5 mb-1.5">
            <Placard>The theme&rsquo;s own</Placard>
          </p>
          <div className="flex items-center gap-1.5">
            {SWATCHES.map((swatch) => {
              const shown = paint(swatch);
              return (
                <button
                  key={swatch}
                  type="button"
                  onClick={() => commit(swatch)}
                  aria-label={swatch}
                  title={
                    shown.token
                      ? `${swatch} — follows the theme, whatever it is set to`
                      : swatch
                  }
                  className="flex size-6 items-center justify-center overflow-hidden rounded-[3px] border border-studio-edge shadow-xs transition-transform hover:scale-110"
                  style={{ background: shown.background }}
                >
                  {shown.token ? (
                    <span className="studio-placard text-studio-dim">
                      {shown.token.slice(0, 2)}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      <Input
        id={id}
        value={draft ?? ""}
        // Never a hex. A plausible colour sitting in two unrelated fields at
        // once leaves brightness as the only thing saying "not an answer",
        // which is not a difference anyone should have to look for.
        placeholder="Theme default"
        onChange={(event) => change(event.target.value)}
        onBlur={(event) => commit(event.target.value)}
        className="studio-readout h-8 text-[12px]"
      />
    </div>
  );
}

/**
 * Images are referenced by path or URL rather than uploaded: there is no
 * storage in this phase, and the themes already resolve both.
 *
 * Most values here are neither — they are WMS file *names*, and a name is what
 * the payload carries: `1786866406190_21721a79-a504…`. The themes turn one into
 * a URL with `getFilePath`, and so does this, or the preview would ask the
 * editor's own origin for a file that was never there.
 *
 * Which WMS directory a name lives in depends on the field — a photo of a
 * person is under `ws-profile`, a section image under `ws-post-images` — so the
 * preview tries the field's own module, then the one nearly everything uses,
 * then the raw value on the chance it was already a path. Whichever loads
 * first, wins; if none do, the placeholder comes back rather than a broken box.
 */
export function ImageControl({
  value,
  onChange,
  id,
  module = POST,
}: ValueControlProps & { module?: string }) {
  const [draft, change, commit] = useDeferredValue(value, onChange);

  const candidates = useMemo(() => {
    const name = typeof draft === "string" ? draft.trim() : "";
    if (!name) return [] as string[];
    return [...new Set([getFilePath(name, module), getFilePath(name, POST), name])].filter(
      (candidate): candidate is string => Boolean(candidate),
    );
  }, [draft, module]);

  // Which candidate is being shown. A new value starts the list again —
  // adjusted during render, like the draft above, so the box never paints one
  // frame of the previous image's failed attempt.
  const [attempt, setAttempt] = useState(0);
  const [lastDraft, setLastDraft] = useState(draft);
  if (draft !== lastDraft) {
    setLastDraft(draft);
    setAttempt(0);
  }
  const src = candidates[attempt];

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[3px] border border-studio-edge bg-studio-surface">
          {src ? (
            // A plain img: the value can be any path or host, and next/image
            // would refuse or rewrite what the theme will happily render.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={src}
              src={src}
              alt=""
              className="size-full object-cover"
              onError={() => setAttempt((n) => n + 1)}
            />
          ) : (
            <ImageIcon className="size-4 text-studio-faint" />
          )}
        </div>
        <Input
          id={id}
          value={draft ?? ""}
          placeholder="A WMS file name, /about.jpg, or https://…"
          onChange={(event) => change(event.target.value)}
          onBlur={(event) => commit(event.target.value)}
          className="h-8 text-[12px]"
        />
      </div>
    </div>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

export function SelectControl({
  value,
  onChange,
  options,
  placeholder = "Default",
  id,
  allowEmpty = true,
}: ValueControlProps & { options: SelectOption[]; allowEmpty?: boolean }) {
  const EMPTY = "__default__";
  return (
    <Select
      value={value === "" || value === undefined || value === null ? EMPTY : String(value)}
      onValueChange={(next) => onChange(next === EMPTY ? "" : next)}
    >
      <SelectTrigger id={id} size="sm" className="w-full text-[12px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowEmpty ? <SelectItem value={EMPTY}>{placeholder}</SelectItem> : null}
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function SegmentedControl({
  value,
  onChange,
  options,
  ariaLabel,
}: Omit<ValueControlProps, "value"> & {
  // A segmented control is one of a fixed set of strings, never a number.
  value?: string | null;
  options: Array<{ value: string; label: string; icon?: ReactNode }>;
  ariaLabel: string;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={value || ""}
      onValueChange={(next) => onChange(next ?? "")}
      aria-label={ariaLabel}
      className="w-full"
    >
      {options.map((option) => (
        <ToggleGroupItem key={option.value} value={option.value} aria-label={option.label} title={option.label}>
          {option.icon ?? <span className="text-xs">{option.label}</span>}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/**
 * Four sides at once, with a link toggle.
 *
 * Padding is set on all four sides far more often than on one, so the linked
 * state is the default and the expanded state is one click away.
 */
/** The four sides of a box property, linked or set one at a time. */
export function BoxControl({
  label,
  values,
  onChange,
  onChangeAll,
  onReset,
  inherited,
}: {
  label: string;
  values: Record<string, string | number | null | undefined>;
  onChange: (side: string, value: any) => void;
  onChangeAll: (value: any) => void;
  onReset?: (() => void) | undefined;
  inherited?: string | null;
}) {
  const id = useId();
  const [linked, setLinked] = useState(() => {
    const set = new Set(Object.values(values).filter((v) => v !== "" && v !== undefined));
    return set.size <= 1;
  });

  const sides = ["Top", "Right", "Bottom", "Left"];
  const all = values.Top ?? "";

  return (
    <Field
      label={label}
      inherited={inherited}
      onReset={onReset}
      hint={linked ? undefined : "Top, right, bottom, left"}
    >
      <div className="flex items-center gap-2">
        {linked ? (
          <NumberControl id={id} value={all} unit="px" placeholder="auto" onChange={onChangeAll} />
        ) : (
          <div className="grid flex-1 grid-cols-4 gap-1">
            {sides.map((side) => (
              <Input
                key={side}
                type="number"
                aria-label={`${label} ${side.toLowerCase()}`}
                value={values[side] ?? ""}
                placeholder={side[0]}
                onChange={(event) => onChange(side, event.target.value)}
                className="h-8 px-1.5 text-center text-[12px]"
              />
            ))}
          </div>
        )}
        <Button
          type="button"
          variant={linked ? "secondary" : "ghost"}
          size="icon-sm"
          onClick={() => setLinked((state) => !state)}
          aria-pressed={linked}
          title={linked ? "Edit each side" : "Link all sides"}
        >
          <Link2 className="size-3.5" />
        </Button>
      </div>
    </Field>
  );
}
