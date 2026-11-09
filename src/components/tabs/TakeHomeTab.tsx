import React from 'react';
import { CompensationInputs, CompensationBreakdown, TaxCalculationResult, IndianState } from '../../types';
import { STATE_PT_CONFIGS } from '../../utils/constants';
import { formatINR, formatINRCompact } from '../../utils/formatters';
import { Wallet, MapPin, ArrowDown } from 'lucide-react';

interface Props {
  inputs: CompensationInputs;
  breakdown: CompensationBreakdown;
  taxResult: TaxCalculationResult;
  onChangeInputs: (inputs: CompensationInputs) => void;
  onOpenPaySlip: () => void;
}

const QUICK_CTC_PRESETS = [
  { label: '6L', value: 600000 },
  { label: '12L', value: 1200000 },
  { label: '18L', value: 1800000 },
  { label: '25L', value: 2500000 },
  { label: '50L', value: 5000000 },
  { label: '1Cr', value: 10000000 },
];

export const TakeHomeTab: React.FC<Props> = ({
  inputs,
  breakdown,
  taxResult,
  onChangeInputs,
  onOpenPaySlip,
}) => {
  const monthlyTakeHome = taxResult.monthlyInHandSalary;
  const annualTakeHome = taxResult.annualInHandSalary;
  const monthlyGross = breakdown.grossSalaryAnnual / 12;
  const monthlyPF = breakdown.employeePFAnnual / 12;
  const monthlyPT = breakdown.professionalTaxMonthly;
  const monthlyTax = taxResult.totalTaxLiabilityMonthly;

  // 12-month cash flow line points
  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const monthlyData = months.map((m, i) => {
    // Check if Maharashtra Feb ₹300 PT applies
    const isFeb = m === 'Feb';
    const ptThisMonth = inputs.state === 'maharashtra' && isFeb ? 300 : monthlyPT;
    const takeHomeThisMonth = monthlyGross - monthlyPF - ptThisMonth - monthlyTax;
    return {
      month: m,
      monthIndex: i,
      takeHome: takeHomeThisMonth,
      cumulative: takeHomeThisMonth * (i + 1),
    };
  });

  // SVG Line dimensions
  const svgWidth = 600;
  const svgHeight = 160;
  const pad = { top: 20, right: 30, bottom: 30, left: 45 };
  const chartW = svgWidth - pad.left - pad.right;
  const chartH = svgHeight - pad.top - pad.bottom;

  const maxVal = Math.max(...monthlyData.map((d) => d.cumulative));
  const getX = (idx: number) => pad.left + (idx / 11) * chartW;
  const getY = (val: number) => pad.top + chartH - (val / (maxVal || 1)) * chartH;

  const linePath = monthlyData.reduce((acc, d, i) => {
    return i === 0 ? `M ${getX(i)} ${getY(d.cumulative)}` : `${acc} L ${getX(i)} ${getY(d.cumulative)}`;
  }, '');

  const areaPath = `${linePath} L ${getX(11)} ${pad.top + chartH} L ${getX(0)} ${pad.top + chartH} Z`;

  return (
    <div className="space-y-4 max-w-4xl mx-auto" id="takehome-tab">
      {/* CTC Quick Input Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-0.5">
            <label htmlFor="ctc-input-tab1" className="text-xs font-bold text-slate-700">
              Enter Your Annual CTC (Cost to Company)
            </label>
            <p className="text-[11px] text-slate-500">
              The total package offer stated in your employment letter
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-400">₹</span>
            <input
              id="ctc-input-tab1"
              type="number"
              min="100000"
              step="50000"
              value={inputs.ctcAnnual}
              onChange={(e) =>
                onChangeInputs({
                  ...inputs,
                  ctcAnnual: Math.max(0, parseFloat(e.target.value) || 0),
                })
              }
              className="w-40 px-3 py-1.5 text-base font-bold text-slate-900 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 font-mono"
            />
          </div>
        </div>

        {/* Quick CTC Chips & State selector */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-500 mr-1">Quick pick:</span>
            {QUICK_CTC_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => onChangeInputs({ ...inputs, ctcAnnual: p.value })}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  inputs.ctcAnnual === p.value
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>State:</span>
            <select
              value={inputs.state || 'karnataka'}
              onChange={(e) =>
                onChangeInputs({
                  ...inputs,
                  state: e.target.value as IndianState,
                  professionalTaxAnnual: STATE_PT_CONFIGS[e.target.value as IndianState]?.defaultAnnualTax || 0,
                })
              }
              className="px-2 py-0.5 text-xs font-medium border border-slate-200 rounded bg-slate-50"
            >
              {Object.values(STATE_PT_CONFIGS).map((s) => (
                <option key={s.state} value={s.state}>
                  {s.stateName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Hero Take-Home Result */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
            <Wallet className="w-4 h-4" />
            <span>Actual Monthly In-Hand Cash</span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white">
            {formatINR(monthlyTakeHome)}
            <span className="text-sm font-normal text-slate-400 ml-1.5">/ month</span>
          </div>
          <p className="text-xs text-slate-400">
            Deposited directly to your bank account after all taxes and retiral deductions.
          </p>
        </div>

        <div className="sm:text-right space-y-1 sm:border-l sm:border-slate-700 sm:pl-6">
          <div className="text-[11px] text-slate-400">Annual Net Take-Home</div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {formatINR(annualTakeHome)}
          </div>
          <button
            type="button"
            onClick={onOpenPaySlip}
            className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            Generate Official Pay Slip
          </button>
        </div>
      </div>

      {/* Line Graphic: 12-Month Cumulative Cash Accumulation */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              12-Month Bank Deposit Trajectory (FY Cumulative)
            </h3>
            <p className="text-[11px] text-slate-500">
              Shows how your monthly cash in-hand accumulates across the financial year
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-700">
            {formatINR(monthlyTakeHome)} / mo
          </span>
        </div>

        <div className="w-full overflow-hidden">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto select-none">
            <defs>
              <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid line */}
            <line
              x1={pad.left}
              y1={pad.top + chartH}
              x2={pad.left + chartW}
              y2={pad.top + chartH}
              stroke="#E2E8F0"
            />

            {/* Area fill */}
            <path d={areaPath} fill="url(#cumGrad)" />

            {/* Main trajectory line */}
            <path d={linePath} fill="none" stroke="#10B981" strokeWidth="2.5" />

            {/* Month markers */}
            {monthlyData.map((d) => (
              <g key={d.month}>
                <circle
                  cx={getX(d.monthIndex)}
                  cy={getY(d.cumulative)}
                  r="3.5"
                  fill="#0F172A"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
                <text
                  x={getX(d.monthIndex)}
                  y={pad.top + chartH + 18}
                  textAnchor="middle"
                  className="text-[9px] fill-slate-500 font-mono"
                >
                  {d.month}
                </text>
              </g>
            ))}

            {/* Final cumulative label */}
            <text
              x={getX(11)}
              y={getY(maxVal) - 8}
              textAnchor="end"
              className="text-[10px] font-mono font-bold fill-emerald-800"
            >
              {formatINRCompact(annualTakeHome)}
            </text>
          </svg>
        </div>
      </div>

      {/* Step-by-Step Deductions Breakdown (Layman Clean View) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900">
          Monthly Paycheck Math (How we arrive at your In-Hand)
        </h3>

        <div className="space-y-2 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-50 flex items-center justify-between font-semibold">
            <span>1. Gross Monthly Earnings</span>
            <span className="font-mono text-slate-900">{formatINR(monthlyGross)}</span>
          </div>

          <div className="p-2.5 rounded-lg border border-slate-100 flex items-center justify-between text-slate-600">
            <div>
              <span className="font-medium text-slate-800">2. Provident Fund (EPF)</span>
              <p className="text-[10px] text-slate-400">Transferred into your EPFO retirement account</p>
            </div>
            <span className="font-mono text-rose-700">- {formatINR(monthlyPF)}</span>
          </div>

          <div className="p-2.5 rounded-lg border border-slate-100 flex items-center justify-between text-slate-600">
            <div>
              <span className="font-medium text-slate-800">3. Professional Tax (PT)</span>
              <p className="text-[10px] text-slate-400">Mandatory tax levied by {inputs.state || 'Karnataka'} state</p>
            </div>
            <span className="font-mono text-rose-700">- {formatINR(monthlyPT)}</span>
          </div>

          <div className="p-2.5 rounded-lg border border-slate-100 flex items-center justify-between text-slate-600">
            <div>
              <span className="font-medium text-slate-800">4. Income Tax Withheld (TDS)</span>
              <p className="text-[10px] text-slate-400">Income tax deducted by employer under {inputs.selectedRegime === 'new' ? 'New' : 'Old'} Regime</p>
            </div>
            <span className="font-mono text-rose-700">- {formatINR(monthlyTax)}</span>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between font-bold text-emerald-950 text-sm">
            <span>Net Monthly In-Hand Deposit</span>
            <span className="font-mono text-emerald-800">{formatINR(monthlyTakeHome)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
