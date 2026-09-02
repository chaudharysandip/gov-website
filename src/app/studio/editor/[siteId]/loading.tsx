import { Skeleton } from "@edn/site-themes/components/ui/skeleton";

/**
 * The editor's loading state.
 *
 * Opening a site is not instant — the route resolves the tenant, asks WMS for
 * its content and pulls in a theme that may carry WebGL and half a dozen
 * carousels — and until now that time was a blank page. For an operator working
 * through one school after another, that is the moment repeated most often in
 * the whole tool, and it was the only one with nothing in it.
 *
 * It is shaped like the bay rather than like a spinner: the rail across the
 * top, the node column, the wall with the mount hanging on it, the inspector.
 * The editor settles into this instead of replacing it, so nothing jumps.
 *
 * `data-studio-bay` rather than a class, and set here rather than by the shell:
 * the shell is what applies the world at runtime and it has not mounted yet, so
 * without this the skeleton would flash the app's own palette first. The
 * attribute selector matches any element, so putting it on this root is enough.
 */
export default function EditorLoading() {
  return (
    <div data-studio-bay className="flex h-dvh flex-col overflow-hidden bg-studio-deep">
      {/* The title block, with the two things it can already say: nothing. */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-studio-line bg-studio-deep pr-2 pl-3.5">
        <Skeleton className="size-4 rounded-[2px] bg-studio-surface" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-3 w-44 rounded-[2px] bg-studio-surface" />
          <Skeleton className="h-2 w-56 rounded-[2px] bg-studio-surface" />
        </div>
        <Skeleton className="h-7 w-20 rounded-[3px] bg-studio-surface" />
        <Skeleton className="h-7 w-16 rounded-[3px] bg-studio-surface" />
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden h-full w-58 shrink-0 flex-col border-r border-studio-line bg-studio-panel 2xl:flex">
          <div className="flex h-9 shrink-0 items-center border-b border-studio-line px-3">
            <Skeleton className="h-2 w-16 rounded-[2px] bg-studio-surface" />
          </div>
          <div className="border-b border-studio-line p-2">
            <Skeleton className="h-7 w-full rounded-[3px] bg-studio-surface" />
          </div>
          <div className="space-y-px p-1.5">
            {/* The wireframe rows the column will hold, at their real height. */}
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="flex items-center gap-2 px-1.5 py-1">
                <Skeleton className="h-6 w-10 shrink-0 rounded-[2px] bg-studio-surface" />
                <Skeleton
                  className="h-2.5 rounded-[2px] bg-studio-surface"
                  style={{ width: `${52 + ((index * 17) % 40)}%` }}
                />
              </div>
            ))}
          </div>
        </aside>

        {/* The wall, with the canvas hanging on it exactly where it will land. */}
        <div className="studio-field relative flex min-w-0 flex-1 flex-col px-10 pt-10 2xl:px-12 2xl:pt-12">
          <Skeleton className="studio-mount min-h-0 flex-1 rounded-none bg-studio-panel/60" />
          <div className="pointer-events-none absolute inset-x-0 bottom-3.5 flex justify-center">
            <Skeleton className="h-9 w-96 max-w-[80%] rounded-md bg-studio-deep/80" />
          </div>
        </div>

        <aside className="flex h-full w-76 shrink-0 flex-col border-l border-studio-line bg-studio-panel">
          <div className="space-y-1.5 border-b border-studio-line px-3 py-2.5">
            <Skeleton className="h-3 w-28 rounded-[2px] bg-studio-surface" />
            <Skeleton className="h-2 w-20 rounded-[2px] bg-studio-surface" />
          </div>
          <div className="flex h-8 items-center gap-6 border-b border-studio-line px-3">
            {[52, 44, 52, 32].map((width, index) => (
              <Skeleton key={index} className="h-2 rounded-[2px] bg-studio-surface" style={{ width }} />
            ))}
          </div>
          <div className="space-y-5 px-3 py-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-2 w-20 rounded-[2px] bg-studio-surface" />
                <Skeleton className="h-8 w-full rounded-[3px] bg-studio-surface" />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
