import type { Metadata } from "next";
import { Cairo, Inter } from "next/font/google";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { LocaleProvider } from "@/providers/locale-provider"; // ✅ هذا صحيح
import { CartProvider } from "@/providers/cart-provider";
import { Toaster } from "sonner";
import { siteConfig } from "@/config/site";
import { PWARegister } from "@/components/pwa-register";
import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: siteConfig.name,
  },
  openGraph: {
    type: "website",
    locale: "ar_EG", // ✅ تغيير إلى العربية
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ar" // ✅ تغيير إلى العربية كافتراضي
      dir="rtl" // ✅ اتجاه RTL
      suppressHydrationWarning
      className={`${inter.variable} ${cairo.variable}`}
    >
      <body className="min-h-screen bg-background font-arabic antialiased">
        <PWARegister />
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <LocaleProvider> {/* ✅ موجود في المكان الصحيح */}
              <CartProvider>
                {children}
                <Toaster 
                  position="bottom-left" // ✅ تغيير لـ RTL
                  richColors 
                  closeButton 
                />
              </CartProvider>
            </LocaleProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
