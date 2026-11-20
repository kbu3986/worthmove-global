import Link from "next/link";
import type { Locale } from "@/lib/site-config";

interface FooterProps {
  locale: Locale;
}

export default function Footer({ locale }: FooterProps) {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-lg font-extrabold text-white">
              {locale === "ko" ? "이직손익판독기 WorthMove" : "WorthMove"}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              {locale === "ko"
                ? "2026년 4대보험(국민연금 4.75%·건강보험 3.545%·장기요양·고용보험) 및 근로소득세·통근 비용·야근 시간을 반영한 실질 시급 & 이직 손익 분석기."
                : "2026 after-tax take-home pay, commute time drain, unpaid overtime, and RTO vs. Remote true hourly wage calculator."}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {locale === "ko" ? "인기 연봉 실수령액" : "Popular Salaries"}
            </p>
            <ul className="mt-3 space-y-2 text-xs">
              {locale === "ko" ? (
                <>
                  <li><Link href="/ko/salary/4000" className="hover:text-white">연봉 4,000만원 실수령액 & 진짜 시급</Link></li>
                  <li><Link href="/ko/salary/5000" className="hover:text-white">연봉 5,000만원 실수령액 & 진짜 시급</Link></li>
                  <li><Link href="/ko/salary/6000" className="hover:text-white">연봉 6,000만원 실수령액 & 진짜 시급</Link></li>
                  <li><Link href="/ko/salary/8000" className="hover:text-white">연봉 8,000만원 실수령액 & 진짜 시급</Link></li>
                  <li><Link href="/ko/salary/10000" className="hover:text-white">연봉 1억원 실수령액 & 진짜 시급</Link></li>
                </>
              ) : (
                <>
                  <li><Link href="/en/salary/75000" className="hover:text-white">$75,000 After-Tax & True Hourly</Link></li>
                  <li><Link href="/en/salary/100000" className="hover:text-white">$100,000 After-Tax & True Hourly</Link></li>
                  <li><Link href="/en/salary/130000" className="hover:text-white">$130,000 After-Tax & True Hourly</Link></li>
                  <li><Link href="/en/salary/160000" className="hover:text-white">$160,000 After-Tax & True Hourly</Link></li>
                  <li><Link href="/en/salary/200000" className="hover:text-white">$200,000 After-Tax & True Hourly</Link></li>
                </>
              )}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {locale === "ko" ? "주요 통근 노선 분석" : "RTO vs Remote Guides"}
            </p>
            <ul className="mt-3 space-y-2 text-xs">
              {locale === "ko" ? (
                <>
                  <li><Link href="/ko/route/suwon-gangnam" className="hover:text-white">수원 ↔ 강남 출퇴근 손익 & 본전 연봉</Link></li>
                  <li><Link href="/ko/route/gimpo-yeouido" className="hover:text-white">김포 ↔ 여의도 출퇴근 손익 & 본전 연봉</Link></li>
                  <li><Link href="/ko/route/anyang-pangyo" className="hover:text-white">안양 ↔ 판교 출퇴근 손익 & 본전 연봉</Link></li>
                  <li><Link href="/ko/route/bundang-gwanghwamun" className="hover:text-white">분당 ↔ 광화문 출퇴근 손익 & 본전 연봉</Link></li>
                  <li><Link href="/ko/route/incheon-guro" className="hover:text-white">인천 ↔ 구로 출퇴근 손익 & 본전 연봉</Link></li>
                </>
              ) : (
                <>
                  <li><Link href="/en/rto-vs-remote/100000" className="hover:text-white">$100k RTO vs $85k Remote</Link></li>
                  <li><Link href="/en/rto-vs-remote/120000" className="hover:text-white">$120k RTO vs $102k Remote</Link></li>
                  <li><Link href="/en/rto-vs-remote/130000" className="hover:text-white">$130k RTO vs $110k Remote</Link></li>
                  <li><Link href="/en/rto-vs-remote/150000" className="hover:text-white">$150k RTO vs $128k Remote</Link></li>
                  <li><Link href="/en/rto-vs-remote/200000" className="hover:text-white">$200k RTO vs $170k Remote</Link></li>
                </>
              )}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {locale === "ko" ? "편도 통근 시간별 손실" : "Commute Time Drain"}
            </p>
            <ul className="mt-3 space-y-2 text-xs">
              <li><Link href={`/${locale}/commute/30`} className="hover:text-white">{locale === "ko" ? "편도 30분 통근의 10년 비용" : "30-Min One-Way Commute Cost"}</Link></li>
              <li><Link href={`/${locale}/commute/45`} className="hover:text-white">{locale === "ko" ? "편도 45분 통근의 10년 비용" : "45-Min One-Way Commute Cost"}</Link></li>
              <li><Link href={`/${locale}/commute/60`} className="hover:text-white">{locale === "ko" ? "편도 60분(왕복 2시간) 비용" : "60-Min One-Way Commute Cost"}</Link></li>
              <li><Link href={`/${locale}/commute/90`} className="hover:text-white">{locale === "ko" ? "편도 90분(왕복 3시간) 비용" : "90-Min One-Way Commute Cost"}</Link></li>
              <li><Link href="/sitemap.xml" className="text-emerald-400 hover:underline">XML Sitemap</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-800 pt-6 text-[11px] text-slate-500 flex flex-col sm:flex-row justify-between gap-2">
          <p>
            © {new Date().getFullYear()} WorthMove.{" "}
            {locale === "ko"
              ? "본 계산 결과는 표준 세율 기준 참고용 시뮬레이션이며 법적·세무적 자문을 대체하지 않습니다."
              : "For informational & career planning purposes only; not formal tax or legal advice."}
          </p>
          <div className="flex gap-4">
            <Link href="/en" className="hover:text-slate-300">English (Global)</Link>
            <Link href="/ko" className="hover:text-slate-300">한국어 (대한민국)</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
