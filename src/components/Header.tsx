"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, Globe, Receipt } from "lucide-react";
import type { Locale } from "@/lib/site-config";

interface HeaderProps {
  locale: Locale;
}

export default function Header({ locale }: HeaderProps) {
  const pathname = usePathname() || `/${locale}`;

  const switchPath = (targetLocale: Locale) => {
    if (pathname === "/" || pathname === "") return `/${targetLocale}`;
    if (/^\/(en|ko)(\/|$)/.test(pathname)) {
      return pathname.replace(/^\/(en|ko)/, `/${targetLocale}`);
    }
    return `/${targetLocale}`;
  };

  const enHref = switchPath("en");
  const koHref = switchPath("ko");

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2.5 text-slate-900 hover:opacity-90 transition"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-emerald-400 shadow-sm">
            <Receipt className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <span className="block text-base font-extrabold tracking-tight sm:text-lg">
              {locale === "ko" ? "이직손익판독기" : "WorthMove"}
            </span>
            <span className="hidden text-[11px] font-medium text-slate-500 sm:block">
              {locale === "ko"
                ? "진짜 시급 & 통근 팩폭 영수증"
                : "True Hourly Wage & RTO Receipt"}
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-semibold text-slate-600 md:flex">
          <Link
            href={`/${locale}#calculator`}
            className="flex items-center gap-1 hover:text-slate-950 transition"
          >
            <Calculator className="h-3.5 w-3.5 text-emerald-600" />
            {locale === "ko" ? "손익 계산기" : "Calculator"}
          </Link>
          <Link
            href={
              locale === "ko" ? "/ko/salary/6000" : "/en/salary/100000"
            }
            className="hover:text-slate-950 transition"
          >
            {locale === "ko" ? "2026 연봉 실수령액표" : "Salary Tables"}
          </Link>
          <Link
            href={
              locale === "ko"
                ? "/ko/route/suwon-gangnam"
                : "/en/rto-vs-remote/130000"
            }
            className="hover:text-slate-950 transition"
          >
            {locale === "ko" ? "출퇴근 노선 손익" : "RTO vs Remote"}
          </Link>
          <Link
            href={`/${locale}/commute/60`}
            className="hover:text-slate-950 transition"
          >
            {locale === "ko" ? "통근 시간 비용" : "Commute Cost"}
          </Link>
        </nav>

        <div
          className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 p-1 text-xs font-bold"
          aria-label="Language Switcher"
        >
          <Globe className="ml-1.5 mr-0.5 h-3.5 w-3.5 text-slate-500" />
          <Link
            href={enHref}
            className={`rounded-full px-2.5 py-1 transition ${
              locale === "en"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            EN
          </Link>
          <span className="text-slate-300">|</span>
          <Link
            href={koHref}
            className={`rounded-full px-2.5 py-1 transition ${
              locale === "ko"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            한국어
          </Link>
        </div>
      </div>
    </header>
  );
}
