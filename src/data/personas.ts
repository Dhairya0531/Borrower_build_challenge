import { BorrowerInput } from '../engine/types';

export interface PersonaProfile {
  id: string;
  name: string;
  age: number;
  location: string;
  employmentLabel: string;
  story: string;
  wantedLoanLabel: string;
  input: BorrowerInput;
  evaluationExpectation: string;
}

export const PERSONAS: PersonaProfile[] = [
  {
    id: 'priya',
    name: 'Priya',
    age: 29,
    location: 'Bengaluru',
    employmentLabel: 'Salaried MNC Engineer',
    story: 'Software engineer at a large MNC for 5 years. Net ₹1,10,000/month. One car loan, EMI ₹14,000, 2 years left. Credit score 780. Rents at ₹28,000.',
    wantedLoanLabel: '₹8,00,000 Personal Loan for wedding',
    evaluationExpectation: 'Lender will sanction ₹11L+, but safe borrowing capacity is lower (₹5L - ₹6L) because a wedding is non-productive consumption and high rent in Bengaluru reduces buffer. Verdict should guide to "Borrow Less" or caution.',
    input: {
      borrowerName: 'Priya',
      age: 29,
      purpose: 'wedding_consumption',
      amountWanted: 800000,
      employmentType: 'salaried',
      employerTier: 'tier1_mnc',
      jobVintageYears: 5,
      netMonthlyIncome: 110000,
      existingEmis: 14000,
      monthlyRent: 28000,
      monthlyHouseholdExpenses: 25000,
      creditScoreStatus: 'known',
      creditScoreValue: 780,
      emergencySavingsMonths: 3,
      hasRecentBouncedEmi: false,
      activeHighCostAppLoans: false,
      isProductiveLoan: false,
      preferredTenureMonths: 36,
    },
  },
  {
    id: 'ravi',
    name: 'Ravi',
    age: 42,
    location: 'Mysuru',
    employmentLabel: 'Self-Employed Kirana Store Owner',
    story: 'Kirana store for 14 years. Cash income ₹40,000–80,000/month; ITR shows ₹4,20,000/year. Owns the shop premises, about ₹45,00,000, unencumbered. Never taken a formal loan; no credit score. Wife earns ₹18,000 teaching.',
    wantedLoanLabel: '₹15,00,000 for second stock line and delivery vehicle',
    evaluationExpectation: 'Crucial scoring test: Ravi must be routed to a secured product (Loan Against Property / LAP) instead of unsecured personal loan. Against ₹4.2L ITR an unsecured loan would be rejected or quoted at 22%+. Pledging ₹45L unencumbered property unlocks ₹15L at 9.0% - 10.25% with comfortable 7-10 yr tenure.',
    input: {
      borrowerName: 'Ravi',
      age: 42,
      purpose: 'business_inventory',
      amountWanted: 1500000,
      employmentType: 'self_employed',
      businessVintageYears: 14,
      netMonthlyIncome: 60000, // Midpoint of 40k-80k
      reportedItrAnnual: 420000,
      unencumberedPropertyMarketValue: 4500000, // ₹45 Lakh shop premises
      existingEmis: 0,
      monthlyRent: 0, // Owns shop and home
      monthlyHouseholdExpenses: 22000,
      secondaryIncomeMonthly: 18000, // Wife teaching
      isSecondaryIncomeFormal: true,
      creditScoreStatus: 'no_history', // Never taken formal loan, no credit score
      emergencySavingsMonths: 4,
      hasRecentBouncedEmi: false,
      activeHighCostAppLoans: false,
      isProductiveLoan: true,
      expectedMonthlyRevenueBoost: 25000, // Productive stock line & delivery
      preferredTenureMonths: 84, // 7 years LAP
    },
  },
  {
    id: 'anita',
    name: 'Anita',
    age: 35,
    location: 'Hubballi',
    employmentLabel: 'Informal Gig Rider + Tailoring',
    story: 'Delivery-platform rider plus home tailoring. ₹26,000–30,000/month, two children, husband unemployed 8 months. Three app loans, ₹35,000 outstanding at 30%+, one EMI bounced last month.',
    wantedLoanLabel: '₹1,50,000 for an electric scooter to double delivery runs',
    evaluationExpectation: 'Crucial scoring test: "Don\'t Borrow" must fire. With 3 active predatory app loans at 30%+, husband unemployed, and a recent bounced EMI, fresh unsecured debt is toxic. Safe route: clear/restructure app debt first, or obtain EV via platform lease/green subsidy rather than cash borrowing.',
    input: {
      borrowerName: 'Anita',
      age: 35,
      purpose: 'electric_scooter_work',
      amountWanted: 150000,
      employmentType: 'informal',
      netMonthlyIncome: 28000, // Midpoint of 26k-30k
      existingEmis: 4500, // Service cost for 3 app loans
      activeHighCostAppLoans: true,
      highCostLoanBalance: 35000, // ₹35,000 at 30%+
      hasRecentBouncedEmi: true, // One EMI bounced last month
      monthlyRent: 6000,
      monthlyHouseholdExpenses: 15000, // 2 kids, unemployed husband
      creditScoreStatus: 'unknown',
      emergencySavingsMonths: 0.5, // Barely 2 weeks savings
      isProductiveLoan: true,
      expectedMonthlyRevenueBoost: 14000, // Doubling delivery runs
      preferredTenureMonths: 36,
    },
  },
];
