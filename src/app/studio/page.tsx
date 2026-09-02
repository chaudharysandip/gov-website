import { ThemeGallery } from "@/studio/components/ThemeGallery";
import { listThemes, listWebsites } from "@/studio/lib/website";

/**
 * The studio index. Reads through the data-access layer rather than importing
 * the static files, so this page is unchanged the day the data comes from an
 * API instead.
 */
export default async function StudioIndexPage() {
  const [sites, themes] = await Promise.all([listWebsites(), listThemes()]);

  return <ThemeGallery sites={sites} themes={themes} />;
}
