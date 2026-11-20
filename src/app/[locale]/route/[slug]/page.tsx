import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Car, MapPin, Train } from "lucide-react";
import WorthMoveCalculator from "@/components/WorthMoveCalculator";
import AffiliateCards from "@/components/AffiliateCards";
import JsonLd from "@/components/JsonLd";
import {
  evaluateJob,
  formatCurrency,
  formatHourly,
  solveBreakEvenOfferGross,
} from "@/lib/calculator";
import { findRouteBySlug, KOREAN_COMMUTE_ROUTES } from "@/lib/pseo-data";
import {
  buildPageMetadata,
  isValidLocale,
  LOCALES,
  SITE_URL,
} from "@/lib/site-config";

export function generateStaticParams() {
  const params: Array<{ locale: string; slug: string }> = [];
  for (const locale of LOCALES) {
    for (const route of KOREAN_COMMUTE_ROUTES) {
      params.push({ locale, slug: route.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) return {};
  const route = findRouteBySlug(slug);
  if (!route) return {};

  if (locale === "ko") {
    return buildPageMetadata({
      locale: "ko",
      pathWithoutLocale: `/route/${route.slug}`,
      title: `${route.originKo} ↔ ${route.destKo} 출퇴근 시간·교통비 & 이직 본전 연봉 (2026)`,
      description: `${route.originKo}에서 ${route.destKo}까지 대중교통(편도 ${route.transitOneWayMin}분, 월 ${(
        route.monthlyTransitKRW / 10000
      ).toFixed(1)}만원) vs 자차(편도 ${route.drivingOneWayMin}분, 월 ${(
        route.monthlyDrivingKRW / 10000
      ).toFixed(0)}만원) 비교 및 연봉대별 최소 이직 손익분기점.`,
    });
  }

  return buildPageMetadata({
    locale: "en",
    pathWithoutLocale: `/route/${route.slug}`,
    title: `${route.originEn} to ${route.destEn} Commute Cost, Time & Break-Even Salary (2026)`,
    description: `Compare transit (${route.transitOneWayMin} min, ₩${route.monthlyTransitKRW.toLocaleString()}/mo) vs. driving (${route.drivingOneWayMin} min, ₩${route.monthlyDrivingKRW.toLocaleString()}/mo) from ${route.originEn} to ${route.destEn}, plus required salary bump.`,
  });
}

export default async function CommuteCorridorPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();
  const route = findRouteBySlug(slug);
  if (!route) notFound();

  const transitHrsYr = Math.round((route.transitOneWayMin * 2 * 250) / 60);
  const drivingHrsYr = Math.round((route.drivingOneWayMin * 2 * 250) / 60);

  const salaryTiersManwon = [4000, 5000, 6000, 8000, 10000];

  const corridorTable = salaryTiersManwon.map((manwon) => {
    const nearHomeJob = evaluateJob(
      {
        annualGross: manwon,
        oneWayCommuteMinutes: 15,
        wfhDaysPerWeek: 1,
        monthlyCommuteCost: 50000,
        weeklyOvertimeHours: 0,
        annualPerks: 0,
        monthlyNonTaxableManwon: 20,
      },
      "ko"
    );

    const transitBreakEven = solveBreakEvenOfferGross(
      nearHomeJob.trueHourlyBase,
      {
        annualGross: manwon,
        oneWayCommuteMinutes: route.transitOneWayMin,
        wfhDaysPerWeek: 0,
        monthlyCommuteCost: route.monthlyTransitKRW,
        weeklyOvertimeHours: 0,
        annualPerks: 0,
        monthlyNonTaxableManwon: 20,
      },
      "ko"
    );

    const drivingBreakEven = solveBreakEvenOfferGross(
      nearHomeJob.trueHourlyBase,
      {
        annualGross: manwon,
        oneWayCommuteMinutes: route.drivingOneWayMin,
        wfhDaysPerWeek: 0,
        monthlyCommuteCost: route.monthlyDrivingKRW,
        weeklyOvertimeHours: 0,
        annualPerks: 0,
        monthlyNonTaxableManwon: 20,
      },
      "ko"
    );

    const transitEval = evaluateJob(
      {
        annualGross: manwon,
        oneWayCommuteMinutes: route.transitOneWayMin,
        wfhDaysPerWeek: 0,
        monthlyCommuteCost: route.monthlyTransitKRW,
        weeklyOvertimeHours: 0,
        annualPerks: 0,
        monthlyNonTaxableManwon: 20,
      },
      "ko"
    );

    return {
      manwon,
      transitHourly: transitEval.trueHourlyBase,
      transitBreakEven,
      drivingBreakEven,
    };
  });

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name:
        locale === "ko"
          ? `${route.originKo} ↔ ${route.destKo} 이직 통근 손익 판독기`
          : `${route.originEn} to ${route.destEn} Commute True Wage Calculator`,
      url: `${SITE_URL}/${locale}/route/${route.slug}`,
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
              ? `${route.originKo}에서 ${route.destKo}로 이직할 때 연봉을 얼마나 올려야 본전인가요?`
              : `How much salary raise is needed to commute from ${route.originEn} to ${route.destEn}?`,
          acceptedAnswer: {
            "@type": "Answer",
            text:
              locale === "ko"
                ? `연봉 6,000만원(집 근처 15분 통근) 직장인 기준, ${route.originKo}↔${route.destKo} 대중교통(편도 ${route.transitOneWayMin}분) 통근 시 최소 ${corridorTable[2].transitBreakEven.toLocaleString()}만원, 자차 통근 시 최소 ${corridorTable[2].drivingBreakEven.toLocaleString()}만원 이상 받아야 실질 시급 본전입니다.`
                : `For a ₩60M KRW worker near home, commuting from ${route.originEn} to ${route.destEn} requires at least ${corridorTable[2].transitBreakEven.toLocaleString()} Manwon by public transit or ${corridorTable[2].drivingBreakEven.toLocaleString()} Manwon by car to maintain true after-tax hourly pay.`,
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
        <span>
          {locale === "ko" ? "수도권 통근 노선" : "Metro Commuter Corridors"}
        </span>{" "}
        /{" "}
        <span className="font-bold text-slate-900">
          {locale === "ko"
            ? `${route.originKo} ↔ ${route.destKo}`
            : `${route.originEn} ↔ ${route.destEn}`}
        </span>
      </nav>

      <section className="mb-8 rounded-3xl bg-slate-900 p-6 text-white sm:p-9">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
          <MapPin className="h-3.5 w-3.5" />
          {locale === "ko"
            ? `편도 거리 약 ${route.distanceKm}km · 혼잡도: ${route.crowdingLevel}`
            : `Distance ~${route.distanceKm} km · Rush Stress: ${route.crowdingLevelEn}`}
        </div>
        <h1 className="mt-3 text-2xl font-black sm:text-4xl">
          {locale === "ko"
            ? `${route.originKo} ↔ ${route.destKo} 출퇴근 시간·비용 & 이직 본전 연봉`
            : `${route.originEn} ↔ ${route.destEn}: Transit vs. Driving & Break-Even Raise`}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
          {locale === "ko"
            ? `주요 노선(${route.transitLineKo}) 이용 시 편도 평균 ${route.transitOneWayMin}분(연간 ${transitHrsYr}시간), 자차 이용 시 편도 ${route.drivingOneWayMin}분(연간 ${drivingHrsYr}시간)이 소요됩니다. 이직 도장 찍기 전 대중교통·자차별 필요 연봉 인상폭을 비교해 보세요.`
            : `Via ${route.transitLineEn}, commuters spend ${route.transitOneWayMin} min each way (${transitHrsYr} hrs/yr), while rush-hour driving averages ${route.drivingOneWayMin} min (${drivingHrsYr} hrs/yr).`}
        </p>
      </section>

      {/* Transit vs Driving Comparison Cards */}
      <section className="mb-8 grid gap-5 sm:grid-cols-2">
        <div className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-900">
              <Train className="h-3.5 w-3.5" />
              {locale === "ko" ? "대중교통 (K-패스 반영)" : "Public Transit (K-Pass)"}
            </span>
            <span className="text-xs font-bold text-slate-500">
              {locale === "ko" ? route.crowdingLevel : route.crowdingLevelEn}
            </span>
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-500">
            {locale === "ko" ? route.transitLineKo : route.transitLineEn}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 tabular-nums">
            <div>
              <p className="text-xs text-slate-500">
                {locale === "ko" ? "편도 / 연간 시간" : "1-Way / Annual"}
              </p>
              <p className="text-xl font-black text-slate-900">
                {route.transitOneWayMin}
                {locale === "ko" ? "분" : "m"}{" "}
                <span className="text-xs font-bold text-slate-500">
                  ({transitHrsYr}h/yr)
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">
                {locale === "ko" ? "월 / 연 교통비" : "Monthly / Annual"}
              </p>
              <p className="text-xl font-black text-emerald-700">
                {formatCurrency(route.monthlyTransitKRW, "ko")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-800">
              <Car className="h-3.5 w-3.5" />
              {locale === "ko"
                ? "자차 출퇴근 (유류+톨비+주차)"
                : "Rush-Hour Driving"}
            </span>
            <span className="text-xs font-bold text-slate-500">
              {route.distanceKm * 2} km/{locale === "ko" ? "일 왕복" : "day RT"}
            </span>
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-500">
            {locale === "ko"
              ? "출퇴근 러시아워 실측 평균 + 오피스 월정기 주차 반영"
              : "Includes fuel, expressway tolls, and CBD monthly parking"}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 tabular-nums">
            <div>
              <p className="text-xs text-slate-500">
                {locale === "ko" ? "편도 / 연간 시간" : "1-Way / Annual"}
              </p>
              <p className="text-xl font-black text-slate-900">
                {route.drivingOneWayMin}
                {locale === "ko" ? "분" : "m"}{" "}
                <span className="text-xs font-bold text-slate-500">
                  ({drivingHrsYr}h/yr)
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">
                {locale === "ko" ? "월 평균 유지·주차비" : "Monthly Car Cost"}
              </p>
              <p className="text-xl font-black text-rose-700">
                {formatCurrency(route.monthlyDrivingKRW, "ko")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Break-Even Salary Table */}
      <section className="mb-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs">
        <h2 className="text-lg font-extrabold text-slate-900">
          {locale === "ko"
            ? `${route.originKo} ↔ ${route.destKo} 통근 시 연봉대별 최소 본전 연봉표`
            : `Required Salary Bump for ${route.originEn} ↔ ${route.destEn} (2026 KRW)`}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {locale === "ko"
            ? "집 근처(편도 15분) 직장에서 이 노선으로 이직할 때 내 진짜 시급이 깎이지 않는 최소 계약 연봉"
            : "Minimum gross salary (in Manwon = ₩10,000 KRW) required to match a 15-min local commute"}
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs sm:text-sm tabular-nums">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 text-left font-bold">
                  {locale === "ko" ? "현 직장 연봉" : "Current Salary"}
                </th>
                <th className="py-2.5 text-right font-bold">
                  {locale === "ko" ? "대중교통 통근 시급" : "Transit True Hourly"}
                </th>
                <th className="py-2.5 text-right font-bold">
                  {locale === "ko" ? "대중교통 본전 연봉" : "Transit Break-Even"}
                </th>
                <th className="py-2.5 text-right font-bold">
                  {locale === "ko" ? "자차 통근 본전 연봉" : "Driving Break-Even"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {corridorTable.map((row) => (
                <tr key={row.manwon} className="hover:bg-slate-50">
                  <td className="py-3 font-bold text-slate-900">
                    {row.manwon.toLocaleString()}만원
                  </td>
                  <td className="py-3 text-right text-slate-700 font-semibold">
                    {formatHourly(row.transitHourly, "ko")}/시간
                  </td>
                  <td className="py-3 text-right font-extrabold text-emerald-700">
                    {row.transitBreakEven.toLocaleString()}만원{" "}
                    <span className="text-[11px]">
                      (+{(row.transitBreakEven - row.manwon).toLocaleString()})
                    </span>
                  </td>
                  <td className="py-3 text-right font-extrabold text-rose-700">
                    {row.drivingBreakEven.toLocaleString()}만원{" "}
                    <span className="text-[11px]">
                      (+{(row.drivingBreakEven - row.manwon).toLocaleString()})
                    </span>
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
                oneWayCommuteMinutes: 20,
                wfhDaysPerWeek: 1,
                monthlyCommuteCost: 60000,
                weeklyOvertimeHours: 2,
                annualPerks: 100,
                monthlyNonTaxableManwon: 20,
              }
            : {
                annualGross: 95000,
                oneWayCommuteMinutes: 15,
                wfhDaysPerWeek: 2,
                monthlyCommuteCost: 80,
                weeklyOvertimeHours: 2,
                annualPerks: 3000,
              }
        }
        initialOffer={
          locale === "ko"
            ? {
                annualGross: 6500,
                oneWayCommuteMinutes: route.transitOneWayMin,
                wfhDaysPerWeek: 0,
                monthlyCommuteCost: route.monthlyTransitKRW,
                weeklyOvertimeHours: 4,
                annualPerks: 100,
                monthlyNonTaxableManwon: 20,
              }
            : {
                annualGross: 112000,
                oneWayCommuteMinutes: route.transitOneWayMin,
                wfhDaysPerWeek: 0,
                monthlyCommuteCost: Math.round(route.monthlyTransitKRW / 1350),
                weeklyOvertimeHours: 4,
                annualPerks: 3000,
              }
        }
      />

      <AffiliateCards locale={locale} commuteMinutes={route.transitOneWayMin} />

      {/* All 36 Commuter Corridors Internal Link Grid */}
      <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-extrabold text-slate-900">
          {locale === "ko"
            ? "수도권 36개 주요 출퇴근 노선 전체 보기"
            : "All 36 Seoul Metropolitan Commuter Corridors"}
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {KOREAN_COMMUTE_ROUTES.map((r) => (
            <Link
              key={r.slug}
              href={`/${locale}/route/${r.slug}`}
              className={`rounded-xl border px-3 py-2 text-xs font-bold truncate ${
                r.slug === route.slug
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-500"
              }`}
            >
              {locale === "ko"
                ? `${r.originKo.split("(")[0]} ↔ ${r.destKo.split("·")[0]}`
                : `${r.originEn.split(" (")[0]} ↔ ${r.destEn.split(" /")[0]}`}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
