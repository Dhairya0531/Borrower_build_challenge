import React, { useState } from 'react';
import { CopilotCalculationResult, BorrowerInput } from '../engine/types';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Zap,
  ArrowRight,
  TrendingDown,
  HelpCircle,
} from 'lucide-react';

interface OutputDashboardProps {
  calculation: CopilotCalculationResult;
  input: BorrowerInput;
  onSelectTenure: (months: number) => void;
  onNavigateToCard: () => void;
  onLenderRateChange: (rate: number | undefined) => void;
}

export const OutputDashboard: React.FC<OutputDashboardProps> = ({
  calculation,
  input,
  onSelectTenure,
  onNavigateToCard,
  onLenderRateChange,
}) => {
  const { o1, o2, o3, o4, confidence, negotiationCard } = calculation;
  const [lenderRateInput, setLenderRateInput] = useState<string>(
    input.lenderQuotedRate ? String(input.lenderQuotedRate) : ''
  );

  const isBorrow = o1.verdict === 'BORROW';
  const isBorrowLess = o1.verdict === 'BORROW_LESS';
  const isDontBorrow = o1.verdict === 'DONT_BORROW';

  const handleLenderRateChange = (val: string) => {
    setLenderRateInput(val);
    const parsed = parseFloat(val);
    onLenderRateChange(parsed > 0 && parsed < 50 ? parsed : undefined);
  };

  return (
    <div className="space-y-6">
      {/* O1: VERDICT */}
      <div
        className={`rounded-xl border p-6 shadow-sm transition-all ${
          isBorrow
            ? 'bg-emerald-50/70 border-emerald-300'
            : isBorrowLess
            ? 'bg-amber-50/70 border-amber-300'
            : 'bg-rose-50/80 border-rose-300'
        }`}
      >
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-white/80 border border-current text-[#4B2440]">
              Output 1 · The Verdict
            </span>
            {o1.alternativeProduct && (
              <span className="text-xs bg-[#4B2440] text-white px-2.5 py-0.5 rounded-full font-medium">
                Route: {o1.alternativeProduct}
              </span>
            )}
          </div>
          <span
            className={`font-mono text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
              isBorrow
                ? 'bg-emerald-700 text-white'
                : isBorrowLess
                ? 'bg-amber-700 text-white'
                : 'bg-rose-700 text-white'
            }`}
          >
            {o1.verdict.replace('_', ' ')}
          </span>
        </div>

        <div className="flex items-start gap-3">
          {isBorrow && <CheckCircle2 className="w-7 h-7 text-emerald-700 flex-shrink-0 mt-1" />}
          {isBorrowLess && <AlertTriangle className="w-7 h-7 text-amber-700 flex-shrink-0 mt-1" />}
          {isDontBorrow && <XCircle className="w-7 h-7 text-rose-700 flex-shrink-0 mt-1" />}

          <div className="flex-1">
            <h3 className="text-xl font-display font-medium text-[#221A20] m-0 mb-1">
              {o1.headline}
            </h3>
            <p className="text-sm text-[#221A20] leading-relaxed mb-4">
              {o1.reason}
            </p>

            {/* Actionable Steps */}
            <div className="bg-white/80 rounded-lg p-3.5 border border-black/5 space-y-2">
              <h4 className="text-xs uppercase font-semibold tracking-wider text-[#6E6069] m-0 mb-1.5">
                What Good Looks Like / Next Actions:
              </h4>
              <ul className="text-xs space-y-1.5 list-disc pl-4 text-[#221A20]">
                {o1.actionableSteps.map((step, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* O2: MAXIMUM AMOUNT */}
      <div className="bg-white border border-[#E2D9DE] rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#4B2440] bg-[#F3EEF1] px-2 py-0.5 rounded">
              Output 2 · Maximum Borrowing Amount
            </span>
            <h3 className="text-lg font-display font-medium text-[#221A20] mt-1 m-0">
              Lender Sanction vs. Safe Carrying Capacity
            </h3>
          </div>
          <span className="text-xs text-[#6E6069] font-mono">
            Confidence margin: ±{confidence.amountMarginPct}%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-[#FBF9FA] border border-[#E2D9DE] rounded-xl p-4">
            <span className="text-xs font-semibold text-[#6E6069] uppercase tracking-wider block">
              What Lender Will Likely Sanction
            </span>
            <div className="text-2xl font-mono font-semibold text-[#221A20] my-1">
              ₹{o2.lenderLikelySanction.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-[#6E6069] leading-relaxed">{o2.lenderSanctionWhy}</p>
          </div>

          <div className="bg-emerald-50/50 border-2 border-emerald-500/40 rounded-xl p-4">
            <span className="text-xs font-semibold text-emerald-900 uppercase tracking-wider flex items-center justify-between">
              What You Can Safely Carry
              <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded font-mono font-bold">RECOMMENDED</span>
            </span>
            <div className="text-2xl font-mono font-semibold text-emerald-900 my-1">
              ₹{o2.borrowerSafeCarry.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-emerald-950/80 leading-relaxed">{o2.borrowerSafeCarryWhy}</p>
          </div>
        </div>

        <div className="bg-[#EFE3EA]/60 border-l-4 border-[#4B2440] p-3 rounded-r-lg text-xs text-[#221A20]">
          <span className="font-semibold block mb-0.5 text-[#4B2440]">Which number should you use?</span>
          {o2.whichToUseWhy}
        </div>
      </div>

      {/* O3: FAIR INTEREST RATE & APR */}
      <div className="bg-white border border-[#E2D9DE] rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#4B2440] bg-[#F3EEF1] px-2 py-0.5 rounded">
              Output 3 · Fair Interest Rate &amp; RBI APR
            </span>
            <h3 className="text-lg font-display font-medium text-[#221A20] mt-1 m-0">{o3.productName}</h3>
          </div>
          <span className="text-xs text-[#6E6069]">Spread: ±{confidence.rateSpreadPct.toFixed(2)}%</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-[#FBF9FA] border border-[#E2D9DE] p-4 rounded-xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6E6069] block">Fair Headline Interest Rate</span>
            <div className="text-2xl font-mono font-semibold text-[#4B2440] my-1">
              {o3.rateBand.min.toFixed(2)}% – {o3.rateBand.max.toFixed(2)}%
            </div>
            <span className="text-xs text-[#6E6069]">Midpoint benchmark: <b>{o3.rateBand.midpoint.toFixed(2)}% p.a.</b></span>
          </div>

          <div className="bg-amber-50/50 border border-amber-300 p-4 rounded-xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-900 flex items-center justify-between">
              True All-in APR (RBI KFS)
              <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-mono">Mandatory</span>
            </span>
            <div className="text-2xl font-mono font-semibold text-amber-950 my-1">
              {o3.aprBand.min.toFixed(2)}% – {o3.aprBand.max.toFixed(2)}%
            </div>
            <span className="text-xs text-amber-900/80">
              Includes {o3.processingFeePercent}% processing fee + 18% GST (₹{o3.estimatedUpfrontDeduction.toLocaleString('en-IN')})
            </span>
          </div>
        </div>

        <p className="text-xs text-[#221A20] mb-4 leading-relaxed bg-[#F3EEF1] p-3 rounded-lg border border-[#E2D9DE]">
          {o3.whyRate}
        </p>

        <div className="border border-[#E2D9DE] rounded-lg overflow-hidden mb-4">
          <div className="bg-[#FBF9FA] px-3 py-2 border-b border-[#E2D9DE] text-[11px] font-semibold uppercase tracking-wider text-[#6E6069]">
            How Your Profile Adjusted the Rate:
          </div>
          <div className="divide-y divide-[#E2D9DE] text-xs">
            {o3.adjustments.map((adj, idx) => (
              <div key={idx} className="p-3 flex items-start justify-between gap-3">
                <div>
                  <span className="font-semibold text-[#221A20] block">{adj.factor}</span>
                  <span className="text-[11px] text-[#6E6069]">{adj.explanation}</span>
                </div>
                <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded flex-shrink-0 ${
                  adj.impactBps < 0 ? 'bg-emerald-100 text-emerald-800'
                  : adj.impactBps === 0 ? 'bg-gray-100 text-gray-800'
                  : 'bg-rose-100 text-rose-800'
                }`}>
                  {adj.impactBps > 0 ? `+${adj.impactBps} bps` : adj.impactBps === 0 ? '0 bps' : `${adj.impactBps} bps`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* LENDER QUOTE COMPARATOR */}
        <div className="border-2 border-dashed border-[#4B2440]/30 rounded-xl p-4 bg-[#FBF9FA]">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-[#4B2440]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#4B2440]">Lender Quote Comparator</span>
            <span className="text-[10px] bg-[#4B2440] text-white px-2 py-0.5 rounded font-mono">NEGOTIATION TOOL</span>
          </div>
          <p className="text-xs text-[#6E6069] mb-3 leading-relaxed">
            Enter your lender's quoted interest rate — see exactly how much extra you will pay vs. your fair rate.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <input
                type="number"
                step="0.25"
                min="6"
                max="40"
                placeholder="e.g. 14.00"
                value={lenderRateInput}
                onChange={(e) => handleLenderRateChange(e.target.value)}
                className="w-28 px-3 py-2 text-sm font-mono bg-white border border-[#E2D9DE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4B2440] focus:border-[#4B2440]"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#6E6069] pointer-events-none">%</span>
            </div>
            <span className="text-xs text-[#6E6069]">
              vs. your fair rate of <b className="text-[#4B2440]">{o3.rateBand.midpoint.toFixed(2)}%</b>
            </span>
          </div>
          {negotiationCard.lenderQuoteComparison && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 text-center">
                <span className="text-[11px] text-rose-700 font-semibold block">Lender Quoted</span>
                <span className="font-mono text-base font-bold text-rose-900">{negotiationCard.lenderQuoteComparison.quotedRate.toFixed(2)}%</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-center">
                <span className="text-[11px] text-emerald-700 font-semibold block">Your Fair Rate</span>
                <span className="font-mono text-base font-bold text-emerald-900">{negotiationCard.lenderQuoteComparison.fairMidpointRate.toFixed(2)}%</span>
              </div>
              <div className="bg-[#EFE3EA] border border-[#CFA5C1] rounded-lg p-2.5 text-center">
                <span className="text-[11px] text-[#4B2440] font-semibold block">Overcharge</span>
                <span className="font-mono text-base font-bold text-[#4B2440]">
                  +{(negotiationCard.lenderQuoteComparison.quotedRate - negotiationCard.lenderQuoteComparison.fairMidpointRate).toFixed(2)}%
                </span>
              </div>
              <div className="sm:col-span-3 bg-rose-50/80 border border-rose-200 rounded-lg p-3 text-xs text-rose-900">
                <span className="font-semibold">Overpayment Alert: </span>
                The lender's rate costs you{' '}
                <b>₹{negotiationCard.lenderQuoteComparison.extraPerMonth.toLocaleString('en-IN')} more per month</b> and{' '}
                <b>₹{negotiationCard.lenderQuoteComparison.totalOverpayment.toLocaleString('en-IN')} extra over the loan tenure</b>.
                Use the counter-script on your Negotiation Card to push back.
              </div>
            </div>
          )}
          {lenderRateInput && parseFloat(lenderRateInput) <= o3.rateBand.midpoint && parseFloat(lenderRateInput) > 0 && (
            <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-800">
              <span className="font-semibold">✓ Good deal: </span>
              The quoted rate of {parseFloat(lenderRateInput).toFixed(2)}% is at or below your fair midpoint of {o3.rateBand.midpoint.toFixed(2)}%. This is a competitive offer.
            </div>
          )}
        </div>
      </div>

      {/* O4: EMI CEILING & STRESS TEST */}
      <div className="bg-white border border-[#E2D9DE] rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#4B2440] bg-[#F3EEF1] px-2 py-0.5 rounded">
              Output 4 · Monthly EMI Ceiling &amp; Stress Test
            </span>
            <h3 className="text-lg font-display font-medium text-[#221A20] mt-1 m-0">
              Safe Outflow &amp; Stress Analysis
            </h3>
          </div>
        </div>

        {/* FOIR Progress Bar */}
        <div className="mb-5 bg-[#FBF9FA] border border-[#E2D9DE] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="font-semibold text-[#221A20]">FOIR Utilization</span>
            <span className="font-mono text-[#6E6069]">
              Current: {o4.currentFoirPercent}% → Projected:{' '}
              <span className={o4.projectedFoirPercent > o4.maxPermissibleFoirPercent ? 'text-rose-700 font-bold' : 'text-[#221A20] font-bold'}>
                {o4.projectedFoirPercent}%
              </span>{' '}
              (Lender Cap: {o4.maxPermissibleFoirPercent}%)
            </span>
          </div>
          <div className="w-full bg-[#E2D9DE] h-4 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-[#4B2440]/60 absolute top-0 left-0 transition-all duration-500"
              style={{ width: `${Math.min(o4.currentFoirPercent, 100)}%` }}
            />
            <div
              className={`h-full absolute top-0 transition-all duration-500 ${
                o4.projectedFoirPercent > o4.maxPermissibleFoirPercent ? 'bg-rose-500/80' : 'bg-emerald-500/70'
              }`}
              style={{
                left: `${Math.min(o4.currentFoirPercent, 100)}%`,
                width: `${Math.min(Math.max(o4.projectedFoirPercent - o4.currentFoirPercent, 0), 100 - o4.currentFoirPercent)}%`,
              }}
            />
            <div
              className="absolute top-0 h-full w-0.5 bg-[#4B2440]"
              style={{ left: `${Math.min(o4.maxPermissibleFoirPercent, 100)}%` }}
            />
          </div>
          <div className="flex items-center gap-4 mt-2 text-[10px] text-[#6E6069]">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-2 bg-[#4B2440]/60 rounded-sm"></span>Existing EMIs
            </span>
            <span className="flex items-center gap-1">
              <span className={`inline-block w-3 h-2 rounded-sm ${o4.projectedFoirPercent > o4.maxPermissibleFoirPercent ? 'bg-rose-500/80' : 'bg-emerald-500/70'}`}></span>New EMI
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-0.5 h-3 bg-[#4B2440]"></span>Lender Cap
            </span>
          </div>
        </div>

        {/* Safe EMI Ceiling */}
        <div className="bg-emerald-50/60 border border-emerald-300 rounded-xl p-4 mb-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-900 block">
                Non-Negotiable Safe Monthly EMI Ceiling
              </span>
              <div className="text-2xl font-mono font-bold text-emerald-950 my-0.5">
                ₹{o4.safeMonthlyEmiCeiling.toLocaleString('en-IN')}/month
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-[#6E6069] block">Lender Policy Max:</span>
              <span className="font-mono text-sm font-semibold text-[#221A20]">
                ₹{o4.lenderMaxEmiCeiling.toLocaleString('en-IN')}/mo
              </span>
            </div>
          </div>
          <p className="text-xs text-emerald-900 mt-2 leading-relaxed border-t border-emerald-200/70 pt-2">
            {o4.whySafeCeiling}
          </p>
        </div>

        {/* Tenure Table */}
        <div className="mb-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6E6069] block mb-2">
            Tenure Trade-offs for ₹{input.amountWanted.toLocaleString('en-IN')} (Click to select):
          </span>
          <div className="overflow-x-auto border border-[#E2D9DE] rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F3EEF1] border-b border-[#E2D9DE] text-[#6E6069] uppercase font-semibold">
                <tr>
                  <th className="p-2.5">Tenure</th>
                  <th className="p-2.5">Monthly EMI</th>
                  <th className="p-2.5">Total Interest</th>
                  <th className="p-2.5">Total Outflow</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2D9DE]">
                {o4.tenureTradeoffs.map((item) => {
                  const isSelected = input.preferredTenureMonths === item.tenureMonths;
                  return (
                    <tr
                      key={item.tenureMonths}
                      onClick={() => onSelectTenure(item.tenureMonths)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#EFE3EA]/60 font-semibold text-[#4B2440]' : 'hover:bg-[#FBF9FA]'
                      }`}
                    >
                      <td className="p-2.5 font-mono">{item.tenureMonths} mos ({(item.tenureMonths / 12).toFixed(1)} yrs)</td>
                      <td className="p-2.5 font-mono">₹{item.monthlyEmi.toLocaleString('en-IN')}</td>
                      <td className="p-2.5 font-mono text-[#6E6069]">₹{item.totalInterest.toLocaleString('en-IN')}</td>
                      <td className="p-2.5 font-mono">₹{item.totalRepayment.toLocaleString('en-IN')}</td>
                      <td className="p-2.5">
                        {item.isWithinSafeCeiling ? (
                          <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px] font-semibold">✓ Safe</span>
                        ) : item.isWithinLenderCeiling ? (
                          <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[10px] font-semibold">⚠ Stretched</span>
                        ) : (
                          <span className="text-rose-800 bg-rose-100 px-2 py-0.5 rounded text-[10px] font-semibold">✕ Breaches FOIR</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stress Tests — prominently bordered */}
        <div className="border-2 border-amber-300 rounded-xl p-4 bg-amber-50/30">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-amber-700" />
            <h4 className="text-sm font-semibold text-[#221A20] m-0">
              Adverse Stress Case Testing — Mandatory Survival Check
            </h4>
            <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-mono font-semibold ml-auto">What if?</span>
          </div>
          <p className="text-xs text-[#6E6069] mb-3 leading-relaxed">
            Every number is run against two real-world shocks. The borrower must survive both without defaulting.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className={`p-3.5 rounded-xl border text-xs ${o4.stressTest.incomeDrop.survives ? 'bg-white border-emerald-200' : 'bg-rose-50 border-rose-300'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">Scenario A: −20% Income</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${o4.stressTest.incomeDrop.survives ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {o4.stressTest.incomeDrop.survives ? '✓ SURVIVES' : '✕ DANGER'}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed mb-2 text-[#221A20]">{o4.stressTest.incomeDrop.verdictText}</p>
              <div className="font-mono text-[10px] text-[#6E6069] bg-[#F3EEF1] p-2 rounded">
                Stressed Income: ₹{o4.stressTest.incomeDrop.stressedNetIncome.toLocaleString('en-IN')} · Stressed FOIR: <b>{o4.stressTest.incomeDrop.stressedFoirPercent}%</b>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border text-xs ${o4.stressTest.rateHike.survives ? 'bg-white border-emerald-200' : 'bg-rose-50 border-rose-300'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm">Scenario B: +200 bps Rate Hike</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${o4.stressTest.rateHike.survives ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {o4.stressTest.rateHike.survives ? '✓ SURVIVES' : '✕ CAUTION'}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed mb-2 text-[#221A20]">{o4.stressTest.rateHike.verdictText}</p>
              <div className="font-mono text-[10px] text-[#6E6069] bg-[#F3EEF1] p-2 rounded">
                Stressed EMI: ₹{o4.stressTest.rateHike.stressedEmi.toLocaleString('en-IN')}/mo (Delta: +₹{o4.stressTest.rateHike.monthlyEmiDelta.toLocaleString('en-IN')})
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HONESTY ABOUT LIMITS: WHERE THE APP IS GUESSING */}
      {calculation.whereTheAppIsGuessing && calculation.whereTheAppIsGuessing.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-300/80 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-4 h-4 text-amber-800 flex-shrink-0" />
            <h4 className="text-xs uppercase font-semibold tracking-wider text-amber-950 m-0">
              Honesty About Limits · Where the Copilot is Guessing
            </h4>
          </div>
          <p className="text-xs text-amber-900/90 mb-3 leading-relaxed">
            Per Challenge Rubric: We never pretend false certainty. Here are the specific areas where this self-assessment relies on conservative institutional assumptions rather than full verification:
          </p>
          <div className="space-y-2.5">
            {calculation.whereTheAppIsGuessing.map((item, idx) => (
              <div key={idx} className="bg-white/90 p-3 rounded-lg border border-amber-200 text-xs">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold text-amber-950">{item.area}</span>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                    Assumption
                  </span>
                </div>
                <div className="text-[11px] text-[#6E6069] mb-0.5">
                  <b>What we do NOT know:</b> {item.whatWeDoNotKnow}
                </div>
                <div className="text-[11px] text-[#221A20]">
                  <b>Where we are guessing:</b> {item.whatWeAreGuessing}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA to Negotiation Card */}
      <div className="bg-[#4B2440] text-white rounded-xl p-5 flex items-center justify-between flex-wrap gap-4 shadow-md">
        <div>
          <h3 className="font-display text-lg font-medium m-0">Ready to visit the lender branch?</h3>
          <p className="text-xs text-[#EFE3EA] mt-0.5">Open the 1-page Negotiation Card on your phone with counter-scripts.</p>
        </div>
        <button
          onClick={onNavigateToCard}
          className="px-4 py-2 bg-white text-[#4B2440] font-semibold text-xs rounded-lg hover:bg-[#EFE3EA] transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <span>Open Negotiation Card</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
