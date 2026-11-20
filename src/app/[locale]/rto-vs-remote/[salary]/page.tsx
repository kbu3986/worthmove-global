import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import WorthMoveCalculator from "@/components/WorthMoveCalculator";
import AffiliateCards from "@/components/AffiliateCards";
import JsonLd from "@/components/JsonLd";
import {
  compareJobs,
  formatCurrency,
  formatHourly,
} from "@/lib/calculator";
import { findRtoScenario, RTO_SCENARIOS } from "@/lib/pseo-data";
import {
  buildPageMetadata,
  isValidLocale,
  LOCALES,
  SITE_URL,
} from "@/lib/site-config";

export function generateStaticParams() {
  const params: Array<{ locale: string; salary: string }> = [];
  for (const locale of LOCALES) {
    for (const s of RTO_SCENARIOS) {
      params.push({ locale, salary: String(s.rtoSalaryUSD) });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; salary: string }>;
}): Promise<Metadata> {
  const { locale, salary } = await params;
  if (!isValidLocale(locale)) return {};
  const n = Number(salary);
  if (!Number.isFinite(n) || n < 20000) return {};

  const scenario = findRtoScenario(n) ?? {
    rtoSalaryUSD: n,
    remoteSalaryUSD: Math.round((n * 0.85) / 1000) * 1000,
    rtoSalaryManwon: Math.round(n * 0.078),
    remoteSalaryManwon: Math.round(n * 0.066),
    oneWayMinutes: 55,
    monthlyCommuteUSD: 350,
    monthlyCommuteKRW: 160000,
  };

  if (locale === "ko") {
    return buildPageMetadata({
      locale: "ko",
      pathWithoutLocale: `/rto-vs-remote/${scenario.rtoSalaryUSD}`,
      title: `$${(scenario.rtoSalaryUSD / 1000).toFixed(0)}k 주5일 출근(RTO) vs $${(
        scenario.remoteSalaryUSD / 1000
      ).toFixed(0)}k 풀재택 — 어디가 진짜 이득일까?`,
      description: `연봉 ${scenario.rtoSalaryManwon.toLocaleString()}만원($${scenario.rtoSalaryUSD.toLocaleString()}) 주 5일 출근 오퍼와 연봉 ${scenario.remoteSalaryManwon.toLocaleString()}만원($${scenario.remoteSalaryUSD.toLocaleString()}) 풀재택 직장의 2026 세후 실질 시급·길바닥 비용 정밀 비교.`,
    });
  }

  return buildPageMetadata({
    locale: "en",
    pathWithoutLocale: `/rto-vs-remote/${scenario.rtoSalaryUSD}`,
    title: `Is a $${(scenario.rtoSalaryUSD / 1000).toFixed(
      0
    )}k 5-Day RTO Job Worth Leaving a $${(
      scenario.remoteSalaryUSD / 1000
    ).toFixed(0)}k Remote Job? (2026 Math)`,
    description: `Side-by-side 2026 after-tax, transit/gas, and commute-hour audit comparing a $${scenario.rtoSalaryUSD.toLocaleString()} 5-day office offer vs. a $${scenario.remoteSalaryUSD.toLocaleString()} 100% remote salary.`,
  });
}

export default async function RtoVsRemotePage({
  params,
}: {
  params: Promise<{ locale: string; salary: string }>;
}) {
  const { locale, salary } = await params;
  if (!isValidLocale(locale)) notFound();
  const n = Number(salary);
  if (!Number.isFinite(n) || n < 20000) notFound();

  const scenario = findRtoScenario(n) ?? {
    rtoSalaryUSD: n,
    remoteSalaryUSD: Math.round((n * 0.85) / 1000) * 1000,
    rtoSalaryManwon: Math.round(n * 0.078),
    remoteSalaryManwon: Math.round(n * 0.066),
    oneWayMinutes: 55,
    monthlyCommuteUSD: 350,
    monthlyCommuteKRW: 160000,
  };

  const currentJob =
    locale === "ko"
      ? {
          annualGross: scenario.remoteSalaryManwon,
          oneWayCommuteMinutes: 0,
          wfhDaysPerWeek: 5,
          monthlyCommuteCost: 0,
          weeklyOvertimeHours: 2,
          annualPerks: 100,
          monthlyNonTaxableManwon: 20,
        }
      : {
          annualGross: scenario.remoteSalaryUSD,
          oneWayCommuteMinutes: 0,
          wfhDaysPerWeek: 5,
          monthlyCommuteCost: 0,
          weeklyOvertimeHours: 2,
          annualPerks: 4000,
        };

  const offerJob =
    locale === "ko"
      ? {
          annualGross: scenario.rtoSalaryManwon,
          oneWayCommuteMinutes: scenario.oneWayMinutes,
          wfhDaysPerWeek: 0,
          monthlyCommuteCost: scenario.monthlyCommuteKRW,
          weeklyOvertimeHours: 4,
          annualPerks: 100,
          monthlyNonTaxableManwon: 20,
        }
      : {
          annualGross: scenario.rtoSalaryUSD,
          oneWayCommuteMinutes: scenario.oneWayMinutes,
          wfhDaysPerWeek: 0,
          monthlyCommuteCost: scenario.monthlyCommuteUSD,
          weeklyOvertimeHours: 4,
          annualPerks: 4000,
        };

  const mainComparison = compareJobs(currentJob, offerJob, locale, "US-AVG");

  const commuteSensitivity = [20, 35, 50, 65, 90].map((mins) => {
    const cmp = compareJobs(
      currentJob,
      { ...offerJob, oneWayCommuteMinutes: mins },
      locale,
      "US-AVG"
    );
    return { mins, cmp };
  });

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name:
        locale === "ko"
          ? `$${scenario.rtoSalaryUSD.toLocaleString()} RTO 출근 vs 풀재택 손익 판독기`
          : `$${scenario.rtoSalaryUSD.toLocaleString()} RTO vs $${scenario.remoteSalaryUSD.toLocaleString()} Remote Calculator`,
      url: `${SITE_URL}/${locale}/rto-vs-remote/${scenario.rtoSalaryUSD}`,
      applicationCategory: "FinanceApplication",
      operatingSystem: "All",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name:
            locale === "ko"
              ? `연봉 ${scenario.remoteSalaryManwon.toLocaleString()}만원 풀재택에서 ${scenario.rtoSalaryManwon.toLocaleString()}만원 주5일 출근으로 옮기면 이득인가요?`
              : `Is a $${scenario.rtoSalaryUSD.toLocaleString()} 5-day RTO offer better than $${scenario.remoteSalaryUSD.toLocaleString()} remote?`,
          acceptedAnswer: {
            "@type": "Answer",
            text:
              locale === "ko"
                ? `편도 ${scenario.oneWayMinutes}분 통근 시 실질 시급 변화율은 ${mainComparison.trueHourlyDeltaPct.toFixed(
                    1
                  )}%이며, 최소 ${mainComparison.breakEvenGrossInputUnit.toLocaleString()}만원 이상 받아야 기존 풀재택 시급과 본전입니다.`
                : `With a ${scenario.oneWayMinutes}-minute one-way commute, your true hourly wage changes by ${mainComparison.trueHourlyDeltaPct.toFixed(
                    1
                  )}%. You need at least $${mainComparison.breakEvenGrossInputUnit.toLocaleString()} gross to break even on real hourly pay.`,
          },
        },
      ],
    },
  ];

  return (
    <div>
      <JsonLd data={jsonLd} />

      <nav className="mb-4 text-xs font-semibold text-slate-500">
        <Link href={`/${locale}`} className="hover:text-slate-900">
          {locale === "ko" ? "홈" : "Home"}
        </Link>{" "}
        / <span>RTO vs Remote</span> /{" "}
        <span className="font-bold text-slate-900">
          ${(scenario.rtoSalaryUSD / 1000).toFixed(0)}k vs $
          {(scenario.remoteSalaryUSD / 1000).toFixed(0)}k
        </span>
      </nav>

      <section className="mb-8 rounded-3xl bg-slate-900 p-6 text-white sm:p-9">
        <span className="inline-block rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300">
          {locale === "ko"
            ? "전면출근(RTO) vs 풀재택 손익 정밀 판독"
            : "RTO Mandate vs. Remote Freedom Audit"}
        </span>
        <h1 className="mt-3 text-2xl font-black sm:text-4xl">
          {locale === "ko"
            ? `연봉 ${scenario.rtoSalaryManwon.toLocaleString()}만원($${(
                scenario.rtoSalaryUSD / 1000
              ).toFixed(0)}k) 주5일 출근 vs ${scenario.remoteSalaryManwon.toLocaleString()}만원($${(
                scenario.remoteSalaryUSD / 1000
              ).toFixed(0)}k) 풀재택`
            : `Is a $${scenario.rtoSalaryUSD.toLocaleString()} 5-Day RTO Job Worth Leaving a $${scenario.remoteSalaryUSD.toLocaleString()} Remote Job?`}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
          {locale === "ko"
            ? `명목 연봉은 +${(
                scenario.rtoSalaryManwon - scenario.remoteSalaryManwon
              ).toLocaleString()}만원 더 많아 보이지만, 세금 증가분과 왕복 ${
                scenario.oneWayMinutes * 2
              }분 출퇴근을 반영하면 실질 시급 변화는 ${
                mainComparison.trueHourlyDeltaPct >= 0 ? "+" : ""
              }${mainComparison.trueHourlyDeltaPct.toFixed(
                1
              )}%입니다. 최소 본전 연봉은 ${mainComparison.breakEvenGrossInputUnit.toLocaleString()}만원입니다.`
            : `A +$${(
                scenario.rtoSalaryUSD - scenario.remoteSalaryUSD
              ).toLocaleString()} nominal raise looks tempting on paper—until marginal taxes, ${formatCurrency(
                scenario.monthlyCommuteUSD * 12,
                "en"
              )}/yr in commuting costs, and ${Math.round(
                mainComparison.offer.annualCommuteHours
              )} hours on the road shift your true hourly rate by ${
                mainComparison.trueHourlyDeltaPct >= 0 ? "+" : ""
              }${mainComparison.trueHourlyDeltaPct.toFixed(
                1
              )}%. Break-even RTO pay: $${mainComparison.breakEvenGrossInputUnit.toLocaleString()}.`}
        </p>
      </section>

      {/* Commute Sensitivity Table */}
      <section className="mb-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
        <h2 className="text-lg font-extrabold text-slate-900">
          {locale === "ko"
            ? "출퇴근 거리(편도 분)에 따른 승패 분기점"
            : "How Commute Length Changes the Verdict"}
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs sm:text-sm tabular-nums">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 text-left font-bold">
                  {locale === "ko" ? "편도 통근 시간" : "1-Way Commute"}
                </th>
                <th className="py-2.5 text-right font-bold">
                  {locale === "ko" ? "출근 후 진짜 시급" : "RTO True Hourly"}
                </th>
                <th className="py-2.5 text-right font-bold">
                  {locale === "ko" ? "재택 대비 증감" : "vs Remote Hourly"}
                </th>
                <th className="py-2.5 text-right font-bold">
                  {locale === "ko" ? "최소 본전 연봉" : "Break-Even Gross"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {commuteSensitivity.map(({ mins, cmp }) => (
                <tr key={mins} className="hover:bg-slate-50">
                  <td className="py-3 font-bold text-slate-900">
                    {locale === "ko" ? `편도 ${mins}분` : `${mins} min 1-way`}
                  </td>
                  <td className="py-3 text-right font-bold">
                    {formatHourly(cmp.offer.trueHourlyBase, locale)}/
                    {locale === "ko" ? "시간" : "hr"}
                  </td>
                  <td
                    className={`py-3 text-right font-extrabold ${
                      cmp.trueHourlyDeltaPct >= 0
                        ? "text-emerald-700"
                        : "text-rose-700"
                    }`}
                  >
                    {cmp.trueHourlyDeltaPct >= 0 ? "+" : ""}
                    {cmp.trueHourlyDeltaPct.toFixed(1)}%
                  </td>
                  <td className="py-3 text-right font-extrabold text-slate-900">
                    {locale === "ko"
                      ? `${cmp.breakEvenGrossInputUnit.toLocaleString()}만원`
                      : `$${cmp.breakEvenGrossInputUnit.toLocaleString()}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <WorthMoveCalculator
        locale={locale}
        initialCurrent={currentJob}
        initialOffer={offerJob}
      />

      <AffiliateCards locale={locale} commuteMinutes={scenario.oneWayMinutes} />

      {/* Other RTO Scenarios */}
      <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-extrabold text-slate-900">
          {locale === "ko"
            ? "다른 연봉대 출근(RTO) vs 재택 비교"
            : "More RTO vs. Remote Salary Comparisons"}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {RTO_SCENARIOS.map((s) => (
            <Link
              key={s.rtoSalaryUSD}
              href={`/${locale}/rto-vs-remote/${s.rtoSalaryUSD}`}
              className={`rounded-lg border px-2.5 py-1 text-xs font-bold tabular-nums ${
                s.rtoSalaryUSD === scenario.rtoSalaryUSD
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-500"
              }`}
            >
              ${(s.rtoSalaryUSD / 1000).toFixed(0)}k vs $
              {(s.remoteSalaryUSD / 1000).toFixed(0)}k
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
