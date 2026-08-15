import React, { useState } from 'react';
import { CompensationBreakdown, TaxCalculationResult, TaxRegime } from '../types';
import { formatINR, formatINRCompact, formatPercent } from '../utils/formatters';
import { PieChart, ArrowDownRight, TrendingDown, Layers, Wallet } from 'lucide-react';

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

  // Donut chart items
  const rawSegments = [
    { label: 'Basic Pay', value: breakdown.basicAnnual, color: '#10B981' }, // Emerald
    { label: 'HRA', value: breakdown.hraAnnual, color: '#06B6D4' }, // Cyan
    { label: 'Special Allowance', value: breakdown.specialAllowanceAnnual, color: '#6366F1' }, // Indigo
    { label: 'Employer PF', value: breakdown.employerPFAnnual, color: '#F59E0B' }, // Amber
    { label: 'Gratuity & Retirals', value: breakdown.gratuityAnnual + breakdown.employerNPSAnnual + breakdown.superannuationAnnual, color: '#EC4899' }, // Pink
    { label: 'Allowances & Flexi', value: breakdown.ltaAnnual + breakdown.otherAllowancesAnnual, color: '#8B5CF6' }, // Violet
    { label: 'Variable Pay', value: breakdown.variablePayAnnual, color: '#F97316' }, // Orange
    { label: 'Vested RSUs', value: breakdown.rsuVestedAnnual, color: '#14B8A6' }, // Teal
  ].filter((s) => s.value > 0);

  const totalSegmentSum = rawSegments.reduce((sum, s) => sum + s.value, 0) || 1;
  const segments: DonutSegment[] = rawSegments.map((s) => ({
    ...s,
    percentage: (s.value / totalSegmentSum) * 100,
  }));

  // SVG Donut calculations
  let accumulatedAngle = 0;
  const radius = 68;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  // Waterfall Chart Steps
  const waterfallSteps = [
    {
      title: 'Gross CTC',
      amount: breakdown.ctcAnnual / divider,
      type: 'base',
      color: 'bg-slate-900 text-white',
      subtext: 'Total cost to company',
    },
    {
      title: 'Employer Retirals',
      amount: -(breakdown.totalEmployerRetirals / divider),
      type: 'subtraction',
      color: 'bg-rose-50 border border-rose-200 text-rose-800',
      subtext: 'PF, Gratuity, NPS deducted from CTC',
    },
    {
      title: 'Gross Salary (Earnings)',
      amount: breakdown.grossSalaryAnnual / divider,
      type: 'subtotal',
      color: 'bg-blue-50 border border-blue-200 text-blue-900',
      subtext: 'Pre-tax earnings on payslip',
    },
    {
      title: 'Tax Deductions / Exemptions',
      amount: -(activeTaxResult.totalDeductionsAndExemptions / divider),
      type: 'subtraction',
      color: 'bg-emerald-50 border border-emerald-200 text-emerald-800',
      subtext: regime === 'new' ? 'Standard Deduction (₹75k) + NPS' : 'Std Ded (₹50k), HRA, 80C, 80D',
    },
    {
      title: 'Net Taxable Income',
      amount: activeTaxResult.netTaxableIncome / divider,
      type: 'subtotal',
      color: 'bg-amber-50 border border-amber-200 text-amber-900',
      subtext: 'Amount subject to slab income tax',
    },
    {
      title: 'Total Income Tax (TDS)',
      amount: -(activeTaxResult.totalTaxLiabilityAnnual / divider),
      type: 'subtraction',
      color: 'bg-rose-100 border border-rose-300 text-rose-900',
      subtext: `Slab tax + Surcharge + 4% Cess (Eff: ${activeTaxResult.effectiveTaxRatePercent.toFixed(1)}%)`,
    },
    {
      title: 'Net In-Hand Take-Home',
      amount: activeTaxResult.annualInHandSalary / divider,
      type: 'final',
      color: 'bg-emerald-600 text-white shadow-md',
      subtext: `Actual cash deposited in bank account`,
    },
  ];

  return (
    <div className="space-y-4" id="visual-breakdown-panel">
      
      {/* Header with Monthly/Annual Period Switcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Compensation Component Split
            </h2>
          </div>
          
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewPeriod('annual')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewPeriod === 'annual'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Annual
            </button>
            <button
              type="button"
              onClick={() => setViewPeriod('monthly')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                viewPeriod === 'monthly'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Donut Chart & Visual Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          
          {/* SVG Donut */}
          <div className="sm:col-span-6 flex flex-col items-center justify-center relative py-2">
            <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 180 180">
              <circle
                cx="90"
                cy="90"
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
                    cx="90"
                    cy="90"
                    r={radius}
                    stroke={segment.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    fill="transparent"
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredSegment(segment)}
                    onMouseLeave={() => setHoveredSegment(null)}
                  />
                );
              })}
            </svg>

            {/* Donut Center Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                {hoveredSegment ? hoveredSegment.label : (viewPeriod === 'monthly' ? 'Monthly CTC' : 'Annual CTC')}
              </span>
              <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                {hoveredSegment
                  ? formatINR(hoveredSegment.value / divider)
                  : formatINR(ctcDisplay)}
              </span>
              <span className="text-[11px] font-semibold text-emerald-600">
                {hoveredSegment ? `${hoveredSegment.percentage.toFixed(1)}% of CTC` : `${formatINR(activeTaxResult.annualInHandSalary / divider)} In-Hand`}
              </span>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="sm:col-span-6 space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {segments.map((seg) => (
              <div
                key={seg.label}
                onMouseEnter={() => setHoveredSegment(seg)}
                onMouseLeave={() => setHoveredSegment(null)}
                className={`flex items-center justify-between text-xs p-1 rounded transition-colors cursor-pointer ${
                  hoveredSegment?.label === seg.label ? 'bg-slate-100 font-bold' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-slate-700 truncate">{seg.label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-mono">
                  <span className="text-slate-900 font-semibold">{formatINRCompact(seg.value / divider)}</span>
                  <span className="text-slate-400 text-[11px] w-9 text-right">{seg.percentage.toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Waterfall Step-Down Chart: Gross CTC -> Monthly Take Home */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Compensation & Tax Waterfall Flow
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500 font-medium">
            {regime === 'new' ? 'New Regime (Sec 115BAC)' : 'Old Tax Regime'}
          </span>
        </div>

        <div className="space-y-2">
          {waterfallSteps.map((step, idx) => {
            const isNegative = step.amount < 0;
            const displayAmt = Math.abs(step.amount);

            return (
              <div
                key={step.title}
                className={`p-2.5 rounded-lg flex items-center justify-between transition-all ${step.color}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center bg-black/10 shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-xs font-bold leading-tight">{step.title}</div>
                    <div className="text-[10px] opacity-80">{step.subtext}</div>
                  </div>
                </div>

                <div className="text-right font-mono font-bold text-xs sm:text-sm">
                  <span>{isNegative ? '-' : ''}{formatINR(displayAmt)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Highlight Banner: Monthly Take-Home Bank Deposit */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-emerald-200 font-bold">
                Net Monthly Bank In-Hand
              </div>
              <div className="text-lg sm:text-xl font-extrabold tracking-tight">
                {formatINR(activeTaxResult.monthlyInHandSalary)}
                <span className="text-xs font-normal text-emerald-300 ml-1">/ month</span>
              </div>
            </div>
          </div>
          <div className="text-right text-xs">
            <div className="text-emerald-200">Effective Tax Rate</div>
            <div className="font-mono font-bold text-base text-white">
              {activeTaxResult.effectiveTaxRatePercent.toFixed(1)}%
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
