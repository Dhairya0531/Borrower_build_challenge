import { describe, it, expect } from 'vitest';
import {
  calculateEmi,
  calculatePrincipalFromEmi,
  calculateAllInApr,
  calculateRecognizedIncome,
  runBorrowerCopilot,
} from '../calculator';
import { getLenderMaxFoir } from '../rules';

describe('Financial Math & Lending Rules Suite', () => {
  it('calculateEmi computes standard reducing balance EMI', () => {
    // ₹10,00,000 at 12% p.a. for 36 months is approx ₹33,214
    const emi = calculateEmi(1000000, 12, 36);
    expect(emi).toBe(33214);
  });

  it('calculatePrincipalFromEmi reverses EMI accurately', () => {
    const principal = calculatePrincipalFromEmi(33214, 12, 36);
    expect(Math.abs(principal - 1000000)).toBeLessThan(50);
  });

  it('calculateAllInApr incorporates processing fees and GST into true IRR', () => {
    // A 10.5% nominal rate with 1.75% processing fee + 18% GST results in ~11.8% APR
    const apr = calculateAllInApr(800000, 10.5, 36, 1.75, 500);
    expect(apr).toBeGreaterThan(10.5);
    expect(apr).toBeLessThan(12.5);
  });

  it('Rule 1 & 5: FOIR tiers and cash income haircuts', () => {
    expect(getLenderMaxFoir(30000)).toBe(0.40);
    expect(getLenderMaxFoir(60000)).toBe(0.50);
    expect(getLenderMaxFoir(100000)).toBe(0.55);

    // Informal income haircut of 40%
    const informalIncome = calculateRecognizedIncome({
      age: 35,
      purpose: 'other',
      amountWanted: 100000,
      employmentType: 'informal',
      netMonthlyIncome: 30000,
      existingEmis: 0,
      monthlyRent: 5000,
      monthlyHouseholdExpenses: 12000,
      creditScoreStatus: 'unknown',
    });
    expect(informalIncome.recognizedMonthlyIncome).toBe(18000); // 60% of 30,000
    expect(informalIncome.unrecognizedCash).toBe(12000); // 40% haircut
  });

  it('Rule 3: Unknown is never treated as 300 or default', () => {
    const outputUnknown = runBorrowerCopilot({
      age: 28,
      purpose: 'personal_unsecured' as any,
      amountWanted: 300000,
      employmentType: 'salaried',
      netMonthlyIncome: 65000,
      existingEmis: 0,
      monthlyRent: 15000,
      monthlyHouseholdExpenses: 15000,
      creditScoreStatus: 'unknown', // Bureau score unknown
    });

    // Score is unrated (+1.5% buffer), not subprime (+4% penalty)
    expect(outputUnknown.o3.rateBand.midpoint).toBeLessThan(16.0);
    expect(outputUnknown.negotiationCard.borrowerProfile.cibilDisplay).toContain('Unscored');
    expect(outputUnknown.o3.whyRate).not.toContain('300');
  });

  it('Rule 4: Every number has a why (explanations present for ceilings and verdicts)', () => {
    const result = runBorrowerCopilot({
      age: 32,
      purpose: 'wedding_consumption',
      amountWanted: 600000,
      employmentType: 'salaried',
      netMonthlyIncome: 80000,
      existingEmis: 5000,
      monthlyRent: 20000,
      monthlyHouseholdExpenses: 20000,
      creditScoreStatus: 'known',
      creditScoreValue: 760,
    });

    expect(result.o2.lenderSanctionWhy.length).toBeGreaterThan(20);
    expect(result.o2.borrowerSafeCarryWhy.length).toBeGreaterThan(20);
    expect(result.o4.whySafeCeiling.length).toBeGreaterThan(20);
    expect(result.o4.whyLenderCeiling.length).toBeGreaterThan(20);
    expect(result.o4.stressTest.incomeDrop.verdictText.length).toBeGreaterThan(15);
  });
});
