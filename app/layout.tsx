import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppFooter } from "@/components/shared/AppFooter";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Portal de soporte", template: "%s | Portal de soporte" },
  description: "Gestión de folios, clientes, cadenas y seguimiento operativo.",
  applicationName: "Portal de soporte",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <script dangerouslySetInnerHTML={{ __html: `try{const t=localStorage.getItem('support-theme');const d=t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.dataset.theme=d?'dark':'light'}catch{}` }} />
        <div className="app-shell-content flex flex-1 flex-col">{children}</div>
        <AppFooter />
      </body>
    </html>
  );
}
