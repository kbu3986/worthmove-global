"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Flame,
  RotateCcw,
  Share2,
  Sparkles,
  Train,
  Car,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  compareJobs,
  formatCurrency,
  formatHourly,
  GLOBAL_TAX_PRESETS,
  type GlobalTaxPresetId,
  type JobInput,
} from "@/lib/calculator";
import { KOREAN_COMMUTE_ROUTES } from "@/lib/pseo-data";
import { downloadReceiptPng } from "@/lib/receipt-canvas";
import type { Locale } from "@/lib/site-config";
import AdBanner from "./AdBanner";

export interface WorthMoveCalculatorProps {
  locale: Locale;
  initialCurrent?: Partial<JobInput>;
  initialOffer?: Partial<JobInput>;
  initialTaxPreset?: GlobalTaxPresetId;
  compactHeader?: boolean;
}

const DEFAULT_CURRENT_EN: JobInput = {
  annualGross: 110000,
  oneWayCommuteMinutes: 0,
  wfhDaysPerWeek: 5,
  monthlyCommuteCost: 0,
  weeklyOvertimeHours: 2,
  annualPerks: 4500,
};

const DEFAULT_OFFER_EN: JobInput = {
  annualGross: 130000,
  oneWayCommuteMinutes: 55,
  wfhDaysPerWeek: 0,
  monthlyCommuteCost: 360,
  weeklyOvertimeHours: 5,
  annualPerks: 4500,
};

const DEFAULT_CURRENT_KO: JobInput = {
  annualGross: 5200,
  oneWayCommuteMinutes: 25,
  wfhDaysPerWeek: 2,
  monthlyCommuteCost: 65000,
  weeklyOvertimeHours: 2,
  annualPerks: 100,
  monthlyNonTaxableManwon: 20,
};

const DEFAULT_OFFER_KO: JobInput = {
  annualGross: 6200,
  oneWayCommuteMinutes: 68,
  wfhDaysPerWeek: 0,
  monthlyCommuteCost: 118000,
  weeklyOvertimeHours: 6,
  annualPerks: 100,
  monthlyNonTaxableManwon: 20,
};

function parseInitialFromSearch(
  searchString: string,
  baseCurrent: JobInput,
  baseOffer: JobInput,
  initialTaxPreset: GlobalTaxPresetId
) {
  if (!searchString) {
    return {
      current: baseCurrent,
      offer: baseOffer,
      taxPreset: initialTaxPreset,
      customTaxPct: 27,
    };
  }
  const sp = new URLSearchParams(searchString);
  if (!sp.has("cs") && !sp.has("ns")) {
    return {
      current: baseCurrent,
      offer: baseOffer,
      taxPreset: initialTaxPreset,
      customTaxPct: 27,
    };
  }

  const num = (key: string, fallback: number) => {
    const raw = sp.get(key);
    if (raw === null || raw === "") return fallback;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const txRaw = sp.get("tx") as GlobalTaxPresetId | null;
  const validTx =
    txRaw && GLOBAL_TAX_PRESETS.some((p) => p.id === txRaw)
      ? txRaw
      : initialTaxPreset;

  return {
    current: {
      ...baseCurrent,
      annualGross: num("cs", baseCurrent.annualGross),
      oneWayCommuteMinutes: num("cc", baseCurrent.oneWayCommuteMinutes),
      wfhDaysPerWeek: num("cw", baseCurrent.wfhDaysPerWeek),
      monthlyCommuteCost: num("cm", baseCurrent.monthlyCommuteCost),
      weeklyOvertimeHours: num("co", baseCurrent.weeklyOvertimeHours),
      annualPerks: num("cp", baseCurrent.annualPerks),
      monthlyNonTaxableManwon: num(
        "cnt",
        baseCurrent.monthlyNonTaxableManwon ?? 20
      ),
    },
    offer: {
      ...baseOffer,
      annualGross: num("ns", baseOffer.annualGross),
      oneWayCommuteMinutes: num("nc", baseOffer.oneWayCommuteMinutes),
      wfhDaysPerWeek: num("nw", baseOffer.wfhDaysPerWeek),
      monthlyCommuteCost: num("nm", baseOffer.monthlyCommuteCost),
      weeklyOvertimeHours: num("no", baseOffer.weeklyOvertimeHours),
      annualPerks: num("np", baseOffer.annualPerks),
      monthlyNonTaxableManwon: num(
        "nnt",
        baseOffer.monthlyNonTaxableManwon ?? 20
      ),
    },
    taxPreset: validTx,
    customTaxPct: sp.has("ct") ? num("ct", 27) : 27,
  };
}

function WorthMoveSearchBoundary(props: WorthMoveCalculatorProps) {
  const searchParams = useSearchParams();
  const searchString = searchParams.toString();
  return (
    <WorthMoveCalculatorInner
      key={searchString || "default"}
      {...props}
      searchString={searchString}
    />
  );
}

export default function WorthMoveCalculator(props: WorthMoveCalculatorProps) {
  return (
    <Suspense
      fallback={<WorthMoveCalculatorInner {...props} searchString="" />}
    >
      <WorthMoveSearchBoundary {...props} />
    </Suspense>
  );
}

function WorthMoveCalculatorInner({
  locale,
  initialCurrent,
  initialOffer,
  initialTaxPreset = "US-AVG",
  searchString,
}: WorthMoveCalculatorProps & { searchString: string }) {
  const baseCurrent = useMemo<JobInput>(
    () => ({
      ...(locale === "ko" ? DEFAULT_CURRENT_KO : DEFAULT_CURRENT_EN),
      ...initialCurrent,
    }),
    [locale, initialCurrent]
  );

  const baseOffer = useMemo<JobInput>(
    () => ({
      ...(locale === "ko" ? DEFAULT_OFFER_KO : DEFAULT_OFFER_EN),
      ...initialOffer,
    }),
    [locale, initialOffer]
  );

  const hydrated = useMemo(
    () =>
      parseInitialFromSearch(
        searchString,
        baseCurrent,
        baseOffer,
        initialTaxPreset
      ),
    [searchString, baseCurrent, baseOffer, initialTaxPreset]
  );

  const [currentJob, setCurrentJob] = useState<JobInput>(hydrated.current);
  const [offerJob, setOfferJob] = useState<JobInput>(hydrated.offer);
  const [taxPreset, setTaxPreset] = useState<GlobalTaxPresetId>(
    hydrated.taxPreset
  );
  const [customTaxPct, setCustomTaxPct] = useState<number>(
    hydrated.customTaxPct
  );
  const [koTransitMode, setKoTransitMode] = useState<"transit" | "driving">(
    "transit"
  );
  const [selectedRouteSlug, setSelectedRouteSlug] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showKoTaxDetail, setShowKoTaxDetail] = useState(false);

  const result = useMemo(
    () =>
      compareJobs(currentJob, offerJob, locale, taxPreset, customTaxPct),
    [currentJob, offerJob, locale, taxPreset, customTaxPct]
  );

  const applyKoreanRoutePreset = (
    slug: string,
    mode: "transit" | "driving" = koTransitMode
  ) => {
    const found = KOREAN_COMMUTE_ROUTES.find((r) => r.slug === slug);
    if (!found) return;
    setSelectedRouteSlug(slug);
    setOfferJob((prev) => ({
      ...prev,
      oneWayCommuteMinutes:
        mode === "driving" ? found.drivingOneWayMin : found.transitOneWayMin,
      monthlyCommuteCost:
        mode === "driving" ? found.monthlyDrivingKRW : found.monthlyTransitKRW,
      wfhDaysPerWeek: 0,
    }));
  };

  const applyGlobalScenario = (id: string) => {
    if (id === "rto-trap") {
      setTaxPreset("US-AVG");
      setCurrentJob({
        annualGross: 110000,
        oneWayCommuteMinutes: 0,
        wfhDaysPerWeek: 5,
        monthlyCommuteCost: 0,
        weeklyOvertimeHours: 2,
        annualPerks: 4500,
      });
      setOfferJob({
        annualGross: 130000,
        oneWayCommuteMinutes: 55,
        wfhDaysPerWeek: 0,
        monthlyCommuteCost: 360,
        weeklyOvertimeHours: 5,
        annualPerks: 4500,
      });
    } else if (id === "ca-to-tx") {
      setTaxPreset("US-TX");
      setCurrentJob({
        annualGross: 145000,
        oneWayCommuteMinutes: 45,
        wfhDaysPerWeek: 2,
        monthlyCommuteCost: 280,
        weeklyOvertimeHours: 5,
        annualPerks: 6000,
      });
      setOfferJob({
        annualGross: 145000,
        oneWayCommuteMinutes: 20,
        wfhDaysPerWeek: 3,
        monthlyCommuteCost: 140,
        weeklyOvertimeHours: 2,
        annualPerks: 6000,
      });
    } else if (id === "big-jump") {
      setTaxPreset("US-NY");
      setCurrentJob({
        annualGross: 95000,
        oneWayCommuteMinutes: 30,
        wfhDaysPerWeek: 2,
        monthlyCommuteCost: 132,
        weeklyOvertimeHours: 3,
        annualPerks: 3000,
      });
      setOfferJob({
        annualGross: 140000,
        oneWayCommuteMinutes: 45,
        wfhDaysPerWeek: 2,
        monthlyCommuteCost: 132,
        weeklyOvertimeHours: 4,
        annualPerks: 7000,
      });
    }
  };

  const buildShareUrl = (): string => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams({
      cs: String(currentJob.annualGross),
      ns: String(offerJob.annualGross),
      cc: String(currentJob.oneWayCommuteMinutes),
      nc: String(offerJob.oneWayCommuteMinutes),
      cw: String(currentJob.wfhDaysPerWeek),
      nw: String(offerJob.wfhDaysPerWeek),
      cm: String(currentJob.monthlyCommuteCost),
      nm: String(offerJob.monthlyCommuteCost),
      co: String(currentJob.weeklyOvertimeHours),
      no: String(offerJob.weeklyOvertimeHours),
      cp: String(currentJob.annualPerks),
      np: String(offerJob.annualPerks),
    });
    if (locale === "ko") {
      params.set("cnt", String(currentJob.monthlyNonTaxableManwon ?? 20));
      params.set("nnt", String(offerJob.monthlyNonTaxableManwon ?? 20));
    } else {
      params.set("tx", taxPreset);
      if (taxPreset === "CUSTOM") {
        params.set("ct", String(customTaxPct));
      }
    }
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  };

  const handleCopyShareLink = async () => {
    const shareUrl = buildShareUrl();
    if (!shareUrl) return;
    window.history.replaceState(null, "", shareUrl);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback textarea copy
      const el = document.createElement("textarea");
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleDownloadPng = () => {
    setDownloading(true);
    try {
      downloadReceiptPng(result, locale);
    } finally {
      setTimeout(() => setDownloading(false), 600);
    }
  };

  const handleReset = () => {
    setCurrentJob(baseCurrent);
    setOfferJob(baseOffer);
    setSelectedRouteSlug("");
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  const isPositive = result.trueHourlyDeltaPct >= 0;
  const featuredRoutes = KOREAN_COMMUTE_ROUTES.slice(0, 8);

  return (
    <div id="calculator" className="scroll-mt-20">
      {/* Quick Scenario / Commute Preset Bar */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        {locale === "ko" ? (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                원클릭 수도권 지옥철·자차 통근 프리셋 (이직 오퍼에 즉시 반영)
              </span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setKoTransitMode("transit");
                    if (selectedRouteSlug)
                      applyKoreanRoutePreset(selectedRouteSlug, "transit");
                  }}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition ${
                    koTransitMode === "transit"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Train className="h-3.5 w-3.5" /> 대중교통(K-패스)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setKoTransitMode("driving");
                    if (selectedRouteSlug)
                      applyKoreanRoutePreset(selectedRouteSlug, "driving");
                  }}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 transition ${
                    koTransitMode === "driving"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Car className="h-3.5 w-3.5" /> 자차(유류+톨+주차)
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {featuredRoutes.map((route) => {
                const active = selectedRouteSlug === route.slug;
                const mins =
                  koTransitMode === "driving"
                    ? route.drivingOneWayMin
                    : route.transitOneWayMin;
                return (
                  <button
                    key={route.slug}
                    type="button"
                    onClick={() =>
                      applyKoreanRoutePreset(route.slug, koTransitMode)
                    }
                    className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition ${
                      active
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400 hover:bg-white"
                    }`}
                  >
                    {route.originKo.split("(")[0]}↔{route.destKo.split("·")[0]}{" "}
                    <span className="opacity-80">({mins}분)</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                Quick Viral Presets:
              </span>
              <button
                type="button"
                onClick={() => applyGlobalScenario("rto-trap")}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-slate-400 hover:bg-white"
              >
                $110k Remote → $130k 5-Day RTO
              </button>
              <button
                type="button"
                onClick={() => applyGlobalScenario("big-jump")}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-slate-400 hover:bg-white"
              >
                $95k → $140k NYC Hybrid
              </button>
              <button
                type="button"
                onClick={() => applyGlobalScenario("ca-to-tx")}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-slate-400 hover:bg-white"
              >
                $145k Commuter → 0% State Tax Hybrid
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="tax-preset-select"
                className="text-xs font-bold text-slate-600 whitespace-nowrap"
              >
                Tax Jurisdiction:
              </label>
              <select
                id="tax-preset-select"
                value={taxPreset}
                onChange={(e) =>
                  setTaxPreset(e.target.value as GlobalTaxPresetId)
                }
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-900 focus:border-emerald-600 focus:outline-none"
              >
                {GLOBAL_TAX_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {locale === "en" && taxPreset === "CUSTOM" && (
          <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3">
            <label
              htmlFor="custom-tax-slider"
              className="text-xs font-bold text-slate-700"
            >
              Custom Effective Tax Rate: {customTaxPct}%
            </label>
            <input
              id="custom-tax-slider"
              type="range"
              min={0}
              max={55}
              step={0.5}
              value={customTaxPct}
              onChange={(e) => setCustomTaxPct(Number(e.target.value))}
              className="h-2 w-48 accent-emerald-600"
            />
          </div>
        )}
      </div>

      {/* Side-by-Side Job Input Cards */}
      <div className="grid gap-5 lg:grid-cols-2">
        <JobInputCard
          locale={locale}
          variant="current"
          title={
            locale === "ko"
              ? "현재 직장 (또는 재택 기준)"
              : "Current Job (or Remote Baseline)"
          }
          subtitle={
            locale === "ko"
              ? `2026 월 실수령 ${formatCurrency(
                  result.current.monthlyNetTakeHomeBase,
                  "ko"
                )} (공제율 ${result.current.effectiveTaxRatePct.toFixed(1)}%)`
              : `Est. Net Monthly: ${formatCurrency(
                  result.current.monthlyNetTakeHomeBase,
                  "en"
                )} (${result.current.effectiveTaxRatePct.toFixed(1)}% eff. tax)`
          }
          job={currentJob}
          onChange={setCurrentJob}
        />

        <JobInputCard
          locale={locale}
          variant="offer"
          title={
            locale === "ko"
              ? "이직 오퍼 (또는 출근 전환 조건)"
              : "New Offer (or Return-to-Office)"
          }
          subtitle={
            locale === "ko"
              ? `2026 월 실수령 ${formatCurrency(
                  result.offer.monthlyNetTakeHomeBase,
                  "ko"
                )} (공제율 ${result.offer.effectiveTaxRatePct.toFixed(1)}%)`
              : `Est. Net Monthly: ${formatCurrency(
                  result.offer.monthlyNetTakeHomeBase,
                  "en"
                )} (${result.offer.effectiveTaxRatePct.toFixed(1)}% eff. tax)`
          }
          job={offerJob}
          onChange={setOfferJob}
        />
      </div>

      {/* Above-Fold High-Visibility Finance Ad Slot */}
      <AdBanner locale={locale} position="above-fold" slot="1102938475" />

      {/* Brutal Verdict Banner + KPI Grid + Viral Receipt Card */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* Left 7 Cols: Brutal Verdict + Key Metrics + Break-even Callout */}
        <div className="space-y-5 lg:col-span-7">
          {/* Brutal Verdict Card */}
          <div
            className={`rounded-3xl border-2 p-6 shadow-sm ${
              result.verdictTier === "brutal-loss" ||
              result.verdictTier === "trap"
                ? "border-rose-300 bg-gradient-to-br from-rose-50 via-white to-rose-50/40"
                : result.verdictTier === "barely-even"
                  ? "border-amber-300 bg-gradient-to-br from-amber-50 via-white to-amber-50/40"
                  : "border-emerald-400 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold tracking-wide ${
                  result.verdictTier === "brutal-loss" ||
                  result.verdictTier === "trap"
                    ? "bg-rose-600 text-white"
                    : result.verdictTier === "barely-even"
                      ? "bg-amber-500 text-slate-950"
                      : "bg-emerald-600 text-white"
                }`}
              >
                {isPositive ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5" />
                )}
                {result.verdictBadge}
              </span>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {locale === "ko" ? "초기화" : "Reset"}
              </button>
            </div>

            <h2 className="mt-3 text-xl font-black leading-snug text-slate-900 sm:text-2xl">
              {result.verdictHeadline}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {result.verdictDetail}
            </p>

            {/* Break-Even Salary Highlight Box */}
            <div className="mt-5 rounded-2xl border border-slate-900/10 bg-slate-900 p-4 text-white">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                {locale === "ko"
                  ? "손익분기점 (최소 본전 연봉)"
                  : "Break-Even Gross Salary Needed"}
              </p>
              <p className="mt-1 text-base font-bold leading-relaxed sm:text-lg">
                {locale === "ko" ? (
                  <>
                    이 통근 거리·야근을 감수하려면 최소 연봉{" "}
                    <span className="text-xl font-black text-amber-300 underline decoration-amber-400/60 underline-offset-4">
                      {result.breakEvenGrossInputUnit.toLocaleString("ko-KR")}만원
                    </span>{" "}
                    이상 받아야 현 직장 시급과 본전입니다.
                  </>
                ) : (
                  <>
                    To break even on this commute &amp; overtime, your new offer
                    must pay at least{" "}
                    <span className="text-xl font-black text-amber-300 underline decoration-amber-400/60 underline-offset-4">
                      ${result.breakEvenGrossInputUnit.toLocaleString("en-US")}
                    </span>{" "}
                    /yr gross.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* 4 KPI Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* True Hourly Comparison */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>
                  {locale === "ko" ? "내 진짜 시급 변화" : "TRUE HOURLY WAGE"}
                </span>
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-rose-600" />
                )}
              </div>
              <div className="mt-2 flex items-baseline gap-2 tabular-nums">
                <span className="text-sm font-bold text-slate-400 line-through">
                  {formatHourly(result.current.trueHourlyBase, locale)}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-2xl font-black text-slate-900">
                  {formatHourly(result.offer.trueHourlyBase, locale)}
                </span>
              </div>
              <p
                className={`mt-1 text-xs font-extrabold tabular-nums ${
                  isPositive ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {formatHourly(result.trueHourlyDeltaBase, locale, true)}/
                {locale === "ko" ? "시간" : "hr"} (
                {result.trueHourlyDeltaPct >= 0 ? "+" : ""}
                {result.trueHourlyDeltaPct.toFixed(1)}%)
              </p>
            </div>

            {/* Net Monthly Take-home */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>
                  {locale === "ko"
                    ? "월 실수령액 (세후 통장 입금액)"
                    : "MONTHLY NET TAKE-HOME"}
                </span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                  {locale === "ko" ? "2026 4대보험" : "AFTER TAX"}
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900 tabular-nums">
                {formatCurrency(result.offer.monthlyNetTakeHomeBase, locale)}
              </p>
              <p
                className={`mt-1 text-xs font-bold tabular-nums ${
                  result.monthlyTakeHomeDeltaBase >= 0
                    ? "text-emerald-700"
                    : "text-rose-700"
                }`}
              >
                {locale === "ko" ? "현 직장 대비 월 " : "vs Current: "}
                {formatCurrency(result.monthlyTakeHomeDeltaBase, locale, {
                  showSign: true,
                })}
              </p>
            </div>

            {/* Annual Hours Lost ("길바닥 헌납 시간") */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>
                  {locale === "ko"
                    ? "연간 길바닥+야근 헌납 시간"
                    : "ANNUAL COMMUTE + OT LOST"}
                </span>
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              <p className="mt-2 text-2xl font-black text-slate-900 tabular-nums">
                {Math.round(result.offer.annualLostHours).toLocaleString()}{" "}
                <span className="text-base font-bold text-slate-500">
                  {locale === "ko" ? "시간/년" : "hrs/yr"}
                </span>
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-600 tabular-nums">
                {locale === "ko"
                  ? `24시간 기준 연 ${(
                      result.offer.annualLostHours / 24
                    ).toFixed(1)}일 증발 (현 직장 대비 ${
                      result.lostHoursDelta >= 0 ? "+" : ""
                    }${Math.round(result.lostHoursDelta)}시간)`
                  : `Equals ${(result.offer.annualLostHours / 24).toFixed(
                      1
                    )} full 24h days/yr (${
                      result.lostHoursDelta >= 0 ? "+" : ""
                    }${Math.round(result.lostHoursDelta)} hrs vs current)`}
              </p>
            </div>

            {/* Real Annual Disposable Cash Delta */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>
                  {locale === "ko"
                    ? "교통비·복지 반영 순수 연소득 증감"
                    : "REAL ANNUAL CASH GAIN"}
                </span>
                <Flame className="h-4 w-4 text-orange-500" />
              </div>
              <p
                className={`mt-2 text-2xl font-black tabular-nums ${
                  result.realAnnualNetDeltaBase >= 0
                    ? "text-emerald-700"
                    : "text-rose-700"
                }`}
              >
                {formatCurrency(result.realAnnualNetDeltaBase, locale, {
                  showSign: true,
                  compact: locale === "ko",
                })}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-600 tabular-nums">
                {locale === "ko"
                  ? `연간 교통비 지출: ${formatCurrency(
                      result.offer.annualCommuteCostBase,
                      "ko",
                      { compact: true }
                    )}`
                  : `Annual commute spend: ${formatCurrency(
                      result.offer.annualCommuteCostBase,
                      "en"
                    )}/yr`}
              </p>
            </div>
          </div>

          {/* Korean 2026 4대보험 & 소득세 상세 내역 토글 */}
          {locale === "ko" &&
            result.current.koreanBreakdown &&
            result.offer.koreanBreakdown && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setShowKoTaxDetail((v) => !v)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div>
                    <span className="text-xs font-extrabold text-emerald-700">
                      2026 개정 요율 반영 (국민연금 4.75% · 건보 3.545%)
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      현 직장 vs 이직 오퍼 4대보험·근로소득세 월 공제 상세 비교
                    </h3>
                  </div>
                  <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    {showKoTaxDetail ? "접기" : "상세 열기"}
                  </span>
                </button>

                {showKoTaxDetail && (
                  <div className="mt-4 overflow-x-auto border-t border-slate-100 pt-3">
                    <table className="w-full text-xs tabular-nums">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-2 text-left font-bold">공제 항목 (월 기준)</th>
                          <th className="py-2 text-right font-bold">현 직장</th>
                          <th className="py-2 text-right font-bold">이직 오퍼</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        <tr>
                          <td className="py-2">세전 월급여 (비과세 포함)</td>
                          <td className="py-2 text-right font-semibold">
                            {formatCurrency(result.current.koreanBreakdown.monthlyGrossKRW, "ko")}
                          </td>
                          <td className="py-2 text-right font-semibold">
                            {formatCurrency(result.offer.koreanBreakdown.monthlyGrossKRW, "ko")}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2">국민연금 (4.75%, 상한 반영)</td>
                          <td className="py-2 text-right">
                            -{formatCurrency(result.current.koreanBreakdown.nationalPensionMonthly, "ko")}
                          </td>
                          <td className="py-2 text-right">
                            -{formatCurrency(result.offer.koreanBreakdown.nationalPensionMonthly, "ko")}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2">건강보험 (3.545%)</td>
                          <td className="py-2 text-right">
                            -{formatCurrency(result.current.koreanBreakdown.healthInsuranceMonthly, "ko")}
                          </td>
                          <td className="py-2 text-right">
                            -{formatCurrency(result.offer.koreanBreakdown.healthInsuranceMonthly, "ko")}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2">장기요양보험 (건보료의 12.95%)</td>
                          <td className="py-2 text-right">
                            -{formatCurrency(result.current.koreanBreakdown.longTermCareMonthly, "ko")}
                          </td>
                          <td className="py-2 text-right">
                            -{formatCurrency(result.offer.koreanBreakdown.longTermCareMonthly, "ko")}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2">고용보험 (0.9%)</td>
                          <td className="py-2 text-right">
                            -{formatCurrency(result.current.koreanBreakdown.employmentInsuranceMonthly, "ko")}
                          </td>
                          <td className="py-2 text-right">
                            -{formatCurrency(result.offer.koreanBreakdown.employmentInsuranceMonthly, "ko")}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2">근로소득세 + 지방소득세(10%)</td>
                          <td className="py-2 text-right">
                            -{formatCurrency(
                              result.current.koreanBreakdown.incomeTaxMonthly +
                                result.current.koreanBreakdown.localIncomeTaxMonthly,
                              "ko"
                            )}
                          </td>
                          <td className="py-2 text-right">
                            -{formatCurrency(
                              result.offer.koreanBreakdown.incomeTaxMonthly +
                                result.offer.koreanBreakdown.localIncomeTaxMonthly,
                              "ko"
                            )}
                          </td>
                        </tr>
                        <tr className="bg-slate-50 font-extrabold text-slate-900">
                          <td className="py-2.5 pl-2">최종 월 실수령액</td>
                          <td className="py-2.5 text-right">
                            {formatCurrency(result.current.koreanBreakdown.monthlyNetKRW, "ko")}
                          </td>
                          <td className="py-2.5 pr-2 text-right text-emerald-700">
                            {formatCurrency(result.offer.koreanBreakdown.monthlyNetKRW, "ko")}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
        </div>

        {/* Right 5 Cols: Shareable Viral Thermal Receipt Card */}
        <div className="lg:col-span-5">
          <div className="rounded-3xl bg-slate-900 p-4 shadow-xl sm:p-5">
            {/* Physical Thermal Paper Card */}
            <div className="relative overflow-hidden rounded-t-sm rounded-b-sm bg-[#faf8f3] px-5 py-6 text-slate-900 shadow-inner font-receipt">
              {/* Top perforated dots visual */}
              <div className="mb-4 flex justify-between border-b-2 border-dashed border-slate-300 pb-3 text-center">
                <div className="w-full">
                  <p className="text-base font-black tracking-tight text-slate-950">
                    {locale === "ko"
                      ? "이직손익판독기 팩폭 영수증"
                      : "WORTHMOVE AUDIT RECEIPT"}
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold text-slate-500">
                    {locale === "ko"
                      ? "2026 세후 실수령 · 통근시간 · 실질시급 명세"
                      : "ITEMIZED RAISE vs. TAX & COMMUTE AUDIT"}
                  </p>
                </div>
              </div>

              {/* Job A vs Job B Header */}
              <div className="mb-3 grid grid-cols-2 gap-2 border-b border-dashed border-slate-300 pb-3 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-slate-500">
                    {locale === "ko" ? "[현 직장]" : "[CURRENT]"}
                  </p>
                  <p className="text-sm font-extrabold">
                    {formatCurrency(result.current.annualGrossBase, locale, {
                      compact: true,
                    })}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    {locale === "ko"
                      ? `편도 ${currentJob.oneWayCommuteMinutes}분 · 주${result.current.officeDaysPerWeek}일 출근`
                      : `${currentJob.oneWayCommuteMinutes}m 1-way · ${result.current.officeDaysPerWeek}d office`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-500">
                    {locale === "ko" ? "[이직 오퍼]" : "[NEW OFFER]"}
                  </p>
                  <p className="text-sm font-extrabold">
                    {formatCurrency(result.offer.annualGrossBase, locale, {
                      compact: true,
                    })}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    {locale === "ko"
                      ? `편도 ${offerJob.oneWayCommuteMinutes}분 · 주${result.offer.officeDaysPerWeek}일 출근`
                      : `${offerJob.oneWayCommuteMinutes}m 1-way · ${result.offer.officeDaysPerWeek}d office`}
                  </p>
                </div>
              </div>

              {/* Itemized Receipt Lines */}
              <dl className="space-y-2 text-xs tabular-nums">
                <div className="flex justify-between">
                  <dt className="text-slate-600">
                    {locale === "ko" ? "명목 연봉 증감" : "Nominal Raise"}
                  </dt>
                  <dd className="font-bold text-slate-900">
                    {formatCurrency(result.nominalGrossDeltaBase, locale, {
                      showSign: true,
                      compact: locale === "ko",
                    })}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">
                    {locale === "ko" ? "세금·4대보험 증가분" : "Tax Bite"}
                  </dt>
                  <dd
                    className={`font-bold ${
                      result.taxDeltaBase > 0
                        ? "text-rose-700"
                        : "text-emerald-700"
                    }`}
                  >
                    {formatCurrency(-result.taxDeltaBase, locale, {
                      showSign: true,
                      compact: locale === "ko",
                    })}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">
                    {locale === "ko"
                      ? "교통·주유비 증감"
                      : "Transit / Gas Drain"}
                  </dt>
                  <dd
                    className={`font-bold ${
                      result.commuteCostDeltaBase > 0
                        ? "text-rose-700"
                        : "text-emerald-700"
                    }`}
                  >
                    {formatCurrency(-result.commuteCostDeltaBase, locale, {
                      showSign: true,
                      compact: locale === "ko",
                    })}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-600">
                    {locale === "ko"
                      ? "통근+야근 시간 세금"
                      : "Commute Time Tax"}
                  </dt>
                  <dd
                    className={`font-bold ${
                      result.lostHoursDelta > 0
                        ? "text-rose-700"
                        : "text-emerald-700"
                    }`}
                  >
                    {result.lostHoursDelta > 0 ? "+" : ""}
                    {Math.round(result.lostHoursDelta)}{" "}
                    {locale === "ko" ? "시간/년" : "hrs/yr"}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-dashed border-slate-300 pt-2">
                  <dt className="font-bold text-slate-700">
                    {locale === "ko"
                      ? "현 직장 진짜 시급"
                      : "Current True Hourly"}
                  </dt>
                  <dd className="font-bold">
                    {formatHourly(result.current.trueHourlyBase, locale)}/
                    {locale === "ko" ? "시간" : "hr"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-bold text-slate-700">
                    {locale === "ko"
                      ? "이직 후 진짜 시급"
                      : "New Offer True Hourly"}
                  </dt>
                  <dd className="font-extrabold">
                    {formatHourly(result.offer.trueHourlyBase, locale)}/
                    {locale === "ko" ? "시간" : "hr"}
                  </dd>
                </div>
              </dl>

              {/* Grand Total Delta */}
              <div className="mt-3 border-y-2 border-dashed border-slate-800 py-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-black uppercase">
                    {locale === "ko" ? "실질 시급 증감" : "REAL HOURLY DELTA"}
                  </span>
                  <span
                    className={`text-lg font-black tabular-nums ${
                      isPositive ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {formatHourly(result.trueHourlyDeltaBase, locale, true)} (
                    {result.trueHourlyDeltaPct >= 0 ? "+" : ""}
                    {result.trueHourlyDeltaPct.toFixed(1)}%)
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] font-bold text-slate-600">
                  <span>
                    {locale === "ko"
                      ? "최소 본전 연봉:"
                      : "Min Break-Even Gross:"}
                  </span>
                  <span className="text-slate-950">
                    {formatCurrency(result.breakEvenGrossBase, locale, {
                      compact: locale === "ko",
                    })}
                  </span>
                </div>
              </div>

              {/* Stamp Badge */}
              <div
                className={`mt-3 rounded-lg border-2 px-3 py-2 text-center text-xs font-black ${
                  isPositive
                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                    : "border-rose-600 bg-rose-50 text-rose-800"
                }`}
              >
                [{result.verdictBadge}]
              </div>

              {/* CSS Barcode */}
              <div
                aria-hidden="true"
                className="mt-4 flex h-8 items-stretch justify-center gap-[2px] opacity-80"
              >
                {[3, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2, 2, 3, 1, 4, 1, 3, 2, 1, 3, 2].map(
                  (w, idx) => (
                    <span
                      key={idx}
                      style={{ width: `${w * 2.5}px` }}
                      className={idx % 2 === 0 ? "bg-slate-900" : "bg-transparent"}
                    />
                  )
                )}
              </div>
              <p className="mt-1.5 text-center text-[10px] font-semibold tracking-widest text-slate-400">
                WORTHMOVE · 2026 AUDIT
              </p>
            </div>

            {/* Viral Action Buttons: Download PNG + Copy Share Link */}
            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={downloading}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-extrabold text-slate-950 shadow-sm transition hover:bg-emerald-400 active:scale-[0.99]"
              >
                <Download className="h-4 w-4" />
                {locale === "ko"
                  ? downloading
                    ? "영수증 생성 중..."
                    : "영수증 이미지 저장 (PNG)"
                  : downloading
                    ? "Rendering PNG..."
                    : "Download PNG Receipt"}
              </button>

              <button
                type="button"
                onClick={handleCopyShareLink}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-xs font-extrabold text-white transition hover:bg-slate-700 active:scale-[0.99]"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    {locale === "ko"
                      ? "결과 링크 복사됨!"
                      : "Receipt Link Copied!"}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-slate-300" />
                    {locale === "ko"
                      ? "결과 공유 링크 복사"
                      : "Copy Share Link"}
                  </>
                )}
              </button>
            </div>
            <p className="mt-2.5 flex items-center justify-center gap-1 text-center text-[11px] text-slate-400">
              <Share2 className="h-3 w-3" />
              {locale === "ko"
                ? "블라인드·단톡방·디시에 영수증 PNG나 링크를 바로 공유해 보세요"
                : "Share your receipt PNG or exact URL on Reddit, Blind, Discord, or X"}
            </p>
          </div>
        </div>
      </div>

      {/* Below-Receipt AdSense Slot */}
      <AdBanner locale={locale} position="below-receipt" slot="5564738291" />
    </div>
  );
}

interface JobInputCardProps {
  locale: Locale;
  variant: "current" | "offer";
  title: string;
  subtitle: string;
  job: JobInput;
  onChange: (next: JobInput) => void;
}

function JobInputCard({
  locale,
  variant,
  title,
  subtitle,
  job,
  onChange,
}: JobInputCardProps) {
  const update = (patch: Partial<JobInput>) => onChange({ ...job, ...patch });

  return (
    <div
      className={`rounded-3xl border bg-white p-5 shadow-xs sm:p-6 ${
        variant === "offer"
          ? "border-emerald-500/60 ring-1 ring-emerald-500/20"
          : "border-slate-200"
      }`}
    >
      <div className="border-b border-slate-100 pb-3">
        <div className="flex items-center justify-between">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
              variant === "offer"
                ? "bg-emerald-100 text-emerald-900"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {variant === "offer"
              ? locale === "ko"
                ? "STEP 2 · 비교 오퍼"
                : "JOB B · NEW OFFER / RTO"
              : locale === "ko"
                ? "STEP 1 · 현재 기준"
                : "JOB A · CURRENT / REMOTE"}
          </span>
        </div>
        <h3 className="mt-2 text-lg font-extrabold text-slate-900">{title}</h3>
        <p className="mt-0.5 text-xs font-semibold text-emerald-700 tabular-nums">
          {subtitle}
        </p>
      </div>

      <div className="mt-4 space-y-4">
        {/* Annual Gross Salary */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <label htmlFor={`${variant}-gross`}>
              {locale === "ko" ? "세전 계약 연봉 (만원)" : "Annual Gross Salary ($)"}
            </label>
            <span className="text-sm font-black text-slate-900 tabular-nums">
              {locale === "ko"
                ? `${job.annualGross.toLocaleString("ko-KR")}만원`
                : `$${job.annualGross.toLocaleString("en-US")}`}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-3">
            <input
              id={`${variant}-gross`}
              type="number"
              min={0}
              step={locale === "ko" ? 100 : 1000}
              value={job.annualGross}
              onChange={(e) =>
                update({ annualGross: Math.max(0, Number(e.target.value) || 0) })
              }
              className="w-36 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-extrabold text-slate-900 tabular-nums focus:border-emerald-600 focus:bg-white focus:outline-none"
            />
            <input
              type="range"
              aria-label={`${title} salary slider`}
              min={locale === "ko" ? 2400 : 30000}
              max={locale === "ko" ? 20000 : 350000}
              step={locale === "ko" ? 100 : 2500}
              value={Math.min(
                locale === "ko" ? 20000 : 350000,
                job.annualGross
              )}
              onChange={(e) => update({ annualGross: Number(e.target.value) })}
              className="h-2 flex-1 accent-slate-900"
            />
          </div>
        </div>

        {/* One-way Commute Minutes + WFH Days */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor={`${variant}-commute`}
              className="block text-xs font-bold text-slate-700"
            >
              {locale === "ko"
                ? "편도 통근 시간 (분)"
                : "One-Way Commute (min)"}
            </label>
            <input
              id={`${variant}-commute`}
              type="number"
              min={0}
              max={240}
              step={5}
              value={job.oneWayCommuteMinutes}
              onChange={(e) =>
                update({
                  oneWayCommuteMinutes: Math.max(
                    0,
                    Number(e.target.value) || 0
                  ),
                })
              }
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 tabular-nums focus:border-emerald-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor={`${variant}-wfh`}
              className="block text-xs font-bold text-slate-700"
            >
              {locale === "ko"
                ? "주당 재택근무 (일/주)"
                : "WFH Days / Week (0–5)"}
            </label>
            <select
              id={`${variant}-wfh`}
              value={job.wfhDaysPerWeek}
              onChange={(e) =>
                update({ wfhDaysPerWeek: Number(e.target.value) })
              }
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
            >
              {[0, 1, 2, 3, 4, 5].map((d) => (
                <option key={d} value={d}>
                  {locale === "ko"
                    ? d === 5
                      ? "주 5일 풀재택"
                      : d === 0
                        ? "0일 (주 5일 전면출근)"
                        : `주 ${d}일 재택 (출근 ${5 - d}일)`
                    : d === 5
                      ? "5 days (100% Remote)"
                      : d === 0
                        ? "0 days (5-Day Office RTO)"
                        : `${d}d WFH (${5 - d}d Office)`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Monthly Commute Cost + Weekly Unpaid Overtime */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor={`${variant}-cost`}
              className="block text-xs font-bold text-slate-700"
            >
              {locale === "ko"
                ? "월 교통·유류·주차비 (원)"
                : "Monthly Commute Cost ($)"}
            </label>
            <input
              id={`${variant}-cost`}
              type="number"
              min={0}
              step={locale === "ko" ? 10000 : 20}
              value={job.monthlyCommuteCost}
              onChange={(e) =>
                update({
                  monthlyCommuteCost: Math.max(0, Number(e.target.value) || 0),
                })
              }
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 tabular-nums focus:border-emerald-600 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor={`${variant}-ot`}
              className="block text-xs font-bold text-slate-700"
            >
              {locale === "ko"
                ? "주당 무급 야근 (시간)"
                : "Weekly Unpaid OT (hrs)"}
            </label>
            <input
              id={`${variant}-ot`}
              type="number"
              min={0}
              max={60}
              step={1}
              value={job.weeklyOvertimeHours}
              onChange={(e) =>
                update({
                  weeklyOvertimeHours: Math.max(0, Number(e.target.value) || 0),
                })
              }
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 tabular-nums focus:border-emerald-600 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Annual Perks / Welfare + KO Non-taxable meal */}
        <div
          className={`grid gap-3 ${
            locale === "ko" ? "grid-cols-2" : "grid-cols-1"
          }`}
        >
          <div>
            <label
              htmlFor={`${variant}-perks`}
              className="block text-xs font-bold text-slate-700"
            >
              {locale === "ko"
                ? "연간 복지포인트·식권 (만원)"
                : "Annual Perks / 401(k) Match ($)"}
            </label>
            <input
              id={`${variant}-perks`}
              type="number"
              min={0}
              step={locale === "ko" ? 50 : 500}
              value={job.annualPerks}
              onChange={(e) =>
                update({
                  annualPerks: Math.max(0, Number(e.target.value) || 0),
                })
              }
              className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 tabular-nums focus:border-emerald-600 focus:bg-white focus:outline-none"
            />
          </div>

          {locale === "ko" && (
            <div>
              <label
                htmlFor={`${variant}-nontax`}
                className="block text-xs font-bold text-slate-700"
              >
                월 비과세 식대 한도 (만원)
              </label>
              <input
                id={`${variant}-nontax`}
                type="number"
                min={0}
                max={100}
                step={5}
                value={job.monthlyNonTaxableManwon ?? 20}
                onChange={(e) =>
                  update({
                    monthlyNonTaxableManwon: Math.max(
                      0,
                      Number(e.target.value) || 0
                    ),
                  })
                }
                className="mt-1 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900 tabular-nums focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
