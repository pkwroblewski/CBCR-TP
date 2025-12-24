import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { DevModeBanner } from "@/components/layout/DevModeBanner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// =============================================================================
// METADATA
// =============================================================================

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://cbcr-review.com'),
  title: {
    default: "PW-(CbCR) Analyzer - Country-by-Country Report Validation",
    template: "%s | PW-(CbCR) Analyzer",
  },
  description:
    "Validate your Country-by-Country Reports against OECD BEPS Action 13 requirements, country-specific rules, and Pillar 2 compliance. Ensure CbCR XML compliance before filing.",
  keywords: [
    "CbCR",
    "Country-by-Country Report",
    "BEPS",
    "Action 13",
    "OECD",
    "Tax Compliance",
    "XML Validation",
    "Pillar 2",
    "GloBE Rules",
    "Transfer Pricing",
    "Luxembourg",
    "Tax Reporting",
    "Multinational Enterprise",
    "MNE",
  ],
  authors: [{ name: "PW-(CbCR) Analyzer Team" }],
  creator: "PW-(CbCR) Analyzer",
  publisher: "PW-(CbCR) Analyzer",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cbcr-review.com",
    siteName: "PW-(CbCR) Analyzer",
    title: "PW-(CbCR) Analyzer - Country-by-Country Report Validation",
    description:
      "Validate CbCR XML files against OECD requirements, country-specific rules, and Pillar 2 compliance. Professional tax compliance tool for multinational enterprises.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PW-(CbCR) Analyzer - Country-by-Country Report Validation Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PW-(CbCR) Analyzer - Country-by-Country Report Validation",
    description:
      "Validate CbCR XML files against OECD requirements and Pillar 2 compliance.",
    images: ["/og-image.png"],
    creator: "@cbcrreview",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://cbcr-review.com",
  },
  category: "Business",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// =============================================================================
// ROOT LAYOUT
// =============================================================================

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {/* Development mode banner - only shows when auth bypass is enabled */}
        <DevModeBanner />

        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="skip-to-main sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-foreground"
        >
          Skip to main content
        </a>

        {/* Main content */}
        <div id="main-content">
          {children}
        </div>
        
        {/* Toast notifications */}
        <Toaster 
          position="top-right" 
          richColors 
          closeButton
          toastOptions={{
            duration: 5000,
          }}
        />
      </body>
    </html>
  );
}
