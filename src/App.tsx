import React, { useState } from 'react';
import {
  CompanyPolicy,
  CompensationInputs,
  AppMode,
  PresetTemplate,
  TaxRegime,
} from './types';
import {
  DEFAULT_COMPANY_POLICY,
  DEFAULT_COMPENSATION_INPUTS,
  PRESET_TEMPLATES,
} from './utils/constants';
import {
  computeCompensationBreakdown,
  computeOldTax,
  computeNewTax,
  compareRegimes,
  computeEmployerShield,
  computeComplianceAlerts,
} from './utils/taxCalculations';
import { Navbar } from './components/Navbar';
import { SmartAlertsBanner } from './components/SmartAlertsBanner';
import { CompensationInputsPanel } from './components/CompensationInputs';
import { VisualBreakdown } from './components/VisualBreakdown';
import { RegimeComparisonCard } from './components/RegimeComparisonCard';
import { EmployerCostCard } from './components/EmployerCostCard';
import { PolicyConfigModal } from './components/PolicyConfigModal';
import { RSUCalculatorModal } from './components/RSUCalculatorModal';
import { SalarySlipModal } from './components/SalarySlipModal';

export default function App() {
  const [policy, setPolicy] = useState<CompanyPolicy>(DEFAULT_COMPANY_POLICY);
  const [inputs, setInputs] = useState<CompensationInputs>(DEFAULT_COMPENSATION_INPUTS);
  const [mode, setMode] = useState<AppMode>('employee');

  // Modals
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isRSUModalOpen, setIsRSUModalOpen] = useState(false);
  const [isPaySlipModalOpen, setIsPaySlipModalOpen] = useState(false);

  // Core Math Calculations
  const breakdown = computeCompensationBreakdown(inputs, policy);
  const oldTaxResult = computeOldTax(breakdown, inputs);
  const newTaxResult = computeNewTax(breakdown, inputs);
  const comparison = compareRegimes(oldTaxResult, newTaxResult);
  const taxShield = computeEmployerShield(breakdown, policy);
  const alerts = computeComplianceAlerts(breakdown, inputs, policy);

  const activeTaxResult = inputs.selectedRegime === 'new' ? newTaxResult : oldTaxResult;

  // Handler for loading preset template
  const handleSelectPreset = (preset: PresetTemplate) => {
    setInputs((prev) => ({
      ...prev,
      ctcAnnual: preset.ctc,
      basicPercentOfCTC: preset.basicPercent,
      hraPercentOfBasic: preset.hraPercent,
      variablePayAnnual: (preset.ctc * preset.variablePercent) / 100,
      rsuVestedValueAnnual: (preset.ctc * preset.rsuVestedPercent) / 100,
      rsuUnvestedGrantAnnual: (preset.ctc * preset.rsuUnvestedPercent) / 100,
      ltaAnnual: preset.lta,
      otherFlexiAnnual: preset.flexi,
    }));
  };

  const handleReset = () => {
    setPolicy(DEFAULT_COMPANY_POLICY);
    setInputs(DEFAULT_COMPENSATION_INPUTS);
  };

  const handleSelectRegime = (regime: TaxRegime) => {
    setInputs((prev) => ({ ...prev, selectedRegime: regime }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans" id="app-root-container">
      
      {/* Top Navbar */}
      <Navbar
        mode={mode}
        onModeChange={setMode}
        onSelectPreset={handleSelectPreset}
        onOpenPolicyModal={() => setIsPolicyModalOpen(true)}
        onOpenRSUModal={() => setIsRSUModalOpen(true)}
        onOpenPaySlipModal={() => setIsPaySlipModalOpen(true)}
        onReset={handleReset}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        
        {/* Compliance Alerts & Warnings Banner */}
        <SmartAlertsBanner alerts={alerts} />

        {/* 3-Column Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Column 1: Inputs & Policy Controls (4 cols on large screens) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                1. CTC & Component Modeler
              </h2>
              <button
                type="button"
                onClick={() => setIsPolicyModalOpen(true)}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 underline"
              >
                Edit Policy Rules
              </button>
            </div>
            <CompensationInputsPanel
              inputs={inputs}
              onChange={setInputs}
              unallocatedSpillover={breakdown.unallocatedSpillover}
              isOverAllocated={breakdown.isOverAllocated}
            />
          </div>

          {/* Column 2: Visual Breakdown & Waterfall (4 cols on large screens) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                2. Visual Analytics & Flow
              </h2>
            </div>
            <VisualBreakdown
              breakdown={breakdown}
              activeTaxResult={activeTaxResult}
              regime={inputs.selectedRegime}
            />
          </div>

          {/* Column 3: Insights & Dual-Perspective Engine (4 cols on large screens) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                3. {mode === 'employee' ? 'Tax Regime Comparison' : 'Employer Outlay & Shield'}
              </h2>
              <span className="text-[11px] font-mono text-slate-500">
                {mode === 'employee' ? 'Employee View' : 'HR/Corporate View'}
              </span>
            </div>

            {mode === 'employee' ? (
              <RegimeComparisonCard
                comparison={comparison}
                selectedRegime={inputs.selectedRegime}
                onSelectRegime={handleSelectRegime}
              />
            ) : (
              <EmployerCostCard
                taxShield={taxShield}
                breakdown={breakdown}
                activeTaxResult={activeTaxResult}
              />
            )}

            {/* Quick Switch Perspective Footer in Col 3 */}
            <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">
                {mode === 'employee' ? 'Switch to Employer HR Perspective' : 'Switch to Employee Net Pay Perspective'}
              </span>
              <button
                type="button"
                onClick={() => setMode(mode === 'employee' ? 'employer' : 'employee')}
                className="px-2.5 py-1 bg-slate-900 text-white rounded-md font-semibold text-xs hover:bg-slate-800 transition-colors"
              >
                Toggle View
              </button>
            </div>
          </div>

        </div>

      </main>

      {/* Modals */}
      <PolicyConfigModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        policy={policy}
        onUpdatePolicy={setPolicy}
      />

      <RSUCalculatorModal
        isOpen={isRSUModalOpen}
        onClose={() => setIsRSUModalOpen(false)}
        marginalTaxRate={activeTaxResult.effectiveTaxRatePercent > 20 ? 30 : 20}
      />

      <SalarySlipModal
        isOpen={isPaySlipModalOpen}
        onClose={() => setIsPaySlipModalOpen(false)}
        breakdown={breakdown}
        taxResult={activeTaxResult}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-slate-500 text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>Indian Compensation & Tax Visualizer</strong> • Verified against Income Tax Act, 1961 (FY 2024-25 / 2025-26)
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span>Sec 115BAC (New Regime)</span>
            <span>•</span>
            <span>Sec 10(13A) HRA</span>
            <span>•</span>
            <span>Sec 17(2)(vii) Retirals</span>
            <span>•</span>
            <span>EPF Act 1952</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
