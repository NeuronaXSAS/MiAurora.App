import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Image optimization - aggressive for mobile
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "**.convex.cloud",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
    // Mobile-first device sizes
    deviceSizes: [375, 414, 640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Minimize image quality for faster loading on slow networks
    minimumCacheTTL: 31536000, // 1 year cache
  },

  // Experimental features for performance
  experimental: {
    // Optimize package imports - tree shaking for smaller bundles
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "framer-motion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
      "@radix-ui/react-select",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-switch",
      "@radix-ui/react-slider",
      "@radix-ui/react-progress",
      "class-variance-authority",
    ],
  },

  // Compression
  compress: true,

  // Reduce powered by header
  poweredByHeader: false,

  // Security and caching headers
  async headers() {
    return [
      {
        // Security headers for all routes
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(self), geolocation=(self)",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy",
            // In development, we need 'unsafe-eval' for hot reloading
            // In production, we remove it for better security
            value: isDev
              ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://www.googletagmanager.com https://pagead2.googlesyndication.com https://*.posthog.com https://us-assets.i.posthog.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.mapbox.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https: http:; media-src 'self' blob: https://res.cloudinary.com; connect-src 'self' https://*.convex.cloud https://api.mapbox.com https://events.mapbox.com https://*.posthog.com https://us.i.posthog.com https://us-assets.i.posthog.com https://api.search.brave.com https://generativelanguage.googleapis.com wss://*.convex.cloud; worker-src 'self' blob:; frame-src 'self' https://www.google.com https://checkout.stripe.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.googletagmanager.com https://pagead2.googlesyndication.com; frame-ancestors 'self';"
              : "default-src 'self'; script-src 'self' 'unsafe-inline' blob: https://www.googletagmanager.com https://pagead2.googlesyndication.com https://*.posthog.com https://us-assets.i.posthog.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.mapbox.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https: http:; media-src 'self' blob: https://res.cloudinary.com; connect-src 'self' https://*.convex.cloud https://api.mapbox.com https://events.mapbox.com https://*.posthog.com https://us.i.posthog.com https://us-assets.i.posthog.com https://api.search.brave.com https://generativelanguage.googleapis.com wss://*.convex.cloud; worker-src 'self' blob:; frame-src 'self' https://www.google.com https://checkout.stripe.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.googletagmanager.com https://pagead2.googlesyndication.com; frame-ancestors 'self';",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        // Aggressive caching for static assets
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|ico|woff|woff2)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache JS/CSS chunks
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
