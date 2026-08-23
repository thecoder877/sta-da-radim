import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { APP_NAME } from "@/lib/constants";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — AI planer putovanja po Srbiji`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Otkrij Srbiju uz AI planer koji ti pravi putovanje prema vremenu, budžetu i interesovanjima.",
  openGraph: {
    title: `${APP_NAME} — AI planer putovanja po Srbiji`,
    description:
      "Personalizovani izleti i vikendi od Fruške gore do Tare, iz sopstvene baze mesta.",
    locale: "sr_Latn_RS",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="sr-Latn"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
