import React from 'react';
import { CompensationInputs, CompensationBreakdown, TaxCalculationResult } from '../../types';
import { formatINR, formatINRCompact } from '../../utils/formatters';
import { Layers, ShieldCheck, PieChart } from 'lucide-react';

interface Props {
  inputs: CompensationInputs;
  breakdown: CompensationBreakdown;
  taxResult: TaxCalculationResult;
  onChangeInputs: (inputs: CompensationInputs) => void;
}

export const SalaryBreakdownTab: React.FC<Props> = ({
  inputs,
  breakdown,
  taxResult,
  onChangeInputs,
}) => {
  const ctc = breakdown.ctcAnnual;
  const cashTakeHome = taxResult.annualInHandSalary;
  const retiralSavings =
    breakdown.employerPFAnnual +
    breakdown.employeePFAnnual +
    breakdown.gratuityAnnual +
    breakdown.employerNPSAnnual +
    breakdown.employeeNpsTier1Annual;
  const totalTaxes = taxResult.totalTaxLiabilityAnnual + breakdown.professionalTaxAnnual;

  const pctCash = ((cashTakeHome / (ctc || 1)) * 100).toFixed(0);
  const pctSavings = ((retiralSavings / (ctc || 1)) * 100).toFixed(0);
  const pctTaxes = ((totalTaxes / (ctc || 1)) * 100).toFixed(0);

  // Line Flow Graphic steps
  const flowSteps = [
    { title: 'Total CTC Offer', amount: ctc, color: '#0F172A', sub: 'Gross package' },
    { title: 'Retiral Savings', amount: retiralSavings, color: '#D97706', sub: 'PF + Gratuity + NPS' },
    { title: 'Income & State Tax', amount: totalTaxes, color: '#E11D48', sub: 'TDS + Prof Tax' },
    { title: 'Bank In-Hand Cash', amount: cashTakeHome, color: '#10B981', sub: 'Liquid cash' },
  ];

  const svgW = 600;
  const svgH = 130;
  const stepW = svgW / 4;

  return (
    <div className="space-y-4 max-w-4xl mx-auto" id="salary-breakdown-tab">
      {/* High-level 3-Bucket Split Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/70 space-y-1">
          <div className="text-[11px] font-bold text-emerald-800 uppercase">1. Cash You Receive</div>
          <div className="text-2xl font-extrabold font-mono text-emerald-950">{pctCash}% of CTC</div>
          <div className="text-xs font-mono font-semibold text-emerald-800">{formatINR(cashTakeHome)}/yr</div>
          <p className="text-[10px] text-emerald-700/80 pt-1 border-t border-emerald-200">
            Deposited into your bank account as monthly salary.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 space-y-1">
          <div className="text-[11px] font-bold text-amber-800 uppercase">2. Savings Saved for You</div>
          <div className="text-2xl font-extrabold font-mono text-amber-950">{pctSavings}% of CTC</div>
          <div className="text-xs font-mono font-semibold text-amber-800">{formatINR(retiralSavings)}/yr</div>
          <p className="text-[10px] text-amber-700/80 pt-1 border-t border-amber-200">
            Provident Fund, Gratuity, and NPS building retirement wealth.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/70 space-y-1">
          <div className="text-[11px] font-bold text-rose-800 uppercase">3. Taxes Paid</div>
          <div className="text-2xl font-extrabold font-mono text-rose-950">{pctTaxes}% of CTC</div>
          <div className="text-xs font-mono font-semibold text-rose-800">{formatINR(totalTaxes)}/yr</div>
          <p className="text-[10px] text-rose-700/80 pt-1 border-t border-rose-200">
            Income Tax (TDS) and State Professional Tax.
          </p>
        </div>
      </div>

      {/* Line Flow Graphic: How ₹ CTC Converts to Cash */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              Cash Flow Pathway (From CTC to Your Pocket)
            </h3>
            <p className="text-[11px] text-slate-500">
              Traces where every rupee goes step-by-step
            </p>
          </div>
        </div>

        <div className="w-full overflow-hidden">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto select-none">
            {/* Horizontal flow line */}
            <line x1={40} y1={50} x2={svgW - 40} y2={50} stroke="#E2E8F0" strokeWidth="3" />

            {/* Connecting lines */}
            <line x1={40} y1={50} x2={stepW * 1.5} y2={50} stroke="#D97706" strokeWidth="3" />
            <line x1={stepW * 1.5} y1={50} x2={stepW * 2.5} y2={50} stroke="#E11D48" strokeWidth="3" />
            <line x1={stepW * 2.5} y1={50} x2={svgW - 40} y2={50} stroke="#10B981" strokeWidth="3" />

            {/* Step nodes */}
            {flowSteps.map((step, idx) => {
              const cx = idx === 0 ? 40 : idx === 1 ? stepW * 1.5 : idx === 2 ? stepW * 2.5 : svgW - 40;
              return (
                <g key={step.title}>
                  <circle cx={cx} cy={50} r="7" fill={step.color} stroke="#FFFFFF" strokeWidth="2.5" />
                  <text
                    x={cx}
                    y={28}
                    textAnchor={idx === 0 ? 'start' : idx === 3 ? 'end' : 'middle'}
                    className="text-[10px] font-bold fill-slate-800"
                  >
                    {step.title}
                  </text>
                  <text
                    x={cx}
                    y={75}
                    textAnchor={idx === 0 ? 'start' : idx === 3 ? 'end' : 'middle'}
                    className="text-[11px] font-mono font-extrabold fill-slate-900"
                  >
                    {formatINRCompact(step.amount)}
                  </text>
                  <text
                    x={cx}
                    y={92}
                    textAnchor={idx === 0 ? 'start' : idx === 3 ? 'end' : 'middle'}
                    className="text-[9px] fill-slate-400"
                  >
                    {step.sub}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Component Breakdown Table (Layman View) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900">
          Component-by-Component Annual Breakdown
        </h3>

        <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
          <div className="grid grid-cols-3 bg-slate-100 p-2 font-bold text-slate-700 text-[11px]">
            <span>Component</span>
            <span>Annual Amount</span>
            <span className="text-right">Monthly Amount</span>
          </div>

          <div className="divide-y divide-slate-100 font-mono text-[11px]">
            <div className="grid grid-cols-3 p-2 items-center">
              <span className="font-sans text-slate-700 font-medium">Basic Pay ({inputs.basicPercentOfCTC}%)</span>
              <span>{formatINR(breakdown.basicAnnual)}</span>
              <span className="text-right text-slate-500">{formatINR(breakdown.basicAnnual / 12)}</span>
            </div>

            <div className="grid grid-cols-3 p-2 items-center">
              <span className="font-sans text-slate-700 font-medium">House Rent Allowance (HRA)</span>
              <span>{formatINR(breakdown.hraAnnual)}</span>
              <span className="text-right text-slate-500">{formatINR(breakdown.hraAnnual / 12)}</span>
            </div>

            <div className="grid grid-cols-3 p-2 items-center">
              <span className="font-sans text-slate-700 font-medium">Special Allowance (Spillover)</span>
              <span>{formatINR(breakdown.specialAllowanceAnnual)}</span>
              <span className="text-right text-slate-500">{formatINR(breakdown.specialAllowanceAnnual / 12)}</span>
            </div>

            <div className="grid grid-cols-3 p-2 items-center">
              <span className="font-sans text-slate-700 font-medium">Employer Provident Fund (PF)</span>
              <span className="text-amber-800">{formatINR(breakdown.employerPFAnnual)}</span>
              <span className="text-right text-slate-500">{formatINR(breakdown.employerPFAnnual / 12)}</span>
            </div>

            <div className="grid grid-cols-3 p-2 items-center">
              <span className="font-sans text-slate-700 font-medium">Gratuity (Payment of Gratuity Act)</span>
              <span className="text-amber-800">{formatINR(breakdown.gratuityAnnual)}</span>
              <span className="text-right text-slate-500">{formatINR(breakdown.gratuityAnnual / 12)}</span>
            </div>

            {breakdown.otherAllowancesAnnual > 0 && (
              <div className="grid grid-cols-3 p-2 items-center">
                <span className="font-sans text-slate-700 font-medium">Flexi & Meal Allowances</span>
                <span>{formatINR(breakdown.otherAllowancesAnnual)}</span>
                <span className="text-right text-slate-500">{formatINR(breakdown.otherAllowancesAnnual / 12)}</span>
              </div>
            )}

            <div className="grid grid-cols-3 p-2.5 items-center bg-slate-50 font-bold font-sans text-slate-900 border-t border-slate-200">
              <span>Total CTC</span>
              <span className="font-mono text-slate-900">{formatINR(breakdown.ctcAnnual)}</span>
              <span className="text-right font-mono text-slate-900">{formatINR(breakdown.ctcAnnual / 12)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
