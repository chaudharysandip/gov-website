import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@edn/site-themes/components/ui/button";
import { StudioEditor } from "@/studio/components/StudioEditor";
import { getEditorBundle, StudioNotFound, themeIdFromParam } from "@/studio/lib/website";

export const metadata = {
  title: "Editor · Website Studio",
  robots: { index: false, follow: false },
};

function NotFound({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md text-center">
        <AlertTriangle className="mx-auto mb-3 size-6 text-muted-foreground" aria-hidden />
        <h1 className="text-lg font-semibold">That website could not be opened</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <Button asChild className="mt-5">
          <Link href="/studio">Back to all websites</Link>
        </Button>
      </div>
    </div>
  );
}

/**
 * Resolves everything the editor needs on the server, then hands it to the
 * client. The route reads the id, the accessor does the rest — no site is
 * hard-coded anywhere below this point.
 */
export default async function EditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ siteId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { siteId } = await params;
  const { theme } = await searchParams;

  let bundle;
  try {
    // `?theme=` opens this site on another template, the same way the live site
    // accepts it. The saved document records which theme it was made for, so
    // reopening on the site's own theme cannot inherit the wrong sections.
    bundle = await getEditorBundle(siteId, themeIdFromParam(theme));
  } catch (error) {
    if (error instanceof StudioNotFound) return <NotFound message={error.message} />;
    throw error;
  }

  if (!bundle.editorConfig.sections.length) {
    return (
      <NotFound
        message={`“${bundle.theme.name}” has no editable sections, so there is nothing for the editor to show.`}
      />
    );
  }

  return (
    <StudioEditor
      // A template switch is a change of query, not of route, so React would
      // keep this instance and its one-shot initialisation. The key is what
      // makes it a remount — which is also what Puck needs, since `data` is
      // its starting state and nothing else.
      key={bundle.site.themeId}
      site={bundle.site}
      theme={bundle.theme}
      editorConfig={bundle.editorConfig}
      content={bundle.content}
      contentSource={bundle.contentSource}
      themes={bundle.themes}
    />
  );
}
