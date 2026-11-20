import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <p className="rounded-full bg-slate-900 px-3.5 py-1 text-xs font-extrabold text-emerald-400">
        404 · PAGE NOT FOUND
      </p>
      <h1 className="mt-4 text-3xl font-black text-slate-900">
        페이지를 찾을 수 없습니다 / Route Not Found
      </h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        요청하신 주소가 변경되었거나 존재하지 않습니다. 아래 계산기 홈으로 이동해 내 진짜 시급을 확인해 보세요.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/en"
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-slate-800"
        >
          WorthMove (English)
        </Link>
        <Link
          href="/ko"
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-500"
        >
          이직손익판독기 (한국어)
        </Link>
      </div>
    </div>
  );
}
