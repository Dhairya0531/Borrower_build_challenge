import React from 'react';
import { BookOpen } from 'lucide-react';

export const RulesExplorer: React.FC = () => {
  return (
    <div className="bg-white border border-[#E2D9DE] rounded-xl p-6 shadow-sm space-y-6">
      <div className="border-b border-[#E2D9DE] pb-4">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-5 h-5 text-[#4B2440]" />
          <h2 className="text-xl font-display font-medium text-[#221A20] m-0">
            Rules & Underwriting Engine Specification (RULES.md)
          </h2>
        </div>
        <p className="text-xs text-[#6E6069] m-0">
          Format: <i>what · value · why · source or "my judgement"</i>. Separated from UI and verified live.
        </p>
      </div>

      {/* Section 1: FOIR */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#4B2440] mb-2">
          1. Fixed Obligation to Income Ratio (FOIR) & Capacity
        </h3>
        <div className="overflow-x-auto border border-[#E2D9DE] rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F3EEF1] border-b border-[#E2D9DE] text-[#6E6069] uppercase font-semibold">
              <tr>
                <th className="p-2.5">What</th>
                <th className="p-2.5">Value</th>
                <th className="p-2.5">Why</th>
                <th className="p-2.5">Source / Judgement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2D9DE]">
              <tr>
                <td className="p-2.5 font-semibold">Low-Income FOIR (&lt; ₹35k/mo)</td>
                <td className="p-2.5 font-mono text-[#4B2440]">Max 40%</td>
                <td className="p-2.5">Leaves minimal absolute cash surplus for food/rent; higher debt leads to default.</td>
                <td className="p-2.5 text-[#6E6069]">RBI MFI Regulatory Framework 2022 (50% max cap, 40% safe)</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">Mid-Income FOIR (₹35k – ₹75k)</td>
                <td className="p-2.5 font-mono text-[#4B2440]">Max 50%</td>
                <td className="p-2.5">Half of income can safely service debt if fixed living costs are modest.</td>
                <td className="p-2.5 text-[#6E6069]">Standard Bank Retail Credit Policy (SBI / HDFC)</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">High-Income FOIR (&gt; ₹75k/mo)</td>
                <td className="p-2.5 font-mono text-[#4B2440]">Max 55% – 60%</td>
                <td className="p-2.5">High absolute discretionary surplus enables higher leverage.</td>
                <td className="p-2.5 text-[#6E6069]">Tier-1 Salaried Underwriting Manuals</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">Informal Cash Haircut</td>
                <td className="p-2.5 font-mono text-[#4B2440]">40% haircut</td>
                <td className="p-2.5">Undocumented cash flows fluctuate and cannot be legally garnished via NACH.</td>
                <td className="p-2.5 text-[#6E6069]">Banking Surrogate Standards (60% cash recognition)</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">Survival Cushion Floor</td>
                <td className="p-2.5 font-mono text-[#4B2440]">₹14k metro, ₹9k non-metro</td>
                <td className="p-2.5">Non-negotiable living survival floor before a rupee can go to debt.</td>
                <td className="p-2.5 text-[#6E6069]">NSSO Consumption Expenditure Data (2026 adjusted)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Products & Routing */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#4B2440] mb-2">
          2. Product Routing & Loan-To-Value (LTV) Rules
        </h3>
        <div className="overflow-x-auto border border-[#E2D9DE] rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F3EEF1] border-b border-[#E2D9DE] text-[#6E6069] uppercase font-semibold">
              <tr>
                <th className="p-2.5">What</th>
                <th className="p-2.5">Value</th>
                <th className="p-2.5">Why</th>
                <th className="p-2.5">Source / Judgement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2D9DE]">
              <tr>
                <td className="p-2.5 font-semibold">Unsecured Personal Loan</td>
                <td className="p-2.5 font-mono text-[#4B2440]">Max 60 months</td>
                <td className="p-2.5">Unsecured credit risk compounds past 5 years.</td>
                <td className="p-2.5 text-[#6E6069]">Retail Banking Standard</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">Loan Against Property (LAP) LTV</td>
                <td className="p-2.5 font-mono text-[#4B2440]">60% Max LTV</td>
                <td className="p-2.5">Protects borrower and bank against property liquidation haircuts.</td>
                <td className="p-2.5 text-[#6E6069]">RBI Master Circular on Housing & Mortgage Lending</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">Two-Wheeler / EV LTV</td>
                <td className="p-2.5 font-mono text-[#4B2440]">80% Max LTV</td>
                <td className="p-2.5">Vehicles depreciate quickly; 20% borrower equity is required to avoid abandonment.</td>
                <td className="p-2.5 text-[#6E6069]">Auto Finance Industry Benchmark</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">The "Ravi Rule" (Secured Routing)</td>
                <td className="p-2.5 font-mono text-[#4B2440]">Route to LAP if property ≥ 2x loan</td>
                <td className="p-2.5">Unsecured rate for low-ITR self-employed is 18–24%; LAP slashes rate to 9.0–10.25%.</td>
                <td className="p-2.5 text-[#6E6069]">Lokta Challenge Brief Core Requirement</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Credit Bureau */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#4B2440] mb-2">
          3. Credit Score (CIBIL) & Risk Rules
        </h3>
        <div className="overflow-x-auto border border-[#E2D9DE] rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F3EEF1] border-b border-[#E2D9DE] text-[#6E6069] uppercase font-semibold">
              <tr>
                <th className="p-2.5">Score Band</th>
                <th className="p-2.5">Rate Impact</th>
                <th className="p-2.5">Handling Rule</th>
                <th className="p-2.5">Source / Judgement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2D9DE]">
              <tr>
                <td className="p-2.5 font-semibold">Super Prime (775 – 900)</td>
                <td className="p-2.5 font-mono text-emerald-700">-50 bps discount</td>
                <td className="p-2.5">Lowest rack rates and fee waivers.</td>
                <td className="p-2.5 text-[#6E6069]">TransUnion CIBIL Prime Tier</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">Prime (725 – 774)</td>
                <td className="p-2.5 font-mono text-gray-700">0 bps (Baseline)</td>
                <td className="p-2.5">Standard card rack rates.</td>
                <td className="p-2.5 text-[#6E6069]">Bank Grid Rate</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">Unknown / New-to-Credit (NTB)</td>
                <td className="p-2.5 font-mono text-[#4B2440]">+150 bps unscored</td>
                <td className="p-2.5"><b>Unknown is NEVER 0 or 300.</b> Priced via surrogate banking & asset backing.</td>
                <td className="p-2.5 text-[#6E6069]">Brief Rule 3 & RBI CIC Regulations</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">Recent Bounced EMI (Anita Rule)</td>
                <td className="p-2.5 font-mono text-rose-700">Triggers "Don't Borrow"</td>
                <td className="p-2.5">Bounced repayment in last 90 days indicates active cash exhaustion.</td>
                <td className="p-2.5 text-[#6E6069]">IBA Credit Underwriting Manual</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 4: All-in APR */}
      <div className="bg-[#FBF9FA] border border-[#E2D9DE] p-4 rounded-xl text-xs space-y-2">
        <h4 className="font-semibold text-sm text-[#221A20] uppercase tracking-wider m-0">
          4. RBI Statutory All-in APR Formula
        </h4>
        <p className="text-[#6E6069] leading-relaxed m-0">
          Per RBI Master Direction on Key Fact Statement (KFS), headline interest rates conceal upfront costs. The Copilot solves the Internal Rate of Return (IRR) on net disbursed funds:
        </p>
        <div className="font-mono bg-white p-3 rounded border border-[#E2D9DE] text-[#4B2440] space-y-1">
          <div>Net Disbursed = Loan Principal - [Processing Fee % × (1 + 18% GST)] - Documentation Charges</div>
          <div>APR = Monthly IRR equated over net disbursed funds × 12</div>
        </div>
      </div>

      {/* Section 5: Honesty About Limits & Guessing */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#4B2440] mb-2">
          5. Honesty About Limits: What We Do Not Know & Where We Guess
        </h3>
        <div className="overflow-x-auto border border-[#E2D9DE] rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#F3EEF1] border-b border-[#E2D9DE] text-[#6E6069] uppercase font-semibold">
              <tr>
                <th className="p-2.5">Dimension</th>
                <th className="p-2.5">What We Do NOT Know</th>
                <th className="p-2.5">Where The App Is Guessing</th>
                <th className="p-2.5">Why It Matters</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2D9DE]">
              <tr>
                <td className="p-2.5 font-semibold">Credit Hard Inquiries</td>
                <td className="p-2.5">We do not pull bureau files to preserve user privacy and CIBIL score.</td>
                <td className="p-2.5">Assumes clean inquiry velocity (&lt; 2 recent pulls).</td>
                <td className="p-2.5 text-[#6E6069]">Applying at 4+ banks in 1 week triggers automated rejection.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">Property Title & Valuation Cuts</td>
                <td className="p-2.5">Legal encumbrance, local circle rate variance, or title search defects.</td>
                <td className="p-2.5">Assumes market value stated by borrower realizes standard 60% LTV.</td>
                <td className="p-2.5 text-[#6E6069]">Empanelled bank valuers typically apply a 15-20% distress haircut.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">Informal Cash Records</td>
                <td className="p-2.5">Actual gross margins without GST returns or audited P&L.</td>
                <td className="p-2.5">Flat 40% haircut on unverified cash.</td>
                <td className="p-2.5 text-[#6E6069]">Cooperative banks may recognize 70%; strict PSU banks recognize 0%.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-semibold">Branch Discretionary Pools</td>
                <td className="p-2.5">Quarter-end branch manager rate concession budgets.</td>
                <td className="p-2.5">Standard card rack rates displayed.</td>
                <td className="p-2.5 text-[#6E6069]">Visiting during quarter-end often unlocks an extra 25-50 bps discount.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
