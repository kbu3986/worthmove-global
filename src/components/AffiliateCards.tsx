import {
  Headphones,
  Armchair,
  BookOpen,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import type { Locale } from "@/lib/site-config";
import { extractIframeSrc, sanitizeHttpUrl } from "@/lib/monetization-env";

interface AffiliateCardsProps {
  locale: Locale;
  commuteMinutes?: number;
}

function buildCoupangUrl({
  query,
  partnersId,
  subId,
  redirectUrl,
}: {
  query: string;
  partnersId: string;
  subId: string;
  redirectUrl: string;
}): string {
  if (redirectUrl) {
    return redirectUrl;
  }
  const params = new URLSearchParams({
    q: query,
    channel: "user",
    subId,
  });
  if (partnersId) {
    params.set("lptag", partnersId);
  }
  return `https://www.coupang.com/np/search?${params.toString()}`;
}

export default function AffiliateCards({
  locale,
  commuteMinutes = 50,
}: AffiliateCardsProps) {
  const amazonTag =
    (process.env.NEXT_PUBLIC_AMAZON_TAG || "").trim() || "worthmove-20";
  const coupangPartnersId = (
    process.env.NEXT_PUBLIC_COUPANG_PARTNERS_ID || ""
  ).trim();
  const coupangSubId =
    (process.env.NEXT_PUBLIC_COUPANG_SUBID || "").trim() || "worthmove";
  const coupangRedirectUrl = sanitizeHttpUrl(
    process.env.NEXT_PUBLIC_COUPANG_REDIRECT_URL
  );
  const coupangIframeUrl = extractIframeSrc(
    process.env.NEXT_PUBLIC_COUPANG_IFRAME_URL
  );

  const items =
    locale === "ko"
      ? [
          {
            title: "노이즈캔슬링 블루투스 헤드폰 (지옥철 소음 완벽 차단)",
            desc: "지하철·광역버스 주행 소음을 지우고 출퇴근 시간을 나만의 오디오북·휴식 시간으로 전환",
            badge: "통근 필수템 1위",
            query: "소니 보스 노이즈캔슬링 헤드폰",
            icon: Headphones,
          },
          {
            title: "메모리폼 허리·골반 교정 방석 (장시간 착석/자차 운전)",
            desc: "왕복 1시간 이상 운전석·사무실 의자에서 무너지는 요추 압력을 분산하는 고밀도 방석",
            badge: "척추 보호",
            query: "커블 메모리폼 허리 쿠션 방석",
            icon: Armchair,
          },
          {
            title: "초경량 이북리더기 & 맥세이프 링 거치대",
            desc: "만원 전철에서도 한 손으로 눈 피로 없이 독서·이직 스펙업을 돕는 150g대 리더기",
            badge: "길바닥 자기계발",
            query: "크레마 오닉스북스 이북리더기",
            icon: BookOpen,
          },
          {
            title: "QHD 2채널 블랙박스 & 고속 맥세이프 차량용 충전기",
            desc: "출퇴근 정체 구간 접촉사고 대비 초고화질 블랙박스 및 15W 쿨링 무선충전 거치대",
            badge: "자차 출퇴근",
            query: "아이나비 파인뷰 QHD 블랙박스",
            icon: ShieldCheck,
          },
        ]
      : [
          {
            title: "Flagship ANC Wireless Headphones",
            desc: "Erase subway screech and open-office chatter; turn dead commute time into deep focus.",
            badge: "Top Commuter Pick",
            query: "Sony WH-1000XM5 Bose QuietComfort Ultra ANC headphones",
            icon: Headphones,
          },
          {
            title: "Ergonomic Memory Foam Lumbar & Seat Cushion",
            desc: "Save your lower spine across 250+ days/year of rush-hour driving or RTO desk chairs.",
            badge: "Spine Saver",
            query: "ergonomic memory foam seat lumbar cushion car office",
            icon: Armchair,
          },
          {
            title: 'Glare-Free Waterproof E-Reader (6.8" Paperwhite)',
            desc: "Read 25+ career & finance books a year during train rides with zero eye strain.",
            badge: "Transit Upskilling",
            query: "Kindle Paperwhite Kobo Clara glare free e-reader",
            icon: BookOpen,
          },
          {
            title: "4K Front/Rear Dashcam + Qi2 MagSafe Vent Charger",
            desc: "Protect your deductible during chaotic highway rush-hour traffic and keep battery at 100%.",
            badge: "Driver Essential",
            query: "4K dual dashcam front and rear Qi2 car charger",
            icon: ShieldCheck,
          },
        ];

  return (
    <section
      className="my-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8"
      data-partners-id={locale === "ko" && coupangPartnersId ? coupangPartnersId : undefined}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
            {locale === "ko"
              ? `편도 ${commuteMinutes}분 출퇴근 생존 장비`
              : `${commuteMinutes}-Min Commute & RTO Survival Kit`}
          </span>
          <h2 className="mt-2 text-xl font-extrabold text-slate-900 sm:text-2xl">
            {locale === "ko"
              ? "피할 수 없는 출퇴근·야근이라면, 체력과 시간을 아끼는 장비"
              : "Can't Escape the Commute? Reclaim Your Sanity & Posture"}
          </h2>
        </div>

        {locale === "ko" && coupangRedirectUrl ? (
          <a
            href={coupangRedirectUrl}
            target="_blank"
            rel="sponsored nofollow noopener"
            className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-extrabold text-emerald-400 hover:bg-slate-800 sm:mt-0"
          >
            <span>직장인 통근 특가 모음 바로가기</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : null}
      </div>

      {locale === "ko" && coupangIframeUrl ? (
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2 flex justify-center">
          <iframe
            src={coupangIframeUrl}
            title="Coupang Partners Dynamic Banner"
            width="680"
            height="140"
            frameBorder="0"
            scrolling="no"
            referrerPolicy="unsafe-url"
            className="max-w-full rounded-xl"
          />
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
          const Icon = item.icon;
          const href =
            locale === "ko"
              ? buildCoupangUrl({
                  query: item.query,
                  partnersId: coupangPartnersId,
                  subId: coupangSubId,
                  redirectUrl: coupangRedirectUrl,
                })
              : `https://www.amazon.com/s?k=${encodeURIComponent(
                  item.query
                )}&tag=${encodeURIComponent(amazonTag)}`;

          return (
            <a
              key={item.title}
              href={href}
              target="_blank"
              rel="sponsored nofollow noopener"
              className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:-translate-y-0.5 hover:border-emerald-500 hover:bg-white hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-emerald-400">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                    {item.badge}
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900 group-hover:text-emerald-700">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  {item.desc}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-200/80 pt-3 text-xs font-bold text-slate-900">
                <span>
                  {locale === "ko" ? "쿠팡 최저가·로켓배송 보기" : "Check Price on Amazon"}
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600" />
              </div>
            </a>
          );
        })}
      </div>

      <p className="mt-5 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-medium text-slate-600">
        {locale === "ko"
          ? "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다."
          : "FTC Disclosure: As an Amazon Associate, WorthMove earns from qualifying purchases. Links above are sponsored affiliate links at zero extra cost to you."}
      </p>
    </section>
  );
}
