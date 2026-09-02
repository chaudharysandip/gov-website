"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@edn/site-themes/components/ui/button";

/**
 * The studio's error boundary.
 *
 * The themes it renders pull in WebGL, GSAP and a dozen carousels. One of them
 * throwing has to end in a page that explains itself and offers a way out, not
 * in a blank document — and never in the whole app going down with it.
 */
export default function StudioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <AlertTriangle className="mx-auto mb-3 size-6 text-destructive" aria-hidden />
        <h1 className="text-lg font-semibold">The studio hit a problem</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your saved work is untouched — it is stored separately from this page.
        </p>
        {error?.message ? (
          <pre className="mt-4 max-h-40 overflow-auto rounded-md border bg-muted/50 p-3 text-left text-[11px] leading-relaxed text-muted-foreground">
            {error.message}
          </pre>
        ) : null}
        <div className="mt-5 flex items-center justify-center gap-2">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" asChild>
            <Link href="/studio">All websites</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
