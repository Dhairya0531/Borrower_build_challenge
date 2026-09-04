import { describe, it, expect } from 'vitest';
import { runBorrowerCopilot } from '../calculator';
import { PERSONAS } from '../../data/personas';

describe('Borrower Copilot Engine — Three Benchmark Personas', () => {
  const priya = PERSONAS.find((p) => p.id === 'priya')!;
  const ravi = PERSONAS.find((p) => p.id === 'ravi')!;
  const anita = PERSONAS.find((p) => p.id === 'anita')!;

  it('Priya (Salaried MNC, ₹1.1L/mo, CIBIL 780): Lender sanction > Safe carry, fair rate prime, verdict Borrow Less', () => {
    const result = runBorrowerCopilot(priya.input);

    // O1 Verdict: Wedding is non-productive consumption; ₹8L exceeds safe capacity after ₹28k rent
    expect(['BORROW_LESS', 'BORROW']).toContain(result.o1.verdict);
    expect(result.o1.recommendedAmount).toBeLessThanOrEqual(priya.input.amountWanted);

    // O2 Max Amount: Lender sanction and Safe carry are clearly separated
    expect(result.o2.lenderLikelySanction).toBeGreaterThan(result.o2.borrowerSafeCarry);
    expect(result.o2.whichToUse).toBe('borrower_safe');
    expect(result.o2.lenderLikelySanction).toBeGreaterThanOrEqual(1000000); // Lenders sanction ₹10L+
    expect(result.o2.whichToUseWhy).toContain('Safe Carrying Capacity');

    // O3 Fair Rate: Prime tier rate (10.5% - 11.5%)
    expect(result.o3.rateBand.min).toBeLessThanOrEqual(11.0);
    expect(result.o3.rateBand.max).toBeLessThanOrEqual(12.5);
    expect(result.o3.aprBand.min).toBeGreaterThan(result.o3.rateBand.min); // APR includes processing fee + GST
    expect(result.o3.processingFeePercent).toBeGreaterThan(0);

    // O4 Safe EMI: Ceiling accounts for ₹28,000 rent and existing car EMI
    expect(result.o4.safeMonthlyEmiCeiling).toBeGreaterThan(0);
    expect(result.o4.safeMonthlyEmiCeiling).toBeLessThan(result.o4.lenderMaxEmiCeiling);
    expect(result.o4.stressTest.incomeDrop.dropPercent).toBe(20);

    // Negotiation Card: Counter scripts for prime tier
    expect(result.negotiationCard.borrowerProfile.cibilDisplay).toBe('780');
    expect(result.negotiationCard.counterScripts.length).toBeGreaterThan(0);
  });

  it('Ravi (Kirana, cashflow ₹60k, ITR ₹4.2L, Shop ₹45L): Successfully routed to LAP, unlocks ₹15L at prime secured rate', () => {
    const result = runBorrowerCopilot(ravi.input);

    // CRITICAL SCORING CHECK: Is Ravi routed to secured product?
    expect(result.o3.productType).toBe('lap_secured');
    expect(result.o3.productName).toContain('Loan Against Property');

    // Rule 3: Unknown/No credit history is NOT treated as 300 / default
    expect(result.negotiationCard.borrowerProfile.cibilDisplay).toContain('Unscored');

    // Unlocks low rate (9.0% - 10.5%) due to property backing
    expect(result.o3.rateBand.min).toBeLessThanOrEqual(10.0);
    expect(result.o3.rateBand.max).toBeLessThanOrEqual(11.5);

    // O2: Property collateral allows sanction of ₹15L+ (well within 60% LTV of ₹45L = ₹27L)
    expect(result.o2.lenderLikelySanction).toBeGreaterThanOrEqual(1500000);

    // O1 Verdict: Borrow via LAP
    expect(result.o1.verdict).toBe('BORROW');
    expect(result.o1.alternativeProduct).toContain('Property');

    // Negotiation Card has specific counter against high-cost unsecured business loans
    const hasLapScript = result.negotiationCard.counterScripts.some((s) => s.borrowerCounter.includes('Loan Against Property'));
    expect(hasLapScript).toBe(true);
  });

  it('Anita (Informal gig rider, 3 app loans at 30%+, 1 bounce): Fires "Don\'t Borrow" to prevent debt trap', () => {
    const result = runBorrowerCopilot(anita.input);

    // CRITICAL SCORING CHECK: "Don't borrow" must fire when it should!
    expect(result.o1.verdict).toBe('DONT_BORROW');
    expect(result.o1.isDebtTrapFlagged).toBe(true);
    expect(result.o1.headline).toContain('Do Not Borrow');
    expect(result.o1.reason).toContain('debt');

    // Productive scooter loan alternative proposed
    expect(result.o1.actionableSteps.some((step) => step.includes('consolidat') || step.includes('clearing'))).toBe(true);
    expect(result.o1.alternativeProduct).toContain('EV');
  });

  it('Confidence widens with silence: Tier 1 alone produces wide bands, precision answers narrow them', () => {
    // Only basic Must questions answered
    const basicInput = {
      age: 30,
      purpose: 'wedding_consumption' as const,
      amountWanted: 500000,
      employmentType: 'salaried' as const,
      netMonthlyIncome: 50000,
      existingEmis: 5000,
      monthlyRent: 15000,
      monthlyHouseholdExpenses: 15000,
      creditScoreStatus: 'unknown' as const,
    };

    const lowConfidenceResult = runBorrowerCopilot(basicInput);
    expect(lowConfidenceResult.confidence.level).toBe('low');
    expect(lowConfidenceResult.confidence.rateSpreadPct).toBeGreaterThanOrEqual(3.0); // Wide spread (±3.5%)
    expect(lowConfidenceResult.confidence.amountMarginPct).toBeGreaterThanOrEqual(20); // Wide margin (±25%)

    // Now answer precision questions (credit score, employer tier, emergency reserve, clean history)
    const detailedInput = {
      ...basicInput,
      creditScoreStatus: 'known' as const,
      creditScoreValue: 790,
      employerTier: 'tier1_mnc' as const,
      emergencySavingsMonths: 6,
      hasRecentBouncedEmi: false,
    };

    const highConfidenceResult = runBorrowerCopilot(detailedInput);
    expect(highConfidenceResult.confidence.level).toBe('high');
    expect(highConfidenceResult.confidence.rateSpreadPct).toBeLessThan(1.5); // Narrow spread
    expect(highConfidenceResult.confidence.amountMarginPct).toBeLessThanOrEqual(10); // Tight margin
  });
});
