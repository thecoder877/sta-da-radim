import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { AuthModalProvider } from "@/components/auth/AuthModalProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { CompleteUsername } from "@/components/auth/CompleteUsername";
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
    default: `${APP_NAME} — Planer putovanja po Srbiji`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "Otkrij Srbiju po svom ritmu. Planiraj izlet ili vikend prema vremenu, budžetu i interesovanjima, od stvarnih mesta.",
  openGraph: {
    title: `${APP_NAME} — Planer putovanja po Srbiji`,
    description:
      "Personalizovani izleti i vikendi od Fruške gore do Tare, iz stvarnih mesta a ne izmišljenih tačaka.",
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
        <AuthProvider>
          <AuthModalProvider>
            <Navbar />
            <CompleteUsername />
            <main className="flex-1">{children}</main>
            <Footer />
          </AuthModalProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
