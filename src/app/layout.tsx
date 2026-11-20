import type { Metadata } from "next";
import "./globals.css";
import { SITE_URL } from "@/lib/site-config";
import {
  extractMetaContent,
  normalizeAdsenseClientId,
} from "@/lib/monetization-env";

const adsenseId = normalizeAdsenseClientId(process.env.NEXT_PUBLIC_ADSENSE_ID);
const gscVerification = extractMetaContent(
  process.env.NEXT_PUBLIC_GSC_VERIFICATION
);
const naverVerification = extractMetaContent(
  process.env.NEXT_PUBLIC_NAVER_VERIFICATION
);

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
      <head>
        {adsenseId ? (
          <>
            <meta name="google-adsense-account" content={adsenseId} />
            <script
              async
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
              crossOrigin="anonymous"
            />
          </>
        ) : null}
        {gscVerification ? (
          <meta name="google-site-verification" content={gscVerification} />
        ) : null}
        {naverVerification ? (
          <meta name="naver-site-verification" content={naverVerification} />
        ) : null}
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
