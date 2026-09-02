# Website Studio

The visual editor for the nineteen website themes, as its own Next.js app.

It was previously a set of routes inside `../school-website-next`. The themes it
edits are the same ones that app renders, so both now consume them from
`@edn/site-themes` rather than either owning a copy.

## Layout

| Path | What it is |
| --- | --- |
| `src/studio/` | The editor: store, panels, canvas, templates, section manifests. |
| `src/app/studio/` | The routes — gallery, `editor/[siteId]`, `preview/[siteId]`. |
| `../site-themes/` | The themes, UI kit, feature pages, WMS service layer and design tokens. Shared with the website app. |

The routes keep their `/studio` prefix so every link inside the editor and every
existing bookmark resolves unchanged. `/` redirects to `/studio`.

## Running it

```bash
pnpm install          # once, and again after changing a dependency
pnpm dev
```

`@edn/site-themes` is a `link:` dependency, not a published package, so it needs
its own install before this app will resolve anything:

```bash
cd ../site-themes && pnpm install
```

## Changing a theme

Themes live in `../site-themes/src/Theme`. Edit one there and it changes in both
this app and the website — that is the point of the split, and the reason not to
copy a theme back into this repo.

After adding or restructuring a theme's sections, regenerate the manifests the
editor reads:

```bash
pnpm studio:manifests           # write
pnpm studio:manifests:report    # dry run
```

## What is NOT here

The public website — its routes, its tenant chrome, its sitemap and its
published-page pipeline — stays in `../school-website-next`.
