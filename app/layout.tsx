import type { Metadata } from "next";
import { IBM_Plex_Mono, Lilita_One, Work_Sans } from "next/font/google";
import "./globals.css";

const lilitaOne = Lilita_One({
  variable: "--font-lilita-one",
  weight: "400",
  subsets: ["latin"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "cine-tracker", template: "%s · cine-tracker" },
  description:
    "Every showtime near you across AMC, Regal, Alamo and local theaters, in one place.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${lilitaOne.variable} ${workSans.variable} ${plexMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
