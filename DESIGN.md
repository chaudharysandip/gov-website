---
name: EDN Website Studio — Editor
description: A colour-grading bay for the studio editor — a lit canvas on a calibrated neutral wall, matte console rails, and one law for colour.
colors:
  studio-ink: "#22231E"
  studio-ink-dim: "#5A5B53"
  studio-ink-faint: "#66675F"
  studio-panel-deep: "#FFFFFF"
  studio-panel: "#F5F5F1"
  studio-surface: "#EAEAE4"
  studio-surface-hi: "#E3E3DC"
  studio-line: "#DCDCD4"
  studio-line-hi: "#C6C6BC"
  studio-field: "#B4B3AD"
  studio-field-edge: "#A7A6A0"
  studio-ref-black: "#000000"
  studio-live: "#0B7A66"
  studio-live-ink: "#FFFFFF"
  studio-caution: "#8F5D0A"
  studio-stop: "#C0322B"
typography:
  heading:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "normal"
  title:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "normal"
  body:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  control:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "normal"
  label:
    fontFamily: "Geist Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  placard:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.11em"
    fontFeature: "tnum 1"
  readout:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "normal"
    fontFeature: "tnum 1"
rounded:
  mark: "1px"
  tight: "2px"
  key: "3px"
  plate: "5px"
  pill: "9999px"
spacing:
  hair: "2px"
  tight: "4px"
  snug: "6px"
  control: "8px"
  panel: "12px"
  group: "14px"
  wall: "48px"
  wall-wide: "64px"
components:
  rail-title-block:
    backgroundColor: "{colors.studio-panel-deep}"
    textColor: "{colors.studio-ink}"
    height: "48px"
    padding: "0 8px 0 6px"
  panel-nodes:
    backgroundColor: "{colors.studio-panel}"
    textColor: "{colors.studio-ink-dim}"
    width: "232px"
  panel-nodes-rail:
    backgroundColor: "{colors.studio-panel}"
    width: "52px"
    padding: "8px 0"
  panel-inspector:
    backgroundColor: "{colors.studio-panel}"
    textColor: "{colors.studio-ink}"
    width: "304px"
  panel-inspector-rail:
    backgroundColor: "{colors.studio-panel}"
    width: "40px"
  button-primary:
    backgroundColor: "{colors.studio-live}"
    textColor: "{colors.studio-live-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.key}"
    height: "28px"
    padding: "0 12px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.studio-ink-dim}"
    typography: "{typography.control}"
    rounded: "{rounded.key}"
    height: "28px"
    padding: "0 10px"
  button-ghost-hover:
    backgroundColor: "{colors.studio-surface}"
    textColor: "{colors.studio-ink}"
  console-plate:
    backgroundColor: "{colors.studio-panel-deep}"
    textColor: "{colors.studio-ink-dim}"
    rounded: "{rounded.plate}"
    padding: "4px 6px"
  console-key:
    backgroundColor: "transparent"
    textColor: "{colors.studio-ink-dim}"
    typography: "{typography.label}"
    rounded: "{rounded.key}"
    height: "28px"
  console-key-on:
    backgroundColor: "{colors.studio-panel-deep}"
    textColor: "{colors.studio-live}"
  input-field:
    backgroundColor: "transparent"
    textColor: "{colors.studio-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.key}"
    height: "32px"
    padding: "0 12px"
  node-row:
    backgroundColor: "transparent"
    textColor: "{colors.studio-ink-dim}"
    typography: "{typography.title}"
    rounded: "{rounded.key}"
    padding: "6px 4px 6px 6px"
  node-row-selected:
    backgroundColor: "{colors.studio-surface-hi}"
    textColor: "{colors.studio-ink}"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.studio-ink-faint}"
    typography: "{typography.control}"
    height: "32px"
  tab-active:
    backgroundColor: "transparent"
    textColor: "{colors.studio-ink}"
  placard:
    backgroundColor: "transparent"
    textColor: "{colors.studio-ink-faint}"
    typography: "{typography.placard}"
  readout:
    backgroundColor: "transparent"
    textColor: "{colors.studio-ink}"
    typography: "{typography.readout}"
---

<!-- SCOPE: this file governs /studio/editor/* only. -->

# Design System: EDN Website Studio — Editor

## Overview

**Scope — read this first.** This document describes **the studio editor's own
chrome and nothing else**: the world that lives under the `.studio-bay` class on
`/studio/editor/*`. It does **not** govern the nineteen tenant themes in
`src/Theme/`, the theme gallery at `/studio`, or the preview route
`/studio/preview/*`. Those deliberately keep the app's own light palette defined
on `:root` in `src/app/globals.css`, and nothing here may be pushed into them.
The canvas inside the editor is a *separate document* — Puck renders it in an
iframe — and it must look exactly like the school's live site, never like the
tool. If you are styling a theme, a marketing page, or the gallery, close this
file.

**Creative North Star: "The Grading Bay"**

The editor is a colour-grading suite, not a page builder. The canvas is the
reference monitor; the operator is grading it. Everything else in the room is
apparatus: warm off-white console rails at the edges, the canvas
mounted centre on a calibrated neutral wall, and the canvas's own controls on a
plate floating at its foot. The category's two defaults — the light three-pane
builder and its near-black twin — are both refused, and for the same reason:
they are the surround a school's palette is judged against, and both of them lie
about it.

Density is high and deliberate. The operator is an expert in the tool daily,
across several school sites in a sitting, under a delivery deadline; rows are
28–32px, the type ramp tops out at 15px, and every fact worth acting on is
reported at rest rather than on hover. The information colour is white. Teal is
what is live and actionable, amber is caution, red is stop, and nothing else in
the room is coloured — a discipline that only works because the loudest colours
on screen at any moment belong to the *school being edited*, on the canvas.

The one value here that is not a matter of taste is the wall: `#B4B3AD`, near
the 18% neutral a grading room is painted to. It exists so that a school's
near-white hero can be judged as near-white. Every other decision below serves
that judgement or gets out of its way.

**Key Characteristics:**

- A calibrated mid-grey wall (`#B4B3AD`) carrying a shadow-mounted canvas
- Matte warm near-black console rails; a warm-neutral nine-step ink/ground ramp
- Three signal colours only — teal live, amber caution, red stop — plus white
- Mono tabular readouts and engraved 10px placards for everything measured
- Milled corners (1 / 2 / 3 / 5px) and hairline grooves; nothing soft or bubbly
- Lamps are the only thing that glows; one authored moment of motion, no more

## Colors

A warm-desaturated neutral ramp carrying three signal hues, applied as a law
rather than a palette.

### Primary

- **Live Teal** (`#0B7A66`): the tool's own colour, and the only accent that
  appears at rest. It marks exactly three kinds of thing: what is *selected*
  (the 2px tick on the live node row, the canvas selection outline, the active
  breakpoint's inset hairline), what is *overridden here* (a lit override mark,
  a field's owned tick, the count on a breakpoint node), and the *primary
  action* (Save, the caret, the focus ring, the drop indicator). It is defined
  on `:root` rather than inside `.studio-bay` on purpose — Puck copies the
  selection CSS into the canvas iframe, where `--primary` belongs to the school,
  and a selection outline that changed hue as you graded the palette would be
  reporting the wrong thing.
- **Live Ink** (`#FFFFFF`): the white that sits *on* teal. The only text
  colour ever placed on a teal fill.

### Secondary

- **Caution Amber** (`#8F5D0A`): work the browser has not stored yet, sample
  content standing in for real WMS content, and a section switched off the page.
  Caution is "look at this before you hand the site over", never "something
  broke".
- **Stop Red** (`#C0322B`): destructive intent only — the bin on hover, the
  destructive menu item. Nothing in the bay is red at rest.

### Neutral

- **Bay Ink** (`#22231E`): the information colour. Every fact — a school name, a
  section label once selected, a set value, a readout figure — is white.
- **Dim Ink** (`#5A5B53`): the resting state of anything interactive and of any
  label whose value lives beside it. A ghost button at rest is dim; on approach
  it goes to full ink.
- **Faint Ink** (`#66675F`): placards, unset placeholders, and secondary counts.
  This value was lifted from `#8E8E87` specifically to clear 4.5:1 on
  `--studio-surface` (it now measures ≈5.1:1); do not darken it back.
- **Panel Deep** (`#FFFFFF`): the console rails, the header, detached plates,
  popovers, and inset wells inside a panel.
- **Panel** (`#F5F5F1`): the standing surface of the node column and the
  inspector.
- **Surface** (`#EAEAE4`): a hovered row, a card, a segmented control's track.
- **Surface High** (`#E3E3DC`): a selected row. The only ground that says "this
  one", together with its teal tick.
- **Line** (`#DCDCD4`) / **Line High** (`#C6C6BC`): hairline separation. `Line`
  divides regions; `Line High` draws control edges, unlit override marks, unlit
  lamp housings, grooves, and the scrollbar thumb.

### Tertiary

- **Reference White** (`#FFFFFF`) and **Reference Black** (`#000000`): the two
  chips in the reference patch, and the only literals in the system. They are
  deliberately outside the ramp — a reference value that had been adjusted to
  taste would not be a reference. Nothing else may use them.

- **The Wall** (`#B4B3AD`) and **Wall Edge** (`#A7A6A0`): the field the canvas
  hangs on, painted as a radial vignette from the wall value at
  `120% 90% at 50% 38%` down to the edge value at the corners. The vignette is
  what makes it a bay rather than a grey box; the flat value is what makes it a
  reference.

### Named Rules

**The Four Colour Law.** White carries the information; teal is what is live and
actionable; amber is caution; red is stop. There is no fifth colour in the bay.
A component that wants one has to come through `src/studio/components/bay.tsx`
to get it — which is the point. *Audit test: screenshot the chrome with the
canvas masked out. If you can find a hue that is not teal, amber or red, it is a
defect.*

**The Calibrated Wall Rule.** `#B4B3AD` is not a background choice and is not
available for restyling, tinting, theming or "brand alignment". It is the
reference the operator judges a school's palette against. The `ReferencePatch`
(paper white / the wall / ink black) sits on the wall's own flat value beside the
canvas for the same reason — a reference chip judged against the vignette's
darkest corner is the exact error the surround exists to refuse.

**The Tool's Colour Rule.** Any chrome drawn over, inside or against the canvas
reads `--studio-live` explicitly. Never `--primary`, never `--accent`, never a
value sampled from the site. Inside the canvas iframe those tokens belong to the
school being edited.

**The Token Remap Rule.** `.studio-bay` expresses the world by remapping the
app's own shadcn tokens (`--background`, `--card`, `--primary`, `--border`, …)
onto the studio ramp, rather than by restyling forty primitives. New chrome
should reach for a `studio-*` utility first; falling back to a generic token is
acceptable only because the remap makes it resolve correctly, and it costs
legibility at the call site.

## Typography

**Body Font:** Geist Sans (with `ui-sans-serif, system-ui, sans-serif`)
**Label/Mono Font:** Geist Mono (with `ui-monospace, monospace`)

Both are already loaded by the app; the bay adds no font. There is no display
face and there is no fluid sizing — the ramp is a fixed set of pixel steps,
because a console's legends do not grow with the window.

**Character:** One neutral grotesque doing all the talking, with a monospace
reserved entirely for measurement. The pairing is instrument-panel plain: the
sans is invisible so the school's own type on the canvas is the only voice with
personality in the room, and the mono is the sound of a number.

### Hierarchy

- **Heading** (500, 15px, 1.3): one use only — the wider-window plate below
  900px. There is nothing else in the editor big enough to be a heading.
- **Title** (500, 13px, 1.2): the school name in the title block, the inspector's
  subject line, and a node row's label. The largest thing in the working layout.
- **Body** (400, 13px, 1.6): explanatory prose in plates and empty states, capped
  around 38–42ch.
- **Control** (500, 12px, 1.2): every button, tab, field label and menu row. The
  working size of the whole interface.
- **Label** (400, 11px, 1.5): hints under a field, secondary lines, and the key
  labels on the console plate.
- **Placard** (Geist Mono, 400, 10px, `0.11em`, uppercase, tabular): engraved
  legends — `SECTIONS`, `EDITING`, `REF`, `PX FIT`, `BASE`, an inherited-from
  badge, a domain. Set via the `.studio-placard` class or the `Placard`
  component, never by hand.
- **Readout** (Geist Mono, 400, 11–12px, tabular): every measured figure — canvas
  width, zoom percentage, section count, override count, a hex value, a stored
  style value. Set via `.studio-readout` or the `Readout` component.

### Named Rules

**The Measurement Is Mono Rule.** If the operator reads it as a number or a
machine value — a width, a zoom, a count, a hex, a stored style — it is Geist
Mono with `tabular-nums`. Everything else is Geist Sans. Mono is never
decoration, and prose is never mono. *Audit test: a figure that reflows its
neighbours as its digits change is a bug, not a style.*

**The Placard Names, The Readout Measures Rule.** A placard is a legend: it names
the thing beside it and never carries the fact itself. `1256` is a readout;
`PX FIT` is the placard next to it. Never put a value in 10px uppercase.

**The Fixed Ramp Rule.** 10 / 11 / 12 / 13 / 15px, and nothing between or above.
No `clamp()`, no `vw` units, no `text-base`. A control that needs to be more
prominent gets ink weight or a lamp, not a bigger size.

## Layout

Four regions, all fixed-width except the one that matters. Across the top, a
48px title-block rail carrying the school, the template picker, the transport
and the save lamp. Left, the node column at 232px — the page's outline, with a
wireframe thumbnail and three override marks per row. Centre, the wall, which
takes all remaining width. Right, the inspector at 304px with four underline
tabs.

The canvas hangs on the wall inside a generous inset — 48px sides and top, 80px
at the foot; 64 / 56 / 96px from 1536px up. The inset is the wall itself, not a
margin: a fluid canvas run to the pane's own edge leaves the surround as a
hairline, and a hairline is not something a colour can be judged against. The
canvas's console strip floats in the reserved bottom inset, so it never covers
the page, with the reference patch on the same line at the far left from 1280px.

Desktop is **fluid**: the canvas is the width of the pane (scaled by zoom), so
tablet (768px) and mobile (375px) are exact device widths while desktop is
whatever the room allows. This is product truth, not an oversight — the width
readout carries a `FIT` placard and `useRenderedWidth` is the single computation
every width readout in the app reads, so no two places can disagree. A
consequence to expect and not "fix": at a 1366px window the canvas measures
about 914px, which means the theme renders its *compact* header while the scope
still says Desktop. The `FIT` label is what makes that honest.

Spacing rhythm is 2 / 4 / 6 / 8 / 12 / 14px inside the chrome, and 48 / 64px for
the wall. Panel padding is 12px horizontal and 14px vertical; groups inside a
panel are separated by 12–14px, controls within a group by 12px, and a label
from its control by 6px.

Responsive behaviour is three plates, not a reflow:

- **≥1536px** — everything above.
- **<1536px** — the node column collapses to its 52px thumbnail rail *whatever
  the store says*, because the column plus the inspector would leave the canvas
  under 800px, which is not a desktop preview of anything. The rail keeps the
  same wireframes, so every row is still reachable and identifiable.
- **<1280px** — the device switcher drops its word labels to icons, and the
  reference patch is withdrawn.
- **<900px** — the editor shows a deliberate wider-window plate with a route to
  the preview instead. It is a media query over the live layout, so the layout
  underneath keeps its state and returns intact when the window does.

### Named Rules

**The Wall Has Walls Rule.** The canvas viewport always reserves its inset —
48px, 64px from 1536px up — even though the canvas is fluid. Giving the room
back its walls costs about a hundred pixels of a twelve-hundred-pixel canvas and
is the whole reason the surround works.

**The Controls Ride The Thing Rule.** A control lives on the surface it acts on.
The canvas's width, zoom, motion and full-screen controls are on a plate at the
canvas's foot, not in the top rail three groups away. The rail says only what
only it can say: which site this is, and whether the work is safe.

**The Rail, Never A Blank Edge Rule.** A collapsed pane leaves a working rail —
52px of wireframes and a count on the left, 40px with a labelled re-open control
on the right — never an empty gutter whose one button exists to undo the
collapse. And the widen control appears only when the collapse was the operator's
own choice: when the window narrowed it, an offer to widen would do nothing.

**The Honest Plate Rule.** Below the width the layout actually needs, say so and
offer the route that works. Do not squeeze the canvas out to keep three panes on
screen.

## Elevation & Depth

The bay is mostly flat, and depth is carried by the tonal ramp: deep for rails
and wells, panel for standing surfaces, surface for hover, surface-high for
selection. Only two things in the room genuinely sit in front of something else,
and both are lit accordingly — the canvas, which is mounted on the wall, and a
console plate, which has come off the console to meet the canvas. Everything
else separates with a hairline.

### Shadow Vocabulary

- **Canvas mount** (`box-shadow: 0 0 0 1px color-mix(in oklab,#000 34%,transparent), inset 0 1px 0 0 color-mix(in oklab,#fff 22%,transparent), 0 22px 48px -18px color-mix(in oklab,#000 72%,transparent), 0 4px 12px -6px color-mix(in oklab,#000 45%,transparent)`): the `.studio-mount` class, used on the canvas and the motion-preview frame only. A hairline of the room's light along the top edge and a real offset cast below — a panel hanging on a wall, not a card.
- **Console plate** (`box-shadow: 0 1px 0 0 color-mix(in oklab,#fff 8%,transparent) inset, 0 14px 30px -12px rgb(0 0 0/0.8)`): the scope strip and any detached cluster, with `backdrop-blur-sm` behind it.
- **Selection bar** (`box-shadow: 0 0 0 1px color-mix(in oklab,var(--studio-live) 42%,transparent), 0 10px 24px -10px rgb(0 0 0/0.75)`): Puck's action bar over the selected section.
- **Lamp glow** (`box-shadow: 0 0 0 1px color-mix(in oklab,<signal> 55%,transparent), 0 0 7px 0 color-mix(in oklab,<signal> 60%,transparent)`): the only glow in the system.
- **Lamp housing, unlit** (`box-shadow: inset 0 0 0 1px var(--studio-line-hi)`): an off lamp keeps its ring, so absence of light is itself readable.
- **Live key inset** (`box-shadow: inset 0 0 0 1px color-mix(in oklab,var(--studio-live) 35%,transparent)`, 35–45% by context): how an engaged toggle, an active breakpoint node and a selected thumbnail report themselves without filling with teal.
- **Bevel** (`box-shadow: inset 0 1px 0 0 color-mix(in oklab,#fff 22%,transparent)`): a single top highlight on the Save button — the one moulded key on the panel.
- **Groove** (`box-shadow: 1px 0 0 0 color-mix(in oklab,#fff 6%,transparent)` on a 1px `--studio-line-hi` bar): a milled channel between two groups of controls on one plate.
- **Drop indicator** (`box-shadow: 0 0 8px 0 color-mix(in oklab,var(--studio-live) 70%,transparent)`): the 2px teal line showing where a dragged section will land.

### Named Rules

**The Lamps Alone Glow Rule.** Glow is reserved for `Lamp`, the drop indicator,
and the selection bar. No button, badge, panel, input or row ever has a coloured
halo. A component that wants attention gets a lamp beside it.

**The Mount, Not The Card Rule.** Only things that are genuinely in front of the
wall cast a shadow — the canvas and a detached console plate. Panels, rows,
fields, menus and chips separate with a 1px `--studio-line` hairline and a tonal
step, never with elevation.

## Shapes

Corners are milled, not moulded. `--radius` inside the bay is `0.3125rem` (5px),
which puts the shadcn scale at 1 / 3 / 5px, and everything hand-set matches it:
1px on override marks and wireframe bars, 2px on small icon buttons, thumbnails,
chips and badges, 3px on the working key size (buttons, inputs, cards, tabs,
node rows), 5px on plates. Fully round is reserved for things that are physically
round or linear: lamps, the 2px live ticks, the drop indicator, and the scrollbar
thumb.

Borders are hairlines at `--studio-line` (region division) or `--studio-line-hi`
(control edges). A dashed hairline means "not part of the page proper" — the
chrome rows bracketing the section list, empty-state plates, and the
off-the-page group. The recurring silhouette is the plate: a 3–5px rectangle of
`panel-deep` with a hairline edge, holding a row of small controls separated by
grooves.

### Named Rules

**The Milled Corner Rule.** 1, 2, 3 or 5px. Nothing in the chrome is softer than
5px except a lamp, a tick or a scrollbar, which are pills. No `rounded-lg` from
the app scale, no capsule buttons — the bay's own `--radius` already re-scales
those utilities, so reaching for a bigger one is always a mistake.

**The Hairline Rule.** Separation is a 1px line or a tonal step. Not a gap, not a
shadow, not a second background.

## Components

### Buttons

- **Shape:** milled 3px (`{rounded.key}`); icon-only variants at 2–3px.
- **Primary (Save):** teal fill, `#FFFFFF` ink, 28px tall, 12px horizontal, 12px
  medium, with the single inset top bevel. There is exactly one primary button
  on screen at a time.
- **Ghost (the default):** transparent at rest with dim ink; on hover the ground
  goes to `--studio-surface` and the ink to full white. 28px in rails and on
  plates, 32px in panels. Never a box of its own at rest.
- **Focus:** a 3px `ring/50` ring — `--ring` is teal in the bay — with
  `outline: none`. Every interactive element carries it, including the bare
  `<button>`s that are not shadcn buttons.
- **Destructive:** ghost at rest, `--studio-stop` ink on hover. Never a red fill.
- **Icon-only buttons always carry both a tooltip and an `aria-label`**, and any
  control that leaves the editor is a real `<Link>` so middle-click works.

### Console Plate & Keys

The signature holder. `panel-deep` at 95% with a backdrop blur, a
`--studio-line-hi` hairline, 5px corners, 4px/6px padding, the plate shadow, and
its contents divided by `Groove` bars rather than gaps. A key on a plate is 28px,
dim at rest, `--studio-surface-hi` on hover; the *engaged* key takes a
`panel-deep` ground, teal ink and the live inset hairline — it is never filled
with teal.

### Placard, Readout & Lamp

The three reporting primitives, all from `bay.tsx`. A **Placard** names (10px
mono, uppercase, `0.11em`, faint ink). A **Readout** measures (mono, tabular,
11–12px, full ink for the live figure, faint for a secondary count). A **Lamp**
is a 5–6px disc in one of four states — `live`, `caution`, `stop`, `off` —
carrying the only glow in the system, and keeping its housing ring when off.

### Cards / Containers

- **Corner Style:** 3px, 5px on plates.
- **Background:** `--studio-panel` for a standing panel, `--studio-panel-deep`
  for an inset well inside one (the site identity block, a breakpoint node, the
  breakpoint chain's tray).
- **Shadow Strategy:** none. See The Mount, Not The Card Rule.
- **Border:** 1px `--studio-line`; dashed for empty states and for anything not
  part of the page proper.
- **Internal Padding:** 10–12px horizontal, 8–10px vertical.

### Inputs / Fields

- **Style:** transparent ground, `--studio-line-hi` hairline, 3px corners, 32px
  tall. A colour field and a stored style value are set in the mono readout
  face; everything else is sans.
- **Focus:** the 3px teal ring; the caret is teal, and selection is teal at 32%.
- **Placeholder:** `--studio-ink-faint`, `opacity: 1`. Placeholders sit two ink
  steps below a set value so an unset field can never be misread as a set one —
  and a colour placeholder is the word `Theme default`, never a plausible hex.
- **Owned vs inherited:** every `Field` carries a 2px vertical bar at its left
  edge — teal when this breakpoint owns the value, `--studio-line` when it is
  borrowed — plus a small `↑ DESKTOP` placard badge naming where the value came
  from, and a reset control that exists only when there is an override to clear.
- **Unset colour swatch:** a diagonal slash, so "nothing set" cannot read as
  "white". A swatch holding a `var(--token)` with no site value is drawn as a
  hatched chip with the token's first letters, never faked as a colour — in the
  inspector that token would otherwise resolve against the *bay's* palette and
  show the tool's own teal.

### Navigation (inspector tabs)

Four full-width triggers, 32px tall, 12px medium, faint at rest, dim on hover,
full ink when active, with a 2px teal rule underneath drawn over the panel's own
border so the two read as one line. It scales in from the centre over 150ms.
Underlines, never a filled segmented control — a pill row reads as four buttons
of equal weight competing with the panel below; an underline reads as a place
you are.

### Node Row (signature)

The list row that makes the page's state readable without opening anything: a 2px
teal tick at the left edge when live, a 40×24 wireframe thumbnail of the
section's *shape* (hero, split, cards, grid, list, stats, logos, people, quote,
banner, top/bottom bar) that becomes the drag grip on hover, the label at 13px,
and three `OverrideMarks` — desktop, tablet, mobile — lit teal where that
breakpoint holds something of its own. Selected rows take `--studio-surface-hi`
and full ink; hidden rows take a strikethrough and an amber eye. The bin and the
visibility toggle fade in on hover but hold their space, so the marks column
never goes ragged.

### Breakpoint Chain (signature)

The responsive model, drawn rather than described: three nodes in a `panel-deep`
tray with chevrons between them pointing the way inheritance actually flows, the
active node carrying the live inset hairline and teal ink, and a mono count under
each node — teal where that breakpoint holds its own values, an em dash in
`--studio-line-hi` where it inherits. Clicking a node moves the canvas to it, so
the thing that explains the model is also the thing that drives it.

### Group Trigger (signature)

An accordion header that reports its own contents while shut: up to five 12px
swatch chips and mono figure summaries (`72px`, `r8`, `Inter · 18px · 600`),
with `+N` for the remainder. Seven identical closed accordions can only be
searched; a group that reports turns the panel into a read.

### Named Rules

**The Two-Pixel Tick Rule.** State that matters is a 2px teal bar at the left
edge of the thing it describes — the live node in the column, the owned value in
a field. Same width, same colour, same position, everywhere.

**The Unlit Housing Rule.** An "off" state keeps its geometry. An unlit lamp
keeps its ring; an un-overridden breakpoint keeps its mark in
`--studio-line-hi`; a chrome row with no bin still reserves the bin's width.
Returning nothing when nothing is set makes "no overrides here" and "this row has
no marks" identical, and the column stops being readable as a graph.

**The Closed Group Reports Rule.** Any collapsible group that can hold a value
shows what it holds while shut. If it cannot summarise itself, it should not be
collapsible.

**The One Authored Moment Rule.** There is exactly one composed motion in the
bay: on a breakpoint change the canvas mount eases its width over **300ms** while
the strip's width figure settles to the new number over **260ms** on an
exponential ease-out (`1 − (1 − t)³`, driven by `requestAnimationFrame`), so the
two read as one movement. Both are `prefers-reduced-motion` gated — reduced
motion gets the destination at once, because there is nothing to understand in
the travel, only in the arrival. Everything else is a **150ms** state transition
(colour, marks, ticks, tab underline) or **200ms** for a lamp lighting. Nothing
else animates.

## Do's and Don'ts

### Do:

- **Do** put the world on `document.documentElement` via the `studio-bay` class,
  added and removed by an effect in `EditorShell`. Not on a wrapper: every menu,
  tooltip and popover here is a Radix portal on `document.body`, and a wrapper
  leaves a dropdown opening in the app's light palette over a console. It is
  verified not to leak — after navigating out, `/studio` and `/studio/preview/*`
  carry `light` alone and the gallery body is `rgb(255,255,255)`.
- **Do** build new chrome from the primitives in `src/studio/components/bay.tsx`
  — `Placard`, `Readout`, `Lamp`, `Console`, `Groove`, `OverrideMarks`,
  `ReferencePatch`. The colour law is enforced there rather than remembered.
- **Do** read `useRenderedWidth` for any width you display. It is the single
  computation behind every width readout; two readouts naming one scope with
  different figures is the confusion this replaced.
- **Do** hold every ink/ground pair at 4.5:1 or better. The ramp is built to it:
  `--studio-ink-faint` is `#66675F` precisely so it clears the floor on
  `--studio-surface`.
- **Do** report a fact at rest. Saved-vs-unsaved, the active breakpoint,
  override-vs-inherited and which template is open are all visible without
  hovering, opening or scrolling.
- **Do** gate every transition longer than 200ms behind `prefers-reduced-motion`.
- **Do** use `zoom` rather than `transform: scale()` on the canvas — a transform
  leaves the browser hit-testing at the unscaled position, which breaks Puck's
  drag and every click on the canvas.

### Don't:

- **Don't** let any of this reach the canvas, the gallery (`/studio`), the
  preview route, or the nineteen themes in `src/Theme/`. The canvas must look
  exactly like the school's live site; the gallery and preview keep the app's own
  light palette on `:root`.
- **Don't** introduce a fourth signal colour, a gradient, or a tinted neutral. A
  tinted surround is a thumb on the scale of every colour judged against it.
- **Don't** style canvas-adjacent chrome with `--primary`, `--accent` or any
  value sampled from the site. Inside the canvas iframe those belong to the
  school.
- **Don't** restyle, tint or theme `--studio-field`. It is a reference value.
- **Don't** add glow, halo or coloured shadow to anything that is not a lamp, the
  drop indicator, or the selection bar.
- **Don't** elevate a panel, row, field, chip or menu. Hairline and tonal step
  only.
- **Don't** use fluid type, `clamp()`, or a size outside 10 / 11 / 12 / 13 / 15px.
- **Don't** set a placeholder in a colour a real value could plausibly be — an
  unset field must be readable as unset by brightness and by wording.
- **Don't** hide a consequential fact behind a breakpoint. Save state was once an
  11px line behind `lg:`, which meant the one fact with real consequences was the
  first thing a narrow window dropped; it is a lamp now.
- **Don't** "fix" the fluid desktop canvas. At a 1366px window the canvas is
  ~914px and the theme renders its compact header while the scope still reads
  Desktop. That is intended; the `FIT` placard is what keeps it honest.
