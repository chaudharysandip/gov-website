# Website Studio

A visual customiser for the nineteen themes already in `src/Theme`. It is not a
page builder: the themes remain the source of the design, and the studio is a
configuration layer over them. No theme was rewritten to make this work.

```
/studio                       websites and themes
/studio/editor/[siteId]       the editor
/studio/preview/[siteId]      the site as it would be published
```

Both routes accept `?theme=<n|theme-n>`, the same override the live site takes,
so any site can be opened on any of the nineteen templates.

## How a theme ends up on the canvas

The themes read their content from `useTenantStore`, the multi-tenant store the
live site fills from WMS. That single fact is what the whole studio rests on:

```
static site record ─┐
                    ├─► content payload ─► useTenantStore ─► the theme renders
default content ────┘                              ▲
                                                   │
                            the inspector edits ───┘
```

Nothing is passed into a section, and nothing about a section is rewritten. The
editor changes the content the theme was already reading.

## The pieces

| Path | What it is |
| --- | --- |
| `lib/website.js` | The data layer. Content comes from WMS for the site's own domain — the same `fetchLayoutData` the live site calls — and falls back to `data/content/defaults.js` for a domain WMS does not host. |
| `data/` | The list of sites (real tenants), the nineteen theme descriptors, and a content factory shaped like the WMS payload, used when a domain has none. |
| `templates/sections/theme-*.js` | Generated. One manifest per theme: its sections, in render order, with the export each one loads and the content slices it reads. |
| `templates/registry.js` | Theme id → manifest, page, header and footer. No `if` chains anywhere else. |
| `templates/frames.jsx` | The wrapper each theme paints its page on. Most are a `div` and a `main`; six need the theme's own palette hook or backdrop, and import it rather than restate it. |
| `editor/config.jsx` | Builds the Puck config: one Puck component per theme section. |
| `editor/content-model.js` | What is editable in each slice of content — defined once per slice, not once per theme. |
| `lib/style-css.js` | Style objects → CSS. Never a Tailwind class built from a user value. |
| `lib/document.js` | The saved/exported document, and its conversion to and from Puck's data. |
| `store/editor-store.js` | Session state: device, zoom, dirty flag, persistence. Puck owns the document. |

## Regenerating the manifests

The section lists are read out of each theme's own `index.tsx` rather than
written by hand, so a theme that gains or loses a section only needs:

```bash
pnpm studio:manifests          # rewrite src/studio/templates/sections/
pnpm studio:manifests:report   # print what it found, write nothing
```

The generator validates that every export it records actually exists. A missing
one is reported rather than written, because a lazy component that resolves to
`undefined` takes the whole page down at runtime.

## Three decisions worth knowing

**Puck owns the document; the store owns the session.** Every content, style,
visibility and order change is dispatched through Puck, which is what makes undo
and redo cover all four. The Zustand store holds what Puck does not care about —
device, zoom, dirty state — and bridges to localStorage.

**Text and buttons are recoloured by rule, not by inheritance.** A colour set
on a section is inherited, and inheritance loses to the `text-white` the theme
put on the heading itself. So the text and button colours compile to rules on
`:is(h1…h6)`, `:is(p, li, …)`, links and `:is(button, [role="button"],
[data-slot="button"])` under the section's scope — specific enough to outrank a
utility class, and scoped tightly enough that a section's own colour still beats
the site-wide one. A button fill also emits `background-image: none`, because a
theme's call to action is usually a gradient and a colour alone would sit behind
it. `ELEMENT_SELECTORS` in `lib/constants.js` is the whole definition.

**Styles are CSS, not classes.** A class assembled from a user value
(`p-[${n}px]`) appears in no source file, so Tailwind never generates it and the
control silently does nothing. Sections emit a scoped rule instead, and the
tablet and mobile overrides are real media queries — so a breakpoint with no
override inherits by not emitting anything, and the canvas and a browser agree.

**GSAP is told where the canvas scrolls.** Puck mounts the canvas with
`createPortal`, so a theme's components execute in the editor's window and only
their DOM lives in the iframe. `whileInView` survives that — IntersectionObserver
resolves through the frame tree — but ScrollTrigger boots against a window that
never scrolls and leaves every GSAP entrance parked at its `from` state.
`editor/components/CanvasScrollBridge.jsx` registers a `scrollerProxy` for the
frame and drives it from the frame's own scroll event, which is the same seam
Lenis uses. It renders before the sections, because layout effects run in tree
order and it has to reach GSAP before the first `useGSAP`.

framer-motion's `useScroll` has no such seam — it defaults to
`document.scrollingElement`, read from this window, and nothing can be passed to
a hook the theme calls itself — so the sections built on it (Theme-1's solution
showcase and every `useScroll` band) sit at progress 0 on the canvas. **Play**,
in the canvas toolbar, is the answer to those: it swaps the canvas for the
preview route in a frame that *navigates*, so the page runs its own JavaScript
against its own scroll and every animation is the real one. The document reaches
it through a draft key of its own, so playing the animations never writes over
the last save.

**Global colours are the theme's own tokens.** `--primary`, `--background`,
`--radius` and the rest are redefined on the canvas root. Every theme already
reads them from the cascade, so a palette change reaches all of them without any
theme knowing the studio exists.

## What this touched outside `src/studio`

- `src/proxy.js` — new. Publishes the request path on a header so the root
  layout can step aside for `/studio/*` instead of wrapping it in a tenant's
  header and footer.
- `src/app/LayoutContent.tsx` — an early return for studio paths.
- `src/lib/file-path.ts` — `getFilePath` now returns an absolute URL, a
  `/public` path or a data URI unchanged instead of prefixing the WMS files
  directory. Several themes already did this check locally; hoisting it means an
  image set in the studio works on all nineteen.
- `Theme-5` and `Theme-11` — their inline backdrops moved into
  `components/Backdrop.tsx` so the studio frame can render the same component
  rather than a copy of it. No markup changed.
