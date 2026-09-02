/**
 * Derives one section manifest per theme from the theme's own `index.tsx`.
 *
 * The studio canvas re-composes a theme from its sections so they can be
 * hidden, reordered and styled individually. That list has to match what the
 * theme actually renders, so it is read out of the source rather than written
 * by hand — a theme that gains a section gets it here by re-running this
 * script, not by someone remembering to.
 *
 *   node scripts/generate-studio-manifests.mjs --report   print, write nothing
 *   node scripts/generate-studio-manifests.mjs            write JSON to stdout
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * The themes are no longer in this app. They live in `@edn/site-themes`, which
 * the website app renders from as well, so this script reads their source from
 * the package and writes manifests that import from it by package specifier.
 */
const PKG = "@edn/site-themes";
const pkgRoot = join(root, "..", "site-themes");

const THEME_COUNT = 19;

/** Component names that are chrome or decoration, never an editable section. */
const NOT_A_SECTION = new Set([
  "ThreeBackground", "DeferredMount", "ScrollTop", "ScrollProgress", "Stage",
  "T13Chrome", "T13Grain", "Grain", "CookieNotice", "FloatingDock",
  "EntranceLogin", "RequestDemoModal", "Container", "Image", "Link",
  "AnimatePresence", "Suspense", "Fragment", "PreviewModal", "CategoryFilter",
  "TemplateGrid", "Star", "Heart", "Sparkles", "Cloud", "Palmtree",
  "Footprints", "Sun", "Trees", "Bird", "CloudSun", "Component",
]);

/**
 * Component name to section kind. The kind decides which slice of tenant
 * content the section reads, and therefore which Content fields the inspector
 * offers. Exact match first, then substring, so "NoticeAndEvents" does not get
 * claimed by the shorter "notice" entry.
 */
const KIND_BY_NAME = [
  ["herov2", "hero"], ["herov3", "hero"], ["hero", "hero"], ["homeslider", "hero"],
  ["aboutus", "about"], ["about", "about"], ["story", "about"], ["provenance", "about"],
  ["statistics", "statistics"], ["stats", "statistics"], ["numbers", "statistics"],
  ["highlights", "statistics"],
  ["programmes", "programs"], ["programs", "programs"], ["products", "programs"],
  ["modules", "programs"], ["courses", "programs"],
  ["quickservices", "services"], ["digitalservices", "services"],
  ["services", "services"], ["portals", "services"],
  ["whychooseus", "features"], ["whychoose", "features"], ["features", "features"],
  ["ecosystem", "features"], ["craft", "features"], ["solutionshowcase", "features"],
  ["platformflow", "features"], ["mobileshowcase", "features"], ["dashboard", "features"],
  ["testimonials", "testimonials"], ["testimonial", "testimonials"], ["voices", "testimonials"],
  ["faculty", "team"], ["team", "team"], ["officials", "team"], ["board", "team"],
  ["brigade", "team"], ["boardmessage", "team"],
  ["virtualtour", "gallery"], ["campuslife", "gallery"], ["studentlife", "gallery"],
  ["gallery", "gallery"], ["house", "gallery"],
  ["noticeandevents", "notices"], ["noticeticker", "notices"], ["notices", "notices"],
  ["emergencyalert", "notices"], ["bulletin", "notices"], ["notice", "notices"],
  ["newsandstories", "news"], ["newsandevents", "news"], ["news", "news"], ["blog", "news"],
  ["events", "events"], ["timeline", "events"],
  ["facilities", "facilities"], ["facility", "facilities"],
  ["partners", "partners"], ["clients", "partners"], ["recruiters", "partners"],
  ["trusted", "partners"], ["accreditation", "partners"], ["awards", "partners"],
  ["ministries", "partners"],
  ["admissionprocess", "admission"], ["admission", "admission"],
  ["reservations", "admission"], ["pricing", "admission"],
  ["faq", "faq"], ["questions", "faq"],
  ["contactcta", "cta"], ["calltoaction", "cta"], ["prefooter", "cta"],
  ["applybanner", "cta"], ["cta", "cta"],
  ["contact", "contact"],
  ["documents", "downloads"], ["downloads", "downloads"],
  ["projects", "portfolio"], ["portfolio", "portfolio"],
];

function kindFor(name) {
  const lower = name.toLowerCase();
  for (const [needle, kind] of KIND_BY_NAME) if (lower === needle) return kind;
  for (const [needle, kind] of KIND_BY_NAME) if (lower.includes(needle)) return kind;
  return "generic";
}

/** "HeroV2" to "Hero V2", "NoticeAndEvents" to "Notice And Events". */
function humanize(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .trim();
}

function collectImports(source, themeNumber) {
  const map = new Map();

  const dynamicRe =
    /const\s+([A-Za-z0-9_]+)\s*=\s*dynamic\(\s*\(\)\s*=>\s*\n?\s*import\(\s*["']([^"']+)["']\s*\)(?:\s*\.then\(\s*\(\s*(?:mod|m)\s*\)\s*=>\s*(?:mod|m)\.([A-Za-z0-9_]+)\s*,?\s*\))?/g;
  for (const m of source.matchAll(dynamicRe)) {
    map.set(m[1], { path: m[2], export: m[3] || "default" });
  }

  // Theme-5 keeps its components in an object literal keyed by section id.
  const keyedRe =
    /([a-zA-Z0-9_]+)\s*:\s*dynamic\(\s*\(\)\s*=>\s*\n?\s*import\(\s*["']([^"']+)["']\s*\)(?:\s*\.then\(\s*\(\s*(?:mod|m)\s*\)\s*=>\s*(?:mod|m)\.([A-Za-z0-9_]+)\s*,?\s*\))?/g;
  for (const m of source.matchAll(keyedRe)) {
    if (!map.has(m[1])) map.set(m[1], { path: m[2], export: m[3] || "default", keyed: true });
  }

  const staticRe = /import\s+(?:\{([^}]+)\}|([A-Za-z0-9_]+))\s+from\s+["']([^"']+)["']/g;
  for (const m of source.matchAll(staticRe)) {
    const path = m[3];
    if (!path.startsWith(".") && !path.startsWith(`${PKG}/Theme`) && !path.startsWith(`${PKG}/features`)) continue;
    if (m[2]) {
      map.set(m[2], { path, export: "default" });
    } else {
      for (const raw of m[1].split(",")) {
        const name = raw.trim().split(/\s+as\s+/).pop().trim();
        if (name) map.set(name, { path, export: name });
      }
    }
  }

  for (const [, entry] of map) {
    if (entry.path.startsWith(".")) {
      entry.path = entry.path.replace(/^\.\//, `${PKG}/Theme/Theme-${themeNumber}/`);
    }
  }
  return map;
}

/**
 * Walk the JSX of the exported component, recording every `<Component />` in
 * render order alongside the classNames of the elements wrapping it.
 * Regex line-scanning on purpose: these are hand-written files with one
 * element per line, and a real parser is not worth a build dependency.
 */
function collectRendered(source, imports) {
  const returnIndex = source.lastIndexOf("  return (");
  if (returnIndex === -1) return [];
  const body = source.slice(returnIndex);
  const lines = body.split("\n");

  const stack = [];
  const found = [];
  let cursor = 0;

  for (const line of lines) {
    const lineStart = cursor;
    cursor += line.length + 1;

    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("{/*")) continue;

    const close = trimmed.match(/^<\/([A-Za-z][A-Za-z0-9.]*)>/);
    if (close) {
      const at = stack.map((s) => s.tag).lastIndexOf(close[1]);
      if (at !== -1) stack.length = at;
      continue;
    }

    const open = trimmed.match(/^<([A-Za-z][A-Za-z0-9.]*)\b([^]*)$/);
    if (!open) continue;
    const [, tag, rest] = open;

    // Attributes may run over several lines, so self-closing has to be judged
    // from the whole tag, not from this line. Without this a decorative
    // `<div ... />` spanning four lines never leaves the wrapper stack and
    // every later section inherits its classes.
    const tagText = body.slice(lineStart, lineStart + 2000).split(">")[0];
    const selfClosing = tagText.trimEnd().endsWith("/");

    if (/^[A-Z]/.test(tag) && imports.has(tag) && !NOT_A_SECTION.has(tag)) {
      found.push({
        name: tag,
        wrappers: stack.map((s) => s.className).filter(Boolean),
        props: rest.replace(/\/?>\s*$/, "").trim(),
      });
      if (!selfClosing) stack.push({ tag, className: "" });
      continue;
    }

    if (selfClosing) continue;

    const cls = tagText.match(/className=(?:"([^"]*)"|\{`([^`]*)`\}|\{cn\(\s*"([^"]*)")/);
    stack.push({
      tag,
      className: cls ? (cls[1] || cls[2] || cls[3] || "").replace(/\s+/g, " ").trim() : "",
    });
  }

  return found;
}

/**
 * Which slices of tenant content a section actually reads. Taken from the
 * component's own `useTenantStore` selectors, so the inspector offers the
 * fields that section renders and no others.
 */
function resolveModule(importPath) {
  const base = importPath.startsWith(`${PKG}/`)
    ? join(pkgRoot, "src", importPath.slice(PKG.length + 1))
    : join(root, importPath);
  const candidates = [`${base}.tsx`, `${base}.ts`, join(base, "index.tsx"), join(base, "index.ts")];
  return candidates.find((c) => existsSync(c)) ?? null;
}

/**
 * Confirms the export the theme's index imports actually exists.
 *
 * Getting this wrong is silent at build time and fatal at runtime — a lazy
 * component whose module has no such export resolves to `undefined`, and React
 * takes the whole page down with "Lazy element type must resolve to a class or
 * function". Cheaper to catch it here.
 */
function verifyExport(importPath, exportName) {
  const file = resolveModule(importPath);
  if (!file) return `module not found: ${importPath}`;

  const source = readFileSync(file, "utf8");
  if (exportName === "default") {
    return /export\s+default\b/.test(source) ? null : `${importPath} has no default export`;
  }
  const named = new RegExp(
    `export\\s+(?:const|function|class|let|var)\\s+${exportName}\\b|export\\s*\\{[^}]*\\b${exportName}\\b`,
  );
  return named.test(source) ? null : `${importPath} does not export ${exportName}`;
}

function collectSlices(importPath) {
  const file = resolveModule(importPath);
  if (!file) return [];

  const source = readFileSync(file, "utf8");
  const slices = new Set();
  const selectorRe = /useTenantStore\(\s*\(\s*[a-zA-Z]+\s*\)\s*=>\s*[a-zA-Z]+\??\.([a-zA-Z0-9_]+)/g;
  for (const m of source.matchAll(selectorRe)) slices.add(m[1]);

  // `const { a, b } = useTenantStore()` destructures instead of selecting.
  const destructureRe = /const\s*\{([^}]+)\}\s*=\s*useTenantStore\(\s*\)/g;
  for (const m of source.matchAll(destructureRe)) {
    for (const raw of m[1].split(",")) {
      const name = raw.trim().split(":")[0].trim();
      if (name) slices.add(name);
    }
  }
  return [...slices].filter((s) => !s.startsWith("set"));
}

const manifests = [];
const problems = [];

for (let n = 1; n <= THEME_COUNT; n += 1) {
  const source = readFileSync(join(pkgRoot, "src", "Theme", `Theme-${n}`, "index.tsx"), "utf8");
  const imports = collectImports(source, n);
  let rendered = collectRendered(source, imports);

  // A theme that renders from a keyed map rather than literal JSX (Theme-5)
  // declares its order in a `defaultLayout` array instead.
  if (!rendered.length) {
    const layout = source.match(/const\s+defaultLayout\s*=\s*\[([^\]]*)\]/);
    if (layout) {
      rendered = layout[1]
        .split(",")
        .map((raw) => raw.trim().replace(/^["']|["']$/g, ""))
        .filter((key) => imports.has(key))
        .map((key) => ({ name: key, wrappers: [], props: "" }));
    }
  }

  // Wrapper elements every section shares are the theme's frame, which the
  // studio renders around the whole list; anything deeper belongs to the
  // individual section and travels with it when it is reordered.
  const chains = rendered.map((item) => item.wrappers);
  let framePrefix = chains[0] ? [...chains[0]] : [];
  for (const chain of chains) {
    let i = 0;
    while (i < framePrefix.length && framePrefix[i] === chain[i]) i += 1;
    framePrefix.length = i;
  }
  framePrefix = framePrefix.slice(0, 2);

  const seen = new Set();
  const sections = [];
  for (const item of rendered) {
    const entry = imports.get(item.name);
    if (!entry) continue;

    // The theme's own index is the authority on which export to load. If it
    // cannot be found, try the other convention before giving up — a section
    // that resolves to `undefined` crashes the page it is on.
    let exportName = entry.export;
    let problem = verifyExport(entry.path, exportName);
    if (problem) {
      const fallback = exportName === "default" ? item.name : "default";
      if (!verifyExport(entry.path, fallback)) {
        exportName = fallback;
        problem = null;
      }
    }
    if (problem) {
      problems.push(`Theme-${n} ${item.name}: ${problem}`);
      continue;
    }
    const kind = kindFor(item.name);
    let id = kind;
    let suffix = 2;
    while (seen.has(id)) id = `${kind}-${suffix++}`;
    seen.add(id);
    sections.push({
      id,
      kind,
      label: humanize(item.name),
      component: item.name,
      path: entry.path,
      export: exportName,
      slices: collectSlices(entry.path),
      // Wrapper classes between the theme frame and the section. The outermost
      // two levels are the frame itself, which the studio renders itself.
      className: item.wrappers.slice(framePrefix.length).join(" ").trim(),
      props: item.props,
    });
  }

  manifests.push({
    theme: n,
    frameClassName: framePrefix[0] ?? "",
    mainClassName: framePrefix[1] ?? "",
    sections,
  });
}

if (problems.length) {
  console.error("Unresolved section imports:");
  for (const problem of problems) console.error(`  ${problem}`);
}

if (process.argv.includes("--report")) {
  for (const m of manifests) {
    console.log(`\nTheme-${m.theme} (${m.sections.length})  frame:"${m.frameClassName}" main:"${m.mainClassName}"`);
    for (const s of m.sections) {
      const extra = [
        s.slices.length && `reads:${s.slices.join("+")}`,
        s.className && `class:${s.className}`,
        s.props && `props:${s.props}`,
      ]
        .filter(Boolean)
        .join("  ");
      console.log(`  ${s.id.padEnd(16)} ${s.component.padEnd(20)} ${s.export.padEnd(14)} ${extra}`);
    }
  }
  process.exit(0);
}

const outDir = join(root, "src", "studio", "templates", "sections");
mkdirSync(outDir, { recursive: true });

const q = (value) => JSON.stringify(value);

for (const manifest of manifests) {
  const id = `theme-${manifest.theme}`;
  const lines = manifest.sections.map((s) => {
    const load =
      s.export === "default"
        ? `() => import(${q(s.path)}).then((m) => m.default)`
        : `() => import(${q(s.path)}).then((m) => m.${s.export})`;
    return [
      "  {",
      `    id: ${q(s.id)},`,
      `    kind: ${q(s.kind)},`,
      `    label: ${q(s.label)},`,
      `    component: ${q(s.component)},`,
      `    slices: ${q(s.slices)},`,
      s.className ? `    className: ${q(s.className)},` : null,
      `    load: ${load},`,
      "  },",
    ]
      .filter(Boolean)
      .join("\n");
  });

  const file = [
    "// AUTO-GENERATED by scripts/generate-studio-manifests.mjs.",
    `// Derived from ${PKG}/Theme/Theme-${manifest.theme}/index.tsx — do not edit by hand.`,
    "",
    'import type { ThemeManifest } from "@/studio/types";',
    "",
    "const manifest: ThemeManifest = {",
    `  id: ${q(id)},`,
    `  frameClassName: ${q(manifest.frameClassName)},`,
    `  mainClassName: ${q(manifest.mainClassName)},`,
    "  sections: [",
    lines.join("\n"),
    "  ],",
    "};",
    "",
    "export default manifest;",
    "",
  ].join("\n");

  writeFileSync(join(outDir, `${id}.ts`), file, "utf8");
}

console.log(`Wrote ${manifests.length} section manifests to src/studio/templates/sections/`);
