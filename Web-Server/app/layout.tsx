import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from 'next/script';
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Admin Map Dashboard",
  description: "Admin login and mapping application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
          integrity="sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A=="
          crossOrigin=""
        />
      </head>
      <body className={geist.className}>
        <Script
          src="https://apis.mapmyindia.com/advancedmaps/v1/2d0d8055e3dd6e6ed5011fd490f2dc3a/map_load?v=1.5"
          strategy="beforeInteractive"
        />
        <Script
          src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}
