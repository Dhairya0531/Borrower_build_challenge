export type EmploymentType = 'salaried' | 'self_employed' | 'informal';

export type LoanPurpose = 
  | 'wedding_consumption'
  | 'business_inventory'
  | 'electric_scooter_work'
  | 'medical_emergency'
  | 'home_renovation'
  | 'education'
  | 'debt_consolidation'
  | 'other';

export type ProductType = 
  | 'personal_unsecured'
  | 'lap_secured'
  | 'twowheeler_ev'
  | 'msme_business';

export type EmployerTier = 'tier1_mnc' | 'listed_corporate' | 'sme' | 'startup';

export type CreditScoreOption = 'known' | 'unknown' | 'no_history';

export interface BorrowerInput {
  // Tier 1: Must questions
  borrowerName?: string;
  age: number;
  purpose: LoanPurpose;
  amountWanted: number;
  employmentType: EmploymentType;
  netMonthlyIncome: number;
  existingEmis: number;
  monthlyRent: number;
  monthlyHouseholdExpenses: number;
  creditScoreStatus: CreditScoreOption;
  creditScoreValue?: number; // 300 - 900 if known

  // Tier 2: Precision questions (Adaptive)
  // Salaried specifics
  employerTier?: EmployerTier;
  jobVintageYears?: number;

  // Self-employed specifics
  businessVintageYears?: number;
  reportedItrAnnual?: number;
  unencumberedPropertyMarketValue?: number; // In Rupees

  // Co-applicant / household
  secondaryIncomeMonthly?: number;
  isSecondaryIncomeFormal?: boolean;

  // Risk & financial resilience
  hasRecentBouncedEmi?: boolean;
  activeHighCostAppLoans?: boolean;
  highCostLoanBalance?: number;
  emergencySavingsMonths?: number;

  // Productive loan dynamics
  isProductiveLoan?: boolean;
  expectedMonthlyRevenueBoost?: number;

  // Loan comparison parameters
  preferredTenureMonths?: number;
  lenderQuotedRate?: number;
  lenderQuotedFeePercent?: number;
}

export interface ConfidenceResult {
  level: 'low' | 'medium' | 'high';
  scorePercent: number; // 0 to 100
  label: string;
  summary: string;
  rateSpreadPct: number; // e.g. 3.5% spread (Low) down to 0.6% spread (High)
  amountMarginPct: number; // e.g. 25% margin (Low) down to 5% margin (High)
  answeredPrecisionCount: number;
  totalPrecisionCount: number;
  unansweredImpacts: Array<{
    field: string;
    label: string;
    impactDescription: string;
  }>;
}

export type VerdictType = 'BORROW' | 'BORROW_LESS' | 'DONT_BORROW';

export interface O1VerdictResult {
  verdict: VerdictType;
  headline: string;
  reason: string;
  recommendedAmount: number;
  actionableSteps: string[];
  alternativeProduct?: string;
  isDebtTrapFlagged: boolean;
}

export interface O2MaxAmountResult {
  lenderLikelySanction: number;
  lenderSanctionWhy: string;
  borrowerSafeCarry: number;
  borrowerSafeCarryWhy: string;
  recommendedAmount: number;
  whichToUse: 'borrower_safe' | 'lender_sanction';
  whichToUseWhy: string;
  uncertaintyBand: {
    min: number;
    max: number;
  };
}

export interface FactorAdjustment {
  factor: string;
  impactBps: number;
  explanation: string;
  isPositive: boolean;
}

export interface O3FairRateResult {
  productType: ProductType;
  productName: string;
  rateBand: {
    min: number;
    max: number;
    midpoint: number;
  };
  aprBand: {
    min: number;
    max: number;
    midpoint: number;
  };
  processingFeePercent: number;
  processingFeeGstPercent: number;
  estimatedUpfrontDeduction: number;
  whyRate: string;
  adjustments: FactorAdjustment[];
}

export interface TenureOption {
  tenureMonths: number;
  monthlyEmi: number;
  totalInterest: number;
  totalRepayment: number;
  isWithinSafeCeiling: boolean;
  isWithinLenderCeiling: boolean;
}

export interface O4SafeEmiResult {
  safeMonthlyEmiCeiling: number;
  whySafeCeiling: string;
  lenderMaxEmiCeiling: number;
  whyLenderCeiling: string;
  proposedEmiAtRequestedAmount: number;
  currentFoirPercent: number;
  projectedFoirPercent: number;
  maxPermissibleFoirPercent: number;
  tenureTradeoffs: TenureOption[];
  stressTest: {
    incomeDrop: {
      dropPercent: number; // 20%
      stressedNetIncome: number;
      stressedFoirPercent: number;
      survives: boolean;
      verdictText: string;
    };
    rateHike: {
      rateHikeBps: number; // 200 bps
      stressedEmi: number;
      monthlyEmiDelta: number;
      survives: boolean;
      verdictText: string;
    };
  };
}

export interface CounterScript {
  lenderTactic: string;
  borrowerCounter: string;
  regulatoryOrMarketBasis: string;
}

export interface NegotiationCardResult {
  borrowerProfile: {
    name: string;
    segmentLabel: string;
    cibilDisplay: string;
    assessedIncomeFormatted: string;
    keyStrengths: string[];
    riskPoints: string[];
  };
  anchorDeal: {
    recommendedProduct: string;
    fairRateRange: string;
    fairAprRange: string;
    maxFairProcessingFee: string;
    safeEmiLimit: string;
    walkAwayRate: string;
  };
  counterScripts: CounterScript[];
  branchChecklist: string[];
  lenderQuoteComparison?: {
    quotedRate: number;
    fairMidpointRate: number;
    extraPerMonth: number;
    totalOverpayment: number;
  };
}

export interface CopilotCalculationResult {
  confidence: ConfidenceResult;
  o1: O1VerdictResult;
  o2: O2MaxAmountResult;
  o3: O3FairRateResult;
  o4: O4SafeEmiResult;
  negotiationCard: NegotiationCardResult;
}
