import type { Metadata } from "next";
import "./globals.css";
import { SITE_URL } from "@/lib/site-config";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "WorthMove — True Hourly Wage, RTO vs Remote & Job-Switch Receipt",
    template: "%s | WorthMove",
  },
  description:
    "Calculate your real after-tax hourly wage after commuting, unpaid overtime, and transit costs. Generate a shareable job-switch audit receipt.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
