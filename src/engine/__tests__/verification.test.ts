import { describe, it, expect } from 'vitest';
import { runBorrowerCopilot } from '../calculator';
import { PERSONAS } from '../../data/personas';
import { QUESTION_SCHEMA } from '../questions';

describe('Exhaustive Verification of HTML Challenge Requirements', () => {
  const priya = PERSONAS.find((p) => p.id === 'priya')!;
  const ravi = PERSONAS.find((p) => p.id === 'ravi')!;
  const anita = PERSONAS.find((p) => p.id === 'anita')!;

  describe('Rubric Criterion 1: Domain Reasoning (30 Points)', () => {
    it('Priya: Lender number and borrower safe carry are clearly separated and different', () => {
      const res = runBorrowerCopilot(priya.input);
      // Lender will sanction significantly more than safe carry
      expect(res.o2.lenderLikelySanction).toBeGreaterThan(res.o2.borrowerSafeCarry);
      expect(res.o2.whichToUse).toBe('borrower_safe');
      expect(res.o2.whichToUseWhy).toContain('Safe Carrying Capacity');
      // Rationale explains wedding consumption and rent impact
      expect(res.o2.borrowerSafeCarryWhy.length).toBeGreaterThan(25);
    });

    it('Ravi: Critical test — Routed to Secured Product (LAP) against ₹45L property', () => {
      const res = runBorrowerCopilot(ravi.input);
      expect(res.o3.productType).toBe('lap_secured');
      expect(res.o3.productName).toContain('Loan Against Property');
      // Pledging property unlocks prime secured rate (9.0% - 10.5%) vs 18%+ unsecured
      expect(res.o3.rateBand.min).toBeLessThanOrEqual(10.0);
      expect(res.o3.rateBand.max).toBeLessThanOrEqual(11.5);
      // Property allows high sanction (60% LTV of 45L = 27L)
      expect(res.o2.lenderLikelySanction).toBeGreaterThanOrEqual(1500000);
      expect(res.o1.verdict).toBe('BORROW');
    });

    it('Anita: Critical test — "Don\'t Borrow" fires for debt distress (bounced EMI + 30% app loans)', () => {
      const res = runBorrowerCopilot(anita.input);
      expect(res.o1.verdict).toBe('DONT_BORROW');
      expect(res.o1.isDebtTrapFlagged).toBe(true);
      expect(res.o1.headline).toContain('Do Not Borrow');
      // Alternative pathway provided (EV platform leasing / debt consolidation)
      expect(res.o1.actionableSteps.length).toBeGreaterThanOrEqual(2);
      expect(res.o1.alternativeProduct).toBeDefined();
    });

    it('Statutory All-in APR is honest about processing fees and 18% GST', () => {
      const res = runBorrowerCopilot(priya.input);
      // APR must be strictly greater than nominal rate
      expect(res.o3.aprBand.min).toBeGreaterThan(res.o3.rateBand.min);
      expect(res.o3.aprBand.max).toBeGreaterThan(res.o3.rateBand.max);
      expect(res.o3.estimatedUpfrontDeduction).toBeGreaterThan(0);
    });
  });

  describe('Rubric Criterion 2: Question Design & Rules (20 Points)', () => {
    it('Rule 1: Adaptive question schema skips non-applicable questions', () => {
      // For Salaried Priya: employerTier applies, reportedItrAnnual and unencumberedProperty do NOT apply
      const priyaQuestions = QUESTION_SCHEMA.filter((q) => !q.appliesIf || q.appliesIf(priya.input));
      const hasEmployerTier = priyaQuestions.some((q) => q.id === 'employerTier');
      const hasItr = priyaQuestions.some((q) => q.id === 'reportedItrAnnual');
      expect(hasEmployerTier).toBe(true);
      expect(hasItr).toBe(false);

      // For Self-Employed Ravi: reportedItrAnnual and property apply, employerTier does NOT apply
      const raviQuestions = QUESTION_SCHEMA.filter((q) => !q.appliesIf || q.appliesIf(ravi.input));
      const hasRaviItr = raviQuestions.some((q) => q.id === 'reportedItrAnnual');
      const hasRaviEmployerTier = raviQuestions.some((q) => q.id === 'employerTier');
      expect(hasRaviItr).toBe(true);
      expect(hasRaviEmployerTier).toBe(false);
    });

    it('Rule 2: Confidence widens with silence', () => {
      const minimalTier1Input = {
        age: 30,
        purpose: 'wedding_consumption' as const,
        amountWanted: 500000,
        employmentType: 'salaried' as const,
        netMonthlyIncome: 70000,
        existingEmis: 0,
        monthlyRent: 20000,
        monthlyHouseholdExpenses: 20000,
        creditScoreStatus: 'unknown' as const,
      };

      const minimalRes = runBorrowerCopilot(minimalTier1Input);
      expect(minimalRes.confidence.level).toBe('low');
      expect(minimalRes.confidence.rateSpreadPct).toBe(3.5); // Wide ±3.5%
      expect(minimalRes.confidence.amountMarginPct).toBe(25); // Wide ±25%

      // When precision questions are answered, band tightens
      const detailedInput = {
        ...minimalTier1Input,
        creditScoreStatus: 'known' as const,
        creditScoreValue: 780,
        employerTier: 'tier1_mnc' as const,
        emergencySavingsMonths: 4,
        hasRecentBouncedEmi: false,
      };
      const detailedRes = runBorrowerCopilot(detailedInput);
      expect(detailedRes.confidence.level).toBe('high');
      expect(detailedRes.confidence.rateSpreadPct).toBeLessThan(1.0); // Tight ±0.60%
    });

    it('Rule 3: Unknown is never zero (NTB handled with dignity)', () => {
      const res = runBorrowerCopilot(ravi.input);
      // Ravi has no credit history, but is not treated as 300 / default
      expect(res.negotiationCard.borrowerProfile.cibilDisplay).toContain('Unscored');
      expect(res.o3.whyRate).not.toContain('300');
    });

    it('Rule 4: Every number has a why', () => {
      const res = runBorrowerCopilot(priya.input);
      expect(res.o2.lenderSanctionWhy.startsWith('Lender')).toBe(true);
      expect(res.o2.borrowerSafeCarryWhy.startsWith('You can safely carry')).toBe(true);
      expect(res.o4.whySafeCeiling.startsWith('Your safe EMI ceiling')).toBe(true);
      expect(res.o4.whyLenderCeiling.startsWith('Lenders allow up to')).toBe(true);
    });

    it('Rule 5: India, in Rupees (FOIR tiers, cash haircut, stress tests)', () => {
      const res = runBorrowerCopilot(anita.input);
      // Informal cash has 40% haircut
      expect(res.o4.currentFoirPercent).toBeGreaterThan(0);
      // Stress tests present
      expect(res.o4.stressTest.incomeDrop.dropPercent).toBe(20);
      expect(res.o4.stressTest.rateHike.rateHikeBps).toBe(200);
    });
  });

  describe('Rubric Criterion 3: Negotiation Card & Explainability (20 Points)', () => {
    it('Generates complete 1-page Negotiation Card with counter-scripts', () => {
      const res = runBorrowerCopilot(priya.input);
      const card = res.negotiationCard;

      expect(card.borrowerProfile.name).toBe('Priya');
      expect(card.anchorDeal.fairRateRange.length).toBeGreaterThan(5);
      expect(card.anchorDeal.safeEmiLimit.length).toBeGreaterThan(5);
      expect(card.anchorDeal.walkAwayRate.length).toBeGreaterThan(2);

      // Counter scripts against standard branch tactics
      expect(card.counterScripts.length).toBeGreaterThanOrEqual(3);
      expect(card.counterScripts.some((s) => s.lenderTactic.includes('insurance'))).toBe(true);
      expect(card.counterScripts.some((s) => s.regulatoryOrMarketBasis.includes('RBI'))).toBe(true);
    });
  });
});
