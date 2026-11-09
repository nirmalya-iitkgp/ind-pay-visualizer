import React, { useState } from 'react';
import {
  CompanyPolicy,
  CompensationInputs,
  PresetTemplate,
  TaxRegime,
} from './types';
import {
  DEFAULT_COMPANY_POLICY,
  DEFAULT_COMPENSATION_INPUTS,
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
import { TakeHomeTab } from './components/tabs/TakeHomeTab';
import { TaxRegimeTab } from './components/tabs/TaxRegimeTab';
import { SalaryBreakdownTab } from './components/tabs/SalaryBreakdownTab';
import { TaxTrajectoryTab } from './components/tabs/TaxTrajectoryTab';
import { EquityTaxTab } from './components/tabs/EquityTaxTab';
import { EmployerOutlayTab } from './components/tabs/EmployerOutlayTab';
import { PolicyConfigModal } from './components/PolicyConfigModal';
import { SalarySlipModal } from './components/SalarySlipModal';
import { Wallet, Scale, PieChart, TrendingUp, Sparkles, Building2 } from 'lucide-react';

export type MainTabId = 'takehome' | 'regime' | 'breakdown' | 'growth' | 'equity' | 'employer';

interface TabDefinition {
  id: MainTabId;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabDefinition[] = [
  { id: 'takehome', label: 'Take-Home Pay', shortLabel: 'Take-Home', icon: Wallet },
  { id: 'regime', label: 'New vs Old Tax', shortLabel: 'Regimes', icon: Scale },
  { id: 'breakdown', label: 'Where CTC Goes', shortLabel: 'Breakdown', icon: PieChart },
  { id: 'growth', label: 'Growth & Surcharges', shortLabel: 'Growth & Tax', icon: TrendingUp },
  { id: 'equity', label: 'RSU & Startup ESOPs', shortLabel: 'Stock & ESOP', icon: Sparkles },
  { id: 'employer', label: 'Employer True Cost', shortLabel: 'Company Cost', icon: Building2 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTabId>('takehome');
  const [policy, setPolicy] = useState<CompanyPolicy>(DEFAULT_COMPANY_POLICY);
  const [inputs, setInputs] = useState<CompensationInputs>(DEFAULT_COMPENSATION_INPUTS);

  // Modals
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isPaySlipModalOpen, setIsPaySlipModalOpen] = useState(false);

  // Calculations
  const breakdown = computeCompensationBreakdown(inputs, policy);
  const oldTaxResult = computeOldTax(breakdown, inputs);
  const newTaxResult = computeNewTax(breakdown, inputs);
  const comparison = compareRegimes(oldTaxResult, newTaxResult);
  const taxShield = computeEmployerShield(breakdown, policy);
  const alerts = computeComplianceAlerts(breakdown, inputs, policy);

  const activeTaxResult = inputs.selectedRegime === 'new' ? newTaxResult : oldTaxResult;

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
        onSelectPreset={handleSelectPreset}
        onOpenPolicyModal={() => setIsPolicyModalOpen(true)}
        onOpenPaySlipModal={() => setIsPaySlipModalOpen(true)}
        onReset={handleReset}
      />

      {/* Prominent Tab Navigation Bar */}
      <div className="bg-white border-b border-slate-200 shadow-2xs sticky top-14 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-5">
        {/* Critical Alerts (Only for genuine blocking errors) */}
        <SmartAlertsBanner alerts={alerts} />

        {/* Tab 1: Monthly Bank In-Hand */}
        {activeTab === 'takehome' && (
          <TakeHomeTab
            inputs={inputs}
            breakdown={breakdown}
            taxResult={activeTaxResult}
            onChangeInputs={setInputs}
            onOpenPaySlip={() => setIsPaySlipModalOpen(true)}
          />
        )}

        {/* Tab 2: New vs Old Tax Regime Comparison */}
        {activeTab === 'regime' && (
          <TaxRegimeTab
            comparison={comparison}
            inputs={inputs}
            onChangeInputs={setInputs}
            onSelectRegime={handleSelectRegime}
          />
        )}

        {/* Tab 3: CTC Anatomy & Where it Goes */}
        {activeTab === 'breakdown' && (
          <SalaryBreakdownTab
            inputs={inputs}
            breakdown={breakdown}
            taxResult={activeTaxResult}
            onChangeInputs={setInputs}
          />
        )}

        {/* Tab 4: Salary Growth, Surcharges & Marginal Relief Curves */}
        {activeTab === 'growth' && (
          <TaxTrajectoryTab
            inputs={inputs}
            policy={policy}
            onChangeInputs={setInputs}
          />
        )}

        {/* Tab 5: RSU & Startup ESOP Stock Taxation */}
        {activeTab === 'equity' && (
          <EquityTaxTab
            marginalTaxRate={activeTaxResult.effectiveTaxRatePercent > 20 ? 30 : 20}
          />
        )}

        {/* Tab 6: Employer True Cost & Tax Shield */}
        {activeTab === 'employer' && (
          <EmployerOutlayTab
            taxShield={taxShield}
            breakdown={breakdown}
            policy={policy}
            onUpdatePolicy={setPolicy}
          />
        )}
      </main>

      {/* Modals */}
      <PolicyConfigModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        policy={policy}
        onUpdatePolicy={setPolicy}
      />

      <SalarySlipModal
        isOpen={isPaySlipModalOpen}
        onClose={() => setIsPaySlipModalOpen(false)}
        breakdown={breakdown}
        taxResult={activeTaxResult}
      />

      {/* Clean Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-slate-500 text-xs mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px]">
          <div>
            Indian Compensation & Tax Engine • FY 2024-25 / 2025-26
          </div>
          <div className="font-mono text-slate-400">
            Section 115BAC • Rule 2A HRA • Section 80-IAC • Article 276(2)
          </div>
        </div>
      </footer>
    </div>
  );
}
