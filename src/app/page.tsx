import { redirect } from "next/navigation";

/**
 * This app is the studio and nothing else, but the routes keep their `/studio`
 * prefix so every link inside the editor — and every bookmark someone already
 * has — resolves unchanged. The root is a redirect rather than a second copy of
 * the gallery, so there is one canonical URL for it.
 */
export default function RootPage() {
  redirect("/studio");
}
