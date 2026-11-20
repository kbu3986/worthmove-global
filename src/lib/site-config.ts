import type { Metadata } from "next";

export type Locale = "en" | "ko";

export const LOCALES: Locale[] = ["en", "ko"];

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://kbu3986.github.io/worthmove-global";

export const SITE_NAME: Record<Locale, string> = {
  en: "WorthMove",
  ko: "이직손익판독기 WorthMove",
};

export const SITE_TAGLINE: Record<Locale, string> = {
  en: "True Hourly Wage, RTO vs Remote & Job-Switch Receipt Calculator",
  ko: "내 진짜 시급 & 통근·야근 팩폭 영수증 (2026 실수령액 자동 계산)",
};

export function isValidLocale(val: string): val is Locale {
  return val === "en" || val === "ko";
}

export function buildPageMetadata({
  locale,
  pathWithoutLocale,
  title,
  description,
  keywords,
}: {
  locale: Locale;
  pathWithoutLocale: string;
  title: string;
  description: string;
  keywords?: string[];
}): Metadata {
  const cleanSubpath = pathWithoutLocale.startsWith("/")
    ? pathWithoutLocale
    : pathWithoutLocale
      ? `/${pathWithoutLocale}`
      : "";

  const enUrl = `${SITE_URL}/en${cleanSubpath}`;
  const koUrl = `${SITE_URL}/ko${cleanSubpath}`;
  const canonicalUrl = locale === "ko" ? koUrl : enUrl;

  return {
    title,
    description,
    keywords,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: enUrl,
        ko: koUrl,
        "x-default": enUrl,
      },
    },
    openGraph: {
      type: "website",
      url: canonicalUrl,
      siteName: SITE_NAME[locale],
      title,
      description,
      locale: locale === "ko" ? "ko_KR" : "en_US",
      alternateLocale: locale === "ko" ? ["en_US"] : ["ko_KR"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
