import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calculator, Mail, Scale, ShieldCheck } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import {
  buildPageMetadata,
  isValidLocale,
  LOCALES,
  SITE_URL,
} from "@/lib/site-config";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

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
      pathWithoutLocale: "/about",
      title: "서비스 소개 · 2026 세금/실질시급 산출 방법론 & 문의 | 이직손익판독기",
      description:
        "이직손익판독기(WorthMove)가 2026년 4대보험(국민연금 4.75%·건강보험 3.545%), 근로소득세, 통근 비용, 야근 시간을 결합해 진짜 시급과 본전 연봉을 산출하는 공식과 운영 안내.",
    });
  }

  return buildPageMetadata({
    locale: "en",
    pathWithoutLocale: "/about",
    title: "About WorthMove · 2026 Tax & True Hourly Wage Methodology & Contact",
    description:
      "Learn how WorthMove calculates 2026 progressive after-tax pay, commute time drain, RTO break-even salaries, and how to contact our editorial engineering team.",
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name:
      locale === "ko"
        ? "서비스 소개 및 계산 방법론 — 이직손익판독기 WorthMove"
        : "About & Methodology — WorthMove",
    url: `${SITE_URL}/${locale}/about`,
    inLanguage: locale === "ko" ? "ko-KR" : "en-US",
  };

  return (
    <div className="mx-auto max-w-4xl">
      <JsonLd data={jsonLd} />

      <nav className="mb-4 text-xs font-semibold text-slate-500">
        <Link href={`/${locale}`} className="hover:text-slate-900">
          {locale === "ko" ? "홈" : "Home"}
        </Link>{" "}
        /{" "}
        <span className="font-bold text-slate-900">
          {locale === "ko" ? "서비스 소개 및 방법론" : "About & Methodology"}
        </span>
      </nav>

      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-10 space-y-8 text-sm leading-relaxed text-slate-700">
        {locale === "ko" ? (
          <>
            <header className="border-b border-slate-200 pb-6">
              <span className="inline-block rounded-full bg-slate-900 px-3 py-1 text-xs font-extrabold text-emerald-400">
                WORTHMOVE METHODOLOGY · 2026 EDITION
              </span>
              <h1 className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl">
                이직손익판독기(WorthMove) 소개 및 2026 계산 기준
              </h1>
              <p className="mt-2 text-slate-600">
                &ldquo;연봉 800만원 올려서 이직했는데 왜 통장 잔고와 삶의 질은
                그대로일까?&rdquo; 이직손익판독기는 계약서상 세전 연봉 뒤에 숨겨진
                한계세율, 왕복 통근 시간, 자차/대중교통 비용을 정량화하기 위해
                만들어졌습니다.
              </p>
            </header>

            <section className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <Calculator className="h-5 w-5 text-emerald-600" />
                <h2 className="mt-2 font-extrabold text-slate-900">
                  2026 세법·4대보험 반영
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  국민연금 4.75%(개정안), 건강보험 3.545%, 장기요양 12.95%,
                  고용보험 0.9% 및 근로소득 간이세액 산출식 적용.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <Scale className="h-5 w-5 text-emerald-600" />
                <h2 className="mt-2 font-extrabold text-slate-900">
                  이진 탐색 본전 연봉 역산
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  누진 소득세 구간까지 반영하여 현 직장 시급과 1원 단위까지 일치하는
                  최소 요구 연봉을 역산합니다.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h2 className="mt-2 font-extrabold text-slate-900">
                  무서버 개인정보 보호
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  모든 수치와 영수증 PNG 이미지는 브라우저 내부에서만 생성되며 외부에
                  저장되지 않습니다.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-extrabold text-slate-900">
                1. 내 진짜 시급(True Hourly Wage) 공식
              </h2>
              <div className="rounded-2xl bg-slate-900 p-4 font-mono text-xs text-emerald-300">
                진짜 시급 = (세후 연 실수령액 + 연간 복지포인트 - 연간 교통·유류비) ÷
                (연 기본 근로 2,000시간 + 연간 왕복 통근 시간 + 연간 무급 야근 시간)
              </div>
              <p>
                연간 활동 주수는 공휴일·연차를 감안한 <strong>50주(주 5일 기준 연 250일 출근)</strong>를
                표준으로 삼습니다. 주당 재택근무 일수를 설정하면 실제 오피스 출근
                일수에 비례해 연간 통근 시간이 자동 차감됩니다.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-extrabold text-slate-900">
                2. 2026년 대한민국 4대보험 및 소득세 산출 기준
              </h2>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <strong>비과세 식대</strong>: 기본 월 20만원(연 240만원)을 과세
                  표준에서 제외하며 계산기에서 직접 조정할 수 있습니다.
                </li>
                <li>
                  <strong>국민연금</strong>: 2026년 시행 기준 근로자 부담분{" "}
                  <strong>4.75%</strong> 및 기준소득월액 상·하한액(40만원~637만원)
                  적용.
                </li>
                <li>
                  <strong>건강보험·장기요양·고용보험</strong>: 건강보험 근로자
                  부담분 3.545%, 장기요양보험(건보료의 12.95%), 고용보험 근로자
                  부담분 0.9% 적용.
                </li>
                <li>
                  <strong>근로소득세 및 지방소득세</strong>: 1인 가구 표준
                  근로소득공제, 기본 인적공제(150만원), 4대보험료 소득공제, 과세표준
                  6%~45% 누진세율, 근로소득세액공제 및 표준세액공제 반영 후
                  지방소득세 10% 가산.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-extrabold text-slate-900">
                3. 면책 조항 (Disclaimer)
              </h2>
              <p>
                본 서비스가 제공하는 모든 세후 급여, 통근 비용 및 손익분기점 수치는
                커리어 의사결정을 돕기 위한 표준 시뮬레이션 추정치입니다. 부양가족
                수, 중소기업 청년 소득세 감면, 연말정산 특별세액공제 여부에 따라 실제
                원천징수액과 차이가 있을 수 있으며, 정식 세무·법률 자문을 대체하지
                않습니다.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-2">
              <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                <Mail className="h-4 w-4 text-emerald-600" />
                4. 문의 및 데이터 제보 (Contact)
              </h2>
              <p className="text-xs sm:text-sm">
                신규 수도권 출퇴근 노선 추가 요청, 세율 업데이트 제보, 제휴 문의는
                공식 GitHub 저장소 이슈 트래커(
                <a
                  href="https://github.com/kbu3986/worthmove-global/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-emerald-700 underline"
                >
                  github.com/kbu3986/worthmove-global/issues
                </a>
                )를 통해 남겨주시면 신속히 검토하여 반영하겠습니다.
              </p>
            </section>
          </>
        ) : (
          <>
            <header className="border-b border-slate-200 pb-6">
              <span className="inline-block rounded-full bg-slate-900 px-3 py-1 text-xs font-extrabold text-emerald-400">
                WORTHMOVE METHODOLOGY · 2026 EDITION
              </span>
              <h1 className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl">
                About WorthMove &amp; Our 2026 Calculation Methodology
              </h1>
              <p className="mt-2 text-slate-600">
                A $20,000 raise on paper frequently turns into a net hourly pay
                cut once marginal income taxes, rush-hour fuel/transit expenses,
                and 500+ annual commuting hours are factored in. WorthMove makes
                that hidden math transparent in seconds.
              </p>
            </header>

            <section className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <Calculator className="h-5 w-5 text-emerald-600" />
                <h2 className="mt-2 font-extrabold text-slate-900">
                  2026 Progressive Taxes
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  Models US Federal brackets, FICA caps, State taxes (CA, NY,
                  TX, WA, FL, IL, MA), UK PAYE/NI, Canada, Australia, and Korea.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <Scale className="h-5 w-5 text-emerald-600" />
                <h2 className="mt-2 font-extrabold text-slate-900">
                  Exact Break-Even Solver
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  Uses binary search across progressive marginal brackets to
                  pinpoint the exact gross offer required to match your current
                  true hourly pay.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h2 className="mt-2 font-extrabold text-slate-900">
                  Zero-Server Privacy
                </h2>
                <p className="mt-1 text-xs text-slate-600">
                  Every calculation and thermal PNG receipt stays 100% inside
                  your browser with zero personal data collection.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-extrabold text-slate-900">
                1. The True Hourly Wage Formula
              </h2>
              <div className="rounded-2xl bg-slate-900 p-4 font-mono text-xs text-emerald-300">
                True Hourly Wage = (Annual After-Tax Net + Annual Perks/401k −
                Annual Commute Spend) ÷ (2,000 Base Work Hours + Annual
                Round-Trip Commute Hours + Annual Unpaid Overtime Hours)
              </div>
              <p>
                We model <strong>50 active working weeks per year</strong>{" "}
                (accounting for ~2 weeks of holidays/PTO), meaning a 5-day
                in-office schedule equals 250 commuting days/year. Hybrid WFH
                schedules proportionally reduce annual commuting hours.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-extrabold text-slate-900">
                2. Tax &amp; Payroll Assumptions
              </h2>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <strong>United States</strong>: 2026 Single Standard Deduction
                  ($15,000), progressive federal brackets (10%–37%), Social
                  Security (6.2% up to wage base cap), Medicare (1.45% + 0.9%
                  Additional Medicare), plus state-specific progressive or flat
                  schedules.
                </li>
                <li>
                  <strong>UK, Canada &amp; Australia</strong>: UK Personal
                  Allowance taper + Income Tax/NI; Canadian Federal + Ontario +
                  CPP/EI; Australian Stage 3 resident brackets + 2% Medicare
                  levy.
                </li>
                <li>
                  <strong>Custom Override</strong>: Users with complex joint
                  filings, pre-tax HSA/401(k) deductions, or other jurisdictions
                  can select Custom Effective Tax Rate (%) for exact tuning.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-extrabold text-slate-900">
                3. Editorial Independence &amp; Financial Disclaimer
              </h2>
              <p>
                WorthMove is an independent educational calculator and career
                planning resource. Estimates do not constitute certified tax,
                accounting, or legal advice; consult a qualified CPA or tax
                advisor for individual tax filings.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-2">
              <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                <Mail className="h-4 w-4 text-emerald-600" />
                4. Contact &amp; Feedback
              </h2>
              <p className="text-xs sm:text-sm">
                Have feedback, a tax bracket update, or a feature request? Open
                an issue on our public repository at{" "}
                <a
                  href="https://github.com/kbu3986/worthmove-global/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-emerald-700 underline"
                >
                  github.com/kbu3986/worthmove-global/issues
                </a>
                .
              </p>
            </section>
          </>
        )}
      </article>
    </div>
  );
}
