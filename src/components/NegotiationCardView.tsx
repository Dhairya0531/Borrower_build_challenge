import React from 'react';
import { NegotiationCardResult } from '../engine/types';
import { ShieldCheck, Printer, ArrowLeft, AlertCircle, CheckCircle, Scale } from 'lucide-react';

interface NegotiationCardViewProps {
  card: NegotiationCardResult;
  onBack: () => void;
}

export const NegotiationCardView: React.FC<NegotiationCardViewProps> = ({ card, onBack }) => {
  const handlePrint = () => {
    window.print();
  };

  const { borrowerProfile, anchorDeal, counterScripts, branchChecklist } = card;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Navigation & Print */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-[#4B2440] hover:text-[#221A20] flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-[#E2D9DE]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Calculator</span>
        </button>

        <button
          onClick={handlePrint}
          className="text-xs font-semibold text-white bg-[#4B2440] hover:bg-[#381B30] flex items-center gap-1.5 px-4 py-1.5 rounded-md shadow-sm transition-colors"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* The Printable Card Screen */}
      <div className="bg-white border-2 border-[#4B2440] rounded-2xl p-6 md:p-8 shadow-md print:border print:p-6 print:shadow-none">
        {/* Header */}
        <div className="border-b border-[#E2D9DE] pb-5 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-[11px] font-mono font-bold tracking-widest text-[#4B2440] uppercase block">
                Lokta · Borrower Copilot · Branch Negotiation Card
              </span>
              <h1 className="text-2xl md:text-3xl font-display font-medium text-[#221A20] m-0 mt-1">
                {borrowerProfile.name}'s Loan Assessment Card
              </h1>
            </div>
            <div className="text-right">
              <span className="text-xs text-[#6E6069] block">Recommended Product</span>
              <span className="font-semibold text-sm text-[#4B2440]">
                {anchorDeal.recommendedProduct}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 md:gap-4 mt-3 pt-3 border-t border-[#F3EEF1] text-xs text-[#6E6069]">
            <span>Profile: <b className="text-[#221A20]">{borrowerProfile.segmentLabel}</b></span>
            <span>•</span>
            <span>Assessed Net: <b className="text-[#221A20]">{borrowerProfile.assessedIncomeFormatted}</b></span>
            <span>•</span>
            <span>CIBIL Score: <b className="text-[#221A20] font-mono">{borrowerProfile.cibilDisplay}</b></span>
          </div>
        </div>

        {/* 4 Crucial Anchor Numbers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {/* Fair Rate */}
          <div className="bg-[#FBF9FA] border border-[#E2D9DE] p-3.5 rounded-xl">
            <span className="text-[11px] uppercase font-semibold text-[#6E6069] block">
              Target Fair Rate
            </span>
            <div className="text-xl font-mono font-bold text-[#4B2440] my-0.5">
              {anchorDeal.fairRateRange}
            </div>
            <span className="text-[10px] text-[#6E6069] block">{anchorDeal.fairAprRange}</span>
          </div>

          {/* Safe EMI Limit */}
          <div className="bg-emerald-50/60 border border-emerald-300 p-3.5 rounded-xl">
            <span className="text-[11px] uppercase font-semibold text-emerald-900 block">
              Max Safe EMI
            </span>
            <div className="text-xl font-mono font-bold text-emerald-950 my-0.5">
              {anchorDeal.safeEmiLimit}
            </div>
            <span className="text-[10px] text-emerald-800 block">Do not exceed</span>
          </div>

          {/* Max Processing Fee */}
          <div className="bg-[#FBF9FA] border border-[#E2D9DE] p-3.5 rounded-xl">
            <span className="text-[11px] uppercase font-semibold text-[#6E6069] block">
              Max Fair Fee
            </span>
            <div className="text-sm font-mono font-bold text-[#221A20] my-1">
              {anchorDeal.maxFairProcessingFee}
            </div>
            <span className="text-[10px] text-[#6E6069] block">Demand GST invoice</span>
          </div>

          {/* Walk-Away Rate */}
          <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl">
            <span className="text-[11px] uppercase font-semibold text-rose-900 block">
              Walk-Away Rate
            </span>
            <div className="text-xl font-mono font-bold text-rose-950 my-0.5">
              &gt; {anchorDeal.walkAwayRate}
            </div>
            <span className="text-[10px] text-rose-800 block">Decline if above this</span>
          </div>
        </div>

        {/* Profile Strengths & Risks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-[#FBF9FA] p-3.5 rounded-xl border border-[#E2D9DE]">
            <span className="text-xs uppercase font-semibold text-emerald-900 flex items-center gap-1.5 mb-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
              Verified Negotiation Leverage (Mention These):
            </span>
            <ul className="text-xs space-y-1 text-[#221A20] list-disc pl-4">
              {borrowerProfile.keyStrengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>

          <div className="bg-[#FBF9FA] p-3.5 rounded-xl border border-[#E2D9DE]">
            <span className="text-xs uppercase font-semibold text-amber-900 flex items-center gap-1.5 mb-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
              Profile Flags (Be Prepared to Address):
            </span>
            <ul className="text-xs space-y-1 text-[#221A20] list-disc pl-4">
              {borrowerProfile.riskPoints.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Counter-Scripts for Branch Discussion */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#4B2440] mb-3 flex items-center gap-1.5">
            <Scale className="w-4 h-4" />
            <span>Word-for-Word Branch Counter-Scripts:</span>
          </h3>

          <div className="space-y-3">
            {counterScripts.map((script, idx) => (
              <div
                key={idx}
                className="border border-[#E2D9DE] rounded-xl p-3.5 bg-white space-y-2"
              >
                <div className="text-xs font-semibold text-rose-900 bg-rose-50/70 p-2 rounded">
                  If Lender Says: <span className="font-normal">{script.lenderTactic}</span>
                </div>
                <div className="text-xs text-emerald-950 bg-emerald-50/70 p-2.5 rounded border-l-2 border-emerald-600">
                  <span className="font-semibold block mb-0.5 text-emerald-900">
                    Hold Up This Card & Reply:
                  </span>
                  <p className="italic font-display text-sm m-0">
                    {script.borrowerCounter}
                  </p>
                </div>
                <div className="text-[10px] text-[#6E6069] font-mono">
                  Regulatory / Policy Basis: {script.regulatoryOrMarketBasis}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Branch Golden Rules & RBI Mandates */}
        <div className="border-t border-[#E2D9DE] pt-4">
          <h4 className="text-xs uppercase font-semibold tracking-wider text-[#6E6069] mb-2 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Mandatory RBI Protections You Must Exercise:</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-[#221A20]">
            {branchChecklist.map((item, idx) => (
              <div key={idx} className="flex items-start gap-1.5 bg-[#FBF9FA] p-2 rounded border border-[#E2D9DE]">
                <span className="font-bold text-[#4B2440]">[{idx + 1}]</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-[#E2D9DE] text-[10px] text-[#6E6069] flex items-center justify-between">
          <span>Generated by Lokta Borrower Copilot · Free borrower self-assessment</span>
          <span>Rules based on RBI Master Directions & Retail Lending Norms</span>
        </div>
      </div>
    </div>
  );
};
