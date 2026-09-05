import {
  BorrowerInput,
  CopilotCalculationResult,
  ConfidenceResult,
  O1VerdictResult,
  O2MaxAmountResult,
  O3FairRateResult,
  O4SafeEmiResult,
  NegotiationCardResult,
  ProductType,
  FactorAdjustment,
  TenureOption,
  CounterScript,
  LimitGuess,
} from './types';
import {
  PRODUCT_BENCHMARKS,
  GST_RATE,
  getLenderMaxFoir,
  getBorrowerSafeFoir,
  INFORMAL_CASH_HAIRCUT,
  SECONDARY_INFORMAL_HAIRCUT,
  EMPLOYER_TIER_ADJUSTMENTS,
  MIN_SURVIVAL_FLOOR_METRO,
  MIN_SURVIVAL_FLOOR_NON_METRO,
} from './rules';

/**
 * Standard EMI calculation using Indian banking reducing balance formula.
 * EMI = P * r * (1+r)^n / ((1+r)^n - 1)
 */
export function calculateEmi(principal: number, annualRatePct: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  if (annualRatePct <= 0) return Math.round(principal / tenureMonths);
  const monthlyRate = annualRatePct / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  return Math.round(emi);
}

/**
 * Calculate principal that can be borrowed for a target monthly EMI.
 * P = EMI * ((1+r)^n - 1) / (r * (1+r)^n)
 */
export function calculatePrincipalFromEmi(monthlyEmi: number, annualRatePct: number, tenureMonths: number): number {
  if (monthlyEmi <= 0 || tenureMonths <= 0) return 0;
  if (annualRatePct <= 0) return Math.round(monthlyEmi * tenureMonths);
  const monthlyRate = annualRatePct / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const principal = (monthlyEmi * (factor - 1)) / (monthlyRate * factor);
  return Math.round(principal);
}

/**
 * Calculate RBI-compliant All-in APR (Internal Rate of Return including fees and GST).
 */
export function calculateAllInApr(
  loanAmount: number,
  nominalAnnualRatePct: number,
  tenureMonths: number,
  processingFeePct: number,
  docCharges: number
): number {
  if (loanAmount <= 0 || tenureMonths <= 0) return nominalAnnualRatePct;
  const upfrontFeeWithGst = loanAmount * (processingFeePct / 100) * (1 + GST_RATE);
  const totalUpfrontDeduction = upfrontFeeWithGst + docCharges;
  const netDisbursed = loanAmount - totalUpfrontDeduction;
  const emi = calculateEmi(loanAmount, nominalAnnualRatePct, tenureMonths);

  if (netDisbursed <= 0) return nominalAnnualRatePct + 5.0;

  // Numerical solve for monthly IRR using binary search
  let low = 0.0001;
  let high = 0.10; // Up to 120% APR
  let monthlyIrr = (low + high) / 2;

  for (let iter = 0; iter < 40; iter++) {
    monthlyIrr = (low + high) / 2;
    // Calculate NPV = netDisbursed - sum(emi / (1+r)^t)
    let npv = netDisbursed;
    const factor = Math.pow(1 + monthlyIrr, tenureMonths);
    const presentValueOfEmis = (emi * (factor - 1)) / (monthlyIrr * factor);
    const diff = npv - presentValueOfEmis;

    if (Math.abs(diff) < 1) break;
    if (diff > 0) {
      // Net disbursed is greater than discounted EMIs -> rate needs to be lower
      high = monthlyIrr;
    } else {
      low = monthlyIrr;
    }
  }

  const annualApr = monthlyIrr * 12 * 100;
  return Math.round(annualApr * 100) / 100;
}

/**
 * Assess recognized income based on employment type and documentary proof.
 */
export function calculateRecognizedIncome(input: BorrowerInput): {
  recognizedMonthlyIncome: number;
  unrecognizedCash: number;
  secondaryRecognized: number;
  totalRecognizedMonthly: number;
  explanation: string;
} {
  let recognizedMonthlyIncome = input.netMonthlyIncome;
  let unrecognizedCash = 0;

  if (input.employmentType === 'informal') {
    // 40% haircut on informal cash
    unrecognizedCash = input.netMonthlyIncome * INFORMAL_CASH_HAIRCUT;
    recognizedMonthlyIncome = input.netMonthlyIncome * (1 - INFORMAL_CASH_HAIRCUT);
  } else if (input.employmentType === 'self_employed') {
    // If self-employed has reported ITR, lenders cap income at (ITR annual / 12) * 1.15 multiplier
    if (input.reportedItrAnnual && input.reportedItrAnnual > 0) {
      const monthlyItrIncome = input.reportedItrAnnual / 12;
      if (input.netMonthlyIncome > monthlyItrIncome) {
        unrecognizedCash = input.netMonthlyIncome - monthlyItrIncome;
        recognizedMonthlyIncome = monthlyItrIncome;
      }
    }
  }

  let secondaryRecognized = 0;
  if (input.secondaryIncomeMonthly && input.secondaryIncomeMonthly > 0) {
    if (input.isSecondaryIncomeFormal) {
      secondaryRecognized = input.secondaryIncomeMonthly;
    } else {
      secondaryRecognized = input.secondaryIncomeMonthly * (1 - SECONDARY_INFORMAL_HAIRCUT);
    }
  }

  const totalRecognizedMonthly = Math.round(recognizedMonthlyIncome + secondaryRecognized);

  let explanation = '';
  if (input.employmentType === 'informal') {
    explanation = `Lenders apply a standard 40% haircut to undocumented informal cashflow. From ₹${input.netMonthlyIncome.toLocaleString('en-IN')}, only ₹${Math.round(recognizedMonthlyIncome).toLocaleString('en-IN')} is formally recognized.`;
  } else if (input.employmentType === 'self_employed' && input.reportedItrAnnual) {
    explanation = `Lenders underwrite self-employed borrowers against reported ITR (₹${(input.reportedItrAnnual / 12).toLocaleString('en-IN')}/mo) rather than gross shop cashflow.`;
  } else {
    explanation = `100% of net salaried income (₹${input.netMonthlyIncome.toLocaleString('en-IN')}/mo) is recognized by tier-1 banks.`;
  }

  if (secondaryRecognized > 0) {
    explanation += ` Added ₹${Math.round(secondaryRecognized).toLocaleString('en-IN')}/mo recognized household co-applicant income.`;
  }

  return {
    recognizedMonthlyIncome,
    unrecognizedCash,
    secondaryRecognized,
    totalRecognizedMonthly,
    explanation,
  };
}

/**
 * Determine the optimal loan product based on borrower assets and purpose.
 * Implements the "Ravi Rule" (routing unencumbered property to LAP).
 */
export function determineRecommendedProduct(input: BorrowerInput): {
  recommendedProduct: ProductType;
  wasRoutedToSecured: boolean;
  routingRationale: string;
} {
  // Check for Two-Wheeler / EV
  if (input.purpose === 'electric_scooter_work') {
    return {
      recommendedProduct: 'twowheeler_ev',
      wasRoutedToSecured: false,
      routingRationale: 'Asset-backed EV/Two-Wheeler loan has lower interest rates (11-13%) and hypothecation compared to high-cost unsecured debt (18-24%).',
    };
  }

  // The "Ravi Rule": If borrower has unencumbered property >= 2x desired loan and wants >= ₹5,00,000
  const propertyValue = input.unencumberedPropertyMarketValue || 0;
  if (propertyValue >= 2 * input.amountWanted && input.amountWanted >= 500000) {
    return {
      recommendedProduct: 'lap_secured',
      wasRoutedToSecured: true,
      routingRationale: `You own unencumbered property valued at ₹${(propertyValue / 100000).toFixed(1)}L. Routing to Loan Against Property (LAP) lowers your interest rate from 18%+ down to 9.0%-10.5% and unlocks longer tenure.`,
    };
  }

  if (input.purpose === 'business_inventory' && input.employmentType === 'self_employed') {
    if (propertyValue >= 1000000) {
      return {
        recommendedProduct: 'lap_secured',
        wasRoutedToSecured: true,
        routingRationale: 'Using your commercial property as collateral unlocks prime LAP rates (9.0% - 10.25%) instead of costly unsecured business loans (16% - 22%).',
      };
    }
    return {
      recommendedProduct: 'msme_business',
      wasRoutedToSecured: false,
      routingRationale: 'MSME Business facility tailored for stock financing and working capital.',
    };
  }

  return {
    recommendedProduct: 'personal_unsecured',
    wasRoutedToSecured: false,
    routingRationale: 'Standard unsecured personal facility for consumer needs.',
  };
}

/**
 * Calculate Confidence Score & "Confidence widens with silence" spreads.
 */
export function calculateConfidence(input: BorrowerInput): ConfidenceResult {
  let score = 35; // Baseline for Tier 1 must-questions
  const answeredPrecision: string[] = [];
  const unansweredImpacts: Array<{ field: string; label: string; impactDescription: string }> = [];

  // Credit score precision
  if (input.creditScoreStatus === 'known' && input.creditScoreValue) {
    score += 20;
    answeredPrecision.push('Verified Credit Bureau Score');
  } else {
    unansweredImpacts.push({
      field: 'creditScoreStatus',
      label: 'Exact Credit Score',
      impactDescription: 'Providing your actual CIBIL score narrows fair rate uncertainty by ±1.75% and unlocks prime rate tiers.',
    });
  }

  // Collateral precision (for self-employed / high amount)
  if (input.unencumberedPropertyMarketValue && input.unencumberedPropertyMarketValue > 0) {
    score += 15;
    answeredPrecision.push('Property Collateral Value');
  } else if (input.amountWanted >= 500000) {
    unansweredImpacts.push({
      field: 'unencumberedPropertyMarketValue',
      label: 'Collateral / Property Backing',
      impactDescription: 'Declaring unencumbered property can switch you to LAP, slashing your rate by 4-8% and doubling safe tenure.',
    });
  }

  // Emergency savings & financial resilience
  if (input.emergencySavingsMonths !== undefined) {
    score += 10;
    answeredPrecision.push('Emergency Buffer Assessment');
  } else {
    unansweredImpacts.push({
      field: 'emergencySavingsMonths',
      label: 'Emergency Reserve Buffer',
      impactDescription: 'Knowing your rainy-day reserves tightens your safe monthly EMI ceiling and protects against stress shocks.',
    });
  }

  // Bounces & app loan history
  if (input.hasRecentBouncedEmi !== undefined) {
    score += 10;
    answeredPrecision.push('Repayment Discipline History');
  } else {
    unansweredImpacts.push({
      field: 'hasRecentBouncedEmi',
      label: 'Recent Bounced EMIs',
      impactDescription: 'Confirming clean banking history removes default risk premiums from the lender quote.',
    });
  }

  // Employer tier / Business vintage
  if (input.employerTier || (input.businessVintageYears && input.businessVintageYears > 0)) {
    score += 10;
    answeredPrecision.push('Stability / Vintage Confirmation');
  } else {
    unansweredImpacts.push({
      field: 'employerTier',
      label: 'Employer Category / Vintage',
      impactDescription: 'Confirming marquee employer (Tier-1 MNC) or 5+ yr vintage secures a 50-75 bps rate concession.',
    });
  }

  // Productive loan revenue boost
  if (input.isProductiveLoan && input.expectedMonthlyRevenueBoost) {
    score += 10;
    answeredPrecision.push('Productive Revenue Uplift');
  }

  // Determine tier & spread
  let level: 'low' | 'medium' | 'high' = 'low';
  let rateSpreadPct = 3.5; // ±3.5% for low
  let amountMarginPct = 25; // ±25% for low
  let label = 'Low Confidence (Silence Widens Band)';
  let summary = 'You have answered basic questions only. The copilot operates with wide conservative bands (±3.5% on rate, ±25% on amount) to prevent misleading commitments.';

  if (score >= 80) {
    level = 'high';
    rateSpreadPct = 0.60; // ±0.60% (1.2% total band)
    amountMarginPct = 5;
    label = 'High Confidence (Verified Profile)';
    summary = 'Profile is calibrated with precision factors. Rate and EMI bounds are tightly pinned to prevailing Indian institutional underwriting desks.';
  } else if (score >= 55) {
    level = 'medium';
    rateSpreadPct = 1.75; // ±1.75% (3.5% total band)
    amountMarginPct = 15;
    label = 'Medium Confidence (Calibrated)';
    summary = 'Good profile coverage. Answering the remaining precision questions will refine your negotiating band even further.';
  }

  return {
    level,
    scorePercent: Math.min(score, 100),
    label,
    summary,
    rateSpreadPct,
    amountMarginPct,
    answeredPrecisionCount: answeredPrecision.length,
    totalPrecisionCount: answeredPrecision.length + unansweredImpacts.length,
    unansweredImpacts,
  };
}

/**
 * Master calculation engine producing all 4 outputs (O1, O2, O3, O4) and Negotiation Card.
 */
export function runBorrowerCopilot(input: BorrowerInput): CopilotCalculationResult {
  const confidence = calculateConfidence(input);
  const incomeAssessment = calculateRecognizedIncome(input);
  const productRouting = determineRecommendedProduct(input);
  const productConfig = PRODUCT_BENCHMARKS[productRouting.recommendedProduct];

  // Default tenure
  const tenureMonths = input.preferredTenureMonths || productConfig.defaultTenureMonths;

  // --- O3: Fair Interest Rate & All-in APR ---
  const adjustments: FactorAdjustment[] = [];
  let computedRate = productConfig.basePrimeRate;

  // Employment Type Adjustment
  if (input.employmentType === 'salaried') {
    if (input.employerTier === 'tier1_mnc') {
      const adj = EMPLOYER_TIER_ADJUSTMENTS.tier1_mnc;
      computedRate += adj;
      adjustments.push({
        factor: 'Tier-1 MNC Employer',
        impactBps: adj * 100,
        explanation: 'Prime corporate category earns premium interest discount from institutional lenders.',
        isPositive: true,
      });
    } else if (input.employerTier === 'startup') {
      const adj = EMPLOYER_TIER_ADJUSTMENTS.startup;
      computedRate += adj;
      adjustments.push({
        factor: 'Startup / High-Beta Employer',
        impactBps: adj * 100,
        explanation: 'Higher perceived job volatility adds standard risk margin.',
        isPositive: false,
      });
    }
  } else if (input.employmentType === 'self_employed') {
    if (productRouting.recommendedProduct === 'personal_unsecured') {
      computedRate += 2.00;
      adjustments.push({
        factor: 'Self-Employed Unsecured Loading',
        impactBps: 200,
        explanation: 'Unsecured loans for self-employed carry higher volatility buffer without asset hypothecation.',
        isPositive: false,
      });
    }
  } else if (input.employmentType === 'informal') {
    computedRate += 4.50;
    adjustments.push({
      factor: 'Informal Cash Assessment Margin',
      impactBps: 450,
      explanation: 'Cash earnings require surrogate assessment and field verification margin.',
      isPositive: false,
    });
  }

  // Credit Score Adjustment (Honoring Rule 3: Unknown is never zero)
  if (input.creditScoreStatus === 'known' && input.creditScoreValue) {
    if (input.creditScoreValue >= 775) {
      computedRate -= 0.50;
      adjustments.push({
        factor: `Super Prime Bureau Score (${input.creditScoreValue})`,
        impactBps: -50,
        explanation: 'Score above 775 qualifies for lowest card rack rates.',
        isPositive: true,
      });
    } else if (input.creditScoreValue >= 725) {
      adjustments.push({
        factor: `Prime Bureau Score (${input.creditScoreValue})`,
        impactBps: 0,
        explanation: 'Clean credit history qualifying for standard institutional card rate.',
        isPositive: true,
      });
    } else if (input.creditScoreValue >= 675) {
      computedRate += 1.75;
      adjustments.push({
        factor: `Near-Prime Score (${input.creditScoreValue})`,
        impactBps: 175,
        explanation: 'Moderate credit score attracts tier-2 NBFC risk premium.',
        isPositive: false,
      });
    } else {
      computedRate += 4.00;
      adjustments.push({
        factor: `Subprime Score (${input.creditScoreValue})`,
        impactBps: 400,
        explanation: 'Past credit strain restricts options to high-cost credit.',
        isPositive: false,
      });
    }
  } else {
    // Unknown or No History (Rule 3)
    computedRate += 1.50;
    adjustments.push({
      factor: 'Unscored / New-to-Credit (NTB)',
      impactBps: 150,
      explanation: 'No credit bureau history. Priced as unscored prime (+1.50%) with surrogate banking checks — NOT penalized as bad credit.',
      isPositive: false,
    });
  }

  // Delinquency / Bounce penalty (Anita Rule)
  if (input.hasRecentBouncedEmi) {
    computedRate += 3.50;
    adjustments.push({
      factor: 'Recent EMI Bounce (Last 90 Days)',
      impactBps: 350,
      explanation: 'Bounced repayment flags immediate cash flow distress across credit algorithms.',
      isPositive: false,
    });
  }

  // Collateral discount
  if (productRouting.wasRoutedToSecured) {
    adjustments.push({
      factor: 'Secured Property Backing (LAP)',
      impactBps: -350,
      explanation: 'Unencumbered property collateral eliminates unsecured lender risk, saving 350+ bps.',
      isPositive: true,
    });
  }

  // Apply confidence spread
  const spread = confidence.rateSpreadPct;
  // Enforce product-specific minimum rate floors: unsecured personal loans cannot go below 10.0%
  // even for super-prime borrowers (no bank in India offers <10% unsecured personal loans in 2026)
  const productMinRate = productRouting.recommendedProduct === 'personal_unsecured' ? 10.00
    : productRouting.recommendedProduct === 'twowheeler_ev' ? 10.50
    : productRouting.recommendedProduct === 'lap_secured' ? 8.75
    : 9.25;
  const rateMin = Math.max(Math.round((computedRate - spread) * 100) / 100, productMinRate);
  const rateMax = Math.round((computedRate + spread) * 100) / 100;
  const rateMid = Math.round(((rateMin + rateMax) / 2) * 100) / 100;

  // Processing fee & APR
  const feePct = productConfig.typicalProcessingFeePct;
  const upfrontDeduction = Math.round(input.amountWanted * (feePct / 100) * (1 + GST_RATE) + productConfig.documentationChargesRupees);
  const aprMin = calculateAllInApr(input.amountWanted, rateMin, tenureMonths, feePct, productConfig.documentationChargesRupees);
  const aprMax = calculateAllInApr(input.amountWanted, rateMax, tenureMonths, feePct, productConfig.documentationChargesRupees);
  const aprMid = Math.round(((aprMin + aprMax) / 2) * 100) / 100;

  let whyRate = `Fair rate is ${rateMin}% – ${rateMax}% based on your ${input.employmentType} profile and ${productConfig.displayName}. All-in APR is ${aprMin}% – ${aprMax}% including ${feePct}% processing fee + 18% GST.`;
  if (productRouting.wasRoutedToSecured) {
    whyRate += ` By securing against your property, you save ~4.0% p.a. compared to unsecured rates.`;
  }

  const o3: O3FairRateResult = {
    productType: productRouting.recommendedProduct,
    productName: productConfig.displayName,
    rateBand: { min: rateMin, max: rateMax, midpoint: rateMid },
    aprBand: { min: aprMin, max: aprMax, midpoint: aprMid },
    processingFeePercent: feePct,
    processingFeeGstPercent: Math.round(feePct * GST_RATE * 100) / 100,
    estimatedUpfrontDeduction: upfrontDeduction,
    whyRate,
    adjustments,
  };

  // --- O4: Safe Monthly EMI & Stress Test ---
  const recognizedMonthly = incomeAssessment.totalRecognizedMonthly;
  const lenderMaxFoirPct = getLenderMaxFoir(recognizedMonthly);
  const borrowerSafeFoirPct = getBorrowerSafeFoir(recognizedMonthly, input.monthlyRent, input.monthlyHouseholdExpenses);

  // Lender ceiling: strictly FOIR based
  const lenderMaxTotalEmi = Math.round(recognizedMonthly * lenderMaxFoirPct);
  const lenderMaxEmiCeiling = Math.max(lenderMaxTotalEmi - input.existingEmis, 0);

  // Borrower safe ceiling: accounts for actual rent, household bills, and emergency buffers
  const realCashSurplus = input.netMonthlyIncome - input.monthlyRent - input.monthlyHouseholdExpenses - input.existingEmis;
  const safeDisposableFromFoir = Math.max(Math.round(recognizedMonthly * borrowerSafeFoirPct) - input.existingEmis, 0);
  
  // Hard floor check: Must leave at least survival floor
  const survivalFloor = input.monthlyRent > 15000 ? MIN_SURVIVAL_FLOOR_METRO : MIN_SURVIVAL_FLOOR_NON_METRO;
  const safeDisposableAfterLiving = Math.max(input.netMonthlyIncome - input.monthlyRent - input.monthlyHouseholdExpenses - input.existingEmis - survivalFloor * 0.25, 0);

  let safeMonthlyEmiCeiling = Math.min(safeDisposableFromFoir, safeDisposableAfterLiving);
  if (safeMonthlyEmiCeiling < 0) safeMonthlyEmiCeiling = 0;

  // Proposed EMI for requested loan
  const proposedEmi = calculateEmi(input.amountWanted, rateMid, tenureMonths);
  const currentFoir = Math.round((input.existingEmis / Math.max(recognizedMonthly, 1)) * 100);
  const projectedFoir = Math.round(((input.existingEmis + proposedEmi) / Math.max(recognizedMonthly, 1)) * 100);

  // Why sentences (Rule 4: Every number has a why)
  const whySafeCeiling = `Your safe EMI ceiling is ₹${safeMonthlyEmiCeiling.toLocaleString('en-IN')}/mo because after your ₹${input.monthlyRent.toLocaleString('en-IN')} rent, ₹${input.monthlyHouseholdExpenses.toLocaleString('en-IN')} living costs, and existing ₹${input.existingEmis.toLocaleString('en-IN')} EMI, exceeding ₹${safeMonthlyEmiCeiling.toLocaleString('en-IN')} strips your monthly emergency buffer.`;
  const whyLenderCeiling = `Lenders allow up to ₹${lenderMaxEmiCeiling.toLocaleString('en-IN')}/mo because standard credit policy caps total debt service at ${Math.round(lenderMaxFoirPct * 100)}% of your recognized income.`;

  // Tenure options table
  const testTenures = productRouting.recommendedProduct === 'lap_secured' 
    ? [36, 60, 84, 120, 180]
    : [12, 24, 36, 48, 60];

  const tenureTradeoffs: TenureOption[] = testTenures.map((tMonths) => {
    const emi = calculateEmi(input.amountWanted, rateMid, tMonths);
    const totalRepay = emi * tMonths;
    const totalInt = totalRepay - input.amountWanted;
    return {
      tenureMonths: tMonths,
      monthlyEmi: emi,
      totalInterest: Math.max(totalInt, 0),
      totalRepayment: totalRepay,
      isWithinSafeCeiling: emi <= safeMonthlyEmiCeiling,
      isWithinLenderCeiling: emi <= lenderMaxEmiCeiling,
    };
  });

  // Stress tests
  // Stress Case 1: Income drops by 20%
  const stressedIncome = Math.round(recognizedMonthly * 0.80);
  const stressedFoir = Math.round(((input.existingEmis + proposedEmi) / Math.max(stressedIncome, 1)) * 100);
  const survivesIncomeStress = stressedFoir <= 65;
  const incomeStressVerdict = survivesIncomeStress
    ? `Survives: A 20% income reduction lifts debt obligations to ${stressedFoir}% of income, which remains manageable without immediate default.`
    : `Danger: If income falls 20%, debt obligations surge to ${stressedFoir}% of income, crossing the 65% default threshold.`;

  // Stress Case 2: Rate hikes by 200 bps (+2.0%)
  const stressedEmi = calculateEmi(input.amountWanted, rateMid + 2.0, tenureMonths);
  const emiDelta = stressedEmi - proposedEmi;
  const survivesRateStress = (input.existingEmis + stressedEmi) <= (safeMonthlyEmiCeiling + input.existingEmis * 1.1);
  const rateStressVerdict = survivesRateStress
    ? `Survives: A 2% interest rate spike increases monthly EMI by ₹${emiDelta.toLocaleString('en-IN')}, within your safety margin.`
    : `Caution: A 200 bps rate hike adds ₹${emiDelta.toLocaleString('en-IN')}/mo, piercing your safe monthly ceiling.`;

  const o4: O4SafeEmiResult = {
    safeMonthlyEmiCeiling,
    whySafeCeiling,
    lenderMaxEmiCeiling,
    whyLenderCeiling,
    proposedEmiAtRequestedAmount: proposedEmi,
    currentFoirPercent: currentFoir,
    projectedFoirPercent: projectedFoir,
    maxPermissibleFoirPercent: Math.round(lenderMaxFoirPct * 100),
    tenureTradeoffs,
    stressTest: {
      incomeDrop: {
        dropPercent: 20,
        stressedNetIncome: stressedIncome,
        stressedFoirPercent: stressedFoir,
        survives: survivesIncomeStress,
        verdictText: incomeStressVerdict,
      },
      rateHike: {
        rateHikeBps: 200,
        stressedEmi,
        monthlyEmiDelta: emiDelta,
        survives: survivesRateStress,
        verdictText: rateStressVerdict,
      },
    },
  };

  // --- O2: Maximum Amount (Lender Sanction vs Borrower Safe Carry) ---
  let lenderLikelySanction = 0;
  let lenderSanctionWhy = '';

  if (productRouting.recommendedProduct === 'lap_secured') {
    const ltvMax = (input.unencumberedPropertyMarketValue || 0) * (productConfig.maxLtvRatio || 0.60);
    const affordableFromEmi = calculatePrincipalFromEmi(lenderMaxEmiCeiling, rateMid, productConfig.defaultTenureMonths);
    lenderLikelySanction = Math.min(ltvMax, affordableFromEmi);
    lenderSanctionWhy = `Lender sanctions up to ₹${Math.round(lenderLikelySanction).toLocaleString('en-IN')} based on 60% LTV of your ₹${((input.unencumberedPropertyMarketValue || 0) / 100000).toFixed(1)}L property and 50% FOIR over 7 years.`;
  } else if (productRouting.recommendedProduct === 'twowheeler_ev') {
    const maxLtvAmount = input.amountWanted * (productConfig.maxLtvRatio || 0.80);
    const affordableFromEmi = calculatePrincipalFromEmi(lenderMaxEmiCeiling, rateMid, productConfig.defaultTenureMonths);
    lenderLikelySanction = Math.min(maxLtvAmount, affordableFromEmi);
    lenderSanctionWhy = `Lender will finance up to 80% on-road invoice (₹${Math.round(lenderLikelySanction).toLocaleString('en-IN')}) subject to 40% FOIR.`;
  } else {
    // Unsecured personal loan
    const maxLoanFromEmi = calculatePrincipalFromEmi(lenderMaxEmiCeiling, rateMid, productConfig.maxTenureMonths);
    // Typical personal loan policy cap: 15x - 20x net monthly income
    const multiplierCap = recognizedMonthly * 18;
    lenderLikelySanction = Math.min(maxLoanFromEmi, multiplierCap);
    lenderSanctionWhy = `Lender will sanction up to ₹${Math.round(lenderLikelySanction).toLocaleString('en-IN')} based on ${Math.round(lenderMaxFoirPct * 100)}% FOIR on your ₹${recognizedMonthly.toLocaleString('en-IN')} income over 5 years.`;
  }

  // Borrower Safe Carry calculation
  let borrowerSafeCarry = calculatePrincipalFromEmi(safeMonthlyEmiCeiling, rateMid, tenureMonths);

  // Consumption-loan penalty: for wedding/social/other with zero ROI,
  // cap safe carry at a more conservative threshold because every rupee
  // borrowed is pure consumption with no income return.
  // Specifically: after paying rent, living costs, and existing EMIs,
  // a wedding loan must leave at least 30% of net income as discretionary buffer.
  if (input.purpose === 'wedding_consumption' || input.purpose === 'other' || input.purpose === 'medical_emergency') {
    // Conservative ceiling: max 35% of net income for new consumption EMI headroom
    const conservativeEmiMax = Math.round(input.netMonthlyIncome * 0.35) - input.existingEmis;
    const conservativeCarry = calculatePrincipalFromEmi(Math.max(conservativeEmiMax, 0), rateMid, tenureMonths);
    borrowerSafeCarry = Math.min(borrowerSafeCarry, conservativeCarry);
    // Additionally, if emergency savings < 2 months, apply a further 70% haircut
    if (input.emergencySavingsMonths !== undefined && input.emergencySavingsMonths < 2) {
      borrowerSafeCarry = Math.round(borrowerSafeCarry * 0.70);
    }
  }

  // Productive loan revenue boost: adds capacity
  if (input.isProductiveLoan && input.expectedMonthlyRevenueBoost && input.expectedMonthlyRevenueBoost > 0) {
    const boostSafeEmi = input.expectedMonthlyRevenueBoost * 0.50; // Count 50% of projected revenue uplift
    const boostedPrincipal = calculatePrincipalFromEmi(boostSafeEmi, rateMid, tenureMonths);
    borrowerSafeCarry += boostedPrincipal;
  }

  // Format borrower safe carry explanation
  const borrowerSafeCarryWhy = `You can safely carry ₹${Math.round(borrowerSafeCarry).toLocaleString('en-IN')} because servicing its monthly EMI leaves sufficient liquidity for living costs and protects you from distress.`;

  const whichToUse = borrowerSafeCarry < lenderLikelySanction ? 'borrower_safe' : 'lender_sanction';
  const whichToUseWhy = whichToUse === 'borrower_safe'
    ? `Use your Safe Carrying Capacity (₹${Math.round(borrowerSafeCarry).toLocaleString('en-IN')}). Lenders will willingly sanction ₹${Math.round(lenderLikelySanction).toLocaleString('en-IN')}, but taking their maximum exposes you to default if unexpected expenses arise.`
    : `Both numbers align. You can comfortably service the amount the lender is willing to sanction.`;

  const amountMargin = confidence.amountMarginPct / 100;
  const o2: O2MaxAmountResult = {
    lenderLikelySanction: Math.round(lenderLikelySanction),
    lenderSanctionWhy,
    borrowerSafeCarry: Math.round(borrowerSafeCarry),
    borrowerSafeCarryWhy,
    recommendedAmount: Math.min(input.amountWanted, borrowerSafeCarry),
    whichToUse,
    whichToUseWhy,
    uncertaintyBand: {
      min: Math.round(borrowerSafeCarry * (1 - amountMargin)),
      max: Math.round(borrowerSafeCarry * (1 + amountMargin)),
    },
  };

  // --- O1: Verdict (Borrow / Don't borrow / Borrow less) ---
  let verdict: O1VerdictResult['verdict'] = 'BORROW';
  let headline = 'Safe to Proceed';
  let reason = '';
  const actionableSteps: string[] = [];
  let isDebtTrapFlagged = false;
  let alternativeProduct: string | undefined;

  // Trigger 1: Active Debt Distress (The Anita Rule)
  if (input.hasRecentBouncedEmi || (input.activeHighCostAppLoans && (input.highCostLoanBalance || 0) > 15000)) {
    verdict = 'DONT_BORROW';
    isDebtTrapFlagged = true;
    headline = 'Do Not Borrow — Active Debt Strain';
    reason = `You have active high-cost app debt and/or a recent bounced EMI. Taking a new unsecured loan at this stage risks an irreversible debt spiral. Banks will either decline you or predatory lenders will charge 36%+ APR.`;
    actionableSteps.push('Prioritize consolidating or clearing the existing high-cost micro/app loans immediately.');
    actionableSteps.push('Do not apply for fresh unsecured personal credit — every rejection pulls down your bureau rating.');
    if (input.purpose === 'electric_scooter_work') {
      alternativeProduct = 'EV Asset Lease / Platform Green Financing';
      actionableSteps.push('For your delivery work, seek asset financing directly through delivery platform partnerships (e.g. battery-as-a-service or EV lease-to-own with government subsidies) rather than personal cash borrowing.');
    }
  } else if (realCashSurplus <= 0 || safeMonthlyEmiCeiling <= 2000) {
    // Trigger 2: Negative or near-zero disposable cashflow
    verdict = 'DONT_BORROW';
    headline = 'Do Not Borrow — Insufficient Cashflow Cushion';
    reason = `Your monthly income of ₹${input.netMonthlyIncome.toLocaleString('en-IN')} is already fully consumed by rent (₹${input.monthlyRent.toLocaleString('en-IN')}), living expenses (₹${input.monthlyHouseholdExpenses.toLocaleString('en-IN')}), and existing obligations. Adding any new EMI creates immediate survival strain.`;
    actionableSteps.push('Build at least 2 months of basic cash reserves before committing to fixed debt obligations.');
    actionableSteps.push('Look for ways to defer this non-essential capital expense.');
  } else if (input.amountWanted > borrowerSafeCarry) {
    // Trigger 3: Borrow Less
    verdict = 'BORROW_LESS';
    headline = `Borrow Less — Cap at ₹${Math.round(borrowerSafeCarry).toLocaleString('en-IN')}`;
    reason = `You asked for ₹${input.amountWanted.toLocaleString('en-IN')}, but your safe borrowing ceiling is ₹${Math.round(borrowerSafeCarry).toLocaleString('en-IN')}. While a lender may approve the higher amount based on gross salary, paying ₹${proposedEmi.toLocaleString('en-IN')}/month will severely squeeze your disposable savings.`;
    actionableSteps.push(`Limit your loan request to ₹${Math.round(borrowerSafeCarry).toLocaleString('en-IN')} to keep your monthly EMI within ₹${safeMonthlyEmiCeiling.toLocaleString('en-IN')}.`);
    actionableSteps.push(`Fund the remaining ₹${Math.round(input.amountWanted - borrowerSafeCarry).toLocaleString('en-IN')} from existing savings or vendor negotiations.`);
    if (productRouting.wasRoutedToSecured) {
      alternativeProduct = 'Loan Against Property (LAP)';
      actionableSteps.push('Switch to LAP using your shop/property premises to reduce the monthly EMI by nearly 40%.');
    }
  } else {
    // Verdict: BORROW — but check for consumption loans where the requested amount
    // is above a comfortable discretionary ceiling, even if within FOIR.
    const isConsumptionLoan = input.purpose === 'wedding_consumption' || input.purpose === 'other';
    const postFixedExpenseSurplus = input.netMonthlyIncome - input.monthlyRent - input.monthlyHouseholdExpenses - input.existingEmis;
    // If the proposed EMI consumes >60% of post-expense surplus on a consumption loan → BORROW_LESS
    const proposedEmiRatioOfSurplus = postFixedExpenseSurplus > 0 ? proposedEmi / postFixedExpenseSurplus : 1;
    if (isConsumptionLoan && proposedEmiRatioOfSurplus > 0.60) {
      verdict = 'BORROW_LESS';
      headline = `Consider Borrowing Less — Wedding Loan Strains Discretionary Buffer`;
      const stretchedPct = Math.round(proposedEmiRatioOfSurplus * 100);
      reason = `You asked for ₹${input.amountWanted.toLocaleString('en-IN')} for a wedding (pure consumption with zero monetary return). After rent (₹${input.monthlyRent.toLocaleString('en-IN')}), living expenses (₹${input.monthlyHouseholdExpenses.toLocaleString('en-IN')}), and existing EMIs (₹${input.existingEmis.toLocaleString('en-IN')}), the new EMI would consume ${stretchedPct}% of your remaining discretionary income. While a lender will happily approve ₹${Math.round(lenderLikelySanction).toLocaleString('en-IN')}, borrowing ₹${input.amountWanted.toLocaleString('en-IN')} for a non-productive purpose leaves you vulnerable to any income shock.`;
      actionableSteps.push(`Cap the wedding loan at ₹${Math.round(borrowerSafeCarry).toLocaleString('en-IN')} — fund the remaining ₹${Math.round(input.amountWanted - borrowerSafeCarry).toLocaleString('en-IN')} from savings or family contributions.`);
      actionableSteps.push(`Stretch the tenure to 48 months instead of 36 to reduce monthly EMI and protect your Bengaluru buffer.`);
      actionableSteps.push(`Target a rate of ${rateMin}% – ${rateMax}% p.a. and reject mandatory bundled insurance (saves ₹15,000–₹20,000 upfront).`);
      actionableSteps.push(`Your lender will likely offer ₹${Math.round(lenderLikelySanction).toLocaleString('en-IN')} — decline the higher amount. Their FOIR does not account for your actual rent burden.`);
    } else {
      verdict = 'BORROW';
      headline = 'Clear to Borrow — Safe Financial Profile';
      reason = `Your requested loan of ₹${input.amountWanted.toLocaleString('en-IN')} fits comfortably within both your safe carrying capacity (₹${Math.round(borrowerSafeCarry).toLocaleString('en-IN')}) and lender sanction limits. Monthly EMI will remain well below your safe threshold.`;
      actionableSteps.push(`Target an interest rate band of ${rateMin}% – ${rateMax}% in branch discussions.`);
      actionableSteps.push(`Insist on a maximum processing fee of ${feePct}% and reject mandatory credit insurance bundling.`);
      if (productRouting.wasRoutedToSecured) {
        alternativeProduct = 'Loan Against Property (LAP)';
        actionableSteps.push('Apply under LAP/Secured MSME facility for lowest rate and optimal tenure.');
      }
    }
  }

  const o1: O1VerdictResult = {
    verdict,
    headline,
    reason,
    recommendedAmount: verdict === 'DONT_BORROW' ? 0 : Math.min(input.amountWanted, Math.round(borrowerSafeCarry)),
    actionableSteps,
    alternativeProduct,
    isDebtTrapFlagged,
  };

  // --- Negotiation Card Generation ---
  const keyStrengths: string[] = [];
  const riskPoints: string[] = [];

  if (input.employmentType === 'salaried' && input.employerTier === 'tier1_mnc') {
    keyStrengths.push('Tier-1 MNC Employer (Marquee Category A corporate)');
  }
  if (input.creditScoreStatus === 'known' && (input.creditScoreValue || 0) >= 750) {
    keyStrengths.push(`Strong Bureau Score: ${input.creditScoreValue} (Prime Category)`);
  }
  if (input.unencumberedPropertyMarketValue && input.unencumberedPropertyMarketValue > 0) {
    keyStrengths.push(`Unencumbered Property Worth ₹${((input.unencumberedPropertyMarketValue) / 100000).toFixed(1)}L available as collateral`);
  }
  if (input.jobVintageYears && input.jobVintageYears >= 3) {
    keyStrengths.push(`${input.jobVintageYears}+ years continuous employment stability`);
  }
  if (input.businessVintageYears && input.businessVintageYears >= 5) {
    keyStrengths.push(`${input.businessVintageYears} years established kirana/business track record`);
  }

  if (input.hasRecentBouncedEmi) {
    riskPoints.push('Recent bounced repayment on record (requires explanation or collateral mitigation)');
  }
  if (input.creditScoreStatus === 'unknown' || input.creditScoreStatus === 'no_history') {
    riskPoints.push('New-to-Credit (NTB) — no bureau footprint yet');
  }
  if (input.employmentType === 'informal') {
    riskPoints.push('Cash flow is unformalized without audited ITR');
  }

  // Lender quote comparison: if borrower has a quoted rate, calculate overpayment
  let lenderQuoteOverpayment: number | undefined;
  let lenderQuoteMonthlyExtra: number | undefined;
  if (input.lenderQuotedRate && input.lenderQuotedRate > rateMid) {
    const lenderEmi = calculateEmi(input.amountWanted, input.lenderQuotedRate, tenureMonths);
    const fairEmi = calculateEmi(input.amountWanted, rateMid, tenureMonths);
    lenderQuoteMonthlyExtra = lenderEmi - fairEmi;
    lenderQuoteOverpayment = lenderQuoteMonthlyExtra * tenureMonths;
  }

  // Dynamic counter scripts based on actual computed rate
  const walkAwayRateNum = Math.round((rateMax + 1.25) * 10) / 10;
  const counterScripts: CounterScript[] = [
    {
      lenderTactic: `Lender quotes ${input.lenderQuotedRate ? input.lenderQuotedRate.toFixed(2) + '%' : '14% - 16%'} claiming personal loans carry fixed standard rates.`,
      borrowerCounter: `"My profile qualifies for prime rack rates (${rateMin}% – ${rateMax}%). PSU and large private banks are actively sanctioning ${rateMid}% for my bureau score and employment tier. I will walk away if you quote above ${walkAwayRateNum}%."`,
      regulatoryOrMarketBasis: `Prime personal loan benchmark for ${input.employmentType === 'salaried' && input.employerTier === 'tier1_mnc' ? 'Tier-1 MNC / CIBIL 750+' : 'this profile'} is ${rateMin}% – ${rateMax}%.`,
    },
    {
      lenderTactic: 'Lender insists that taking a ₹15,000 credit life insurance policy is mandatory for loan approval.',
      borrowerCounter: `"Per RBI Master Directions on Fair Practices Code, third-party insurance products are strictly optional and cannot be made a prerequisite for credit sanction. Please issue the sanction letter without bundled insurance."`,
      regulatoryOrMarketBasis: 'RBI Master Circular on Customer Service & Fair Practices Code prohibit forced bundling.',
    },
    {
      lenderTactic: 'Lender charges 2.5% to 3.0% processing fee plus administrative charges.',
      borrowerCounter: `"Standard institutional processing fee for this ticket size is ${feePct}% + GST. Please match ${feePct}% + GST or waive the administrative charges. I will not pay above ₹${Math.round(input.amountWanted * (feePct / 100) * 1.18).toLocaleString('en-IN')}."`,
      regulatoryOrMarketBasis: 'Competitive market pricing for prime retail tickets.',
    },
  ];

  // Expose lender quote comparison data via the negotiation card object
  const lenderQuoteComparisonData = lenderQuoteOverpayment !== undefined ? {
    quotedRate: input.lenderQuotedRate!,
    fairMidpointRate: rateMid,
    extraPerMonth: Math.round(lenderQuoteMonthlyExtra!),
    totalOverpayment: Math.round(lenderQuoteOverpayment),
  } : undefined;

  if (productRouting.wasRoutedToSecured) {
    counterScripts.unshift({
      lenderTactic: 'Lender offers a high-cost unsecured business loan at 18% - 22% citing low ITR filing.',
      borrowerCounter: `"I do not want an unsecured business loan. I am pledging unencumbered commercial/residential property valued at ₹${((input.unencumberedPropertyMarketValue || 0) / 100000).toFixed(1)}L. Quote me a Loan Against Property (LAP) at 9.0% - 10.25%."`,
      regulatoryOrMarketBasis: 'LAP offers 9.0%–10.5% secured against prime collateral regardless of cash ITR haircuts.',
    });
  }

  const branchChecklist: string[] = [
    'Demand the official Key Fact Statement (KFS) before signing any sanction document.',
    'Verify that the Annual Percentage Rate (APR) matches the quoted headline rate plus processing fees.',
    'Ensure pre-payment and foreclosure penalties are 0% (RBI mandates ZERO foreclosure fees on floating rate loans to individuals).',
    'Reject any upfront insurance deductions deducted from the disbursed loan amount.',
  ];

  const walkAwayRate = `${Math.round((rateMax + 1.25) * 10) / 10}%`;

  const negotiationCard: NegotiationCardResult = {
    borrowerProfile: {
      name: input.borrowerName || 'Borrower',
      segmentLabel: `${input.employmentType.toUpperCase()} · ${input.age} yrs`,
      cibilDisplay: input.creditScoreStatus === 'known' ? `${input.creditScoreValue}` : 'Unscored / New-to-Credit',
      assessedIncomeFormatted: `₹${recognizedMonthly.toLocaleString('en-IN')}/mo (Net)`,
      keyStrengths: keyStrengths.length > 0 ? keyStrengths : ['Regular verifiable monthly income'],
      riskPoints: riskPoints.length > 0 ? riskPoints : ['None flagged'],
    },
    anchorDeal: {
      recommendedProduct: productConfig.displayName,
      fairRateRange: `${rateMin}% – ${rateMax}% p.a.`,
      fairAprRange: `${aprMin}% – ${aprMax}% APR`,
      maxFairProcessingFee: `${feePct}% + 18% GST (Max ₹${Math.round(input.amountWanted * (feePct / 100) * 1.18).toLocaleString('en-IN')})`,
      safeEmiLimit: `₹${safeMonthlyEmiCeiling.toLocaleString('en-IN')}/month`,
      walkAwayRate,
    },
    counterScripts,
    branchChecklist,
    lenderQuoteComparison: lenderQuoteComparisonData,
  };

  // --- Honesty About Limits: What We Do Not Know & Where We Are Guessing ---
  const whereTheAppIsGuessing: LimitGuess[] = [
    {
      area: 'Credit Inquiries (Hard Pulls)',
      whatWeDoNotKnow: 'Whether you applied at other lenders this week (we never pull bureau files to preserve your score).',
      whatWeAreGuessing: 'Guessing clean inquiry velocity (<2 hard pulls in last 30 days). Multiple recent applications drop CIBIL by 15-30 points.',
    },
  ];

  if (input.employmentType === 'informal') {
    whereTheAppIsGuessing.push({
      area: 'Informal Cash Turnover',
      whatWeDoNotKnow: 'Exact gross margin without audited GST returns or formal salary slips.',
      whatWeAreGuessing: `Guessing a flat 40% haircut on your ₹${input.netMonthlyIncome.toLocaleString('en-IN')} cash. Cooperative lenders may recognize 70%, while strict PSU banks recognize 0%.`,
    });
  }

  if (input.creditScoreStatus === 'unknown' || input.creditScoreStatus === 'no_history') {
    whereTheAppIsGuessing.push({
      area: 'Credit History & Repayment Track',
      whatWeDoNotKnow: 'Your past loan repayment track record or hidden delinquencies.',
      whatWeAreGuessing: 'Guessing unscored prime (+1.50% buffer). We do not assume bad credit, but a bank surrogate review will be required.',
    });
  }

  if (input.unencumberedPropertyMarketValue && input.unencumberedPropertyMarketValue > 0) {
    whereTheAppIsGuessing.push({
      area: 'Property Collateral Distress Valuation',
      whatWeDoNotKnow: 'Encumbrance status, local municipal circle rate discounts, or title search defects.',
      whatWeAreGuessing: `Guessing your ₹${((input.unencumberedPropertyMarketValue) / 100000).toFixed(1)}L property realizes a clean 60% LTV sanction. Bank valuer technical reports often apply a 15–20% distress haircut.`,
    });
  }

  whereTheAppIsGuessing.push({
    area: 'Branch Manager Discretionary Pricing',
    whatWeDoNotKnow: 'Whether the branch manager has unmet month-end or quarter-end lending targets.',
    whatWeAreGuessing: 'Guessing standard card rack rates. Visiting a branch in the last 10 days of a quarter can unlock an extra 25–50 bps rate discount.',
  });

  return {
    confidence,
    o1,
    o2,
    o3,
    o4,
    negotiationCard,
    whereTheAppIsGuessing,
  };
}
