import {
  type ComparisonResult,
  formatCurrency,
  formatHourly,
} from "./calculator";
import type { Locale } from "./site-config";

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  // Works cleanly for both space-separated English and Korean phrases
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line ? `${line} ${words[n]}` : words[n];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

export function renderReceiptToCanvas(
  result: ComparisonResult,
  locale: Locale
): HTMLCanvasElement {
  const width = 840;
  const height = 1280;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const monoStack =
    '"JetBrains Mono", ui-monospace, SFMono-Regular, Consolas, "Malgun Gothic", "Apple SD Gothic Neo", monospace';
  const sansStack =
    '"Pretendard", -apple-system, BlinkMacSystemFont, "Malgun Gothic", "Apple SD Gothic Neo", "Segoe UI", sans-serif';

  // Outer backdrop
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, width, height);

  // Subtle drop shadow + thermal paper body
  const padX = 56;
  const topY = 48;
  const botY = height - 48;
  const paperW = width - padX * 2;
  const toothW = 18;
  const toothH = 12;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 12;

  ctx.beginPath();
  ctx.moveTo(padX, topY + toothH);
  for (let x = padX; x < padX + paperW; x += toothW) {
    const mid = Math.min(x + toothW / 2, padX + paperW);
    const next = Math.min(x + toothW, padX + paperW);
    ctx.lineTo(mid, topY);
    ctx.lineTo(next, topY + toothH);
  }
  ctx.lineTo(padX + paperW, botY - toothH);
  for (let x = padX + paperW; x > padX; x -= toothW) {
    const mid = Math.max(x - toothW / 2, padX);
    const next = Math.max(x - toothW, padX);
    ctx.lineTo(mid, botY);
    ctx.lineTo(next, botY - toothH);
  }
  ctx.closePath();
  ctx.fillStyle = "#faf8f3";
  ctx.fill();
  ctx.restore();

  const left = padX + 44;
  const right = padX + paperW - 44;
  const contentW = right - left;
  const centerX = width / 2;

  const drawDashedLine = (y: number) => {
    ctx.save();
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
    ctx.restore();
  };

  // Store Header
  let y = topY + 62;
  ctx.fillStyle = "#0f172a";
  ctx.textAlign = "center";
  ctx.font = `800 32px ${sansStack}`;
  ctx.fillText(
    locale === "ko" ? "이직손익판독기 팩폭 영수증" : "WORTHMOVE AUDIT RECEIPT",
    centerX,
    y
  );

  y += 30;
  ctx.fillStyle = "#475569";
  ctx.font = `600 17px ${monoStack}`;
  ctx.fillText(
    locale === "ko"
      ? "2026 4대보험·소득세·통근시간 실질시급 명세서"
      : "2026 TAX + COMMUTE + OVERTIME TRUE WAGE AUDIT",
    centerX,
    y
  );

  y += 26;
  const nowStr = new Date().toISOString().slice(0, 10);
  ctx.fillStyle = "#64748b";
  ctx.font = `500 15px ${monoStack}`;
  ctx.fillText(`DATE: ${nowStr}   |   ITEM #WM-2026`, centerX, y);

  y += 24;
  drawDashedLine(y);

  // Two-column Job Summary
  y += 36;
  ctx.textAlign = "left";
  ctx.fillStyle = "#64748b";
  ctx.font = `700 15px ${monoStack}`;
  ctx.fillText(locale === "ko" ? "[현 직장 / 기준]" : "[CURRENT / BASE]", left, y);
  ctx.textAlign = "right";
  ctx.fillText(locale === "ko" ? "[이직 오퍼 / 비교]" : "[NEW OFFER / RTO]", right, y);

  y += 28;
  ctx.fillStyle = "#0f172a";
  ctx.font = `800 22px ${monoStack}`;
  ctx.textAlign = "left";
  ctx.fillText(
    formatCurrency(result.current.annualGrossBase, locale, { compact: true }),
    left,
    y
  );
  ctx.textAlign = "right";
  ctx.fillText(
    formatCurrency(result.offer.annualGrossBase, locale, { compact: true }),
    right,
    y
  );

  y += 24;
  ctx.fillStyle = "#475569";
  ctx.font = `500 15px ${sansStack}`;
  ctx.textAlign = "left";
  ctx.fillText(
    locale === "ko"
      ? `편도 ${(
          (result.current.annualCommuteHours * 60) /
          Math.max(1, result.current.officeDaysPerYear * 2)
        ).toFixed(0)}분 · 주${result.current.officeDaysPerWeek}일 출근`
      : `${result.current.officeDaysPerWeek}d/wk office · ${Math.round(
          result.current.annualLostHours
        )}h lost/yr`,
    left,
    y
  );
  ctx.textAlign = "right";
  ctx.fillText(
    locale === "ko"
      ? `편도 ${(
          (result.offer.annualCommuteHours * 60) /
          Math.max(1, result.offer.officeDaysPerYear * 2)
        ).toFixed(0)}분 · 주${result.offer.officeDaysPerWeek}일 출근`
      : `${result.offer.officeDaysPerWeek}d/wk office · ${Math.round(
          result.offer.annualLostHours
        )}h lost/yr`,
    right,
    y
  );

  y += 26;
  drawDashedLine(y);

  // Line items
  const rows: Array<{
    label: string;
    value: string;
    tone?: "positive" | "negative" | "neutral";
    bold?: boolean;
  }> = [
    {
      label: locale === "ko" ? "1. 명목 연봉 증감" : "1. NOMINAL GROSS RAISE",
      value: formatCurrency(result.nominalGrossDeltaBase, locale, {
        showSign: true,
        compact: locale === "ko",
      }),
      tone: result.nominalGrossDeltaBase >= 0 ? "positive" : "negative",
    },
    {
      label:
        locale === "ko"
          ? "2. 세금·4대보험 추가 징수"
          : "2. EXTRA TAX & PAYROLL BITE",
      value: formatCurrency(-result.taxDeltaBase, locale, {
        showSign: true,
        compact: locale === "ko",
      }),
      tone: result.taxDeltaBase > 0 ? "negative" : "positive",
    },
    {
      label:
        locale === "ko"
          ? "3. 연간 교통·유류비 증감"
          : "3. ANNUAL TRANSIT/GAS DRAIN",
      value: formatCurrency(-result.commuteCostDeltaBase, locale, {
        showSign: true,
        compact: locale === "ko",
      }),
      tone: result.commuteCostDeltaBase > 0 ? "negative" : "positive",
    },
    {
      label:
        locale === "ko"
          ? "4. 복지·보너스 증감"
          : "4. PERKS / 401K MATCH DELTA",
      value: formatCurrency(result.perksDeltaBase, locale, {
        showSign: true,
        compact: locale === "ko",
      }),
      tone: result.perksDeltaBase >= 0 ? "positive" : "negative",
    },
    {
      label:
        locale === "ko"
          ? "5. 실질 가처분 연소득 증감"
          : "5. REAL DISPOSABLE NET DELTA",
      value: formatCurrency(result.realAnnualNetDeltaBase, locale, {
        showSign: true,
        compact: locale === "ko",
      }),
      tone: result.realAnnualNetDeltaBase >= 0 ? "positive" : "negative",
      bold: true,
    },
    {
      label:
        locale === "ko"
          ? "6. 연간 길바닥+야근 시간 증감"
          : "6. EXTRA COMMUTE + OT HOURS",
      value: `${result.lostHoursDelta > 0 ? "+" : ""}${Math.round(
        result.lostHoursDelta
      )} ${locale === "ko" ? "시간/년" : "hrs/yr"}`,
      tone: result.lostHoursDelta > 0 ? "negative" : "positive",
    },
    {
      label:
        locale === "ko" ? "7. 현 직장 진짜 시급" : "7. CURRENT TRUE HOURLY",
      value: `${formatHourly(result.current.trueHourlyBase, locale)}/${
        locale === "ko" ? "시간" : "hr"
      }`,
      tone: "neutral",
    },
    {
      label:
        locale === "ko" ? "8. 이직 오퍼 진짜 시급" : "8. NEW OFFER TRUE HOURLY",
      value: `${formatHourly(result.offer.trueHourlyBase, locale)}/${
        locale === "ko" ? "시간" : "hr"
      }`,
      tone: "neutral",
      bold: true,
    },
  ];

  y += 12;
  for (const row of rows) {
    y += 38;
    ctx.textAlign = "left";
    ctx.fillStyle = row.bold ? "#0f172a" : "#334155";
    ctx.font = `${row.bold ? 700 : 500} 18px ${sansStack}`;
    ctx.fillText(row.label, left, y);

    ctx.textAlign = "right";
    if (row.tone === "positive") ctx.fillStyle = "#047857";
    else if (row.tone === "negative") ctx.fillStyle = "#be123c";
    else ctx.fillStyle = "#0f172a";

    ctx.font = `${row.bold ? 800 : 700} 19px ${monoStack}`;
    ctx.fillText(row.value, right, y);
  }

  y += 28;
  drawDashedLine(y);

  // Big Total Block
  y += 42;
  ctx.textAlign = "left";
  ctx.fillStyle = "#0f172a";
  ctx.font = `800 24px ${sansStack}`;
  ctx.fillText(
    locale === "ko" ? "실질 시급 손익 (DELTA)" : "REAL HOURLY DELTA",
    left,
    y
  );

  const isWin = result.trueHourlyDeltaPct >= 0;
  ctx.textAlign = "right";
  ctx.fillStyle = isWin ? "#047857" : "#be123c";
  ctx.font = `900 30px ${monoStack}`;
  const pctStr = `${result.trueHourlyDeltaPct >= 0 ? "+" : ""}${result.trueHourlyDeltaPct.toFixed(
    1
  )}%`;
  ctx.fillText(
    `${formatHourly(result.trueHourlyDeltaBase, locale, true)} (${pctStr})`,
    right,
    y
  );

  y += 34;
  ctx.textAlign = "left";
  ctx.fillStyle = "#475569";
  ctx.font = `700 17px ${sansStack}`;
  ctx.fillText(
    locale === "ko"
      ? "이 조건 최소 본전 연봉"
      : "MIN. BREAK-EVEN GROSS NEEDED",
    left,
    y
  );
  ctx.textAlign = "right";
  ctx.fillStyle = "#0f172a";
  ctx.font = `800 20px ${monoStack}`;
  ctx.fillText(
    formatCurrency(result.breakEvenGrossBase, locale, {
      compact: locale === "ko",
    }),
    right,
    y
  );

  // Verdict Stamp Box
  y += 30;
  const boxH = 148;
  ctx.save();
  ctx.fillStyle = isWin ? "#ecfdf5" : "#fff1f2";
  ctx.strokeStyle = isWin ? "#10b981" : "#f43f5e";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(left, y, contentW, boxH, 12);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.textAlign = "left";
  ctx.fillStyle = isWin ? "#065f46" : "#9f1239";
  ctx.font = `800 16px ${monoStack}`;
  ctx.fillText(`[${result.verdictBadge}]`, left + 22, y + 34);

  ctx.fillStyle = "#0f172a";
  ctx.font = `700 20px ${sansStack}`;
  drawWrappedText(
    ctx,
    result.verdictHeadline,
    left + 22,
    y + 68,
    contentW - 44,
    28
  );

  y += boxH + 34;

  // Pseudo-barcode
  const barPattern = [
    3, 2, 5, 2, 2, 4, 2, 6, 3, 2, 4, 2, 3, 5, 2, 2, 6, 2, 3, 4, 2, 5, 3, 2, 4,
    3, 2, 5, 2, 3, 6, 2, 2, 4, 3, 2, 5, 2, 4, 3,
  ];
  const totalUnits = barPattern.reduce((a, b) => a + b, 0);
  const barScale = (contentW * 0.72) / totalUnits;
  let bx = centerX - (contentW * 0.72) / 2;
  ctx.fillStyle = "#1e293b";
  barPattern.forEach((u, idx) => {
    const bw = u * barScale;
    if (idx % 2 === 0) {
      ctx.fillRect(bx, y, bw, 46);
    }
    bx += bw;
  });

  y += 72;
  ctx.textAlign = "center";
  ctx.fillStyle = "#64748b";
  ctx.font = `600 15px ${monoStack}`;
  ctx.fillText(
    locale === "ko"
      ? "worthmove · 내 진짜 시급 & 이직 손익 계산기"
      : "worthmove · True Hourly Wage & RTO Calculator",
    centerX,
    y
  );

  return canvas;
}

export function downloadReceiptPng(
  result: ComparisonResult,
  locale: Locale
): void {
  const canvas = renderReceiptToCanvas(result, locale);
  const filename =
    locale === "ko"
      ? `worthmove-이직팩폭영수증-2026.png`
      : `worthmove-true-wage-receipt-2026.png`;

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }, "image/png");
}
