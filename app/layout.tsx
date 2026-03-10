import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";

import { getThemeFromCookies } from "@/lib/theme";

const displayFont = Fraunces({
  variable: "--font-brand-display",
  subsets: ["latin"],
});

const bodyFont = Instrument_Sans({
  variable: "--font-brand-sans",
  subsets: ["latin"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-brand-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "FarmAlmacen",
  description: "Gestion de inventario y movimientos para almacenes de farmacias",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getThemeFromCookies();

  return (
    <html lang="es" className={theme === "dark" ? "dark" : ""}>
      <body className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
