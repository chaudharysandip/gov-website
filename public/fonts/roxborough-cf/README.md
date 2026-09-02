# Roxborough CF

Themes 1 and 18 set their headings in **Roxborough CF** (Connary Fagen).

It is a **commercial** typeface. It is not on Google Fonts and its licence does not
permit redistribution, so the font files are deliberately **not** committed here — this
directory holds only this note.

## To activate it

Buy or locate your licence at https://connary.com/roxborough.html, export web formats,
and drop the files in beside this README with these exact names:

```
public/fonts/roxborough-cf/
  RoxboroughCF-Thin.woff2      (100)
  RoxboroughCF-Light.woff2     (300)
  RoxboroughCF-Regular.woff2   (400)
  RoxboroughCF-Medium.woff2    (500)
  RoxboroughCF-Bold.woff2      (700)
```

The `@font-face` blocks are already declared in `src/app/globals.css` under the
"ROXBOROUGH CF" heading and point at exactly these paths. Nothing else needs changing —
add the files and the headings switch over on the next reload.

You do not need every weight. Any file that is missing simply 404s and that weight falls
through to the fallback; the ones you do supply are used. `Regular` and `Bold` carry
almost all of the two themes' headings.

## Until then

The `src` URLs 404 and the browser moves to the next family in the stack: **Cormorant
Garamond**, loaded from Google Fonts in `src/lib/fonts.ts`. It is the closest freely
licensed match — same flared serifs, same high contrast, also drawn for display sizes —
so both themes look designed rather than broken in the meantime.

The 404s are silent to the reader but do appear in the network panel. That is the
intended behaviour, not a bug to "fix" by deleting the `@font-face` blocks.

## Why not `next/font/local`

`next/font/local` reads the files at **build time** and throws if they are missing, so
wiring it that way would break `next build` for anyone without the licence. A plain
`@font-face` degrades instead of failing.
