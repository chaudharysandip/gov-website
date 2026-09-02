/**
 * The studio's own shell.
 *
 * The root layout resolves a tenant from the request host and wraps everything
 * in that tenant's theme header and footer. The studio is not a tenant page —
 * it renders whichever site you chose, inside a canvas — so `LayoutContent`
 * steps aside for `/studio/*` and this takes over. See `src/proxy.js` for how
 * the path reaches a server layout.
 */

export const metadata = {
  title: "Website Studio",
  description: "Visual editor for the existing website themes.",
  robots: { index: false, follow: false },
};

export default function StudioLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>;
}import type { ReactNode } from "react";

