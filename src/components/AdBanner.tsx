"use client";

import { useEffect } from "react";
import type { Locale } from "@/lib/site-config";
import { normalizeAdsenseClientId } from "@/lib/monetization-env";

interface AdBannerProps {
  locale: Locale;
  slot?: string;
  position?: "above-fold" | "below-receipt";
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export default function AdBanner({
  locale,
  slot = "9283746501",
  position = "above-fold",
}: AdBannerProps) {
  const adsenseClientId = normalizeAdsenseClientId(
    process.env.NEXT_PUBLIC_ADSENSE_ID
  );

  useEffect(() => {
    if (adsenseClientId && typeof window !== "undefined") {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // Ignore duplicate push on hot reload
      }
    }
  }, [adsenseClientId]);

  return (
    <aside
      aria-label={locale === "ko" ? "스폰서 광고 영역" : "Sponsored Advertisement"}
      className="my-6 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs"
    >
      <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        <span>{locale === "ko" ? "AD · 금융/커리어 스폰서" : "ADVERTISEMENT · FINANCE"}</span>
        <span>{position === "above-fold" ? "TOP SLOT" : "RECEIPT FOOTER SLOT"}</span>
      </div>

      {adsenseClientId ? (
        <div className="min-h-[90px] w-full overflow-hidden">
          <ins
            className="adsbygoogle block"
            style={{ display: "block", minHeight: "90px" }}
            data-ad-client={adsenseClientId}
            data-ad-slot={slot}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      ) : (
        <div className="flex min-h-[88px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-gradient-to-r from-slate-50 via-emerald-50/40 to-slate-50 px-4 py-3 text-center">
          <p className="text-xs font-bold text-slate-700">
            {locale === "ko"
              ? position === "above-fold"
                ? "연봉 협상 & 직장인 마이너스통장·퇴직연금(IRP) 세액공제 한도 비교"
                : "직장인 대환대출 금리 비교 · K-패스/알뜰교통 체크카드 캐시백 혜택"
              : position === "above-fold"
                ? "Compare High-Yield Savings (4.5%+ APY) & 401(k) Rollover Fee Analyzers"
                : "Salary Negotiation Coaching & Remote-First Tech Job Boards"}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {locale === "ko"
              ? "Google AdSense 금융·커리어 고단가 광고 슬롯 (NEXT_PUBLIC_ADSENSE_ID 연동 준비 완료)"
              : "AdSense Finance Display Unit Ready (Configure NEXT_PUBLIC_ADSENSE_ID in env)"}
          </p>
        </div>
      )}
    </aside>
  );
}
