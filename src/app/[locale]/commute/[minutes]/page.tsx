import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import WorthMoveCalculator from "@/components/WorthMoveCalculator";
import AffiliateCards from "@/components/AffiliateCards";
import JsonLd from "@/components/JsonLd";
import {
  ACTIVE_WEEKS_PER_YEAR,
  evaluateJob,
  formatCurrency,
  solveBreakEvenOfferGross,
} from "@/lib/calculator";
import { COMMUTE_MINUTES_LIST } from "@/lib/pseo-data";
import {
  buildPageMetadata,
  isValidLocale,
  LOCALES,
  SITE_URL,
} from "@/lib/site-config";

export function generateStaticParams() {
  const params: Array<{ locale: string; minutes: string }> = [];
  for (const locale of LOCALES) {
    for (const m of COMMUTE_MINUTES_LIST) {
      params.push({ locale, minutes: String(m) });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; minutes: string }>;
}): Promise<Metadata> {
  const { locale, minutes } = await params;
  if (!isValidLocale(locale)) return {};
  const mins = Number(minutes);
  if (!Number.isFinite(mins) || mins < 1 || mins > 300) return {};

  const hrs1Yr = Math.round((mins * 2 * 5 * ACTIVE_WEEKS_PER_YEAR) / 60);

  if (locale === "ko") {
    return buildPageMetadata({
      locale: "ko",
      pathWithoutLocale: `/commute/${mins}`,
      title: `편도 ${mins}분(왕복 ${mins * 2}분) 출퇴근의 1년·5년·10년 인생 비용 & 본전 연봉`,
      description: `편도 ${mins}분 통근은 1년에 ${hrs1Yr}시간, 10년이면 ${(
        hrs1Yr * 10
      ).toLocaleString()}시간을 길바닥에 헌납합니다. 연봉대별 실질 시급 손실과 최소 보상 연봉을 확인하세요.`,
    });
  }

  return buildPageMetadata({
    locale: "en",
    pathWithoutLocale: `/commute/${mins}`,
    title: `True Cost of a ${mins}-Minute One-Way Commute Over 1, 5 & 10 Years (2026)`,
    description: `A ${mins}-minute one-way commute burns ${hrs1Yr} hours per year (${(
      hrs1Yr * 10
    ).toLocaleString()} hours over 10 years). See the exact cash drain, S&P 500 opportunity cost, and raise required to break even.`,
  });
}

export default async function CommuteDurationPage({
  params,
}: {
  params: Promise<{ locale: string; minutes: string }>;
}) {
  const { locale, minutes } = await params;
  if (!isValidLocale(locale)) notFound();
  const mins = Number(minutes);
  if (!Number.isFinite(mins) || mins < 1 || mins > 300) notFound();

  const officeDaysPerYear = 5 * ACTIVE_WEEKS_PER_YEAR; // 250 days
  const annualHours = (mins * 2 * officeDaysPerYear) / 60;
  const estMonthlyCost =
    locale === "ko"
      ? Math.round(45000 + mins * 1400)
      : Math.round(90 + mins * 5.2);
  const annualCashCost = estMonthlyCost * 12;

  // 7% real compounding opportunity cost
  const fv = (pmtAnnual: number, years: number) => {
    const r = 0.07;
    return pmtAnnual * ((Math.pow(1 + r, years) - 1) / r);
  };

  const horizons = [1, 5, 10].map((yrs) => ({
    years: yrs,
    hoursLost: Math.round(annualHours * yrs),
    fullDaysLost: ((annualHours * yrs) / 24).toFixed(1),
    workWeeksLost: ((annualHours * yrs) / 40).toFixed(1),
    directCash: annualCashCost * yrs,
    investedValue: Math.round(fv(annualCashCost, yrs)),
  }));

  const sampleSalaries =
    locale === "ko"
      ? [4000, 5500, 7000, 9000, 12000]
      : [65000, 90000, 120000, 150000, 200000];

  const breakEvenRows = sampleSalaries.map((sal) => {
    const remote = evaluateJob(
      {
        annualGross: sal,
        oneWayCommuteMinutes: 0,
        wfhDaysPerWeek: 5,
        monthlyCommuteCost: 0,
        weeklyOvertimeHours: 0,
        annualPerks: 0,
        monthlyNonTaxableManwon: 20,
      },
      locale
    );
    const needed = solveBreakEvenOfferGross(
      remote.trueHourlyBase,
      {
        annualGross: sal,
        oneWayCommuteMinutes: mins,
        wfhDaysPerWeek: 0,
        monthlyCommuteCost: estMonthlyCost,
        weeklyOvertimeHours: 0,
        annualPerks: 0,
        monthlyNonTaxableManwon: 20,
      },
      locale
    );
    return {
      baseSalary: sal,
      neededSalary: needed,
      bumpNeeded: needed - sal,
    };
  });

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name:
        locale === "ko"
          ? `편도 ${mins}분 통근 비용 계산기`
          : `${mins}-Minute Commute Cost Calculator`,
      url: `${SITE_URL}/${locale}/commute/${mins}`,
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
              ? `편도 ${mins}분 출퇴근하면 1년과 10년 동안 몇 시간을 길에서 쓰나요?`
              : `How many hours is a ${mins}-minute one-way commute per year and over 10 years?`,
          acceptedAnswer: {
            "@type": "Answer",
            text:
              locale === "ko"
                ? `주 5일(연 250일) 출근 시 1년에 약 ${horizons[0].hoursLost.toLocaleString()}시간(24시간 기준 ${horizons[0].fullDaysLost}일), 10년이면 ${horizons[2].hoursLost.toLocaleString()}시간(${horizons[2].fullDaysLost}일)을 길바닥에서 소비합니다.`
                : `Across 250 workdays per year, a ${mins}-minute one-way commute consumes ${horizons[0].hoursLost.toLocaleString()} hours/year (${horizons[0].fullDaysLost} full 24h days) and ${horizons[2].hoursLost.toLocaleString()} hours over 10 years.`,
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
        /{" "}
        <span>{locale === "ko" ? "통근 시간 비용" : "Commute Cost"}</span> /{" "}
        <span className="font-bold text-slate-900">
          {locale === "ko" ? `편도 ${mins}분` : `${mins} Min`}
        </span>
      </nav>

      <section className="mb-8 rounded-3xl bg-slate-900 p-6 text-white sm:p-9">
        <span className="inline-block rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
          {locale === "ko"
            ? `하루 왕복 ${mins * 2}분 · 주당 ${((mins * 10) / 60).toFixed(1)}시간 통근`
            : `${mins * 2} Min Round-Trip · ${((mins * 10) / 60).toFixed(1)} Hrs/Week`}
        </span>
        <h1 className="mt-3 text-2xl font-black sm:text-4xl">
          {locale === "ko"
            ? `편도 ${mins}분 출퇴근이 1년·5년·10년 동안 앗아가는 인생과 돈`
            : `The True 1, 5 & 10-Year Cost of a ${mins}-Minute Commute`}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
          {locale === "ko"
            ? `매일 편도 ${mins}분씩 주 5일 출퇴근하면 1년에 ${horizons[0].hoursLost.toLocaleString()}시간(40시간 근무주 기준 ${horizons[0].workWeeksLost}주치 노동시간)이 길바닥에서 사라집니다.`
            : `Commuting ${mins} minutes each way five days a week burns ${horizons[0].hoursLost.toLocaleString()} unpaid hours every year—equivalent to ${horizons[0].workWeeksLost} extra 40-hour workweeks annually.`}
        </p>
      </section>

      {/* 1 / 5 / 10 Year Horizon Cards */}
      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        {horizons.map((h) => (
          <div
            key={h.years}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs tabular-nums"
          >
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-extrabold text-emerald-400">
              {locale === "ko" ? `${h.years}년 누적 손실` : `${h.years}-YEAR DRAIN`}
            </span>
            <p className="mt-4 text-3xl font-black text-slate-900">
              {h.hoursLost.toLocaleString()}{" "}
              <span className="text-base font-bold text-slate-500">
                {locale === "ko" ? "시간" : "hrs"}
              </span>
            </p>
            <p className="mt-1 text-xs font-semibold text-rose-700">
              {locale === "ko"
                ? `24시간 기준 온전한 ${h.fullDaysLost}일 증발`
                : `${h.fullDaysLost} full 24-hour days of life`}
            </p>
            <div className="mt-4 border-t border-slate-100 pt-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">
                  {locale === "ko" ? "직접 교통비 지출:" : "Direct Transit/Gas:"}
                </span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(h.directCash, locale, {
                    compact: locale === "ko",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">
                  {locale === "ko" ? "연 7% 투자 기회비용:" : "7% S&P 500 Value:"}
                </span>
                <span className="font-extrabold text-emerald-700">
                  {formatCurrency(h.investedValue, locale, {
                    compact: locale === "ko",
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Required Raise Table */}
      <section className="mb-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
        <h2 className="text-lg font-extrabold text-slate-900">
          {locale === "ko"
            ? `편도 ${mins}분 통근을 감수하기 위한 연봉대별 최소 본전 인상액`
            : `Required Gross Raise to Justify a ${mins}-Minute Commute`}
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs sm:text-sm tabular-nums">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 text-left font-bold">
                  {locale === "ko" ? "현재(재택) 연봉" : "Remote Salary"}
                </th>
                <th className="py-2.5 text-right font-bold">
                  {locale === "ko" ? "필요한 최소 출근 연봉" : "Break-Even Office Salary"}
                </th>
                <th className="py-2.5 text-right font-bold">
                  {locale === "ko" ? "최소 필요 인상폭" : "Required Gross Bump"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {breakEvenRows.map((r) => (
                <tr key={r.baseSalary} className="hover:bg-slate-50">
                  <td className="py-3 font-bold text-slate-900">
                    {locale === "ko"
                      ? `${r.baseSalary.toLocaleString()}만원`
                      : `$${r.baseSalary.toLocaleString()}`}
                  </td>
                  <td className="py-3 text-right font-extrabold text-emerald-700">
                    {locale === "ko"
                      ? `${r.neededSalary.toLocaleString()}만원`
                      : `$${r.neededSalary.toLocaleString()}`}
                  </td>
                  <td className="py-3 text-right font-bold text-rose-700">
                    {locale === "ko"
                      ? `+${r.bumpNeeded.toLocaleString()}만원`
                      : `+$${r.bumpNeeded.toLocaleString()}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <WorthMoveCalculator
        locale={locale}
        initialCurrent={
          locale === "ko"
            ? {
                annualGross: 5500,
                oneWayCommuteMinutes: 15,
                wfhDaysPerWeek: 2,
                monthlyCommuteCost: 55000,
                weeklyOvertimeHours: 2,
                annualPerks: 100,
                monthlyNonTaxableManwon: 20,
              }
            : {
                annualGross: 100000,
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
                annualGross: 6500,
                oneWayCommuteMinutes: mins,
                wfhDaysPerWeek: 0,
                monthlyCommuteCost: estMonthlyCost,
                weeklyOvertimeHours: 4,
                annualPerks: 100,
                monthlyNonTaxableManwon: 20,
              }
            : {
                annualGross: 120000,
                oneWayCommuteMinutes: mins,
                wfhDaysPerWeek: 0,
                monthlyCommuteCost: estMonthlyCost,
                weeklyOvertimeHours: 4,
                annualPerks: 4000,
              }
        }
      />

      <AffiliateCards locale={locale} commuteMinutes={mins} />

      <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-extrabold text-slate-900">
          {locale === "ko"
            ? "다른 편도 통근 시간 비교"
            : "Compare Other Commute Durations"}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {COMMUTE_MINUTES_LIST.map((m) => (
            <Link
              key={m}
              href={`/${locale}/commute/${m}`}
              className={`rounded-lg border px-3 py-1 text-xs font-bold ${
                m === mins
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-500"
              }`}
            >
              {locale === "ko" ? `편도 ${m}분` : `${m} min`}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
