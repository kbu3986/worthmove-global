import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import WorthMoveCalculator from "@/components/WorthMoveCalculator";
import AffiliateCards from "@/components/AffiliateCards";
import JsonLd from "@/components/JsonLd";
import {
  calculateGlobalNetPay,
  calculateKoreanNetPay2026,
  evaluateJob,
  formatCurrency,
  formatHourly,
  solveBreakEvenOfferGross,
  type GlobalTaxPresetId,
} from "@/lib/calculator";
import {
  ALL_SALARY_SLUGS,
  EN_SALARY_BRACKETS,
  KO_SALARY_BRACKETS,
} from "@/lib/pseo-data";
import {
  buildPageMetadata,
  isValidLocale,
  LOCALES,
  SITE_URL,
} from "@/lib/site-config";

export function generateStaticParams() {
  const params: Array<{ locale: string; amount: string }> = [];
  for (const locale of LOCALES) {
    for (const amount of ALL_SALARY_SLUGS) {
      params.push({ locale, amount });
    }
  }
  return params;
}

function parseSalaryParam(raw: string): {
  value: number;
  isKoreanManwon: boolean;
} | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1500 || n > 1_000_000) return null;
  return {
    value: Math.round(n),
    isKoreanManwon: n < 25000,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; amount: string }>;
}): Promise<Metadata> {
  const { locale, amount } = await params;
  if (!isValidLocale(locale)) return {};
  const parsed = parseSalaryParam(amount);
  if (!parsed) return {};

  const { value, isKoreanManwon } = parsed;

  if (locale === "ko") {
    if (isKoreanManwon) {
      const ko = calculateKoreanNetPay2026(value, 20);
      const monthlyMan = Math.round(ko.monthlyNetKRW / 10000);
      return buildPageMetadata({
        locale: "ko",
        pathWithoutLocale: `/salary/${value}`,
        title: `2026 연봉 ${value.toLocaleString()}만원 실수령액 (월 ${monthlyMan.toLocaleString()}만원) & 통근시간별 진짜 시급`,
        description: `2026년 연봉 ${value.toLocaleString()}만원의 4대보험·근로소득세 공제 후 월 실수령액은 ${ko.monthlyNetKRW.toLocaleString()}원입니다. 재택(0분), 편도 30분, 60분, 90분 통근 시 내 진짜 시급과 이직 본전 연봉을 확인하세요.`,
      });
    }
    const approxManwon = Math.round(value * 0.138);
    return buildPageMetadata({
      locale: "ko",
      pathWithoutLocale: `/salary/${value}`,
      title: `연봉 $${value.toLocaleString()} (약 ${approxManwon.toLocaleString()}만원) 세후 실수령액 & 통근 시급 분석`,
      description: `글로벌 연봉 $${value.toLocaleString()} USD의 2026 세후 실수령액과 통근 시간별 실질 시급 및 한국 연봉 환산 비교표.`,
    });
  }

  // EN metadata
  if (!isKoreanManwon) {
    const usAvg = calculateGlobalNetPay(value, "US-AVG");
    return buildPageMetadata({
      locale: "en",
      pathWithoutLocale: `/salary/${value}`,
      title: `$${value.toLocaleString()} a Year Is How Much an Hour After Taxes & Commute? (2026)`,
      description: `On a $${value.toLocaleString()} salary, 2026 estimated net pay is $${Math.round(
        usAvg.monthlyNet
      ).toLocaleString()}/month ($${Math.round(
        usAvg.annualNet
      ).toLocaleString()}/yr). Compare true hourly wage across 0, 30, and 60-min commutes and RTO break-even raises.`,
    });
  }

  const ko = calculateKoreanNetPay2026(value, 20);
  return buildPageMetadata({
    locale: "en",
    pathWithoutLocale: `/salary/${value}`,
    title: `₩${(value * 10000).toLocaleString()} KRW (${value.toLocaleString()} Manwon) Salary in South Korea — 2026 Net Pay & True Hourly`,
    description: `2026 South Korea net take-home pay for ${value.toLocaleString()} Manwon is ₩${ko.monthlyNetKRW.toLocaleString()}/month after 4-major social insurances and income tax.`,
  });
}

export default async function SalaryBracketPage({
  params,
}: {
  params: Promise<{ locale: string; amount: string }>;
}) {
  const { locale, amount } = await params;
  if (!isValidLocale(locale)) notFound();
  const parsed = parseSalaryParam(amount);
  if (!parsed) notFound();

  const { value, isKoreanManwon } = parsed;

  // Normalize calculator defaults for this page
  const koBaseManwon = isKoreanManwon ? value : Math.round(value * 0.138);
  const enBaseUSD = isKoreanManwon ? Math.round((value * 10000) / 1380) : value;

  const koTax = calculateKoreanNetPay2026(koBaseManwon, 20);

  const commuteRowsMinutes = [0, 30, 60, 90];

  const koCommuteMatrix = commuteRowsMinutes.map((mins) => {
    const cost = mins === 0 ? 0 : mins <= 30 ? 72000 : mins <= 60 ? 110000 : 145000;
    const wfh = mins === 0 ? 5 : 0;
    const ev = evaluateJob(
      {
        annualGross: koBaseManwon,
        oneWayCommuteMinutes: mins,
        wfhDaysPerWeek: wfh,
        monthlyCommuteCost: cost,
        weeklyOvertimeHours: 0,
        annualPerks: 0,
        monthlyNonTaxableManwon: 20,
      },
      "ko"
    );
    const remoteBaseline = evaluateJob(
      {
        annualGross: koBaseManwon,
        oneWayCommuteMinutes: 0,
        wfhDaysPerWeek: 5,
        monthlyCommuteCost: 0,
        weeklyOvertimeHours: 0,
        annualPerks: 0,
        monthlyNonTaxableManwon: 20,
      },
      "ko"
    );
    const breakEven =
      mins === 0
        ? koBaseManwon
        : solveBreakEvenOfferGross(
            remoteBaseline.trueHourlyBase,
            {
              annualGross: koBaseManwon,
              oneWayCommuteMinutes: mins,
              wfhDaysPerWeek: 0,
              monthlyCommuteCost: cost,
              weeklyOvertimeHours: 0,
              annualPerks: 0,
              monthlyNonTaxableManwon: 20,
            },
            "ko"
          );
    return { mins, cost, ev, breakEven };
  });

  const enStates: Array<{ id: GlobalTaxPresetId; name: string }> = [
    { id: "US-AVG", name: "US National Avg" },
    { id: "US-TX", name: "Texas / Florida (0% State)" },
    { id: "US-CA", name: "California" },
    { id: "US-NY", name: "New York" },
    { id: "UK", name: "United Kingdom" },
  ];

  const enStateRows = enStates.map((s) => ({
    ...s,
    tax: calculateGlobalNetPay(enBaseUSD, s.id),
  }));

  const enCommuteMatrix = commuteRowsMinutes.map((mins) => {
    const cost = mins === 0 ? 0 : mins <= 30 ? 180 : mins <= 60 ? 350 : 520;
    const wfh = mins === 0 ? 5 : 0;
    const ev = evaluateJob(
      {
        annualGross: enBaseUSD,
        oneWayCommuteMinutes: mins,
        wfhDaysPerWeek: wfh,
        monthlyCommuteCost: cost,
        weeklyOvertimeHours: 0,
        annualPerks: 0,
      },
      "en",
      "US-AVG"
    );
    const remoteBaseline = evaluateJob(
      {
        annualGross: enBaseUSD,
        oneWayCommuteMinutes: 0,
        wfhDaysPerWeek: 5,
        monthlyCommuteCost: 0,
        weeklyOvertimeHours: 0,
        annualPerks: 0,
      },
      "en",
      "US-AVG"
    );
    const breakEven =
      mins === 0
        ? enBaseUSD
        : solveBreakEvenOfferGross(
            remoteBaseline.trueHourlyBase,
            {
              annualGross: enBaseUSD,
              oneWayCommuteMinutes: mins,
              wfhDaysPerWeek: 0,
              monthlyCommuteCost: cost,
              weeklyOvertimeHours: 0,
              annualPerks: 0,
            },
            "en",
            "US-AVG"
          );
    return { mins, cost, ev, breakEven };
  });

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity:
      locale === "ko"
        ? [
            {
              "@type": "Question",
              name: `2026년 연봉 ${koBaseManwon.toLocaleString()}만원의 월 실수령액은 얼마인가요?`,
              acceptedAnswer: {
                "@type": "Answer",
                text: `비과세 식대 월 20만원 기준, 2026년 4대보험 및 근로소득세·지방소득세(${koTax.totalMonthlyDeduction.toLocaleString()}원)를 공제한 월 실수령액은 약 ${koTax.monthlyNetKRW.toLocaleString()}원입니다.`,
              },
            },
            {
              "@type": "Question",
              name: `연봉 ${koBaseManwon.toLocaleString()}만원 직장인이 편도 60분 통근 시 진짜 시급은?`,
              acceptedAnswer: {
                "@type": "Answer",
                text: `주 5일 편도 60분 출퇴근 시 연간 500시간이 길바닥에서 소모되어 실질 시급은 ${formatHourly(
                  koCommuteMatrix[2].ev.trueHourlyBase,
                  "ko"
                )}으로 하락하며, 재택근무와 동일한 시급을 유지하려면 최소 연봉 ${koCommuteMatrix[2].breakEven.toLocaleString()}만원이 필요합니다.`,
              },
            },
          ]
        : [
            {
              "@type": "Question",
              name: `How much is $${enBaseUSD.toLocaleString()} a year after taxes in 2026?`,
              acceptedAnswer: {
                "@type": "Answer",
                text: `Under 2026 US average federal, FICA, and state tax rates, $${enBaseUSD.toLocaleString()} gross yields approximately $${Math.round(
                  enStateRows[0].tax.annualNet
                ).toLocaleString()} per year or $${Math.round(
                  enStateRows[0].tax.monthlyNet
                ).toLocaleString()} per month.`,
              },
            },
            {
              "@type": "Question",
              name: `What is the true hourly wage of $${enBaseUSD.toLocaleString()} with a 60-minute commute?`,
              acceptedAnswer: {
                "@type": "Answer",
                text: `With a 60-minute one-way commute (500 extra hours/year) and $350/month transit/gas costs, your true after-tax hourly wage drops to ${formatHourly(
                  enCommuteMatrix[2].ev.trueHourlyBase,
                  "en"
                )}/hr. You would need $${enCommuteMatrix[2].breakEven.toLocaleString()} gross to match a remote role.`,
              },
            },
          ],
  };

  return (
    <div>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name:
              locale === "ko"
                ? `연봉 ${koBaseManwon.toLocaleString()}만원 실수령액 & 진짜 시급 계산기`
                : `$${enBaseUSD.toLocaleString()} Salary After-Tax & True Hourly Calculator`,
            url: `${SITE_URL}/${locale}/salary/${value}`,
            applicationCategory: "FinanceApplication",
            operatingSystem: "All",
          },
          faqJsonLd,
        ]}
      />

      {/* Breadcrumb */}
      <nav className="mb-4 text-xs font-semibold text-slate-500">
        <Link href={`/${locale}`} className="hover:text-slate-900">
          {locale === "ko" ? "홈" : "Home"}
        </Link>{" "}
        /{" "}
        <span>
          {locale === "ko" ? "2026 연봉 실수령액" : "2026 Salary Breakdown"}
        </span>{" "}
        /{" "}
        <span className="text-slate-900 font-bold">
          {isKoreanManwon
            ? `${value.toLocaleString()}만원`
            : `$${value.toLocaleString()}`}
        </span>
      </nav>

      {/* Hero Summary */}
      <section className="mb-8 rounded-3xl bg-slate-900 p-6 text-white sm:p-9">
        <span className="inline-block rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
          {locale === "ko"
            ? "2026 4대보험·근로소득세 + 통근시간 정밀 반영"
            : "2026 After-Tax + Commute Time True Hourly Analysis"}
        </span>

        <h1 className="mt-3 text-2xl font-black sm:text-4xl">
          {locale === "ko"
            ? isKoreanManwon
              ? `2026 연봉 ${value.toLocaleString()}만원 실수령액 & 통근시간별 진짜 시급`
              : `글로벌 연봉 $${value.toLocaleString()} (약 ${koBaseManwon.toLocaleString()}만원) 실수령액 & 통근 손익`
            : !isKoreanManwon
              ? `$${value.toLocaleString()} Salary: 2026 After-Tax Pay & True Hourly Wage`
              : `₩${(value * 10000).toLocaleString()} KRW (${value.toLocaleString()} Manwon) Korean Salary Net Pay & True Hourly`}
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
          {locale === "ko"
            ? `세전 연봉 ${koBaseManwon.toLocaleString()}만원의 2026년 예상 월 실수령액은 ${formatCurrency(
                koTax.monthlyNetKRW,
                "ko"
              )}(월 공제 합계 ${formatCurrency(
                koTax.totalMonthlyDeduction,
                "ko"
              )})입니다. 하지만 왕복 출퇴근 시간이 길어질수록 내 실질 시급은 급격히 달라집니다.`
            : `A $${enBaseUSD.toLocaleString()} gross salary delivers roughly ${formatCurrency(
                enStateRows[0].tax.monthlyNet,
                "en"
              )}/month net (${enStateRows[0].tax.effectiveTaxRatePct.toFixed(
                1
              )}% effective tax). Below is how commuting 0, 30, 60, or 90 minutes transforms your true hourly rate.`}
        </p>
      </section>

      {/* Primary Data Tables */}
      {locale === "ko" ? (
        <div className="mb-10 grid gap-6 lg:grid-cols-12">
          {/* 2026 4대보험 실수령액 상세표 */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs lg:col-span-5">
            <h2 className="text-lg font-extrabold text-slate-900">
              연봉 {koBaseManwon.toLocaleString()}만원 월 급여 공제 명세 (2026)
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              비과세 식대 월 20만원 · 부양가족 1인(본인) 기준
            </p>
            <dl className="mt-4 divide-y divide-slate-100 text-sm tabular-nums">
              <div className="flex justify-between py-2.5">
                <dt className="text-slate-600">세전 월 환산 급여</dt>
                <dd className="font-bold text-slate-900">
                  {formatCurrency(koTax.monthlyGrossKRW, "ko")}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-slate-600">국민연금 (4.75%)</dt>
                <dd className="font-semibold text-rose-700">
                  -{formatCurrency(koTax.nationalPensionMonthly, "ko")}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-slate-600">건강보험 (3.545%)</dt>
                <dd className="font-semibold text-rose-700">
                  -{formatCurrency(koTax.healthInsuranceMonthly, "ko")}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-slate-600">장기요양보험 (12.95%)</dt>
                <dd className="font-semibold text-rose-700">
                  -{formatCurrency(koTax.longTermCareMonthly, "ko")}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-slate-600">고용보험 (0.9%)</dt>
                <dd className="font-semibold text-rose-700">
                  -{formatCurrency(koTax.employmentInsuranceMonthly, "ko")}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-slate-600">근로소득세 + 지방소득세</dt>
                <dd className="font-semibold text-rose-700">
                  -
                  {formatCurrency(
                    koTax.incomeTaxMonthly + koTax.localIncomeTaxMonthly,
                    "ko"
                  )}
                </dd>
              </div>
              <div className="flex justify-between bg-emerald-50/70 px-3 py-3 rounded-xl mt-2">
                <dt className="font-extrabold text-slate-900">
                  2026 월 예상 실수령액
                </dt>
                <dd className="text-base font-black text-emerald-700">
                  {formatCurrency(koTax.monthlyNetKRW, "ko")}
                </dd>
              </div>
            </dl>
          </div>

          {/* 통근시간별 실질 시급 & 본전 연봉 표 */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs lg:col-span-7">
            <h2 className="text-lg font-extrabold text-slate-900">
              통근 시간별 내 진짜 시급 &amp; 재택 대비 본전 연봉
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              주 5일 출근(연 250일) 및 대중교통 월 평균 비용 차감 기준
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs sm:text-sm tabular-nums">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 text-left font-bold">편도 통근</th>
                    <th className="py-2.5 text-right font-bold">길바닥/년</th>
                    <th className="py-2.5 text-right font-bold">진짜 시급</th>
                    <th className="py-2.5 text-right font-bold">재택 본전 연봉</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {koCommuteMatrix.map((row) => (
                    <tr key={row.mins} className="hover:bg-slate-50">
                      <td className="py-3 font-bold text-slate-900">
                        {row.mins === 0
                          ? "0분 (풀재택)"
                          : `편도 ${row.mins}분 (왕복 ${row.mins * 2}분)`}
                      </td>
                      <td className="py-3 text-right text-slate-600">
                        {Math.round(row.ev.annualCommuteHours)}시간
                      </td>
                      <td className="py-3 text-right font-extrabold text-emerald-700">
                        {formatHourly(row.ev.trueHourlyBase, "ko")}/시간
                      </td>
                      <td className="py-3 text-right font-extrabold text-slate-900">
                        {row.breakEven.toLocaleString("ko-KR")}만원
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-10 grid gap-6 lg:grid-cols-12">
          {/* State/Country Tax Comparison */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs lg:col-span-5">
            <h2 className="text-lg font-extrabold text-slate-900">
              ${enBaseUSD.toLocaleString()} After-Tax Pay by Location (2026)
            </h2>
            <div className="mt-4 divide-y divide-slate-100 text-sm tabular-nums">
              {enStateRows.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between py-2.5"
                >
                  <div>
                    <p className="font-bold text-slate-900">{row.name}</p>
                    <p className="text-xs text-slate-500">
                      Eff. tax: {row.tax.effectiveTaxRatePct.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-emerald-700">
                      {formatCurrency(row.tax.monthlyNet, "en")}/mo
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatCurrency(row.tax.annualNet, "en")}/yr
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Commute True Hourly & RTO Break-Even Table */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs lg:col-span-7">
            <h2 className="text-lg font-extrabold text-slate-900">
              True Hourly Wage &amp; RTO Break-Even Salary Table
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Based on 250 office days/yr (5-day RTO) vs. 100% Remote baseline
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs sm:text-sm tabular-nums">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 text-left font-bold">Commute (1-Way)</th>
                    <th className="py-2.5 text-right font-bold">Hours/Yr</th>
                    <th className="py-2.5 text-right font-bold">True Hourly</th>
                    <th className="py-2.5 text-right font-bold">RTO Break-Even</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enCommuteMatrix.map((row) => (
                    <tr key={row.mins} className="hover:bg-slate-50">
                      <td className="py-3 font-bold text-slate-900">
                        {row.mins === 0
                          ? "0 min (Remote)"
                          : `${row.mins} min (${row.mins * 2}m/day)`}
                      </td>
                      <td className="py-3 text-right text-slate-600">
                        {Math.round(row.ev.annualCommuteHours)} hrs
                      </td>
                      <td className="py-3 text-right font-extrabold text-emerald-700">
                        {formatHourly(row.ev.trueHourlyBase, "en")}/hr
                      </td>
                      <td className="py-3 text-right font-extrabold text-slate-900">
                        ${row.breakEven.toLocaleString("en-US")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pre-loaded Interactive Calculator */}
      <section className="mb-8">
        <h2 className="mb-4 text-xl font-extrabold text-slate-900">
          {locale === "ko"
            ? `연봉 ${koBaseManwon.toLocaleString()}만원 기준 이직 오퍼 직접 시뮬레이션`
            : `Simulate an Offer Against $${enBaseUSD.toLocaleString()} Below`}
        </h2>
        <WorthMoveCalculator
          locale={locale}
          initialCurrent={
            locale === "ko"
              ? {
                  annualGross: koBaseManwon,
                  oneWayCommuteMinutes: 20,
                  wfhDaysPerWeek: 2,
                  monthlyCommuteCost: 65000,
                  weeklyOvertimeHours: 2,
                  annualPerks: 100,
                  monthlyNonTaxableManwon: 20,
                }
              : {
                  annualGross: enBaseUSD,
                  oneWayCommuteMinutes: 0,
                  wfhDaysPerWeek: 5,
                  monthlyCommuteCost: 0,
                  weeklyOvertimeHours: 2,
                  annualPerks: 4000,
                }
          }
          initialOffer={
            locale === "ko"
              ? {
                  annualGross: Math.round(koBaseManwon * 1.18),
                  oneWayCommuteMinutes: 60,
                  wfhDaysPerWeek: 0,
                  monthlyCommuteCost: 118000,
                  weeklyOvertimeHours: 5,
                  annualPerks: 100,
                  monthlyNonTaxableManwon: 20,
                }
              : {
                  annualGross: Math.round((enBaseUSD * 1.18) / 1000) * 1000,
                  oneWayCommuteMinutes: 55,
                  wfhDaysPerWeek: 0,
                  monthlyCommuteCost: 350,
                  weeklyOvertimeHours: 4,
                  annualPerks: 4000,
                }
          }
        />
      </section>

      <AffiliateCards locale={locale} commuteMinutes={60} />

      {/* Neighboring Salary Links */}
      <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-extrabold text-slate-900">
          {locale === "ko"
            ? "다른 연봉 구간 실수령액 & 진짜 시급 비교"
            : "Explore Adjacent Salary Brackets"}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {(locale === "ko" ? KO_SALARY_BRACKETS : EN_SALARY_BRACKETS).map(
            (b) => (
              <Link
                key={b}
                href={`/${locale}/salary/${b}`}
                className={`rounded-lg border px-2.5 py-1 text-xs font-bold tabular-nums ${
                  b === value
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-500"
                }`}
              >
                {locale === "ko"
                  ? `${b.toLocaleString()}만원`
                  : `$${(b / 1000).toFixed(0)}k`}
              </Link>
            )
          )}
        </div>
      </section>
    </div>
  );
}
