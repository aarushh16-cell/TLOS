import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { GlobalUI } from "@/components/GlobalUI";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TLOS: The Market Simulation",
  description: "Live Hackathon Business Competition",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[var(--background)] text-[var(--foreground)] antialiased transition-colors duration-300`} id="main-content">
        <Providers>
          {children}
          <GlobalUI />
        </Providers>
      </body>
    </html>
  );
}
