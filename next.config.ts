import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * `@edn/site-themes` ships TypeScript source rather than a build output — the
   * nineteen themes, the UI kit and the WMS service layer, shared with the
   * school website app. Next has to compile it like first-party code, which is
   * the point: editing a theme shows up in both apps on the next hot reload,
   * with no build step between them for someone to forget to run.
   */
  transpilePackages: ["@edn/site-themes"],

  /**
   * That package is a `link:` dependency beside this project, so its symlink
   * resolves outside the app directory. Turbopack will not read files above its
   * root, so the root has to be the common parent of both.
   */
  turbopack: {
    root: path.join(import.meta.dirname, ".."),
  },

  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.16.*.*", "172.17.*.*"],

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@radix-ui/react-navigation-menu",
      "@radix-ui/react-dialog",
      "radix-ui",
      "yet-another-react-lightbox",
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // An editing tool must not be cached by a shared proxy or indexed.
          // The routes already carry `robots: { index: false }`; this covers
          // the assets and the API of the crawler that ignores it.
          { key: "Cache-Control", value: "no-store, private" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Referrer-Policy", value: "same-origin" },
        ],
      },
    ];
  },

  /**
   * Matches the website app. The canvas renders real tenant media straight from
   * whatever host a school uploaded it to, and optimising every image a tenant
   * has ever uploaded is not what an editor is for.
   */
  images: {
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: "https", hostname: "**", pathname: "/**" },
      { protocol: "http", hostname: "**", pathname: "/**" },
    ],
  },
};

export default nextConfig;
