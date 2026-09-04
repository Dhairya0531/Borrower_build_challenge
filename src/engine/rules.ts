import { ProductType, EmployerTier } from './types';

export const GST_RATE = 0.18; // 18% standard Indian GST on banking fees

export interface ProductBenchmark {
  type: ProductType;
  displayName: string;
  basePrimeRate: number; // in percentage, e.g. 10.5
  maxTenureMonths: number;
  defaultTenureMonths: number;
  maxLtvRatio?: number; // e.g. 0.60 for LAP, 0.80 for 2W
  typicalProcessingFeePct: number;
  minProcessingFeeRupees: number;
  documentationChargesRupees: number;
}

export const PRODUCT_BENCHMARKS: Record<ProductType, ProductBenchmark> = {
  personal_unsecured: {
    type: 'personal_unsecured',
    displayName: 'Unsecured Personal Loan',
    basePrimeRate: 10.50,
    maxTenureMonths: 60,
    defaultTenureMonths: 36,
    typicalProcessingFeePct: 1.75,
    minProcessingFeeRupees: 1500,
    documentationChargesRupees: 500,
  },
  lap_secured: {
    type: 'lap_secured',
    displayName: 'Loan Against Property (LAP)',
    basePrimeRate: 9.00,
    maxTenureMonths: 180,
    defaultTenureMonths: 84,
    maxLtvRatio: 0.60,
    typicalProcessingFeePct: 0.85,
    minProcessingFeeRupees: 5000,
    documentationChargesRupees: 2500,
  },
  twowheeler_ev: {
    type: 'twowheeler_ev',
    displayName: 'Two-Wheeler / EV Hypothecated Loan',
    basePrimeRate: 11.00,
    maxTenureMonths: 48,
    defaultTenureMonths: 36,
    maxLtvRatio: 0.80,
    typicalProcessingFeePct: 2.00,
    minProcessingFeeRupees: 1000,
    documentationChargesRupees: 750,
  },
  msme_business: {
    type: 'msme_business',
    displayName: 'Secured MSME / Business Loan',
    basePrimeRate: 9.75,
    maxTenureMonths: 84,
    defaultTenureMonths: 60,
    maxLtvRatio: 0.65,
    typicalProcessingFeePct: 1.25,
    minProcessingFeeRupees: 3500,
    documentationChargesRupees: 1500,
  },
};

/**
 * FOIR (Fixed Obligation to Income Ratio) calculation based on net income bracket.
 * In Indian retail lending, lower earners are allowed lower FOIR to preserve absolute survival cushion.
 */
export function getLenderMaxFoir(netMonthlyIncome: number): number {
  if (netMonthlyIncome < 35000) {
    return 0.40; // 40% for under 35k
  } else if (netMonthlyIncome <= 75000) {
    return 0.50; // 50% for 35k - 75k
  } else if (netMonthlyIncome <= 150000) {
    return 0.55; // 55% for 75k - 1.5L
  } else {
    return 0.60; // 60% for ultra high earners
  }
}

/**
 * Borrower Safe FOIR is strictly more conservative than lender FOIR.
 * Safe FOIR accounts for rent, household dependents, and emergency reserve building.
 */
export function getBorrowerSafeFoir(netMonthlyIncome: number, rent: number, householdExpenses: number): number {
  const livingBurnRate = (rent + householdExpenses) / Math.max(netMonthlyIncome, 1);
  if (livingBurnRate > 0.65) {
    // High essential living cost leaves smaller room
    return 0.30;
  } else if (netMonthlyIncome < 35000) {
    return 0.35;
  } else if (netMonthlyIncome <= 75000) {
    return 0.40;
  } else {
    return 0.45;
  }
}

/**
 * Haircut on unverified cash income.
 * Indian lenders apply a 30% to 50% haircut on undocumented cash flows.
 */
export const INFORMAL_CASH_HAIRCUT = 0.40; // 40% haircut (60% recognized)
export const SECONDARY_INFORMAL_HAIRCUT = 0.50; // 50% haircut on secondary unverified income

/**
 * Minimum essential survival threshold (non-negotiable survival buffer).
 */
export const MIN_SURVIVAL_FLOOR_METRO = 14000;
export const MIN_SURVIVAL_FLOOR_NON_METRO = 9000;

/**
 * Employer Tier adjustments for salaried borrowers.
 */
export const EMPLOYER_TIER_ADJUSTMENTS: Record<EmployerTier, number> = {
  tier1_mnc: -0.75, // -75 bps discount for marquee global MNC / Super Cat A
  listed_corporate: -0.25, // -25 bps discount for Cat B
  sme: +0.50, // +50 bps premium for small private firms
  startup: +1.00, // +100 bps premium for early-stage ventures
};
