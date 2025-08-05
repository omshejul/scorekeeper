import type { Metadata } from "next";
import { Figtree, Silkscreen } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";



const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Score Keeper",
  description:
    "Keep track of scores and stats for your games and matches. Built with Next.js, React, and Tailwind CSS.",
  keywords: [
    "sports",
    "scoring",
    "stats",
    "games",
    "matches",
    "score tracking",
  ],
  authors: [{ name: "Om Shejul" }],
  creator: "Om Shejul",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-64x64.png", sizes: "64x64", type: "image/png" },
      { url: "/favicon-128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/favicon-256x256.png", sizes: "256x256", type: "image/png" },
      { url: "/favicon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      {
        url: "/apple-touch-icon-precomposed.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    title: "Score Keeper",
    description: "Keep track of scores and stats for your games and matches",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={` ${figtree.variable} ${silkscreen.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
