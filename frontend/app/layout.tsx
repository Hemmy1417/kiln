import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Nav } from "@/components/Nav";
import { NetworkBanner } from "@/components/NetworkBanner";
import { LiveBackdrop } from "@/components/LiveBackdrop";
import { CONTRACT_ADDRESS, explorerAddressUrl } from "@/lib/config";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KILN — the adjudicated NFT launchpad",
  description:
    "Every collection passes AI validator review before it can mint. Reports are ruled by consensus, critical rulings freeze and refund. Trust, adjudicated on GenLayer.",
  openGraph: {
    title: "KILN — the adjudicated NFT launchpad on GenLayer",
    description:
      "Collections vetted before launch, ownership created at mint, disputes ruled by AI consensus, holders protected by a live refund pool.",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#0b0e11" };

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${plexMono.variable}`}>
      <body className="min-h-screen flex flex-col">
        <LiveBackdrop />
        <Providers>
          <Nav />
          <NetworkBanner />
          <main className="flex-1 relative">{children}</main>
          <footer className="mt-16 border-t border-hairline" style={{ background: "rgba(11, 14, 17, 0.8)" }}>
            <div className="mx-auto max-w-6xl px-5 py-6 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="eyebrow">Adjudicated on GenLayer · Studionet</span>
              <span className="text-muted">
                AI launch review · consensus-ruled reports · holder refund pool ·{" "}
                <a
                  href={explorerAddressUrl(CONTRACT_ADDRESS)}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-ivory"
                >
                  Verify on explorer ↗
                </a>
              </span>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
