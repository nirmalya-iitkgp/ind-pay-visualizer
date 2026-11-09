import React from 'react';
import { CompensationInputs, RegimeComparison, TaxRegime } from '../../types';
import { formatINR, formatINRCompact } from '../../utils/formatters';
import { Scale, CheckCircle2, Trophy, HelpCircle } from 'lucide-react';

interface Props {
  comparison: RegimeComparison;
  inputs: CompensationInputs;
  onChangeInputs: (inputs: CompensationInputs) => void;
  onSelectRegime: (regime: TaxRegime) => void;
}

export const TaxRegimeTab: React.FC<Props> = ({
  comparison,
  inputs,
  onChangeInputs,
  onSelectRegime,
}) => {
  const { oldRegime, newRegime, recommendedRegime, taxDifferenceAnnual, monthlyTakeHomeDifference } = comparison;
  const isNewWinner = recommendedRegime === 'new';

  // Generate comparison curve line data from ₹5L to ₹50L
  const curvePoints = [500000, 750000, 1000000, 1500000, 2000000, 3000000, 4000000, 5000000];
  const chartWidth = 560;
  const chartHeight = 150;
  const pad = { top: 15, right: 30, bottom: 25, left: 45 };
  const innerW = chartWidth - pad.left - pad.right;
  const innerH = chartHeight - pad.top - pad.bottom;

  // Max tax in range for scaling
  const maxTax = Math.max(oldRegime.totalTaxLiabilityAnnual, newRegime.totalTaxLiabilityAnnual, 1000000);
  const getX = (val: number) => pad.left + ((val - 500000) / (5000000 - 500000)) * innerW;
  const getY = (tax: number) => pad.top + innerH - (tax / (maxTax || 1)) * innerH;

  return (
    <div className="space-y-4 max-w-4xl mx-auto" id="tax-regime-tab">
      {/* Winner Recommendation Banner */}
      <div
        className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          isNewWinner
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : 'bg-indigo-50 border-indigo-200 text-indigo-950'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl ${
              isNewWinner ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
            } shrink-0 mt-0.5`}
          >
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-extrabold">
              {isNewWinner ? 'New Tax Regime (Section 115BAC) Wins' : 'Old Tax Regime Wins'}
            </div>
            <p className="text-xs text-slate-700 mt-1 leading-relaxed">
              {isNewWinner
                ? `You save ₹${Math.round(Math.abs(taxDifferenceAnnual)).toLocaleString(
                    'en-IN'
                  )} in tax per year under the New Regime due to lower slab rates and the ₹75,000 standard deduction.`
                : `You save ₹${Math.round(Math.abs(taxDifferenceAnnual)).toLocaleString(
                    'en-IN'
                  )} in tax per year under the Old Regime because of your high itemized rent and 80C deductions.`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSelectRegime(recommendedRegime)}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors shrink-0"
        >
          {inputs.selectedRegime === recommendedRegime ? 'Active Regime' : `Switch to ${isNewWinner ? 'New' : 'Old'} Regime`}
        </button>
      </div>

      {/* Side-by-Side Tax Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* New Regime Card */}
        <div
          onClick={() => onSelectRegime('new')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            inputs.selectedRegime === 'new'
              ? 'border-emerald-600 bg-white ring-2 ring-emerald-100 shadow-xs'
              : 'border-slate-200 bg-slate-50 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">New Regime (Default)</span>
            {inputs.selectedRegime === 'new' && (
              <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded font-bold">
                Selected
              </span>
            )}
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-slate-900">
            {formatINR(newRegime.totalTaxLiabilityAnnual)}
            <span className="text-xs font-normal text-slate-500 ml-1">/yr tax</span>
          </div>
          <div className="text-xs text-slate-600 mt-1">
            Monthly In-Hand: <strong className="font-mono text-slate-900">{formatINR(newRegime.monthlyInHandSalary)}</strong>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            Zero proof submission required. Slabs start from 5% up to 30% with automatic ₹75k standard deduction.
          </p>
        </div>

        {/* Old Regime Card */}
        <div
          onClick={() => onSelectRegime('old')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            inputs.selectedRegime === 'old'
              ? 'border-indigo-600 bg-white ring-2 ring-indigo-100 shadow-xs'
              : 'border-slate-200 bg-slate-50 hover:bg-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">Old Tax Regime</span>
            {inputs.selectedRegime === 'old' && (
              <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded font-bold">
                Selected
              </span>
            )}
          </div>
          <div className="mt-2 text-2xl font-extrabold font-mono text-slate-900">
            {formatINR(oldRegime.totalTaxLiabilityAnnual)}
            <span className="text-xs font-normal text-slate-500 ml-1">/yr tax</span>
          </div>
          <div className="text-xs text-slate-600 mt-1">
            Monthly In-Hand: <strong className="font-mono text-slate-900">{formatINR(oldRegime.monthlyInHandSalary)}</strong>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
            Requires submitting rent receipts (HRA), 80C investment proofs, health insurance, and home loan certificates.
          </p>
        </div>
      </div>

      {/* Line Graphic: Side-by-Side Tax Payable Curves */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              Tax Payable Comparison Line
            </h3>
            <p className="text-[11px] text-slate-500">
              Green = New Regime tax • Indigo = Old Regime tax with your current deductions
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-emerald-700">● New: {formatINR(newRegime.totalTaxLiabilityAnnual)}</span>
            <span className="text-indigo-700">● Old: {formatINR(oldRegime.totalTaxLiabilityAnnual)}</span>
          </div>
        </div>

        <div className="w-full overflow-hidden">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto select-none">
            {/* Grid line */}
            <line
              x1={pad.left}
              y1={pad.top + innerH}
              x2={pad.left + innerW}
              y2={pad.top + innerH}
              stroke="#E2E8F0"
            />

            {/* Horizontal 50% line */}
            <line
              x1={pad.left}
              y1={pad.top + innerH / 2}
              x2={pad.left + innerW}
              y2={pad.top + innerH / 2}
              stroke="#F1F5F9"
              strokeDasharray="2 2"
            />

            {/* Current user point marker */}
            <circle
              cx={pad.left + innerW * 0.45}
              cy={getY(newRegime.totalTaxLiabilityAnnual)}
              r="4.5"
              fill="#10B981"
              stroke="#FFFFFF"
              strokeWidth="2"
            />
            <circle
              cx={pad.left + innerW * 0.45}
              cy={getY(oldRegime.totalTaxLiabilityAnnual)}
              r="4.5"
              fill="#6366F1"
              stroke="#FFFFFF"
              strokeWidth="2"
            />

            {/* Connecting comparison line */}
            <line
              x1={pad.left + innerW * 0.45}
              y1={getY(newRegime.totalTaxLiabilityAnnual)}
              x2={pad.left + innerW * 0.45}
              y2={getY(oldRegime.totalTaxLiabilityAnnual)}
              stroke="#94A3B8"
              strokeDasharray="2 2"
            />

            <text
              x={pad.left + innerW * 0.45}
              y={pad.top + innerH + 16}
              textAnchor="middle"
              className="text-[9px] font-mono fill-slate-500 font-bold"
            >
              Your CTC: {formatINRCompact(inputs.ctcAnnual)}
            </text>
          </svg>
        </div>
      </div>

      {/* Layman Deduction Adjuster: "What deductions do you have?" */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900">
          Adjust Your Old Regime Deductions
        </h3>
        <p className="text-[11px] text-slate-500">
          Enter what you actually spend on rent and investments to see if the Old Regime beats the New Regime.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
              Monthly House Rent Paid (₹)
            </label>
            <input
              type="number"
              min="0"
              step="2000"
              value={inputs.monthlyRentPaid}
              onChange={(e) =>
                onChangeInputs({
                  ...inputs,
                  monthlyRentPaid: Math.max(0, parseFloat(e.target.value) || 0),
                })
              }
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Generates HRA Exemption: {formatINR(oldRegime.hraExemption)}/yr
            </span>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
              Section 80C (PPF, ELSS, EPF) (₹)
            </label>
            <input
              type="number"
              min="0"
              max="150000"
              step="10000"
              value={inputs.deduction80C}
              onChange={(e) =>
                onChangeInputs({
                  ...inputs,
                  deduction80C: Math.max(0, Math.min(150000, parseFloat(e.target.value) || 0)),
                })
              }
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Max cap ₹1,50,000/year</span>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
              Health Insurance (80D) (₹)
            </label>
            <input
              type="number"
              min="0"
              max="100000"
              step="5000"
              value={inputs.deduction80D}
              onChange={(e) =>
                onChangeInputs({
                  ...inputs,
                  deduction80D: Math.max(0, parseFloat(e.target.value) || 0),
                })
              }
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Up to ₹25k self + ₹50k parents</span>
          </div>
        </div>
      </div>
    </div>
  );
};
