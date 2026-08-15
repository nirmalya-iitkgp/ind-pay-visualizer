import React, { useState } from 'react';
import { RegimeComparison, TaxRegime } from '../types';
import { formatINR, formatINRCompact } from '../utils/formatters';
import { Trophy, CheckCircle2, ChevronRight, Scale, Info, ArrowUpRight, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

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
  const [showSlabDetails, setShowSlabDetails] = useState(false);
  const { oldRegime, newRegime, recommendedRegime, taxDifferenceAnnual, monthlyTakeHomeDifference } = comparison;

  const isNewWinner = recommendedRegime === 'new';
  const isOldWinner = recommendedRegime === 'old';

  const triggerConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

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
      newVal: 'Not Allowed (₹0)',
      highlight: oldRegime.hraExemption > 0 ? 'old' : undefined,
    },
    {
      label: 'Section 80C (EPF, ELSS, PPF)',
      oldVal: formatINR(oldRegime.chapterVIA80CDeduction),
      newVal: 'Not Allowed (₹0)',
      highlight: oldRegime.chapterVIA80CDeduction > 0 ? 'old' : undefined,
    },
    {
      label: 'Section 80D & 80CCD(1B)',
      oldVal: formatINR(oldRegime.chapterVIA80DDeduction + oldRegime.chapterVIA80CCD1BDeduction),
      newVal: 'Not Allowed (₹0)',
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
      label: 'Sec 87A Tax Rebate',
      oldVal: formatINR(oldRegime.section87ARebate),
      newVal: formatINR(newRegime.section87ARebate),
    },
    {
      label: 'Total Income Tax + Cess',
      oldVal: formatINR(oldRegime.totalTaxLiabilityAnnual),
      newVal: formatINR(newRegime.totalTaxLiabilityAnnual),
      highlight: oldRegime.totalTaxLiabilityAnnual < newRegime.totalTaxLiabilityAnnual ? 'old' : 'new',
      isHeader: true,
    },
    {
      label: 'Monthly Take-Home Pay',
      oldVal: formatINR(oldRegime.monthlyInHandSalary),
      newVal: formatINR(newRegime.monthlyInHandSalary),
      highlight: oldRegime.monthlyInHandSalary > newRegime.monthlyInHandSalary ? 'old' : 'new',
      isHeader: true,
    },
  ];

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-4" id="regime-comparison-card">
      
      {/* Winner Recommendation Banner */}
      <div
        className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
          isNewWinner
            ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 text-emerald-950'
            : 'bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200 text-indigo-950'
        }`}
      >
        <div className={`p-2 rounded-lg ${isNewWinner ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'} shrink-0 mt-0.5`}>
          <Trophy className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wide">
              {isNewWinner ? 'New Regime (Sec 115BAC) Wins' : 'Old Tax Regime Wins'}
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white shadow-2xs">
              Save {formatINR(taxDifferenceAnnual)}/yr
            </span>
          </div>
          <p className="text-xs mt-1 leading-relaxed opacity-90">{comparison.summaryReason}</p>
          
          {selectedRegime !== recommendedRegime && (
            <button
              type="button"
              onClick={() => {
                onSelectRegime(recommendedRegime);
                triggerConfetti();
              }}
              className="mt-2 text-xs font-bold inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 underline"
            >
              Switch to Recommended {isNewWinner ? 'New' : 'Old'} Regime
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Regime Toggle Selector */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5 text-emerald-600" />
          Side-by-Side Regime Matrix
        </span>

        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => onSelectRegime('new')}
            className={`px-2 py-1 rounded-md transition-all ${
              selectedRegime === 'new'
                ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            New Regime
          </button>
          <button
            type="button"
            onClick={() => onSelectRegime('old')}
            className={`px-2 py-1 rounded-md transition-all ${
              selectedRegime === 'old'
                ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Old Regime
          </button>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg text-xs">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] uppercase font-bold">
              <th className="p-2.5">Component</th>
              <th className={`p-2.5 text-right ${selectedRegime === 'new' ? 'bg-emerald-50/70 text-emerald-900 font-extrabold' : ''}`}>
                New Regime (115BAC)
              </th>
              <th className={`p-2.5 text-right ${selectedRegime === 'old' ? 'bg-emerald-50/70 text-emerald-900 font-extrabold' : ''}`}>
                Old Regime
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r, i) => (
              <tr
                key={r.label}
                className={`${r.isHeader ? 'bg-slate-50/60 font-bold text-slate-900' : 'text-slate-700 hover:bg-slate-50/40'}`}
              >
                <td className="p-2.5">{r.label}</td>
                <td
                  className={`p-2.5 text-right font-mono ${
                    r.highlight === 'new'
                      ? 'text-emerald-700 font-bold bg-emerald-50/50'
                      : ''
                  }`}
                >
                  {r.newVal}
                </td>
                <td
                  className={`p-2.5 text-right font-mono ${
                    r.highlight === 'old'
                      ? 'text-emerald-700 font-bold bg-emerald-50/50'
                      : ''
                  }`}
                >
                  {r.oldVal}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Toggle Slab Tax Breakdown Details */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowSlabDetails(!showSlabDetails)}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center justify-between w-full p-2 rounded-lg bg-slate-50 border border-slate-200/80"
        >
          <span className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            {selectedRegime === 'new' ? 'New Regime FY 24-25/25-26 Slabs Breakdown' : 'Old Regime Slabs Breakdown'}
          </span>
          <span className="text-[11px] text-emerald-700 font-bold">
            {showSlabDetails ? 'Hide' : 'View Slabs'}
          </span>
        </button>

        {showSlabDetails && (
          <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5 font-mono">
            {(selectedRegime === 'new' ? newRegime.slabBreakdown : oldRegime.slabBreakdown).map((slab) => (
              <div key={slab.slabRange} className="flex items-center justify-between text-slate-700">
                <span>{slab.slabRange} ({slab.rate}%):</span>
                <span className="font-semibold text-slate-900">{formatINR(slab.taxAmount)}</span>
              </div>
            ))}
            <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between font-bold text-slate-900">
              <span>Slab Tax Total:</span>
              <span>{formatINR(selectedRegime === 'new' ? newRegime.slabTax : oldRegime.slabTax)}</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
