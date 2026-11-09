import React, { useState } from 'react';
import { RegimeComparison, TaxRegime } from '../types';
import { formatINR } from '../utils/formatters';
import { Check, Scale, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  comparison: RegimeComparison;
  selectedRegime: TaxRegime;
  onSelectRegime: (regime: TaxRegime) => void;
}

export const RegimeComparisonCard: React.FC<Props> = ({
  comparison,
  selectedRegime,
  onSelectRegime,
}) => {
  const [showSlabs, setShowSlabs] = useState(false);
  const { oldRegime, newRegime, recommendedRegime, taxDifferenceAnnual, monthlyTakeHomeDifference } = comparison;

  const isNewWinner = recommendedRegime === 'new';

  const rows = [
    {
      label: 'Standard Deduction',
      oldVal: formatINR(oldRegime.standardDeduction),
      newVal: formatINR(newRegime.standardDeduction),
      highlight: newRegime.standardDeduction > oldRegime.standardDeduction ? 'new' : undefined,
    },
    {
      label: 'HRA Exemption (Sec 10(13A))',
      oldVal: formatINR(oldRegime.hraExemption),
      newVal: '₹0 (Not allowed)',
      highlight: oldRegime.hraExemption > 0 ? 'old' : undefined,
    },
    {
      label: 'Meal Coupons & LTC Exemption',
      oldVal: formatINR(oldRegime.mealCouponExemption + oldRegime.ltaExemption),
      newVal: '₹0 (Not allowed)',
      highlight: (oldRegime.mealCouponExemption + oldRegime.ltaExemption) > 0 ? 'old' : undefined,
    },
    {
      label: 'Section 80C & Employee NPS (80CCD(1))',
      oldVal: formatINR(oldRegime.chapterVIA80CDeduction),
      newVal: '₹0 (Not allowed)',
      highlight: oldRegime.chapterVIA80CDeduction > 0 ? 'old' : undefined,
    },
    {
      label: 'Section 80D & 80CCD(1B) Self NPS',
      oldVal: formatINR(oldRegime.chapterVIA80DDeduction + oldRegime.chapterVIA80CCD1BDeduction),
      newVal: '₹0 (Not allowed)',
      highlight: (oldRegime.chapterVIA80DDeduction + oldRegime.chapterVIA80CCD1BDeduction) > 0 ? 'old' : undefined,
    },
    {
      label: 'Employer NPS (Sec 80CCD(2))',
      oldVal: formatINR(oldRegime.employerNPSDeduction80CCD2),
      newVal: formatINR(newRegime.employerNPSDeduction80CCD2),
    },
    {
      label: 'Total Deductions & Exemptions',
      oldVal: formatINR(oldRegime.totalDeductionsAndExemptions),
      newVal: formatINR(newRegime.totalDeductionsAndExemptions),
      isHeader: true,
    },
    {
      label: 'Net Taxable Income',
      oldVal: formatINR(oldRegime.netTaxableIncome),
      newVal: formatINR(newRegime.netTaxableIncome),
      isHeader: true,
    },
    {
      label: 'Section 87A Rebate',
      oldVal: formatINR(oldRegime.section87ARebate),
      newVal: formatINR(newRegime.section87ARebate),
    },
    {
      label: 'Surcharge Amount',
      oldVal: formatINR(oldRegime.surchargeAmount),
      newVal: formatINR(newRegime.surchargeAmount),
      subtext: oldRegime.surchargeRatePercent > 0 || newRegime.surchargeRatePercent > 0 ? 'Applies above ₹50L' : undefined,
    },
    {
      label: 'Marginal Relief (Section 115BAC)',
      oldVal: oldRegime.marginalRelief > 0 ? `- ${formatINR(oldRegime.marginalRelief)}` : '₹0',
      newVal: newRegime.marginalRelief > 0 ? `- ${formatINR(newRegime.marginalRelief)}` : '₹0',
      highlight: newRegime.marginalRelief > 0 ? 'new' : undefined,
    },
    {
      label: 'Total Income Tax + 4% Cess',
      oldVal: formatINR(oldRegime.totalTaxLiabilityAnnual),
      newVal: formatINR(newRegime.totalTaxLiabilityAnnual),
      highlight: oldRegime.totalTaxLiabilityAnnual < newRegime.totalTaxLiabilityAnnual ? 'old' : 'new',
      isHeader: true,
    },
    {
      label: 'Monthly Net Take-Home Pay',
      oldVal: formatINR(oldRegime.monthlyInHandSalary),
      newVal: formatINR(newRegime.monthlyInHandSalary),
      highlight: oldRegime.monthlyInHandSalary > newRegime.monthlyInHandSalary ? 'old' : 'new',
      isHeader: true,
    },
  ];

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3.5" id="regime-comparison-card">
      {/* Recommendation Summary */}
      <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-slate-900">
            {isNewWinner ? 'New Tax Regime (Section 115BAC) is more beneficial' : 'Old Tax Regime is more beneficial'}
          </div>
          <div className="text-[11px] text-slate-600 mt-0.5">
            Saves {formatINR(Math.abs(taxDifferenceAnnual))}/year (+{formatINR(Math.abs(monthlyTakeHomeDifference))}/month in hand).
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSelectRegime(recommendedRegime)}
          className="px-2.5 py-1.5 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 transition-colors shrink-0"
        >
          {selectedRegime === recommendedRegime ? 'Active' : 'Apply Winner'}
        </button>
      </div>

      {/* Regime Selector Tabs */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <button
          type="button"
          onClick={() => onSelectRegime('new')}
          className={`p-2 rounded-lg border text-left transition-colors ${
            selectedRegime === 'new'
              ? 'border-emerald-600 bg-emerald-50/60 font-bold text-emerald-950'
              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span>New Regime (115BAC)</span>
            {selectedRegime === 'new' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
          </div>
          <div className="text-[11px] font-mono text-slate-600 mt-1">
            {formatINR(newRegime.monthlyInHandSalary)}/mo
          </div>
        </button>

        <button
          type="button"
          onClick={() => onSelectRegime('old')}
          className={`p-2 rounded-lg border text-left transition-colors ${
            selectedRegime === 'old'
              ? 'border-indigo-600 bg-indigo-50/60 font-bold text-indigo-950'
              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span>Old Tax Regime</span>
            {selectedRegime === 'old' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
          </div>
          <div className="text-[11px] font-mono text-slate-600 mt-1">
            {formatINR(oldRegime.monthlyInHandSalary)}/mo
          </div>
        </button>
      </div>

      {/* Comparison Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
        <div className="grid grid-cols-3 bg-slate-100 p-2 font-semibold text-slate-700 border-b border-slate-200 text-[11px]">
          <span>Tax Component</span>
          <span className="text-right">Old Regime</span>
          <span className="text-right">New Regime</span>
        </div>

        <div className="divide-y divide-slate-100">
          {rows.map((row) => (
            <div
              key={row.label}
              className={`grid grid-cols-3 p-2 items-center text-[11px] ${
                row.isHeader ? 'bg-slate-50/80 font-bold text-slate-900' : 'text-slate-600'
              }`}
            >
              <div>
                <span>{row.label}</span>
                {row.subtext && <span className="block text-[9px] text-slate-400">{row.subtext}</span>}
              </div>
              <div
                className={`text-right font-mono ${
                  row.highlight === 'old' ? 'text-emerald-700 font-bold' : ''
                }`}
              >
                {row.oldVal}
              </div>
              <div
                className={`text-right font-mono ${
                  row.highlight === 'new' ? 'text-emerald-700 font-bold' : ''
                }`}
              >
                {row.newVal}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Slab Details Accordion */}
      <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
        <button
          type="button"
          onClick={() => setShowSlabs(!showSlabs)}
          className="w-full p-2.5 bg-slate-50 font-semibold text-slate-700 flex items-center justify-between hover:bg-slate-100"
        >
          <span>Tax Slabs Breakdown ({selectedRegime === 'new' ? 'New Regime' : 'Old Regime'})</span>
          {showSlabs ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
        </button>

        {showSlabs && (
          <div className="p-2 space-y-1 bg-white border-t border-slate-100">
            {(selectedRegime === 'new' ? newRegime.slabBreakdown : oldRegime.slabBreakdown).map((s) => (
              <div key={s.slabRange} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-50 font-mono">
                <span className="text-slate-600">
                  {s.slabRange} ({s.rate}%)
                </span>
                <span className="text-slate-900 font-semibold">{formatINR(s.taxAmount)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-slate-900 text-xs pt-1.5 font-mono">
              <span>Total Tax + Cess</span>
              <span>{formatINR(selectedRegime === 'new' ? newRegime.totalTaxLiabilityAnnual : oldRegime.totalTaxLiabilityAnnual)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
