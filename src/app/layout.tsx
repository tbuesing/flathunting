import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flathunting Sydney",
  description: "Vergleichsliste für Zimmerangebote in Sydney.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
