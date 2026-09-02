import type { ReactNode } from "react";
import { ThemeProvider } from "@edn/site-themes/components/shared/theme-provider";
import { Toaster } from "@edn/site-themes/components/ui/sonner";
import { localFontVariables } from "@edn/site-themes/lib/fonts";
import "./globals.css";

export const metadata = {
  title: "Website Studio",
  description: "Visual editor for the school website themes.",
  robots: { index: false, follow: false },
};

/**
 * The studio's root layout.
 *
 * Deliberately thin. The website app's root layout resolves a tenant from the
 * request host and wraps every page in that tenant's theme header and footer;
 * the studio is not a tenant page — it renders whichever site you are editing
 * inside a canvas of its own — so there is nothing here but the font variables,
 * the colour scheme and a toaster.
 *
 * The editor reads live tenant content per request through `getDomainConfig`,
 * so nothing under this layout can be prerendered.
 */
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${localFontVariables} antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
