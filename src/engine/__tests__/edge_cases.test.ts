import { describe, it, expect } from 'vitest';
import { runBorrowerCopilot, calculateAllInApr } from '../calculator';
import { BorrowerInput } from '../types';

describe('Exhaustive Edge Cases and Combinations Suite', () => {
  const baseInput: BorrowerInput = {
    age: 30,
    purpose: 'personal_unsecured' as any,
    amountWanted: 500000,
    employmentType: 'salaried',
    netMonthlyIncome: 50000,
    existingEmis: 0,
    monthlyRent: 15000,
    monthlyHouseholdExpenses: 15000,
    creditScoreStatus: 'known',
    creditScoreValue: 750,
  };

  it('Edge Case 1: Zero income or near-zero income never throws and returns DONT_BORROW', () => {
    const res = runBorrowerCopilot({
      ...baseInput,
      netMonthlyIncome: 0,
    });
    expect(res.o1.verdict).toBe('DONT_BORROW');
    expect(res.o4.safeMonthlyEmiCeiling).toBe(0);
    expect(Number.isFinite(res.o3.rateBand.min)).toBe(true);
    expect(Number.isFinite(res.o4.safeMonthlyEmiCeiling)).toBe(true);
  });

  it('Edge Case 2: Debt > Income (Extreme over-indebtedness)', () => {
    const res = runBorrowerCopilot({
      ...baseInput,
      existingEmis: 80000, // Existing EMIs far higher than 50k income
    });
    expect(res.o1.verdict).toBe('DONT_BORROW');
    expect(res.o4.safeMonthlyEmiCeiling).toBe(0);
  });

  it('Edge Case 3: Zero desired loan amount', () => {
    const res = runBorrowerCopilot({
      ...baseInput,
      amountWanted: 0,
    });
    expect(Number.isFinite(res.o3.rateBand.midpoint)).toBe(true);
    expect(res.o4.proposedEmiAtRequestedAmount).toBe(0);
  });

  it('Edge Case 4: High Ticket (₹1 Crore+ loan)', () => {
    const res = runBorrowerCopilot({
      ...baseInput,
      netMonthlyIncome: 500000,
      amountWanted: 10000000,
      employmentType: 'salaried',
      creditScoreStatus: 'known',
      creditScoreValue: 820,
    });
    expect(Number.isFinite(res.o2.lenderLikelySanction)).toBe(true);
    expect(Number.isFinite(res.o4.safeMonthlyEmiCeiling)).toBe(true);
    expect(res.o3.rateBand.min).toBeGreaterThan(8);
  });

  it('Edge Case 5: Credit score status is known but value is undefined or zero', () => {
    const res = runBorrowerCopilot({
      ...baseInput,
      creditScoreStatus: 'known',
      creditScoreValue: undefined,
    });
    // Should fallback gracefully without NaN
    expect(Number.isFinite(res.o3.rateBand.midpoint)).toBe(true);
  });

  it('Edge Case 6: All optional fields undefined or null', () => {
    const res = runBorrowerCopilot({
      age: 25,
      purpose: 'other',
      amountWanted: 200000,
      employmentType: 'informal',
      netMonthlyIncome: 25000,
      existingEmis: 0,
      monthlyRent: 0,
      monthlyHouseholdExpenses: 10000,
      creditScoreStatus: 'unknown',
    });
    expect(res.confidence.level).toBe('low');
    expect(res.o1.verdict).toBeDefined();
    expect(res.negotiationCard.anchorDeal.fairRateRange).toBeDefined();
  });

  it('Edge Case 7: Rent higher than income', () => {
    const res = runBorrowerCopilot({
      ...baseInput,
      netMonthlyIncome: 30000,
      monthlyRent: 35000,
    });
    expect(res.o1.verdict).toBe('DONT_BORROW');
    expect(res.o4.safeMonthlyEmiCeiling).toBe(0);
  });

  it('Edge Case 8: All-in APR calculation with short tenure and small ticket', () => {
    const apr = calculateAllInApr(50000, 14.0, 12, 2.5, 500);
    expect(apr).toBeGreaterThan(14.0);
    expect(Number.isFinite(apr)).toBe(true);
  });
});
