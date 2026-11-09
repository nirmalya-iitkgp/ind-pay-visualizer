import React from 'react';
import { CompanyPolicy, EmployerTaxShield, CompensationBreakdown, CorporateTaxProfileType } from '../../types';
import { CORPORATE_TAX_PROFILES } from '../../utils/constants';
import { formatINR, formatINRCompact } from '../../utils/formatters';
import { Building2, Shield, AlertTriangle } from 'lucide-react';

interface Props {
  taxShield: EmployerTaxShield;
  breakdown: CompensationBreakdown;
  policy: CompanyPolicy;
  onUpdatePolicy: (policy: CompanyPolicy) => void;
}

export const EmployerOutlayTab: React.FC<Props> = ({
  taxShield,
  breakdown,
  policy,
  onUpdatePolicy,
}) => {
  const {
    grossCTC,
    effectiveEmployerNetCost,
    corporateTaxShieldAmount,
    corporateTaxRate,
    baseCorporateTaxRate,
    surchargeRatePercent,
    cessRatePercent,
    taxProfileName,
    deductibleExpenses,
    nonDeductibleExpenses,
  } = taxShield;

  const handleProfileChange = (profileKey: CorporateTaxProfileType) => {
    const cfg = CORPORATE_TAX_PROFILES[profileKey];
    if (cfg) {
      onUpdatePolicy({
        ...policy,
        corporateTaxProfile: profileKey,
        corporateBaseRate: cfg.baseRate,
        corporateSurchargeRate: cfg.surchargeRate,
        corporateCessRate: cfg.cessRate,
        corporateTaxRate: cfg.effectiveRate,
      });
    }
  };

  // Line Outlay dimensions
  const svgW = 560;
  const svgH = 100;
  const pad = { left: 40, right: 40, y: 50 };
  const lineW = svgW - pad.left - pad.right;

  return (
    <div className="space-y-4 max-w-4xl mx-auto" id="employer-outlay-tab">
      {/* Overview Box */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <Building2 className="w-4 h-4 text-indigo-600" />
          <span>Employer Corporate Outlay & Tax Shield</span>
        </div>
        <p className="text-xs text-slate-600">
          Salary, allowances, and PF contributions are 100% tax-deductible business expenses under Section 37(1). This reduces the company’s corporate income tax bill.
        </p>
      </div>

      {/* Hero Outlay Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-indigo-300">
            Real Net Cost to Employer (After Tax Shield)
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white">
            {formatINR(effectiveEmployerNetCost)}
            <span className="text-sm font-normal text-indigo-300 ml-1.5">/ year</span>
          </div>
          <div className="text-xs font-mono text-emerald-400">
            Tax Shield Savings: -{formatINR(corporateTaxShieldAmount)}
          </div>
        </div>

        <div className="sm:text-right space-y-1 sm:border-l sm:border-slate-800 sm:pl-6 text-xs">
          <div className="text-slate-400">Stated Offer CTC</div>
          <div className="text-xl font-bold font-mono text-white">{formatINR(grossCTC)}</div>
          <div className="text-[11px] text-indigo-200 mt-1">
            Monthly Cost: {formatINR(effectiveEmployerNetCost / 12)}/mo
          </div>
        </div>
      </div>

      {/* Line Graphic: Outlay Bridge */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              Corporate Outlay Bridge Line
            </h3>
            <p className="text-[11px] text-slate-500">
              How the corporate tax deduction shields company cost
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-700">
            {corporateTaxRate}% tax reduction
          </span>
        </div>

        <div className="w-full overflow-hidden">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto select-none">
            {/* Outlay connector */}
            <line
              x1={pad.left}
              y1={pad.y}
              x2={pad.left + lineW}
              y2={pad.y}
              stroke="#E2E8F0"
              strokeWidth="3"
            />
            <line
              x1={pad.left}
              y1={pad.y}
              x2={pad.left + lineW * 0.75}
              y2={pad.y}
              stroke="#10B981"
              strokeWidth="3"
            />

            {/* Nodes */}
            <circle cx={pad.left} cy={pad.y} r="6" fill="#0F172A" stroke="#FFFFFF" strokeWidth="2" />
            <text x={pad.left} y={pad.y - 14} textAnchor="start" className="text-[10px] font-bold fill-slate-800">
              Gross CTC: {formatINRCompact(grossCTC)}
            </text>

            <circle cx={pad.left + lineW * 0.75} cy={pad.y} r="6" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
            <text x={pad.left + lineW * 0.75} y={pad.y + 22} textAnchor="middle" className="text-[10px] font-mono font-bold fill-emerald-800">
              Net Cost: {formatINRCompact(effectiveEmployerNetCost)}
            </text>

            <circle cx={pad.left + lineW} cy={pad.y} r="5" fill="#E2E8F0" stroke="#FFFFFF" strokeWidth="2" />
            <text x={pad.left + lineW} y={pad.y - 14} textAnchor="end" className="text-[10px] font-mono fill-slate-400">
              Shield: {formatINRCompact(corporateTaxShieldAmount)}
            </text>
          </svg>
        </div>
      </div>

      {/* Corporate Tax Profile Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              Company Tax Profile & Turnover Slabs
            </h3>
            <p className="text-[11px] text-slate-500">
              Select company type to apply appropriate base tax, surcharge, and 4% Higher Education Cess
            </p>
          </div>
          <span className="font-mono font-bold text-xs text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 self-start sm:self-auto">
            {corporateTaxRate}% Effective
          </span>
        </div>

        <select
          value={policy.corporateTaxProfile || 'sec_115baa'}
          onChange={(e) => handleProfileChange(e.target.value as CorporateTaxProfileType)}
          className="w-full px-3 py-2 text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg bg-slate-50"
        >
          {Object.values(CORPORATE_TAX_PROFILES).map((prof) => (
            <option key={prof.profile} value={prof.profile}>
              {prof.name} ({prof.effectiveRate}%)
            </option>
          ))}
        </select>

        <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-lg text-center font-mono text-xs border border-slate-100">
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Base Corporate Tax</span>
            <span className="font-bold text-slate-900">{baseCorporateTaxRate}%</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Surcharge</span>
            <span className="font-bold text-slate-900">{surchargeRatePercent}%</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Higher Education Cess</span>
            <span className="font-bold text-slate-900">{cessRatePercent}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
