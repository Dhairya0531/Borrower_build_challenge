import React, { useState, useEffect } from 'react';
import { BorrowerInput } from '../engine/types';
import { QUESTION_SCHEMA } from '../engine/questions';

interface AdaptiveQuestionnaireProps {
  input: BorrowerInput;
  onChange: (updated: BorrowerInput) => void;
  focusedField?: string | null;
}

export const AdaptiveQuestionnaire: React.FC<AdaptiveQuestionnaireProps> = ({
  input,
  onChange,
  focusedField,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'must' | 'additional'>('all');

  useEffect(() => {
    if (focusedField) {
      setActiveTab('all');
    }
  }, [focusedField]);

  const handleInputChange = (key: keyof BorrowerInput, value: any) => {
    onChange({
      ...input,
      [key]: value,
    });
  };

  // Filter questions based on applicability
  const applicableQuestions = QUESTION_SCHEMA.filter((q) => {
    if (q.appliesIf && !q.appliesIf(input)) {
      return false;
    }
    if (activeTab === 'must' && q.tier !== 'must') return false;
    if (activeTab === 'additional' && q.tier !== 'additional') return false;
    return true;
  });

  const mustCount = QUESTION_SCHEMA.filter((q) => q.tier === 'must').length;
  const additionalCount = QUESTION_SCHEMA.filter(
    (q) => q.tier === 'additional' && (!q.appliesIf || q.appliesIf(input))
  ).length;

  return (
    <div className="bg-white border border-[#E2D9DE] rounded-xl p-5 shadow-sm">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-[#E2D9DE] mb-5">
        <div>
          <h2 className="text-lg font-display font-medium text-[#221A20] m-0">
            Adaptive Question Tree
          </h2>
          <p className="text-xs text-[#6E6069] mt-0.5">
            Rule 1: Skip what does not apply. Every question moves a number.
          </p>
        </div>

        <div className="flex items-center bg-[#F3EEF1] p-1 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'all'
                ? 'bg-white text-[#4B2440] shadow-sm font-semibold'
                : 'text-[#6E6069] hover:text-[#221A20]'
            }`}
          >
            All Questions ({mustCount + additionalCount})
          </button>
          <button
            onClick={() => setActiveTab('must')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'must'
                ? 'bg-white text-[#4B2440] shadow-sm font-semibold'
                : 'text-[#6E6069] hover:text-[#221A20]'
            }`}
          >
            Must Questions ({mustCount})
          </button>
          <button
            onClick={() => setActiveTab('additional')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'additional'
                ? 'bg-white text-[#4B2440] shadow-sm font-semibold'
                : 'text-[#6E6069] hover:text-[#221A20]'
            }`}
          >
            Precision Questions ({additionalCount})
          </button>
        </div>
      </div>

      {/* Questions list */}
      <div className="space-y-6">
        {applicableQuestions.map((q) => {
          const isFocused = focusedField === q.id;
          const isMust = q.tier === 'must';

          return (
            <div
              key={q.id as string}
              id={`q-${q.id as string}`}
              className={`p-4 rounded-xl border transition-all ${
                isFocused
                  ? 'border-[#4B2440] ring-2 ring-[#4B2440]/20 bg-[#FBF9FA]'
                  : isMust
                  ? 'border-[#E2D9DE] bg-white'
                  : 'border-amber-200 bg-amber-50/20'
              }`}
            >
              {/* Question Meta Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                        isMust
                          ? 'bg-[#4B2440] text-white'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {isMust ? 'TIER 1 · MUST' : 'TIER 2 · PRECISION'}
                    </span>
                    <span className="text-[11px] font-medium text-[#6E6069] bg-[#F3EEF1] px-2 py-0.5 rounded">
                      Moves {q.outputImpact}
                    </span>
                  </div>
                  <label className="block text-sm font-semibold text-[#221A20] cursor-pointer">
                    {q.title}
                  </label>
                  {q.subtitle && (
                    <p className="text-xs text-[#6E6069] mt-0.5 leading-relaxed">
                      {q.subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Input Renderers */}
              <div className="mt-3">
                {q.inputType === 'currency' && (
                  <div className="relative max-w-sm">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-mono text-[#6E6069] pointer-events-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      step={q.id === 'amountWanted' ? 25000 : 1000}
                      value={(input as any)[q.id] ?? ''}
                      onChange={(e) =>
                        handleInputChange(q.id as keyof BorrowerInput, parseFloat(e.target.value) || 0)
                      }
                      className="w-full pl-8 pr-3 py-2 text-sm font-mono bg-white border border-[#E2D9DE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4B2440] focus:border-[#4B2440]"
                    />
                    <span className="text-[11px] text-[#6E6069] mt-1 block">
                      = ₹{((input as any)[q.id] || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}

                {q.inputType === 'text' && (
                  <div className="max-w-sm">
                    <input
                      type="text"
                      placeholder={q.placeholder || ''}
                      value={(input as any)[q.id] ?? ''}
                      onChange={(e) =>
                        handleInputChange(q.id as keyof BorrowerInput, e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm bg-white border border-[#E2D9DE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4B2440] focus:border-[#4B2440]"
                    />
                  </div>
                )}

                {q.inputType === 'number' && (
                  <div className="max-w-xs">
                    <input
                      type="number"
                      value={(input as any)[q.id] ?? ''}
                      onChange={(e) =>
                        handleInputChange(q.id as keyof BorrowerInput, parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 text-sm font-mono bg-white border border-[#E2D9DE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4B2440] focus:border-[#4B2440]"
                    />
                  </div>
                )}

                {q.inputType === 'select' && (
                  <select
                    value={(input as any)[q.id] ?? q.defaultValue}
                    onChange={(e) => handleInputChange(q.id as keyof BorrowerInput, e.target.value)}
                    className="w-full max-w-md px-3 py-2 text-sm bg-white border border-[#E2D9DE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4B2440] focus:border-[#4B2440]"
                  >
                    {q.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                {q.inputType === 'radio' && (
                  <div className="space-y-2 mt-1">
                    {q.options?.map((opt) => {
                      const isSelected = (input as any)[q.id] === opt.value;
                      return (
                        <label
                          key={opt.value}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-[#4B2440] bg-[#EFE3EA]/30'
                              : 'border-[#E2D9DE] hover:bg-[#FBF9FA]'
                          }`}
                        >
                          <input
                            type="radio"
                            name={q.id as string}
                            value={opt.value}
                            checked={isSelected}
                            onChange={() => handleInputChange(q.id as keyof BorrowerInput, opt.value)}
                            className="mt-1 text-[#4B2440] focus:ring-[#4B2440]"
                          />
                          <div className="text-xs">
                            <span className="font-semibold text-[#221A20] block">
                              {opt.label}
                            </span>
                            {opt.subtext && (
                              <span className="text-[#6E6069] mt-0.5 block">{opt.subtext}</span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}

                {q.inputType === 'boolean' && (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleInputChange(q.id as keyof BorrowerInput, true)}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        (input as any)[q.id] === true
                          ? 'bg-[#4B2440] text-white border-[#4B2440]'
                          : 'bg-white text-[#221A20] border-[#E2D9DE] hover:bg-[#F3EEF1]'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange(q.id as keyof BorrowerInput, false)}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        (input as any)[q.id] === false || (input as any)[q.id] === undefined
                          ? 'bg-[#4B2440] text-white border-[#4B2440]'
                          : 'bg-white text-[#221A20] border-[#E2D9DE] hover:bg-[#F3EEF1]'
                      }`}
                    >
                      No
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
