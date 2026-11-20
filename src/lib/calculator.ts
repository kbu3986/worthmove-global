import type { Locale } from "./site-config";

export const ACTIVE_WEEKS_PER_YEAR = 50; // 52 weeks minus ~2 weeks holidays/PTO for active commuting & overtime
export const BASE_WORK_HOURS_PER_WEEK = 40;
export const BASE_WORK_HOURS_PER_YEAR =
  ACTIVE_WEEKS_PER_YEAR * BASE_WORK_HOURS_PER_WEEK; // 2,000 active contracted work hours/year

export type GlobalTaxPresetId =
  | "US-AVG"
  | "US-CA"
  | "US-NY"
  | "US-TX"
  | "US-WA"
  | "US-FL"
  | "US-IL"
  | "US-MA"
  | "UK"
  | "CA-ON"
  | "AU"
  | "CUSTOM";

export interface GlobalTaxPreset {
  id: GlobalTaxPresetId;
  label: string;
  shortLabel: string;
  currencySymbol: string;
  description: string;
}

export const GLOBAL_TAX_PRESETS: GlobalTaxPreset[] = [
  {
    id: "US-AVG",
    label: "US Average (Federal + FICA + ~4.5% State)",
    shortLabel: "US Avg",
    currencySymbol: "$",
    description: "2026 Federal brackets, Social Security/Medicare, and typical 4.5% state tax.",
  },
  {
    id: "US-CA",
    label: "California, USA (Fed + FICA + CA Progressive)",
    shortLabel: "CA (US)",
    currencySymbol: "$",
    description: "2026 Federal + FICA + California progressive state income tax + SDI.",
  },
  {
    id: "US-NY",
    label: "New York, USA (Fed + FICA + NY Progressive)",
    shortLabel: "NY (US)",
    currencySymbol: "$",
    description: "2026 Federal + FICA + New York state/metro income tax brackets.",
  },
  {
    id: "US-TX",
    label: "Texas, USA (0% State Income Tax)",
    shortLabel: "TX (0% State)",
    currencySymbol: "$",
    description: "2026 Federal + FICA only; 0% Texas state income tax.",
  },
  {
    id: "US-WA",
    label: "Washington, USA (0% State Income Tax)",
    shortLabel: "WA (0% State)",
    currencySymbol: "$",
    description: "2026 Federal + FICA + WA payroll; 0% state income tax.",
  },
  {
    id: "US-FL",
    label: "Florida, USA (0% State Income Tax)",
    shortLabel: "FL (0% State)",
    currencySymbol: "$",
    description: "2026 Federal + FICA only; 0% Florida state income tax.",
  },
  {
    id: "US-IL",
    label: "Illinois, USA (Fed + FICA + 4.95% Flat)",
    shortLabel: "IL (US)",
    currencySymbol: "$",
    description: "2026 Federal + FICA + Illinois 4.95% flat state income tax.",
  },
  {
    id: "US-MA",
    label: "Massachusetts, USA (Fed + FICA + 5.0% State)",
    shortLabel: "MA (US)",
    currencySymbol: "$",
    description: "2026 Federal + FICA + Massachusetts 5.0% state tax.",
  },
  {
    id: "UK",
    label: "United Kingdom (Income Tax + National Insurance)",
    shortLabel: "UK (PAYE)",
    currencySymbol: "$",
    description: "Personal Allowance, 20%/40%/45% Income Tax + Class 1 NI.",
  },
  {
    id: "CA-ON",
    label: "Canada — Ontario (Federal + Provincial + CPP/EI)",
    shortLabel: "Canada (ON)",
    currencySymbol: "$",
    description: "Canadian Federal + Ontario brackets + CPP & EI deductions.",
  },
  {
    id: "AU",
    label: "Australia (2026 Stage 3 Brackets + Medicare Levy)",
    shortLabel: "Australia",
    currencySymbol: "$",
    description: "Australian resident Stage 3 income tax brackets + 2% Medicare levy.",
  },
  {
    id: "CUSTOM",
    label: "Custom Effective Tax Rate (%)",
    shortLabel: "Custom %",
    currencySymbol: "$",
    description: "Set your exact blended effective income + payroll tax rate.",
  },
];

/**
 * 2026 US Federal Income Tax + FICA + State progressive estimator
 */
function computeUSFederalAndFica(gross: number): number {
  if (gross <= 0) return 0;
  const standardDeduction = 15_000;
  const taxable = Math.max(0, gross - standardDeduction);

  // 2026 Single Federal brackets
  const brackets: Array<[number, number]> = [
    [11_925, 0.1],
    [48_475, 0.12],
    [103_350, 0.22],
    [197_300, 0.24],
    [250_525, 0.32],
    [626_350, 0.35],
    [Infinity, 0.37],
  ];

  let fedTax = 0;
  let prev = 0;
  for (const [limit, rate] of brackets) {
    if (taxable > prev) {
      const chunk = Math.min(taxable, limit) - prev;
      fedTax += chunk * rate;
      prev = limit;
    } else {
      break;
    }
  }

  // FICA: 6.2% Social Security up to $176,100 cap + 1.45% Medicare + 0.9% > $200,000
  const ssTax = Math.min(gross, 176_100) * 0.062;
  const medicareTax =
    gross * 0.0145 + Math.max(0, gross - 200_000) * 0.009;

  return fedTax + ssTax + medicareTax;
}

function computeProgressiveBrackets(
  taxable: number,
  brackets: Array<[number, number]>
): number {
  let tax = 0;
  let prev = 0;
  for (const [limit, rate] of brackets) {
    if (taxable > prev) {
      tax += (Math.min(taxable, limit) - prev) * rate;
      prev = limit;
    } else {
      break;
    }
  }
  return tax;
}

export interface GlobalTaxBreakdown {
  annualGross: number;
  annualTax: number;
  annualNet: number;
  monthlyNet: number;
  effectiveTaxRatePct: number;
}

export function calculateGlobalNetPay(
  annualGross: number,
  preset: GlobalTaxPresetId = "US-AVG",
  customTaxRatePct = 26
): GlobalTaxBreakdown {
  const gross = Math.max(0, annualGross);
  if (gross === 0) {
    return {
      annualGross: 0,
      annualTax: 0,
      annualNet: 0,
      monthlyNet: 0,
      effectiveTaxRatePct: 0,
    };
  }

  let annualTax = 0;

  switch (preset) {
    case "CUSTOM": {
      const clampedPct = Math.min(75, Math.max(0, customTaxRatePct));
      annualTax = gross * (clampedPct / 100);
      break;
    }
    case "US-TX":
    case "US-FL": {
      annualTax = computeUSFederalAndFica(gross);
      break;
    }
    case "US-WA": {
      // WA has 0% income tax, ~0.58% WA Cares/PFML payroll
      annualTax = computeUSFederalAndFica(gross) + gross * 0.0058;
      break;
    }
    case "US-IL": {
      annualTax =
        computeUSFederalAndFica(gross) + Math.max(0, gross - 2_775) * 0.0495;
      break;
    }
    case "US-MA": {
      annualTax =
        computeUSFederalAndFica(gross) + Math.max(0, gross - 4_400) * 0.05;
      break;
    }
    case "US-CA": {
      const caTaxable = Math.max(0, gross - 5_540);
      const caState = computeProgressiveBrackets(caTaxable, [
        [10_756, 0.01],
        [25_499, 0.02],
        [40_245, 0.04],
        [55_866, 0.06],
        [70_606, 0.08],
        [360_659, 0.093],
        [432_787, 0.103],
        [721_314, 0.113],
        [Infinity, 0.123],
      ]);
      const caSdi = gross * 0.011;
      annualTax = computeUSFederalAndFica(gross) + caState + caSdi;
      break;
    }
    case "US-NY": {
      const nyTaxable = Math.max(0, gross - 8_000);
      const nyState = computeProgressiveBrackets(nyTaxable, [
        [8_500, 0.04],
        [11_700, 0.045],
        [13_900, 0.0525],
        [80_650, 0.055],
        [215_400, 0.06],
        [1_077_550, 0.0685],
        [Infinity, 0.0965],
      ]);
      // Blended metro surcharge (~1.8%)
      annualTax = computeUSFederalAndFica(gross) + nyState + nyTaxable * 0.018;
      break;
    }
    case "UK": {
      // Personal allowance tapers over 100k
      const allowance =
        gross > 100_000
          ? Math.max(0, 12_570 - (gross - 100_000) * 0.5)
          : 12_570;
      const taxable = Math.max(0, gross - allowance);
      const incomeTax = computeProgressiveBrackets(taxable, [
        [37_700, 0.2],
        [125_140, 0.4],
        [Infinity, 0.45],
      ]);
      const ni =
        Math.max(0, Math.min(gross, 50_270) - 12_570) * 0.08 +
        Math.max(0, gross - 50_270) * 0.02;
      annualTax = incomeTax + ni;
      break;
    }
    case "CA-ON": {
      const fedTaxable = Math.max(0, gross - 16_129);
      const fed = computeProgressiveBrackets(fedTaxable, [
        [57_375, 0.15],
        [114_750, 0.205],
        [177_882, 0.26],
        [253_414, 0.29],
        [Infinity, 0.33],
      ]);
      const onTaxable = Math.max(0, gross - 12_747);
      const on = computeProgressiveBrackets(onTaxable, [
        [52_886, 0.0505],
        [105_775, 0.0915],
        [150_000, 0.1116],
        [220_000, 0.1216],
        [Infinity, 0.1316],
      ]);
      const cppEi = Math.min(4_034, Math.max(0, gross - 3_500) * 0.0595) + Math.min(1_077, gross * 0.0164);
      annualTax = fed + on + cppEi;
      break;
    }
    case "AU": {
      const incomeTax = computeProgressiveBrackets(gross, [
        [18_200, 0],
        [45_000, 0.16],
        [135_000, 0.3],
        [190_000, 0.37],
        [Infinity, 0.45],
      ]);
      const medicare = gross > 26_000 ? gross * 0.02 : 0;
      annualTax = incomeTax + medicare;
      break;
    }
    case "US-AVG":
    default: {
      const avgState = Math.max(0, gross - 10_000) * 0.045;
      annualTax = computeUSFederalAndFica(gross) + avgState;
      break;
    }
  }

  const annualNet = Math.max(0, gross - annualTax);
  return {
    annualGross: gross,
    annualTax,
    annualNet,
    monthlyNet: annualNet / 12,
    effectiveTaxRatePct: gross > 0 ? (annualTax / gross) * 100 : 0,
  };
}

/**
 * 2026 Korean 4대보험 + 근로소득세·지방소득세 실수령액 계산기
 * - 국민연금: 2026년 연금개혁 반영 근로자 부담분 4.75% (기준소득월액 하한 40만원, 상한 637만원)
 * - 건강보험: 근로자 부담분 3.545% (총 7.09%)
 * - 장기요양보험: 건강보험료의 12.95%
 * - 고용보험: 근로자 부담분 0.9%
 * - 근로소득세 + 지방소득세(10%): 2026 근로소득공제·기본공제·4대보험공제·누진세율·근로소득세액공제 반영
 */
export interface KoreanTaxBreakdown {
  annualGrossManwon: number;
  annualGrossKRW: number;
  monthlyGrossKRW: number;
  monthlyNonTaxableKRW: number;
  nationalPensionMonthly: number;
  healthInsuranceMonthly: number;
  longTermCareMonthly: number;
  employmentInsuranceMonthly: number;
  incomeTaxMonthly: number;
  localIncomeTaxMonthly: number;
  totalMonthlyDeduction: number;
  monthlyNetKRW: number;
  annualNetKRW: number;
  effectiveDeductionRatePct: number;
}

export function calculateKoreanNetPay2026(
  annualGrossManwon: number,
  monthlyNonTaxableManwon = 20
): KoreanTaxBreakdown {
  const annualGrossKRW = Math.max(0, Math.round(annualGrossManwon * 10_000));
  const monthlyGrossKRW = Math.round(annualGrossKRW / 12);
  const monthlyNonTaxableKRW = Math.min(
    monthlyGrossKRW,
    Math.max(0, Math.round(monthlyNonTaxableManwon * 10_000))
  );
  const monthlyTaxable = Math.max(0, monthlyGrossKRW - monthlyNonTaxableKRW);

  if (annualGrossKRW === 0) {
    return {
      annualGrossManwon: 0,
      annualGrossKRW: 0,
      monthlyGrossKRW: 0,
      monthlyNonTaxableKRW: 0,
      nationalPensionMonthly: 0,
      healthInsuranceMonthly: 0,
      longTermCareMonthly: 0,
      employmentInsuranceMonthly: 0,
      incomeTaxMonthly: 0,
      localIncomeTaxMonthly: 0,
      totalMonthlyDeduction: 0,
      monthlyNetKRW: 0,
      annualNetKRW: 0,
      effectiveDeductionRatePct: 0,
    };
  }

  // 1. 국민연금 (근로자 4.75%, 상한 637만원 / 하한 40만원, 10원 미만 절사)
  const pensionBase =
    monthlyTaxable <= 0
      ? 0
      : Math.min(6_370_000, Math.max(400_000, monthlyTaxable));
  const nationalPensionMonthly = Math.floor((pensionBase * 0.0475) / 10) * 10;

  // 2. 건강보험 (근로자 3.545%, 10원 미만 절사)
  const healthInsuranceMonthly =
    Math.floor((monthlyTaxable * 0.03545) / 10) * 10;

  // 3. 장기요양보험 (건강보험료의 12.95%, 10원 미만 절사)
  const longTermCareMonthly =
    Math.floor((healthInsuranceMonthly * 0.1295) / 10) * 10;

  // 4. 고용보험 (근로자 0.9%, 10원 미만 절사)
  const employmentInsuranceMonthly =
    Math.floor((monthlyTaxable * 0.009) / 10) * 10;

  // 5. 근로소득세 (연간 총급여 기준 1인 가구 표준 공제 산출)
  const annualTaxableGross = monthlyTaxable * 12;
  let earnedIncomeDeduction = 0;
  if (annualTaxableGross <= 5_000_000) {
    earnedIncomeDeduction = annualTaxableGross * 0.7;
  } else if (annualTaxableGross <= 15_000_000) {
    earnedIncomeDeduction = 3_500_000 + (annualTaxableGross - 5_000_000) * 0.4;
  } else if (annualTaxableGross <= 45_000_000) {
    earnedIncomeDeduction =
      7_500_000 + (annualTaxableGross - 15_000_000) * 0.15;
  } else if (annualTaxableGross <= 100_000_000) {
    earnedIncomeDeduction =
      12_000_000 + (annualTaxableGross - 45_000_000) * 0.05;
  } else {
    earnedIncomeDeduction = Math.min(
      20_000_000,
      14_750_000 + (annualTaxableGross - 100_000_000) * 0.02
    );
  }

  const earnedIncomeAmount = Math.max(
    0,
    annualTaxableGross - earnedIncomeDeduction
  );
  const annualSocialInsurance =
    (nationalPensionMonthly +
      healthInsuranceMonthly +
      longTermCareMonthly +
      employmentInsuranceMonthly) *
    12;

  const personalDeduction = 1_500_000;
  const taxBase = Math.max(
    0,
    earnedIncomeAmount - personalDeduction - annualSocialInsurance
  );

  // 2026 종합소득 과세표준 구간별 세율
  let calculatedTax = 0;
  if (taxBase <= 14_000_000) {
    calculatedTax = taxBase * 0.06;
  } else if (taxBase <= 50_000_000) {
    calculatedTax = 840_000 + (taxBase - 14_000_000) * 0.15;
  } else if (taxBase <= 88_000_000) {
    calculatedTax = 6_240_000 + (taxBase - 50_000_000) * 0.24;
  } else if (taxBase <= 150_000_000) {
    calculatedTax = 15_360_000 + (taxBase - 88_000_000) * 0.35;
  } else if (taxBase <= 300_000_000) {
    calculatedTax = 37_060_000 + (taxBase - 150_000_000) * 0.38;
  } else if (taxBase <= 500_000_000) {
    calculatedTax = 94_060_000 + (taxBase - 300_000_000) * 0.4;
  } else if (taxBase <= 1_000_000_000) {
    calculatedTax = 174_060_000 + (taxBase - 500_000_000) * 0.42;
  } else {
    calculatedTax = 384_060_000 + (taxBase - 1_000_000_000) * 0.45;
  }

  // 근로소득세액공제
  const rawTaxCredit =
    calculatedTax <= 1_300_000
      ? calculatedTax * 0.55
      : 715_000 + (calculatedTax - 1_300_000) * 0.3;

  let creditCap = 740_000;
  if (annualTaxableGross <= 33_000_000) {
    creditCap = 740_000;
  } else if (annualTaxableGross <= 70_000_000) {
    creditCap = Math.max(
      660_000,
      740_000 - (annualTaxableGross - 33_000_000) * 0.008
    );
  } else if (annualTaxableGross <= 120_000_000) {
    creditCap = Math.max(
      500_000,
      660_000 - (annualTaxableGross - 70_000_000) * 0.5
    );
  } else {
    creditCap = Math.max(
      200_000,
      500_000 - (annualTaxableGross - 120_000_000) * 0.5
    );
  }

  const standardTaxCredit = 130_000;
  const annualFinalIncomeTax = Math.max(
    0,
    calculatedTax - Math.min(rawTaxCredit, creditCap) - standardTaxCredit
  );

  const incomeTaxMonthly = Math.floor(annualFinalIncomeTax / 12 / 10) * 10;
  const localIncomeTaxMonthly = Math.floor((incomeTaxMonthly * 0.1) / 10) * 10;

  const totalMonthlyDeduction =
    nationalPensionMonthly +
    healthInsuranceMonthly +
    longTermCareMonthly +
    employmentInsuranceMonthly +
    incomeTaxMonthly +
    localIncomeTaxMonthly;

  const monthlyNetKRW = Math.max(0, monthlyGrossKRW - totalMonthlyDeduction);
  const annualNetKRW = monthlyNetKRW * 12;

  return {
    annualGrossManwon,
    annualGrossKRW,
    monthlyGrossKRW,
    monthlyNonTaxableKRW,
    nationalPensionMonthly,
    healthInsuranceMonthly,
    longTermCareMonthly,
    employmentInsuranceMonthly,
    incomeTaxMonthly,
    localIncomeTaxMonthly,
    totalMonthlyDeduction,
    monthlyNetKRW,
    annualNetKRW,
    effectiveDeductionRatePct:
      monthlyGrossKRW > 0
        ? (totalMonthlyDeduction / monthlyGrossKRW) * 100
        : 0,
  };
}

export interface JobInput {
  /** EN: Annual Gross in USD ($). KO: Annual Gross in Manwon (만원, e.g. 5500 = 5,500만원) */
  annualGross: number;
  /** One-way commute duration in minutes */
  oneWayCommuteMinutes: number;
  /** Work-from-home days per week (0 to 5) */
  wfhDaysPerWeek: number;
  /** EN: Monthly transit/gas/parking in USD ($). KO: Monthly commute cost in KRW (원, e.g. 120000) */
  monthlyCommuteCost: number;
  /** Weekly unpaid overtime hours */
  weeklyOvertimeHours: number;
  /** EN: Annual perks/401k match in USD ($). KO: Annual welfare points/bonus in Manwon (만원) */
  annualPerks: number;
  /** KO only: Monthly non-taxable meal/childcare allowance in Manwon (default 20만원) */
  monthlyNonTaxableManwon?: number;
}

export interface EvaluatedJob {
  /** All monetary values normalized to base currency unit ($ for EN, 원 KRW for KO) */
  annualGrossBase: number;
  annualTaxBase: number;
  annualNetTakeHomeBase: number;
  monthlyNetTakeHomeBase: number;
  effectiveTaxRatePct: number;
  annualPerksBase: number;
  annualCommuteCostBase: number;
  /** Real annual disposable cash after taxes, commute out-of-pocket expenses, plus perks */
  realAnnualNetBase: number;
  realMonthlyNetBase: number;
  officeDaysPerWeek: number;
  officeDaysPerYear: number;
  annualCommuteHours: number;
  annualOvertimeHours: number;
  /** Commute + unpaid overtime ("길바닥 + 야근 헌납 시간") */
  annualLostHours: number;
  /** 2,000 contracted base hours + commute hours + unpaid overtime hours */
  totalAnnualHoursInvested: number;
  /** Gross / 2,000 hrs */
  nominalHourlyBase: number;
  /** Real Annual Net / Total Life Hours Invested */
  trueHourlyBase: number;
  koreanBreakdown?: KoreanTaxBreakdown;
}

export function evaluateJob(
  input: JobInput,
  locale: Locale,
  taxPreset: GlobalTaxPresetId = "US-AVG",
  customTaxRatePct = 26
): EvaluatedJob {
  const wfh = Math.min(5, Math.max(0, input.wfhDaysPerWeek));
  const officeDaysPerWeek = Math.max(0, 5 - wfh);
  const officeDaysPerYear = officeDaysPerWeek * ACTIVE_WEEKS_PER_YEAR;

  const oneWayMin = Math.max(0, input.oneWayCommuteMinutes);
  const annualCommuteHours = (oneWayMin * 2 * officeDaysPerYear) / 60;
  const annualOvertimeHours =
    Math.max(0, input.weeklyOvertimeHours) * ACTIVE_WEEKS_PER_YEAR;
  const annualLostHours = annualCommuteHours + annualOvertimeHours;
  const totalAnnualHoursInvested =
    BASE_WORK_HOURS_PER_YEAR + annualLostHours;

  if (locale === "ko") {
    const ko = calculateKoreanNetPay2026(
      input.annualGross,
      input.monthlyNonTaxableManwon ?? 20
    );
    const annualPerksBase = Math.max(0, input.annualPerks) * 10_000;
    const annualCommuteCostBase = Math.max(0, input.monthlyCommuteCost) * 12;
    const realAnnualNetBase =
      ko.annualNetKRW + annualPerksBase - annualCommuteCostBase;

    return {
      annualGrossBase: ko.annualGrossKRW,
      annualTaxBase: ko.totalMonthlyDeduction * 12,
      annualNetTakeHomeBase: ko.annualNetKRW,
      monthlyNetTakeHomeBase: ko.monthlyNetKRW,
      effectiveTaxRatePct: ko.effectiveDeductionRatePct,
      annualPerksBase,
      annualCommuteCostBase,
      realAnnualNetBase,
      realMonthlyNetBase: realAnnualNetBase / 12,
      officeDaysPerWeek,
      officeDaysPerYear,
      annualCommuteHours,
      annualOvertimeHours,
      annualLostHours,
      totalAnnualHoursInvested,
      nominalHourlyBase: ko.annualGrossKRW / BASE_WORK_HOURS_PER_YEAR,
      trueHourlyBase:
        totalAnnualHoursInvested > 0
          ? realAnnualNetBase / totalAnnualHoursInvested
          : 0,
      koreanBreakdown: ko,
    };
  }

  // EN mode
  const en = calculateGlobalNetPay(
    input.annualGross,
    taxPreset,
    customTaxRatePct
  );
  const annualPerksBase = Math.max(0, input.annualPerks);
  const annualCommuteCostBase = Math.max(0, input.monthlyCommuteCost) * 12;
  const realAnnualNetBase =
    en.annualNet + annualPerksBase - annualCommuteCostBase;

  return {
    annualGrossBase: en.annualGross,
    annualTaxBase: en.annualTax,
    annualNetTakeHomeBase: en.annualNet,
    monthlyNetTakeHomeBase: en.monthlyNet,
    effectiveTaxRatePct: en.effectiveTaxRatePct,
    annualPerksBase,
    annualCommuteCostBase,
    realAnnualNetBase,
    realMonthlyNetBase: realAnnualNetBase / 12,
    officeDaysPerWeek,
    officeDaysPerYear,
    annualCommuteHours,
    annualOvertimeHours,
    annualLostHours,
    totalAnnualHoursInvested,
    nominalHourlyBase: en.annualGross / BASE_WORK_HOURS_PER_YEAR,
    trueHourlyBase:
      totalAnnualHoursInvested > 0
        ? realAnnualNetBase / totalAnnualHoursInvested
        : 0,
  };
}

export type VerdictTier =
  | "brutal-loss"
  | "trap"
  | "barely-even"
  | "worth-it"
  | "jackpot";

export interface ComparisonResult {
  current: EvaluatedJob;
  offer: EvaluatedJob;
  nominalGrossDeltaBase: number;
  taxDeltaBase: number;
  commuteCostDeltaBase: number;
  perksDeltaBase: number;
  realAnnualNetDeltaBase: number;
  monthlyTakeHomeDeltaBase: number;
  lostHoursDelta: number;
  lostDaysDelta: number;
  trueHourlyDeltaBase: number;
  trueHourlyDeltaPct: number;
  /** Minimum gross salary on Offer (in input units: $ for EN, 만원 for KO) needed to match Current True Hourly Wage */
  breakEvenGrossInputUnit: number;
  /** Base currency version of break-even gross ($ for EN, 원 KRW for KO) */
  breakEvenGrossBase: number;
  verdictTier: VerdictTier;
  verdictBadge: string;
  verdictHeadline: string;
  verdictDetail: string;
}

/**
 * Solves for exact Offer Gross Salary (in input units) such that
 * Offer's True Hourly Wage === Current's True Hourly Wage.
 */
export function solveBreakEvenOfferGross(
  currentTrueHourlyBase: number,
  offerTemplate: JobInput,
  locale: Locale,
  taxPreset: GlobalTaxPresetId = "US-AVG",
  customTaxRatePct = 26
): number {
  if (currentTrueHourlyBase <= 0) return 0;

  let low = 0;
  let high = locale === "ko" ? 200_000 : 2_000_000; // up to 20억 KRW or $2M USD

  for (let i = 0; i < 36; i++) {
    const mid = (low + high) / 2;
    const candidate = evaluateJob(
      { ...offerTemplate, annualGross: mid },
      locale,
      taxPreset,
      customTaxRatePct
    );
    if (candidate.trueHourlyBase < currentTrueHourlyBase) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return locale === "ko"
    ? Math.round((low + high) / 2) // nearest 1만원
    : Math.round((low + high) / 2 / 100) * 100; // nearest $100
}

export function compareJobs(
  currentInput: JobInput,
  offerInput: JobInput,
  locale: Locale,
  taxPreset: GlobalTaxPresetId = "US-AVG",
  customTaxRatePct = 26
): ComparisonResult {
  const current = evaluateJob(
    currentInput,
    locale,
    taxPreset,
    customTaxRatePct
  );
  const offer = evaluateJob(offerInput, locale, taxPreset, customTaxRatePct);

  const nominalGrossDeltaBase =
    offer.annualGrossBase - current.annualGrossBase;
  const taxDeltaBase = offer.annualTaxBase - current.annualTaxBase;
  const commuteCostDeltaBase =
    offer.annualCommuteCostBase - current.annualCommuteCostBase;
  const perksDeltaBase = offer.annualPerksBase - current.annualPerksBase;
  const realAnnualNetDeltaBase =
    offer.realAnnualNetBase - current.realAnnualNetBase;
  const monthlyTakeHomeDeltaBase =
    offer.monthlyNetTakeHomeBase - current.monthlyNetTakeHomeBase;
  const lostHoursDelta = offer.annualLostHours - current.annualLostHours;
  const lostDaysDelta = lostHoursDelta / 24;

  const trueHourlyDeltaBase = offer.trueHourlyBase - current.trueHourlyBase;
  const trueHourlyDeltaPct =
    current.trueHourlyBase > 0
      ? (trueHourlyDeltaBase / current.trueHourlyBase) * 100
      : 0;

  const breakEvenGrossInputUnit = solveBreakEvenOfferGross(
    current.trueHourlyBase,
    offerInput,
    locale,
    taxPreset,
    customTaxRatePct
  );
  const breakEvenGrossBase =
    locale === "ko" ? breakEvenGrossInputUnit * 10_000 : breakEvenGrossInputUnit;

  let verdictTier: VerdictTier = "barely-even";
  let verdictBadge = "";
  let verdictHeadline = "";
  let verdictDetail = "";

  if (trueHourlyDeltaPct <= -8) {
    verdictTier = "brutal-loss";
    if (locale === "ko") {
      verdictBadge = "경고 · 시급 삭감 계약";
      verdictHeadline =
        "연봉 인상 착시 주의! 실상은 내 시급이 깎이는 '통근 노예' 이직입니다.";
      verdictDetail = `세금·교통비를 떼고 길바닥+야근 시간을 합산하면 실질 시급이 ${Math.abs(
        trueHourlyDeltaPct
      ).toFixed(1)}% 폭락합니다.`;
    } else {
      verdictBadge = "BRUTAL PAY CUT IN DISGUISE";
      verdictHeadline =
        "Walk away or renegotiate: Your real hourly wage drops hard.";
      verdictDetail = `After taxes, transit expenses, and unpaid commute/overtime hours, your true hourly pay plunges ${Math.abs(
        trueHourlyDeltaPct
      ).toFixed(1)}%.`;
    }
  } else if (trueHourlyDeltaPct < 0) {
    verdictTier = "trap";
    if (locale === "ko") {
      verdictBadge = "주의 · 본전 미달 구간";
      verdictHeadline =
        "세금이랑 길바닥에 인상분을 다 뺏깁니다. 본전 못 찾는 손해 구간!";
      verdictDetail = `명목 연봉보다 세금·교통비·출퇴근 시간 증가 폭이 더 커서 실질 시급이 오히려 줄어듭니다.`;
    } else {
      verdictBadge = "TRAP OFFER · BELOW BREAK-EVEN";
      verdictHeadline =
        "Taxes and asphalt eat 100% of your raise. You lose value per hour.";
      verdictDetail = `Marginal taxes and extra commuting wipe out the nominal bump, leaving your true hourly rate ${Math.abs(
        trueHourlyDeltaPct
      ).toFixed(1)}% lower.`;
    }
  } else if (trueHourlyDeltaPct < 8) {
    verdictTier = "barely-even";
    if (locale === "ko") {
      verdictBadge = "보류 · 간신히 본전 턱걸이";
      verdictHeadline =
        "간신히 본전 수준! 이직 리스크를 감안하면 연봉·재택 추가 협상이 필수입니다.";
      verdictDetail = `실질 시급 상승폭이 +${trueHourlyDeltaPct.toFixed(
        1
      )}%에 불과합니다. 커리어 점프 목적이 아니라면 신중히 판단하세요.`;
    } else {
      verdictBadge = "MARGINAL · NEGOTIATE HARDER";
      verdictHeadline =
        "Barely above break-even: Counter-offer higher pay or hybrid WFH.";
      verdictDetail = `A +${trueHourlyDeltaPct.toFixed(
        1
      )}% real hourly gain barely compensates for job-switching risk and onboarding stress.`;
    }
  } else if (trueHourlyDeltaPct < 20) {
    verdictTier = "worth-it";
    if (locale === "ko") {
      verdictBadge = "합격 · 건전한 시급 상승";
      verdictHeadline =
        "이직 합격점! 세금·교통비·통근시간을 다 빼고도 진짜 시급이 오릅니다.";
      verdictDetail = `모든 숨은 비용을 반영해도 내 시간당 가치가 +${trueHourlyDeltaPct.toFixed(
        1
      )}% 상승하는 알짜 조건입니다.`;
    } else {
      verdictBadge = "WORTH THE MOVE · SOLID GAIN";
      verdictHeadline =
        "Genuine upgrade: Your net hourly pay rises even after taxes & transit.";
      verdictDetail = `Every hour of your work + commute yields +${trueHourlyDeltaPct.toFixed(
        1
      )}% more real disposable cash.`;
    }
  } else {
    verdictTier = "jackpot";
    if (locale === "ko") {
      verdictBadge = "대박 · 무조건 이직 각";
      verdictHeadline =
        "뒤도 보지 말고 도장 찍으세요! 돈과 삶의 질을 동시에 잡는 떡상 조건입니다.";
      verdictDetail = `실질 시급이 무려 +${trueHourlyDeltaPct.toFixed(
        1
      )}% 수직 상승합니다. 흔치 않은 갓성비 오퍼입니다.`;
    } else {
      verdictTier = "jackpot";
      verdictBadge = "CERTIFIED LIFE UPGRADE";
      verdictHeadline =
        "Sign before they rescind it: Massive jump in true hourly freedom.";
      verdictDetail = `Your net true hourly rate surges +${trueHourlyDeltaPct.toFixed(
        1
      )}% after accounting for every tax dollar and commute minute.`;
    }
  }

  return {
    current,
    offer,
    nominalGrossDeltaBase,
    taxDeltaBase,
    commuteCostDeltaBase,
    perksDeltaBase,
    realAnnualNetDeltaBase,
    monthlyTakeHomeDeltaBase,
    lostHoursDelta,
    lostDaysDelta,
    trueHourlyDeltaBase,
    trueHourlyDeltaPct,
    breakEvenGrossInputUnit,
    breakEvenGrossBase,
    verdictTier,
    verdictBadge,
    verdictHeadline,
    verdictDetail,
  };
}

export function formatCurrency(
  amountBase: number,
  locale: Locale,
  opts?: { showSign?: boolean; compact?: boolean }
): string {
  const sign =
    opts?.showSign && amountBase > 0
      ? "+"
      : amountBase < 0
        ? "-"
        : "";
  const abs = Math.abs(Math.round(amountBase));

  if (locale === "ko") {
    if (opts?.compact && abs >= 10_000) {
      const manwon = Math.round(abs / 10_000);
      if (manwon >= 10_000) {
        const eok = Math.floor(manwon / 10_000);
        const rem = manwon % 10_000;
        return rem > 0
          ? `${sign}${eok}억 ${rem.toLocaleString("ko-KR")}만원`
          : `${sign}${eok}억원`;
      }
      return `${sign}${manwon.toLocaleString("ko-KR")}만원`;
    }
    return `${sign}${abs.toLocaleString("ko-KR")}원`;
  }

  if (opts?.compact && abs >= 1_000) {
    return `${sign}$${(abs / 1_000).toFixed(abs % 1_000 === 0 ? 0 : 1)}k`;
  }
  return `${sign}$${abs.toLocaleString("en-US")}`;
}

export function formatHourly(
  hourlyBase: number,
  locale: Locale,
  showSign = false
): string {
  const sign =
    showSign && hourlyBase > 0 ? "+" : hourlyBase < 0 ? "-" : "";
  const abs = Math.abs(hourlyBase);
  if (locale === "ko") {
    return `${sign}${Math.round(abs).toLocaleString("ko-KR")}원`;
  }
  return `${sign}$${abs.toFixed(2)}`;
}
