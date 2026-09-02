# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: EDN production staff, pre-handover.** Internal operators who take a
school or college that has just signed, pick one of the nineteen shipped themes
for it, pour in that institution's real WMS content, retune colours, type and
spacing until it looks like *that* school rather than the template, and hand the
site over. They are expert users in the tool daily, often across several sites in
a sitting, under a delivery deadline. Density, speed and keyboard reach serve
them; hand-holding does not.

The wider app serves ~150 tenant institutions (`src/lib/domains.ts`), any of
which can be opened in the studio.

## Product Purpose

The Website Studio (`/studio`) is a visual customiser for the nineteen themes in
`src/Theme`. Success is a site that looks bespoke to one institution without a
single line of theme code being written or forked for it.

It is explicitly **not** a page builder. The theme remains the source of the
design; the studio is a configuration layer over it.

## Positioning

Every change routes through the seam the live site already uses. Content is
written into `useTenantStore` — the same multi-tenant store the production site
fills from WMS — so all nineteen themes render edits without any theme knowing
the studio exists. Style changes compile to scoped CSS rules and real media
queries, never to Tailwind classes assembled from user values (a class that
appears in no source file is a class Tailwind never generates).

The consequence a neighbouring builder cannot truthfully copy: nothing is ever
rewritten. A template that gains a section only needs its manifest regenerated;
a theme is never forked per client.

## Operating Context

Three routes: `/studio` (theme gallery), `/studio/editor/[siteId]` (the editor),
`/studio/preview/[siteId]` (the site as published). Both editor and preview
accept `?theme=<n>`, the same override the live site takes, so any site can be
opened on any of the nineteen templates.

The editing loop, as it is actually performed:

1. Open a site on a template.
2. Work down the page section by section — content first, then colour, type and
   spacing.
3. Switch breakpoint (desktop / tablet / mobile) and fix what the narrower
   layout broke, knowing tablet and mobile store only what differs.
4. Press Play to watch the scroll-driven animations run for real, because the
   editable canvas cannot run them.
5. Save; export a JSON file when the work must move between machines.

Structural facts the interface must respect:

- **Puck owns the document; the Zustand store owns the session.** Content,
  style, visibility and order all dispatch through Puck, which is what makes one
  undo stack cover all four. Device, zoom, dirty flag and panel state are the
  store's.
- **Header and footer are the theme's chrome, not sections.** They are
  selectable and stylable but cannot be reordered or removed.
- **The template owns the layout.** Sections can be reordered, hidden and taken
  off the page (recoverably); nothing can be nested and nothing new inserted.
- **Desktop is the base breakpoint;** tablet and mobile are max-width overrides
  that inherit by not emitting anything.

## Capabilities and Constraints

Shipped and must survive any redesign: undo/redo (`Ctrl+Z` / `Ctrl+Shift+Z`),
save (`Ctrl+S`), `Escape` unwinding motion-preview → fullscreen → selection,
`Delete`/`Backspace` removing the selected section, drag-to-reorder with a drop
line, hide/show, remove-and-restore, template switching that preserves the
document, JSON import/export, reset to template defaults, device switching,
zoom 25–150%, fullscreen canvas, motion preview ("Play"), per-section and
site-wide colour/type/spacing controls, global design-token editing.

Constraints:

- **Persistence is `localStorage` only.** There is no server for studio
  documents in this phase; "Saved" means saved in this browser. Export is the
  only way work leaves the machine. The interface must be honest about this.
- **Content may be sample content.** When WMS hosts no payload for a domain, the
  canvas falls back to `data/content/defaults.ts`. The user must be able to tell
  which they are looking at.
- **Images are referenced, never uploaded.** Values are WMS file names, `/public`
  paths or absolute URLs; there is no asset store.
- **framer-motion `useScroll` sections cannot animate on the editable canvas.**
  Puck portals the canvas, so the theme's JS runs in the editor's window while
  its DOM lives in the iframe. GSAP is bridged via a `scrollerProxy`;
  framer-motion has no equivalent seam, which is why Play exists.
- **The canvas scales with `zoom`, not `transform`,** so hit-testing scales with
  the pixels and Puck's drag keeps working.
- Some themes pull WebGL, GSAP and several carousels; one throwing must not take
  the app down (`/studio/error.tsx`).

Terminology, as used in the product and by the team: **template** (the theme, by
number — "Theme-15"), **section** (a band of the page), **chrome** (header and
footer), **breakpoint**, **override** vs **inherited**, **site** (one tenant
institution), **the canvas**, **Play**.

## Brand Commitments

The studio is internal tooling and carries no institutional identity of its own —
it renders other people's brands and must not compete with them. The nineteen
themes' own colours belong to the canvas; the surrounding tool is not a place to
express them.

## Evidence on Hand

- Nineteen real theme manifests, generated from each theme's own `index.tsx`
  (`src/studio/templates/sections/theme-*.ts`), with real section labels, kinds
  and content slices.
- Real theme screenshots in `/public` for the gallery, and a real accent colour
  per theme (`src/studio/data/themes.ts`).
- ~150 real tenant domains and institution names via `src/lib/domains.ts`.
- Real WMS content for hosted domains; a real sample payload for the rest.

No usage analytics, no user research, no published claims about the studio
exist. None may be invented.

## Product Principles

1. **The theme is the truth; the studio only trims it.** Every control offered
   is one that cannot break a template. Anything that would fork a theme is out
   of scope by design.
2. **Nothing is destroyed.** Removal is recoverable, overrides are clearable,
   inheritance is visible, and one undo stack covers every kind of change.
3. **The canvas is the work; everything else is apparatus.** Chrome earns its
   space against the thing being edited.
4. **State must be legible, not inferred.** Which breakpoint is being written,
   what is overridden versus inherited, saved versus unsaved, real content
   versus sample — each is a fact the operator must be able to read, not deduce.
5. **Expert speed over novice comfort.** The daily operator sets the bar:
   keyboard reach, density and directness, without becoming cryptic.

## Accessibility & Inclusion

No externally imposed standard is recorded. The existing implementation holds a
self-set bar that later work must not regress: every icon-only control carries an
accessible name and a tooltip, every destination that leaves the editor is a real
link, focus is visible on custom controls, and `prefers-reduced-motion` is
honoured in the gallery.
