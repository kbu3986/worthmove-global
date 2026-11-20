import type { MetadataRoute } from "next";
import {
  ALL_SALARY_SLUGS,
  COMMUTE_MINUTES_LIST,
  KOREAN_COMMUTE_ROUTES,
  RTO_SCENARIOS,
} from "@/lib/pseo-data";
import { LOCALES, SITE_URL } from "@/lib/site-config";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  const pushBilingual = (subpath: string, priority: number) => {
    const clean = subpath
      ? subpath.startsWith("/")
        ? subpath
        : `/${subpath}`
      : "";
    for (const locale of LOCALES) {
      entries.push({
        url: `${SITE_URL}/${locale}${clean}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority,
        alternates: {
          languages: {
            en: `${SITE_URL}/en${clean}`,
            ko: `${SITE_URL}/ko${clean}`,
            "x-default": `${SITE_URL}/en${clean}`,
          },
        },
      });
    }
  };

  // 1. Home & Trust/Compliance pages (/en, /ko, /about, /privacy)
  pushBilingual("", 1.0);
  pushBilingual("/about", 0.7);
  pushBilingual("/privacy", 0.6);

  // 2. Salary brackets (USD + KRW Manwon)
  for (const amount of ALL_SALARY_SLUGS) {
    pushBilingual(`/salary/${amount}`, 0.85);
  }

  // 3. RTO vs Remote comparison pages
  for (const s of RTO_SCENARIOS) {
    pushBilingual(`/rto-vs-remote/${s.rtoSalaryUSD}`, 0.85);
  }

  // 4. Commute duration pages
  for (const m of COMMUTE_MINUTES_LIST) {
    pushBilingual(`/commute/${m}`, 0.8);
  }

  // 5. Korean Commuter Corridors
  for (const r of KOREAN_COMMUTE_ROUTES) {
    pushBilingual(`/route/${r.slug}`, 0.85);
  }

  return entries;
}
