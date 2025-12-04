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
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Aurora",
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
        <link rel="icon" href="/Au_Logo_1.png" />
        <link rel="apple-touch-icon" href="/Au_Logo_1.png" />
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
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('[Aurora] Service Worker registered:', registration.scope);
                    },
                    function(err) {
                      console.log('[Aurora] Service Worker registration failed:', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
