import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GameConnectionProvider } from "@/components/GameConnectionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cryptopoli - The Crypto Trading Game",
  description: "A crypto-themed Monopoly game with multiplayer support",
  keywords: ["monopoly", "crypto", "game", "multiplayer", "bitcoin", "ethereum"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GameConnectionProvider>{children}</GameConnectionProvider>
      </body>
    </html>
  );
}
