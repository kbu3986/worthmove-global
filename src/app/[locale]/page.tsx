import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BadgeDollarSign,
  Building2,
  Clock,
  MapPin,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import WorthMoveCalculator from "@/components/WorthMoveCalculator";
import AffiliateCards from "@/components/AffiliateCards";
import JsonLd from "@/components/JsonLd";
import {
  COMMUTE_MINUTES_LIST,
  EN_SALARY_BRACKETS,
  KO_SALARY_BRACKETS,
  KOREAN_COMMUTE_ROUTES,
  RTO_SCENARIOS,
} from "@/lib/pseo-data";
import {
  buildPageMetadata,
  isValidLocale,
  SITE_URL,
} from "@/lib/site-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};

  if (locale === "ko") {
    return buildPageMetadata({
      locale: "ko",
      pathWithoutLocale: "",
      title:
        "이직손익판독기 (WorthMove) — 2026 내 진짜 시급 & 통근·야근 팩폭 영수증",
      description:
        "연봉 1,000만원 올려도 출퇴근 왕복 2시간이면 오히려 손해? 2026년 4대보험·근로소득세 실수령액, 길바닥 헌납 시간, 교통비를 모두 반영한 진짜 시급과 본전 연봉을 계산하고 영수증 PNG로 공유하세요.",
      keywords: [
        "이직 연봉 계산기",
        "2026 연봉 실수령액",
        "내 진짜 시급",
        "출퇴근 시간 비용",
        "재택근무 출근 전환 연봉",
        "이직 손익분기점",
      ],
    });
  }

  return buildPageMetadata({
    locale: "en",
    pathWithoutLocale: "",
    title:
      "WorthMove — True Hourly Wage, RTO vs Remote & Job-Switch Receipt Calculator",
    description:
      "Is a $20k raise worth a 60-minute commute? Calculate your real 2026 after-tax hourly wage after taxes, gas/transit, commuting, and unpaid overtime—and download a viral audit receipt.",
    keywords: [
      "true hourly wage calculator",
      "RTO vs remote calculator",
      "is job offer worth commute",
      "real hourly rate after taxes and commute",
      "break even salary calculator",
    ],
  });
}

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const faqs =
    locale === "ko"
      ? [
          {
            q: "내 진짜 시급(실질 시급)은 어떻게 계산하나요?",
            a: "2026년 4대보험(국민연금 4.75%, 건강보험 3.545%, 장기요양보험, 고용보험)과 근로소득세·지방소득세를 뺀 세후 연봉에서 연간 교통·주유비를 차감하고 복지포인트를 더한 '실질 가처분 연소득'을, 연간 기본 근로시간(2,000시간) + 왕복 출퇴근 시간 + 무급 야근 시간의 합계로 나누어 산출합니다.",
          },
          {
            q: "풀재택에서 주 5일 출근(편도 1시간)으로 이직할 때 연봉을 얼마나 올려야 본전인가요?",
            a: "편도 60분(왕복 2시간) 주 5일 출근 시 연간 약 500시간(근로시간의 +25%)이 길바닥에서 추가로 소모됩니다. 연봉 인상분에는 한계 소득세율과 4대보험이 추가 부과되므로 통상 세전 연봉 기준 최소 30%~38% 이상 인상되어야 실질 시급 손해를 면할 수 있습니다.",
          },
          {
            q: "영수증 이미지(PNG) 저장과 결과 공유 링크는 무료인가요?",
            a: "네, 100% 무료이며 서버에 개인 연봉 데이터를 저장하지 않습니다. 공유 링크 복사 시 입력값이 URL 파라미터에 암호 없이 인코딩되어 블라인드, 카카오톡, 디시인사이드에서 동일한 영수증을 즉시 재현할 수 있습니다.",
          },
        ]
      : [
          {
            q: "How does WorthMove calculate True Hourly Wage?",
            a: "WorthMove starts with your 2026 after-tax net pay (accounting for federal, FICA, and state/country progressive brackets), adds annual perks/401(k) match, subtracts annual transit/gas/parking expenses, and divides by your total life hours invested (2,000 base work hours + round-trip commute hours + unpaid overtime hours).",
          },
          {
            q: "How much raise do I need to leave a remote job for a 5-day RTO offer?",
            a: "A 60-minute one-way commute adds 500 unpaid hours per year (+25% life time) plus $3,600–$6,000 in after-tax transit or driving costs. Because raises are taxed at your marginal bracket, most workers need a 30%–40% gross salary bump just to break even on true hourly pay.",
          },
          {
            q: "Does the PNG receipt or share link store my salary data on a server?",
            a: "No. Everything runs 100% client-side in your browser. The PNG receipt renders locally on HTML5 Canvas, and Share Links encode your numbers directly in URL query parameters.",
          },
        ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name:
        locale === "ko"
          ? "이직손익판독기 (WorthMove)"
          : "WorthMove — True Hourly Wage & RTO Calculator",
      url: `${SITE_URL}/${locale}`,
      applicationCategory: "FinanceApplication",
      operatingSystem: "All",
      inLanguage: locale === "ko" ? "ko-KR" : "en-US",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: locale === "ko" ? "KRW" : "USD",
      },
      description:
        locale === "ko"
          ? "2026 4대보험 실수령액 및 통근·야근 시간 반영 실질 시급 계산기 & 팩폭 영수증 생성기"
          : "Calculate real after-tax hourly pay after commute time, transit expenses, and RTO mandates.",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.a,
        },
      })),
    },
  ];

  return (
    <div>
      <JsonLd data={jsonLd} />

      {/* Hero Section */}
      <section className="mb-8 rounded-3xl bg-slate-900 px-6 py-9 text-white shadow-lg sm:px-10 sm:py-12">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-300">
            <Receipt className="h-3.5 w-3.5" />
            {locale === "ko"
              ? "2026 4대보험 개정 요율 · 통근 팩폭 영수증 자동 발급"
              : "2026 Tax Brackets · Instant Shareable Audit Receipt"}
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl leading-[1.15]">
            {locale === "ko" ? (
              <>
                연봉 올랐다고 좋아했는데,{" "}
                <span className="text-emerald-400">내 진짜 시급</span>은
                오히려 깎였다고?
              </>
            ) : (
              <>
                Is That Raise Real—Or Just{" "}
                <span className="text-emerald-400">Unpaid Highway Time</span>?
              </>
            )}
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-slate-300 sm:text-base">
            {locale === "ko"
              ? "세금·4대보험 증가분, 길바닥에 버리는 왕복 출퇴근 시간, K-패스/자차 유지비, 무급 야근까지 전부 까발려 드립니다. 이직 도장 찍기 전 10초 만에 손익분기 연봉을 확인하고 블라인드·단톡방용 팩폭 영수증을 뽑아보세요."
              : "Compare Current/Remote vs. New Offer/RTO side by side. Factor in progressive income taxes, gas/transit drain, round-trip commuting, and unpaid overtime to uncover your True Hourly Wage—and export a crisp thermal receipt."}
          </p>

          <div className="mt-5 flex flex-wrap gap-4 text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              {locale === "ko"
                ? "100% 브라우저 즉시 계산 (서버 저장 없음)"
                : "100% Client-Side Privacy"}
            </span>
            <span className="flex items-center gap-1.5">
              <BadgeDollarSign className="h-4 w-4 text-emerald-400" />
              {locale === "ko"
                ? "2026 국민연금(4.75%)·건보·소득세 자동 반영"
                : "US State + UK/CA/AU 2026 Progressive Taxes"}
            </span>
          </div>
        </div>
      </section>

      {/* Main Interactive Calculator + Receipt */}
      <WorthMoveCalculator locale={locale} />

      {/* Affiliate Survival Kit */}
      <AffiliateCards locale={locale} commuteMinutes={55} />

      {/* Programmatic SEO Explorer Hubs */}
      <section className="mt-14 space-y-10">
        {/* Hub 1: Salary Brackets */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-8">
          <div className="flex items-center gap-2 text-emerald-700">
            <BadgeDollarSign className="h-5 w-5" />
            <span className="text-xs font-extrabold uppercase tracking-wider">
              {locale === "ko"
                ? "2026 연봉별 실수령액 & 통근 시급 표"
                : "2026 Salary After-Tax & Commute Matrix"}
            </span>
          </div>
          <h2 className="mt-1.5 text-xl font-extrabold text-slate-900 sm:text-2xl">
            {locale === "ko"
              ? "연봉 3,000만원 ~ 1억 5,000만원 구간별 진짜 시급 바로가기"
              : "True Hourly Wage by Gross Salary ($40,000 – $250,000)"}
          </h2>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">
            {locale === "ko"
              ? "내 연봉을 클릭하면 2026년 4대보험 공제 후 월 실수령액과 통근 0분/30분/60분별 실질 시급을 확인할 수 있습니다."
              : "Select any gross salary bracket to inspect 2026 net monthly pay across states and compare 0-min remote vs. 30/60-min commutes."}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {(locale === "ko" ? KO_SALARY_BRACKETS : EN_SALARY_BRACKETS).map(
              (amt) => (
                <Link
                  key={amt}
                  href={`/${locale}/salary/${amt}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 tabular-nums transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-900"
                >
                  {locale === "ko"
                    ? amt >= 10000
                      ? `${(amt / 10000).toFixed(amt % 10000 === 0 ? 0 : 2)}억 (${amt.toLocaleString()}만)`
                      : `${amt.toLocaleString()}만원`
                    : `$${(amt / 1000).toFixed(0)}k`}
                </Link>
              )
            )}
          </div>
        </div>

        {/* Hub 2: Korean Commuter Corridors OR RTO vs Remote */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
            <div className="flex items-center gap-2 text-emerald-700">
              <MapPin className="h-5 w-5" />
              <span className="text-xs font-extrabold uppercase tracking-wider">
                {locale === "ko"
                  ? "수도권 36개 주요 출퇴근 노선 손익"
                  : "Seoul Metro 36 Commuter Corridors"}
              </span>
            </div>
            <h2 className="mt-1.5 text-lg font-extrabold text-slate-900 sm:text-xl">
              {locale === "ko"
                ? "우리 동네 ↔ 오피스 통근 본전 연봉 판독"
                : "Major Commuter Corridor Cost & Break-Even"}
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {KOREAN_COMMUTE_ROUTES.slice(0, 14).map((r) => (
                <Link
                  key={r.slug}
                  href={`/${locale}/route/${r.slug}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-emerald-500 hover:bg-emerald-50/50"
                >
                  <span className="truncate">
                    {locale === "ko"
                      ? `${r.originKo.split("(")[0]} ↔ ${r.destKo.split("·")[0]}`
                      : `${r.originEn.split(" (")[0]} ↔ ${r.destEn.split(" /")[0]}`}
                  </span>
                  <span className="ml-2 shrink-0 text-[11px] text-emerald-700">
                    {r.transitOneWayMin}m →
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
            <div className="flex items-center gap-2 text-emerald-700">
              <Building2 className="h-5 w-5" />
              <span className="text-xs font-extrabold uppercase tracking-wider">
                {locale === "ko"
                  ? "RTO 전면출근 vs 풀재택 연봉 대결"
                  : "5-Day RTO vs. Remote Showdowns"}
              </span>
            </div>
            <h2 className="mt-1.5 text-lg font-extrabold text-slate-900 sm:text-xl">
              {locale === "ko"
                ? "연봉 더 주는 출근직 vs 덜 받는 풀재택 승자는?"
                : "Is a Higher-Paying Office Job Worth Leaving Remote?"}
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {RTO_SCENARIOS.slice(0, 14).map((s) => (
                <Link
                  key={s.rtoSalaryUSD}
                  href={`/${locale}/rto-vs-remote/${s.rtoSalaryUSD}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-emerald-500 hover:bg-emerald-50/50"
                >
                  <span>
                    {locale === "ko"
                      ? `$${s.rtoSalaryUSD / 1000}k 출근 vs $${s.remoteSalaryUSD / 1000}k 재택`
                      : `$${s.rtoSalaryUSD / 1000}k RTO vs $${s.remoteSalaryUSD / 1000}k Remote`}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Hub 3: Commute Duration Pages */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
          <div className="flex items-center gap-2 text-emerald-700">
            <Clock className="h-5 w-5" />
            <span className="text-xs font-extrabold uppercase tracking-wider">
              {locale === "ko"
                ? "편도 통근 시간별 1년·5년·10년 인생 비용"
                : "1-Yr / 5-Yr / 10-Yr Commute Life Drain"}
            </span>
          </div>
          <h2 className="mt-1.5 text-lg font-extrabold text-slate-900 sm:text-xl">
            {locale === "ko"
              ? "편도 10분 ~ 120분 통근이 앗아가는 시간과 기회비용"
              : "True Life & Compounding Wealth Cost of Your One-Way Commute"}
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {COMMUTE_MINUTES_LIST.map((m) => (
              <Link
                key={m}
                href={`/${locale}/commute/${m}`}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-900"
              >
                {locale === "ko"
                  ? `편도 ${m}분 (왕복 ${m * 2}분)`
                  : `${m}-Min One-Way (${m * 2}m/day)`}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-8">
        <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
          {locale === "ko"
            ? "자주 묻는 질문 (2026 실수령액 & 통근 손익 계산 기준)"
            : "Frequently Asked Questions"}
        </h2>
        <div className="mt-5 divide-y divide-slate-200">
          {faqs.map((faq) => (
            <div key={faq.q} className="py-4 first:pt-0 last:pb-0">
              <h3 className="text-sm font-extrabold text-slate-900 sm:text-base">
                {faq.q}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
