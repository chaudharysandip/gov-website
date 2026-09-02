import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@edn/site-themes/components/ui/button";
import { StudioPreview } from "@/studio/components/StudioPreview";
import { getEditorBundle, StudioNotFound, themeIdFromParam } from "@/studio/lib/website";

export const metadata = {
  title: "Preview · Website Studio",
  robots: { index: false, follow: false },
};

/**
 * The site as it would be published: the theme's own header, sections and
 * footer, with the saved edits applied and nothing of the editor around it.
 *
 * `?chrome=off` drops even the preview controls — that is the URL the device
 * frames load in their iframe, and the one to open to see the page bare.
 * `?draft=` reads the editor's unsaved work instead of the last save.
 */
export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { siteId } = await params;
  const { chrome, theme, draft } = await searchParams;

  let bundle;
  try {
    bundle = await getEditorBundle(siteId, themeIdFromParam(theme));
  } catch (error) {
    if (error instanceof StudioNotFound) {
      return (
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="max-w-md text-center">
            <AlertTriangle className="mx-auto mb-3 size-6 text-muted-foreground" aria-hidden />
            <h1 className="text-lg font-semibold">Nothing to preview</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
            <Button asChild className="mt-5">
              <Link href="/studio">Back to all websites</Link>
            </Button>
          </div>
        </div>
      );
    }
    throw error;
  }

  return (
    <StudioPreview
      site={bundle.site}
      editorConfig={bundle.editorConfig}
      content={bundle.content}
      showControls={chrome !== "off"}
      // `?draft=` is the editor's motion preview asking for the work in
      // progress rather than the last save. Its value is the draft's stamp,
      // which is what makes a second play reload this route.
      draft={Boolean(draft)}
    />
  );
}
