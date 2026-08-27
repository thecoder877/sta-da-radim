import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { UtmTracker } from "@/components/analytics/UtmTracker";
import { AuthModalProvider } from "@/components/auth/AuthModalProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { CompleteUsername } from "@/components/auth/CompleteUsername";
import { BackToTop } from "@/components/layout/BackToTop";
import { CookieBanner } from "@/components/layout/CookieBanner";
import { FloatingContact } from "@/components/layout/FloatingContact";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { ScrollProgress } from "@/components/layout/ScrollProgress";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
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
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main-content"
          className="sr-only rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
        >
          Preskoči na sadržaj
        </a>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ScrollProgress />
          <AuthProvider>
            <AuthModalProvider>
              <Navbar />
              <CompleteUsername />
              <main id="main-content" className="flex-1">
                {children}
              </main>
              <Footer />
              <BackToTop />
              <FloatingContact />
              <CookieBanner />
            </AuthModalProvider>
          </AuthProvider>
          <UtmTracker />
        </ThemeProvider>
      </body>
    </html>
  );
}
