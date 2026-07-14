import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { CsrfBootstrap } from "@/components/CsrfBootstrap";
import { TranslationProvider } from "@/contexts/TranslationContext";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Aerodrom Tuzla - Statistika",
  description: "Airport Statistics Management System for Tuzla International Airport",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bs" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TranslationProvider>
            <CsrfBootstrap />
            {children}
          </TranslationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
