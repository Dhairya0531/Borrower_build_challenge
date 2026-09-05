import { useState, useMemo } from 'react';
import { PERSONAS, PersonaProfile } from './data/personas';
import { BorrowerInput } from './engine/types';
import { runBorrowerCopilot } from './engine/calculator';
import { ConfidenceMeter } from './components/ConfidenceMeter';
import { AdaptiveQuestionnaire } from './components/AdaptiveQuestionnaire';
import { OutputDashboard } from './components/OutputDashboard';
import { NegotiationCardView } from './components/NegotiationCardView';
import { RulesExplorer } from './components/RulesExplorer';
import {
  CreditCard,
  Sliders,
  BookOpen,
  RotateCcw,
} from 'lucide-react';

export function App() {
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('priya');
  const [currentInput, setCurrentInput] = useState<BorrowerInput>(PERSONAS[0].input);
  const [activeTab, setActiveTab] = useState<'copilot' | 'card' | 'rules'>('copilot');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Run calculation dynamically on any change
  const calculationResult = useMemo(() => {
    return runBorrowerCopilot(currentInput);
  }, [currentInput]);

  const handleSelectPersona = (persona: PersonaProfile) => {
    setSelectedPersonaId(persona.id);
    setCurrentInput(persona.input);
    setFocusedField(null);
  };

  const handleResetPersona = () => {
    const currentPersona = PERSONAS.find((p) => p.id === selectedPersonaId) || PERSONAS[0];
    setCurrentInput({ ...currentPersona.input });
    setFocusedField(null);
  };

  const handleFocusField = (fieldName: string) => {
    setFocusedField(fieldName);
    setActiveTab('copilot');
    const el = document.getElementById(`q-${fieldName}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSelectTenure = (months: number) => {
    setCurrentInput((prev) => ({
      ...prev,
      preferredTenureMonths: months,
    }));
  };

  const handleLenderRateChange = (rate: number | undefined) => {
    setCurrentInput((prev) => ({
      ...prev,
      lenderQuotedRate: rate,
    }));
  };

  return (
    <div className="min-h-screen bg-[#FBF9FA] text-[#221A20] font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-[#E2D9DE] sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#6E6069] font-bold">
                Lokta · Build Challenge
              </span>
              <span className="text-[10px] bg-[#EFE3EA] text-[#4B2440] font-semibold px-2 py-0.5 rounded">
                v1.0 Ready
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-medium text-[#221A20] m-0">
              Borrower <em>Copilot</em>
            </h1>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-[#F3EEF1] p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setActiveTab('copilot')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'copilot'
                  ? 'bg-white text-[#4B2440] shadow-sm font-semibold'
                  : 'text-[#6E6069] hover:text-[#221A20]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Assessment & Outputs</span>
            </button>
            <button
              onClick={() => setActiveTab('card')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'card'
                  ? 'bg-white text-[#4B2440] shadow-sm font-semibold'
                  : 'text-[#6E6069] hover:text-[#221A20]'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Negotiation Card</span>
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'rules'
                  ? 'bg-white text-[#4B2440] shadow-sm font-semibold'
                  : 'text-[#6E6069] hover:text-[#221A20]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>RULES.md Explorer</span>
            </button>
          </div>
        </div>

        {/* Persona Switcher Bar */}
        <div className="bg-[#F3EEF1] border-t border-[#E2D9DE] px-4 py-2 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#6E6069] uppercase tracking-wider text-[11px]">
                Test Personas:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {PERSONAS.map((p) => {
                  const isSelected = selectedPersonaId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPersona(p)}
                      className={`px-3 py-1 rounded-lg border text-xs transition-all ${
                        isSelected
                          ? 'bg-[#4B2440] text-white border-[#4B2440] font-semibold shadow-xs'
                          : 'bg-white text-[#221A20] border-[#E2D9DE] hover:bg-[#FBF9FA]'
                      }`}
                    >
                      {p.name} ({p.location} · {p.employmentLabel.split(' ')[0]})
                    </button>
                  );
                })}
                <button
                  onClick={handleResetPersona}
                  title="Reset inputs to initial preset state"
                  className="px-2.5 py-1 rounded-lg border text-xs text-[#6E6069] bg-white border-[#E2D9DE] hover:bg-[#FBF9FA] hover:text-[#221A20] flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            <div className="text-[11px] text-[#6E6069] hidden md:block italic">
              Clicking a persona loads their exact inputs, adaptive questions, and verified outputs.
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
        {/* Persona Context Banner */}
        {activeTab === 'copilot' && (
          <div className="mb-6 bg-white border border-[#E2D9DE] rounded-xl p-4 shadow-xs">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#4B2440] font-mono font-bold block">
                  Active Persona Context
                </span>
                <h2 className="text-base font-display font-medium text-[#221A20] m-0">
                  {PERSONAS.find((p) => p.id === selectedPersonaId)?.story || 'Custom Borrower Profile'}
                </h2>
                <span className="text-xs text-[#6E6069] mt-1 block">
                  Loan Request:{' '}
                  <b>{PERSONAS.find((p) => p.id === selectedPersonaId)?.wantedLoanLabel}</b>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-[#6E6069] block">Engine Check:</span>
                <span className="text-xs font-semibold text-[#4B2440] max-w-xs block leading-tight">
                  {PERSONAS.find((p) => p.id === selectedPersonaId)?.evaluationExpectation}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: COPILOT FLOW */}
        {activeTab === 'copilot' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Adaptive Questionnaire & Confidence Meter (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <ConfidenceMeter
                confidence={calculationResult.confidence}
                onFocusField={handleFocusField}
              />
              <AdaptiveQuestionnaire
                input={currentInput}
                onChange={setCurrentInput}
                focusedField={focusedField}
              />
            </div>

            {/* Right Column: 4 Outputs Dashboard (7 cols) */}
            <div className="lg:col-span-7">
              <OutputDashboard
                calculation={calculationResult}
                input={currentInput}
                onSelectTenure={handleSelectTenure}
                onNavigateToCard={() => setActiveTab('card')}
                onLenderRateChange={handleLenderRateChange}
              />
            </div>
          </div>
        )}

        {/* TAB 2: NEGOTIATION CARD */}
        {activeTab === 'card' && (
          <NegotiationCardView
            card={calculationResult.negotiationCard}
            onBack={() => setActiveTab('copilot')}
          />
        )}

        {/* TAB 3: RULES EXPLORER */}
        {activeTab === 'rules' && <RulesExplorer />}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-[#E2D9DE] py-6 text-center text-xs text-[#6E6069] bg-white">
        <p className="m-0 max-w-xl mx-auto px-4">
          Lokta Borrower Copilot · Built for Indian retail borrowers. Decoupled rules engine · Zero login · Zero bureau pull · 100% Client-Side Privacy.
        </p>
      </footer>
    </div>
  );
}
