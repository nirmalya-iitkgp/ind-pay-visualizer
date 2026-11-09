import React, { useState } from 'react';
import { CompensationBreakdown, TaxCalculationResult, TaxRegime } from '../types';
import { formatINR, formatINRCompact } from '../utils/formatters';
import { PieChart, Layers, Wallet } from 'lucide-react';

interface Props {
  breakdown: CompensationBreakdown;
  activeTaxResult: TaxCalculationResult;
  regime: TaxRegime;
}

interface DonutSegment {
  label: string;
  value: number;
  color: string;
  percentage: number;
}

export const VisualBreakdown: React.FC<Props> = ({
  breakdown,
  activeTaxResult,
  regime,
}) => {
  const [viewPeriod, setViewPeriod] = useState<'annual' | 'monthly'>('annual');
  const [hoveredSegment, setHoveredSegment] = useState<DonutSegment | null>(null);

  const divider = viewPeriod === 'monthly' ? 12 : 1;
  const ctcDisplay = breakdown.ctcAnnual / divider;

  const rawSegments = [
    { label: 'Basic Pay', value: breakdown.basicAnnual, color: '#0F766E' },
    { label: 'HRA', value: breakdown.hraAnnual, color: '#0284C7' },
    { label: 'Special Allowance', value: breakdown.specialAllowanceAnnual, color: '#6366F1' },
    { label: 'Employer PF & Retirals', value: breakdown.totalEmployerRetirals, color: '#D97706' },
    { label: 'Allowances & Meal', value: breakdown.ltaAnnual + breakdown.otherAllowancesAnnual, color: '#7C3AED' },
    { label: 'Variable Pay', value: breakdown.variablePayAnnual, color: '#EA580C' },
    { label: 'RSU Equity', value: breakdown.rsuVestedAnnual, color: '#059669' },
  ].filter((s) => s.value > 0);

  const totalSegmentSum = rawSegments.reduce((sum, s) => sum + s.value, 0) || 1;
  const segments: DonutSegment[] = rawSegments.map((s) => ({
    ...s,
    percentage: (s.value / totalSegmentSum) * 100,
  }));

  let accumulatedAngle = 0;
  const radius = 64;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  const waterfallSteps = [
    {
      title: 'Gross CTC',
      amount: breakdown.ctcAnnual / divider,
      color: 'bg-slate-900 text-white',
      subtext: 'Total cost to company',
    },
    {
      title: 'Employer Retirals',
      amount: -(breakdown.totalEmployerRetirals / divider),
      color: 'bg-slate-50 text-slate-700 border border-slate-200',
      subtext: 'PF, Gratuity, Employer NPS',
    },
    {
      title: 'Gross Salary Earnings',
      amount: breakdown.grossSalaryAnnual / divider,
      color: 'bg-slate-100 text-slate-800 font-bold',
      subtext: 'Pre-tax pay slip earnings',
    },
    {
      title: 'Total Deductions & Exemptions',
      amount: -(activeTaxResult.totalDeductionsAndExemptions / divider),
      color: 'bg-emerald-50 text-emerald-900 border border-emerald-200',
      subtext: regime === 'new' ? '₹75k Std Ded + Employer NPS' : 'Std Ded, HRA, 80C, 80D, Meal',
    },
    {
      title: 'Net Taxable Income',
      amount: activeTaxResult.netTaxableIncome / divider,
      color: 'bg-slate-50 text-slate-800 border border-slate-200',
      subtext: 'Subject to slab rates',
    },
    {
      title: 'Income Tax & Cess (TDS)',
      amount: -(activeTaxResult.totalTaxLiabilityAnnual / divider),
      color: 'bg-rose-50 text-rose-900 border border-rose-200',
      subtext: `Eff. Tax Rate: ${activeTaxResult.effectiveTaxRatePercent.toFixed(1)}%`,
    },
    {
      title: 'Net Bank In-Hand',
      amount: activeTaxResult.annualInHandSalary / divider,
      color: 'bg-emerald-600 text-white font-bold',
      subtext: 'Cash deposited in account',
    },
  ];

  return (
    <div className="space-y-3.5" id="visual-breakdown-panel">
      {/* Visual Component Split */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold text-slate-800">
              Component Distribution
            </h3>
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setViewPeriod('annual')}
              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                viewPeriod === 'annual' ? 'bg-white text-slate-900 font-bold' : 'text-slate-600'
              }`}
            >
              Annual
            </button>
            <button
              type="button"
              onClick={() => setViewPeriod('monthly')}
              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                viewPeriod === 'monthly' ? 'bg-white text-slate-900 font-bold' : 'text-slate-600'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-5 flex items-center justify-center relative py-1">
            <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="text-slate-100"
                strokeWidth={strokeWidth}
                stroke="currentColor"
                fill="transparent"
              />
              {segments.map((segment) => {
                const strokeDasharray = `${(segment.percentage / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -((accumulatedAngle / 100) * circumference);
                accumulatedAngle += segment.percentage;

                const isHovered = hoveredSegment?.label === segment.label;

                return (
                  <circle
                    key={segment.label}
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke={segment.color}
                    strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    fill="transparent"
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredSegment(segment)}
                    onMouseLeave={() => setHoveredSegment(null)}
                  />
                );
              })}
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[9px] uppercase font-semibold text-slate-400">
                {hoveredSegment ? hoveredSegment.label : 'In-Hand Pay'}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                {hoveredSegment
                  ? formatINR(hoveredSegment.value / divider)
                  : formatINR(activeTaxResult.annualInHandSalary / divider)}
              </span>
            </div>
          </div>

          <div className="sm:col-span-7 space-y-1 max-h-40 overflow-y-auto pr-1">
            {segments.map((seg) => (
              <div
                key={seg.label}
                onMouseEnter={() => setHoveredSegment(seg)}
                onMouseLeave={() => setHoveredSegment(null)}
                className={`flex items-center justify-between text-[11px] p-1 rounded cursor-pointer ${
                  hoveredSegment?.label === seg.label ? 'bg-slate-100 font-bold' : ''
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                  <span className="text-slate-700 truncate">{seg.label}</span>
                </div>
                <span className="font-mono text-slate-900 font-semibold">{formatINRCompact(seg.value / divider)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Waterfall Step Down */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold text-slate-800">
              Cash Flow: CTC to Take-Home
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {regime === 'new' ? 'New Regime' : 'Old Regime'}
          </span>
        </div>

        <div className="space-y-1.5">
          {waterfallSteps.map((step) => {
            const isNegative = step.amount < 0;
            return (
              <div
                key={step.title}
                className={`p-2 rounded-lg flex items-center justify-between text-xs transition-colors ${step.color}`}
              >
                <div>
                  <div className="font-semibold text-[11px]">{step.title}</div>
                  <div className="text-[9px] opacity-75">{step.subtext}</div>
                </div>
                <div className="font-mono font-bold text-xs sm:text-sm">
                  {isNegative ? '-' : ''}{formatINR(Math.abs(step.amount))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bank Deposit Box */}
        <div className="p-3 rounded-lg bg-emerald-950 text-white flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-[10px] text-emerald-300 uppercase">Monthly Cash In Bank</div>
              <div className="text-base font-bold text-white">
                {formatINR(activeTaxResult.monthlyInHandSalary)}
                <span className="text-xs font-normal text-emerald-400 ml-1">/mo</span>
              </div>
            </div>
          </div>
          <div className="text-right text-xs">
            <div className="text-emerald-300 text-[10px]">Tax Rate</div>
            <div className="font-bold">{activeTaxResult.effectiveTaxRatePercent.toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};
