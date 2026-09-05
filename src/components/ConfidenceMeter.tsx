import React from 'react';
import { ConfidenceResult } from '../engine/types';
import { ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

interface ConfidenceMeterProps {
  confidence: ConfidenceResult;
  onFocusField?: (fieldName: string) => void;
}

export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({ confidence, onFocusField }) => {
  const isHigh = confidence.level === 'high';
  const isMedium = confidence.level === 'medium';
  const isLow = confidence.level === 'low';

  const badgeColor = isHigh
    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
    : isMedium
    ? 'bg-amber-100 text-amber-900 border-amber-300'
    : 'bg-rose-50 text-rose-800 border-rose-200';

  const barColor = isHigh ? 'bg-emerald-600' : isMedium ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <div className="bg-white border border-[#E2D9DE] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#4B2440]" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#6E6069] m-0">
            Confidence Engine · "Silence Widens the Band"
          </h3>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${badgeColor}`}>
          {confidence.label} ({confidence.scorePercent}%)
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#F3EEF1] h-2.5 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full transition-all duration-500 rounded-full ${barColor}`}
          style={{ width: `${confidence.scorePercent}%` }}
        />
      </div>

      <p className="text-xs text-[#6E6069] mb-4 leading-relaxed">
        {confidence.summary}
      </p>

      {/* Metric bands readout */}
      <div className="grid grid-cols-2 gap-3 mb-4 bg-[#FBF9FA] p-3 rounded-lg border border-[#E2D9DE]">
        <div>
          <span className="text-[11px] font-medium text-[#6E6069] block">Interest Rate Uncertainty</span>
          <span className="font-mono text-sm font-semibold text-[#221A20]">
            ±{confidence.rateSpreadPct.toFixed(2)}%
          </span>
          <span className="text-[10px] text-[#6E6069] block mt-0.5">
            {isLow ? 'Wide band (baseline only)' : isMedium ? 'Calibrated band' : 'Institutional precision'}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-medium text-[#6E6069] block">Loan Amount Uncertainty</span>
          <span className="font-mono text-sm font-semibold text-[#221A20]">
            ±{confidence.amountMarginPct}%
          </span>
          <span className="text-[10px] text-[#6E6069] block mt-0.5">
            Buffer for unexpected underwriting cuts
          </span>
        </div>
      </div>

      {/* Unanswered Questions Impact list */}
      {confidence.unansweredImpacts.length > 0 && (
        <div className="border-t border-[#E2D9DE] pt-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#4B2440] mb-2">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Answer these to tighten your band:</span>
          </div>
          <div className="space-y-2">
            {confidence.unansweredImpacts.slice(0, 3).map((impact) => (
              <div
                key={impact.field}
                onClick={() => onFocusField && onFocusField(impact.field)}
                className="text-xs p-2 rounded bg-amber-50/60 border border-amber-200/60 text-[#221A20] flex flex-col gap-0.5 cursor-pointer hover:bg-amber-100/60 transition-colors"
              >
                <span className="font-semibold text-amber-950 flex items-center justify-between">
                  {impact.label}
                  <span className="text-[10px] text-amber-800 font-normal">Click to fill →</span>
                </span>
                <span className="text-amber-900/80 text-[11px]">{impact.impactDescription}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isHigh && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          <span>Maximum precision achieved. All outputs are calibrated to institutional credit matrices.</span>
        </div>
      )}
    </div>
  );
};
