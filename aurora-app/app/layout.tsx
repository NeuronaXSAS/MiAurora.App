import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { CookieConsent } from "@/components/cookie-consent";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3d0d73",
};

export const metadata: Metadata = {
  title: "Aurora App - The Front Page of the Internet for Women",
  description: "A community-driven platform where women share intelligence and unlock opportunities",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/Au_Logo_1.png", type: "image/png" },
    ],
    apple: [
      { url: "/Au_Logo_1.png", type: "image/png" },
    ],
    shortcut: "/Au_Logo_1.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Aurora App",
  },
  openGraph: {
    title: "Aurora App - Safety & Community for Women",
    description: "Join millions of women sharing safety intelligence and unlocking opportunities worldwide",
    type: "website",
    locale: "en_US",
    siteName: "Aurora App",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aurora App - Safety & Community for Women",
    description: "Join millions of women sharing safety intelligence and unlocking opportunities worldwide",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/Au_Logo_1.png" sizes="any" />
        <link rel="icon" type="image/png" href="/Au_Logo_1.png" sizes="32x32" />
        <link rel="icon" type="image/png" href="/Au_Logo_1.png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/Au_Logo_1.png" sizes="180x180" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="google-adsense-account" content="ca-pub-9358935810206071" />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9358935810206071"
          crossOrigin="anonymous"
        />
      </head>
      <body className={inter.className}>
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>
        <Providers>
          {children}
          <CookieConsent />
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Service Worker Registration with Update Handling
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('[Aurora] Service Worker registered:', registration.scope);
                      
                      // Check for updates periodically
                      setInterval(function() {
                        registration.update();
                      }, 60000); // Check every minute
                      
                      // Handle updates
                      registration.addEventListener('updatefound', function() {
                        var newWorker = registration.installing;
                        if (newWorker) {
                          newWorker.addEventListener('statechange', function() {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                              console.log('[Aurora] New version available');
                              // Show update notification or auto-reload
                              if (window.confirm('Aurora App has been updated. Reload to get the latest version?')) {
                                window.location.reload();
                              }
                            }
                          });
                        }
                      });
                    },
                    function(err) {
                      console.log('[Aurora] Service Worker registration failed:', err);
                    }
                  );
                  
                  // Listen for SW messages (e.g., cache cleared)
                  navigator.serviceWorker.addEventListener('message', function(event) {
                    if (event.data && event.data.type === 'SW_UPDATED') {
                      console.log('[Aurora] SW updated to version:', event.data.version);
                    }
                  });
                });
              }
              
              // Handle chunk load errors - auto reload on stale chunks
              window.addEventListener('error', function(event) {
                var isChunkError = event.message && (
                  event.message.includes('Loading chunk') ||
                  event.message.includes('Failed to load chunk') ||
                  event.message.includes('ChunkLoadError')
                );
                
                if (isChunkError) {
                  console.warn('[Aurora] Chunk load error detected, clearing cache and reloading...');
                  
                  // Clear caches and reload
                  if ('caches' in window) {
                    caches.keys().then(function(names) {
                      return Promise.all(names.map(function(name) {
                        return caches.delete(name);
                      }));
                    }).then(function() {
                      window.location.reload(true);
                    });
                  } else {
                    window.location.reload(true);
                  }
                }
              });
              
              // Handle unhandled promise rejections for chunk errors
              window.addEventListener('unhandledrejection', function(event) {
                var reason = event.reason;
                var isChunkError = reason && reason.message && (
                  reason.message.includes('Loading chunk') ||
                  reason.message.includes('Failed to load chunk') ||
                  reason.message.includes('ChunkLoadError')
                );
                
                if (isChunkError) {
                  console.warn('[Aurora] Chunk promise rejection, clearing cache and reloading...');
                  event.preventDefault();
                  
                  if ('caches' in window) {
                    caches.keys().then(function(names) {
                      return Promise.all(names.map(function(name) {
                        return caches.delete(name);
                      }));
                    }).then(function() {
                      window.location.reload(true);
                    });
                  } else {
                    window.location.reload(true);
                  }
                }
              });
            `,
          }}
        />
      </body>
    </html>
  );
}
