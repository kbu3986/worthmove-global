import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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
      pathWithoutLocale: "/privacy",
      title: "개인정보처리방침 및 쿠키·제휴광고 고지 | 이직손익판독기 WorthMove",
      description:
        "이직손익판독기(WorthMove)의 개인정보 보호 원칙, 브라우저 로컬 연산 구조, Google AdSense(DoubleClick DART 쿠키) 맞춤형 광고 설정 해제 안내 및 쿠팡 파트너스·아마존 제휴 고지.",
    });
  }

  return buildPageMetadata({
    locale: "en",
    pathWithoutLocale: "/privacy",
    title: "Privacy Policy, Cookie Notice & Affiliate Disclosure | WorthMove",
    description:
      "WorthMove's client-side privacy architecture, Google AdSense DoubleClick DART cookie disclosure and opt-out instructions, and Amazon Associates / Coupang Partners affiliate policies.",
  });
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name:
      locale === "ko"
        ? "개인정보처리방침 — 이직손익판독기 WorthMove"
        : "Privacy Policy — WorthMove",
    url: `${SITE_URL}/${locale}/privacy`,
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
          {locale === "ko" ? "개인정보처리방침" : "Privacy Policy"}
        </span>
      </nav>

      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs sm:p-10 space-y-7 text-sm leading-relaxed text-slate-700">
        {locale === "ko" ? (
          <>
            <header className="border-b border-slate-200 pb-6">
              <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-900">
                최종 시행일: 2026년 1월 1일
              </span>
              <h1 className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl">
                개인정보처리방침 및 쿠키·광고 고지
              </h1>
              <p className="mt-2 text-slate-600">
                이직손익판독기(WorthMove, 이하 &ldquo;본 서비스&rdquo;)는 이용자의
                프라이버시를 최우선으로 보호하며, 대한민국 「개인정보 보호법」 및
                글로벌 데이터 보호 원칙을 준수합니다.
              </p>
            </header>

            <section className="space-y-2">
              <h2 className="text-lg font-extrabold text-slate-900">
                1. 연봉 및 계산 데이터의 100% 브라우저 내부 처리
              </h2>
              <p>
                본 서비스에 입력하시는 현재 연봉, 이직 오퍼 연봉, 비과세 식대,
                출퇴근 시간, 교통비 및 야근 시간 등 모든 재무·근로 정보는 오직
                이용자의 웹 브라우저(Client-Side JavaScript 및 HTML5 Canvas)
                내부에서만 연산됩니다. 본 서비스는 별도의 회원가입을 요구하지 않으며,
                입력된 급여 데이터를 외부 데이터베이스 서버로 전송하거나 저장하지
                않습니다.
              </p>
              <p>
                &ldquo;결과 공유 링크 복사&rdquo; 기능을 사용할 경우, 이용자가 직접
                입력한 수치만 URL 쿼리 문자열(예: <code>?cs=5200&amp;ns=6200...</code>)에
                포함되어 클립보드로 복사되며, 링크를 공유할지 여부는 전적으로
                이용자의 선택에 따릅니다.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-extrabold text-slate-900">
                2. Google AdSense 및 DoubleClick DART 쿠키 고지
              </h2>
              <p>
                본 서비스는 무료 계산 도구를 지속적으로 운영하기 위해 제3자 광고
                사업자인 <strong>Google AdSense(구글 애드센스)</strong>를 사용할 수
                있습니다.
              </p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  Google을 포함한 제3자 광고 사업자는 쿠키( 특히{" "}
                  <strong>DoubleClick DART 쿠키</strong>)를 사용하여 이용자가 본
                  웹사이트 및 다른 웹사이트를 방문한 기록을 바탕으로 관심사 기반
                  맞춤형 광고를 게재합니다.
                </li>
                <li>
                  이용자는 언제든지{" "}
                  <a
                    href="https://adssettings.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-emerald-700 underline"
                  >
                    Google 광고 설정(adssettings.google.com)
                  </a>{" "}
                  페이지에 접속하여 맞춤형 광고용 DART 쿠키 사용을 해제(Opt-out)할 수
                  있습니다.
                </li>
                <li>
                  또한{" "}
                  <a
                    href="https://www.aboutads.info/choices/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-emerald-700 underline"
                  >
                    aboutads.info
                  </a>{" "}
                  페이지에서 제3자 광고 사업자의 맞춤형 광고 쿠키 사용을 일괄 관리할
                  수 있습니다.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-extrabold text-slate-900">
                3. 제휴 마케팅(쿠팡 파트너스 및 Amazon Associates) 고지
              </h2>
              <p>
                본 서비스 내 일부 출퇴근·업무 환경 추천 상품 링크는 제휴 마케팅
                프로그램과 연동되어 있습니다.
              </p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <strong>쿠팡 파트너스 고지</strong>: 이 포스팅(및 본 웹사이트의
                  한국어 페이지)은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의
                  수수료를 제공받습니다. 구매자에게 추가 비용은 발생하지 않습니다.
                </li>
                <li>
                  <strong>Amazon Associates 고지</strong>: 영문 페이지의 상품 링크는
                  Amazon Services LLC Associates Program의 일환으로 제공되며, 적격
                  구매 발생 시 일정 수수료를 제공받습니다.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-extrabold text-slate-900">
                4. 서버 접속 로그 및 보안
              </h2>
              <p>
                본 웹사이트를 호스팅하는 정적 콘텐츠 전송 네트워크(CDN, 예: GitHub
                Pages / Vercel)는 디도스(DDoS) 방어 및 트래픽 안정성 유지를 위해
                표준 웹 서버 로그(IP 주소, 브라우저 User-Agent, 요청 시각, 참조 URL)를
                일시적으로 자동 처리할 수 있습니다. 본 서비스 운영자는 이를 개인
                식별 목적으로 결합하거나 제3자에게 판매하지 않습니다.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-extrabold text-slate-900">
                5. 이용자의 권리 및 문의처
              </h2>
              <p>
                이용자는 브라우저 설정을 통해 언제든 모든 쿠키 저장을 거부하거나
                삭제할 수 있습니다. 본 방침이나 계산기 오류 제보와 관련한 문의는{" "}
                <Link
                  href="/ko/about"
                  className="font-bold text-emerald-700 underline"
                >
                  서비스 소개 및 문의하기(/ko/about)
                </Link>{" "}
                페이지의 공식 채널을 통해 접수하실 수 있습니다.
              </p>
            </section>
          </>
        ) : (
          <>
            <header className="border-b border-slate-200 pb-6">
              <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-900">
                Effective Date: January 1, 2026
              </span>
              <h1 className="mt-3 text-2xl font-black text-slate-950 sm:text-3xl">
                Privacy Policy, Cookie Notice &amp; Affiliate Disclosure
              </h1>
              <p className="mt-2 text-slate-600">
                WorthMove (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;the
                Service&rdquo;) is built privacy-first. This policy explains what
                information is (and is not) collected when you use our salary,
                tax, and commute calculators.
              </p>
            </header>

            <section className="space-y-2">
              <h2 className="text-lg font-extrabold text-slate-900">
                1. 100% Client-Side Salary &amp; Receipt Processing
              </h2>
              <p>
                All compensation figures, tax presets, commute durations, transit
                expenses, and overtime hours you enter into WorthMove are computed
                exclusively inside your browser using client-side JavaScript. PNG
                audit receipts are rendered locally on your device via the HTML5
                2D Canvas API. We do not require user accounts and never transmit
                or store your salary inputs on a backend database.
              </p>
              <p>
                When you click &ldquo;Copy Share Link,&rdquo; your calculator
                inputs are encoded directly into URL query parameters (e.g.,{" "}
                <code>?cs=110000&amp;ns=130000...</code>) on your clipboard so
                anyone you choose to share that link with can view the same
                scenario.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-extrabold text-slate-900">
                2. Google AdSense &amp; DoubleClick DART Cookies
              </h2>
              <p>
                To keep WorthMove free for everyone, we may display advertisements
                served by <strong>Google AdSense</strong> and certified third-party
                advertising partners.
              </p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  Third-party vendors, including Google, use cookies—specifically
                  the <strong>DoubleClick DART cookie</strong>—to serve ads based
                  on a user&apos;s prior visits to this website or other websites
                  on the Internet.
                </li>
                <li>
                  Google&apos;s use of advertising cookies enables it and its
                  partners to serve personalized or non-personalized ads to users
                  based on their visit to WorthMove and other sites on the web.
                </li>
                <li>
                  Users may opt out of personalized advertising at any time by
                  visiting{" "}
                  <a
                    href="https://adssettings.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-emerald-700 underline"
                  >
                    Google Ads Settings (adssettings.google.com)
                  </a>
                  . Alternatively, you can opt out of third-party vendor cookies
                  for personalized advertising by visiting{" "}
                  <a
                    href="https://www.aboutads.info/choices/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-emerald-700 underline"
                  >
                    www.aboutads.info/choices
                  </a>
                  .
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-extrabold text-slate-900">
                3. Affiliate Marketing Disclosures (Amazon &amp; Coupang)
              </h2>
              <p>
                WorthMove participates in affiliate marketing programs designed to
                provide a means for sites to earn advertising fees by linking to
                retailers at zero additional cost to the buyer:
              </p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <strong>Amazon Associates Disclosure</strong>: As an Amazon
                  Associate, WorthMove earns from qualifying purchases made
                  through sponsored Amazon links on our English pages.
                </li>
                <li>
                  <strong>Coupang Partners Disclosure (Korea)</strong>: Korean
                  language pages participate in Coupang Partners
                  (&ldquo;이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의
                  수수료를 제공받습니다.&rdquo;), earning a small commission from
                  qualifying purchases.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-extrabold text-slate-900">
                4. Standard Hosting Logs &amp; Your Privacy Rights (GDPR / CCPA)
              </h2>
              <p>
                Our static hosting infrastructure (such as GitHub Pages or Vercel
                CDN) automatically processes standard HTTP request metadata (IP
                address, browser type, timestamp, and referring page) strictly for
                security, DDoS mitigation, and reliability. We never sell personal
                information. You can block or clear cookies at any time in your
                browser preferences.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg font-extrabold text-slate-900">
                5. Contact Information
              </h2>
              <p>
                For privacy inquiries, methodology questions, or bug reports,
                please visit our{" "}
                <Link
                  href="/en/about"
                  className="font-bold text-emerald-700 underline"
                >
                  About &amp; Contact page (/en/about)
                </Link>
                .
              </p>
            </section>
          </>
        )}
      </article>
    </div>
  );
}
