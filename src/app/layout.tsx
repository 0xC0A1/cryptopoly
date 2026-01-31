import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { GameConnectionProvider } from "@/components/GameConnectionProvider";
import { GAME_NAME, GAME_TAGLINE } from "@/lib/game/constants";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: `${GAME_NAME} - ${GAME_TAGLINE}`,
  description: `A crypto-themed Monopoly game with multiplayer support`,
  keywords: ["monopoly", "crypto", "game", "multiplayer", "bitcoin", "ethereum"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-sans antialiased`}>
        <GameConnectionProvider>{children}</GameConnectionProvider>
      </body>
    </html>
  );
}
