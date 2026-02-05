import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import "@/app/global.css";

import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
} from "@clerk/nextjs";

import { ConvexProviderWithClerk } from "convex/react-clerk";
import AppProviders from "./providers";

import { LanguageProvider } from "@/components/language-provider";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });


export const metadata: Metadata = {
  title: "TFM - Chap Chap",
  description: "A platform to help you manage your money",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AppProviders>
      <LanguageProvider>
        <html lang="en" className={`${figtree.variable} ${figtree.variable} antialiased`}>
          <body>
            {children}
          </body>
        </html>
      </LanguageProvider>
    </AppProviders>
  );
}
