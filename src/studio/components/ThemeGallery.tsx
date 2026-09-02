"use client";

/**
 * The studio's front door: the themes a site can be built on.
 *
 * The websites themselves are not listed here — a theme is what you pick, and
 * every card opens on the same site, so the index answers one question instead
 * of two and names that site once, in the header, rather than fifteen times.
 *
 * The card is the screenshot. A theme is recognised by its look long before its
 * name is read, so the plate carries the shot at full width and the label under
 * it is the theme's id — the thing you say out loud when you ask for one.
 */

import type { SiteRecord, ThemeDescriptor } from "@/studio/types";
import Link from "next/link";
import { useState } from "react";
import { Eye, PencilLine, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@edn/site-themes/components/ui/button";
import { Input } from "@edn/site-themes/components/ui/input";
import { clearAllWebsiteStates } from "@/studio/lib/storage";
import { useSavedSiteIdsKey } from "@/studio/lib/use-saved-state";

/**
 * A theme with no screenshot still gets a real cover: its own number, set in
 * its accent over a wash of the same colour.
 *
 * Both colours are mixed against the card tokens rather than used raw, so the
 * near-black accents stay legible if the studio is opened in the dark palette.
 */
function ThemeCover({ theme }: { theme: ThemeDescriptor }) {
  const zoom =
    "size-full transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.03]";

  if (theme.preview) {
    // A plain img: these are static files in /public, and the gallery is not
    // worth the optimiser round trip.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={theme.preview} alt="" loading="lazy" className={`${zoom} object-cover object-top`} />;
  }

  return (
    <div
      className={`${zoom} flex items-center justify-center`}
      style={{
        background: `linear-gradient(140deg, color-mix(in oklab, ${theme.accent} 22%, var(--card)), color-mix(in oklab, ${theme.accent} 6%, var(--card)))`,
      }}
      aria-hidden
    >
      <span
        className="text-6xl font-semibold tracking-[-0.04em] tabular-nums"
        style={{ color: `color-mix(in oklab, ${theme.accent} 80%, var(--card-foreground))` }}
      >
        {theme.id.replace(/\D+/g, "") || theme.key}
      </span>
    </div>
  );
}

function ThemeCard({ theme, sites }: { theme: ThemeDescriptor; sites: SiteRecord[] }) {
  // Any theme can be opened on any site — `?theme=` is the same override the
  // live site accepts. A theme no sample site uses is still reachable, which is
  // what makes every listed theme openable from the websites the app serves.
  const home = sites.find((site) => site.themeId === theme.id);
  const target = home ?? sites[0];
  const query = home ? "" : `?theme=${theme.id}`;

  // The accent is the theme's own, but it is read against the dark scrim, so
  // it is lifted towards white — the near-black accents would be a hole.
  const dot = (
    <span
      className="size-2 shrink-0 rounded-full"
      style={{ background: `color-mix(in oklab, ${theme.accent} 65%, white)` }}
      aria-hidden
    />
  );

  // No websites configured is a real state, and a card whose links go nowhere
  // is worse than one that says so.
  if (!target) {
    return (
      <article className="relative aspect-5/4 overflow-hidden rounded-2xl border bg-muted">
        <ThemeCover theme={theme} />
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 bg-linear-to-t from-black/80 to-transparent px-5 pt-10 pb-4">
          {dot}
          <h3 className="truncate text-base font-semibold tracking-tight text-white tabular-nums">
            {theme.id}
          </h3>
          <span className="ml-auto text-xs text-white/70">No website to open it on</span>
        </div>
      </article>
    );
  }

  return (
    <article
      className={[
        "group relative aspect-5/4 overflow-hidden rounded-2xl border bg-muted",
        "transition-[transform,box-shadow,border-color] duration-300 ease-out",
        "hover:border-ring/40 hover:shadow-[0_18px_40px_-24px_rgb(15_23_42/0.55)]",
        "motion-safe:hover:-translate-y-1",
      ].join(" ")}
    >
      <ThemeCover theme={theme} />

      {/* At rest the card is the screenshot and nothing else. The name and the
          two ways in arrive together on hover — and on keyboard focus, and on
          a coarse pointer, which has no hover to give. */}
      <div className="absolute inset-0 flex flex-col justify-end bg-black/45 bg-linear-to-t from-black/70 via-black/15 to-transparent p-4 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100 sm:p-5">
        <div className="flex items-center justify-between gap-3 transition-transform duration-300 ease-out motion-safe:translate-y-2 motion-safe:group-hover:translate-y-0 motion-safe:group-focus-within:translate-y-0 motion-safe:pointer-coarse:translate-y-0">
          <div className="flex min-w-0 items-center gap-2.5">
            {dot}
            <h3 className="truncate text-base font-semibold tracking-tight text-white tabular-nums">
              {theme.id}
            </h3>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button asChild size="sm" variant="secondary" className="h-8">
              <Link
                href={`/studio/preview/${target.id}${query}`}
                aria-label={`Preview ${theme.id}`}
              >
                <Eye className="size-3.5" aria-hidden />
                Preview
              </Link>
            </Button>
            <Button asChild size="sm" className="h-8">
              <Link
                href={`/studio/editor/${target.id}${query}`}
                aria-label={`Edit ${theme.id} — ${theme.name}`}
              >
                <PencilLine className="size-3.5" aria-hidden />
                Edit
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function ThemeGallery({
  sites,
  themes,
}: {
  sites: SiteRecord[];
  themes: ThemeDescriptor[];
}) {
  // Which sites have local edits is browser-only knowledge: the server snapshot
  // is empty, so the markup it renders and the first client render agree, and a
  // count cannot arrive mid-hydration.
  //
  // `nudge` exists because the `storage` event fires in *other* tabs only.
  // Clearing here has to force a render, at which point the snapshot is read
  // again and the count goes.
  const [, setNudge] = useState(0);
  const [query, setQuery] = useState("");
  const savedKey = useSavedSiteIdsKey();
  const savedCount = savedKey ? savedKey.split(",").length : 0;

  // Showcase templates are reachable by id but are not part of the catalogue a
  // school is choosing from, so the grid lists the real site themes only.
  const available = themes.filter((theme) => theme.available !== false && !theme.demo);

  // Id first, because the cards are titled by it. Name, category and
  // description still match — they are how a theme is described even where the
  // grid no longer prints them. Matching is done here rather than by the
  // server: the list is static and already in the page, so filtering it is a
  // keystroke, not a round trip.
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? available.filter(
        (theme) =>
          theme.id.toLowerCase().includes(needle) ||
          theme.name.toLowerCase().includes(needle) ||
          theme.category.toLowerCase().includes(needle) ||
          theme.description.toLowerCase().includes(needle),
      )
    : available;

  const discardAll = () => {
    clearAllWebsiteStates();
    setNudge((n) => n + 1);
    toast.success("All saved changes cleared");
  };

  return (
    <div className="w-full px-6 py-8 sm:py-10 lg:px-10">
      {/* One panel rather than a stack of rows: the title, what the grid is,
          and the two controls that act on it belong to the same thought. The
          dot field is the app's own texture, faded out from the corner so the
          type sits on quiet ground. */}
      <header className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-primary/10 via-card to-card px-6 py-8 sm:px-10 sm:py-10">
        <div
          className="pointer-events-none absolute inset-0 bg-dot-pattern mask-[radial-gradient(130%_110%_at_0%_0%,black,transparent_70%)]"
          aria-hidden
        />

        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Customise a site without leaving its theme
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Content, colours, type, spacing and section order are yours to change. The theme
              stays the source of the design.
            </p>
            <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground tabular-nums">
                {needle ? `${visible.length} of ${available.length} themes` : `${available.length} themes`}
              </span>
              {sites[0] ? (
                <>
                  <span aria-hidden>·</span>
                  <span>
                    Opens on {sites[0].schoolName}
                    <span className="text-muted-foreground/70"> — {sites[0].domain}</span>
                  </span>
                </>
              ) : null}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="relative w-full sm:w-72">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search themes"
                aria-label="Search themes by id, name or category"
                className="h-10 bg-card pl-9"
              />
            </div>

            {savedCount ? (
              <Button variant="ghost" size="sm" className="h-10 shrink-0" onClick={discardAll}>
                Clear {savedCount} saved {savedCount === 1 ? "site" : "sites"}
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mt-8">
      {visible.length ? (
        <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((theme) => (
            <ThemeCard key={theme.id} theme={theme} sites={sites} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed px-6 py-20 text-center text-sm text-muted-foreground">
          {needle ? `Nothing matches “${query.trim()}”.` : "No themes are configured yet."}
        </p>
      )}
      </div>
    </div>
  );
}
