import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans'
import Script from 'next/script';
import "./globals.css";

export const metadata: Metadata = {
  title: "garuda",
  description: "Admin login portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={GeistSans.className}>
      <head>
        <Script
          src="https://gallimap.com/static/dist/js/gallimaps.vector.min.latest.js"
          strategy="beforeInteractive"
          id="galli-maps"
        />
      </head>
      <body className="bg-black">
        {children}
      </body>
    </html>
  )
}
