# Anastasya Confession

Themes 1 and 18 set their **titles** — `h1` and `h2`, the large display lines — in
**Anastasya Confession**. Smaller headings (`h3`–`h6`) stay in Roxborough CF; see
`../roxborough-cf/README.md`.

Like Roxborough, this is a **commercial** typeface: not on Google Fonts, not
redistributable, so the files are deliberately not committed. This directory holds only
this note.

## To activate it

Drop your licensed web exports in beside this README with these names:

```
public/fonts/anastasya-confession/
  AnastasyaConfession-Regular.woff2
  AnastasyaConfession-Italic.woff2    (optional)
```

The `@font-face` blocks are already declared in `src/app/globals.css` under the
"ANASTASYA CONFESSION" heading and point at exactly these paths. Add the files and the
titles switch over on the next reload — nothing else to change.

Only `Regular` is needed. Display faces of this kind normally ship a single weight, and
`font-synthesis-weight: none` is set on these headings so the browser will use that one
real weight rather than smearing a faux-bold out of it.

## Until then

The `src` URL 404s and the browser falls through the stack in order:

```
Anastasya Confession  →  Roxborough CF  →  Cormorant Garamond  →  system serifs
```

So a missing file here costs nothing visible — titles simply keep the Roxborough CF
treatment they already had, and if that is missing too they land on Cormorant Garamond,
which ships from Google Fonts and is always available.

That ordering is the whole point of the setup: every layer degrades into the next
without a blank page, a flash of invisible text, or a build failure.

## Why not `next/font/local`

It resolves its `src` at **build time** and throws on a missing file, which would break
`next build` for anyone without the licence. A plain `@font-face` degrades instead.
