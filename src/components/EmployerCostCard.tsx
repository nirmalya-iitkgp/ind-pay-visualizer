import React from 'react';
import { EmployerTaxShield, CompensationBreakdown, TaxCalculationResult } from '../types';
import { formatINR, formatINRCompact } from '../utils/formatters';
import { Building2, AlertTriangle } from 'lucide-react';

interface Props {
  taxShield: EmployerTaxShield;
  breakdown: CompensationBreakdown;
  activeTaxResult: TaxCalculationResult;
}

export const EmployerCostCard: React.FC<Props> = ({
  taxShield,
  breakdown,
  activeTaxResult,
}) => {
  const {
    deductibleExpenses,
    nonDeductibleExpenses,
    taxProfileName,
    baseCorporateTaxRate,
    surchargeRatePercent,
    cessRatePercent,
    corporateTaxRate,
    corporateTaxShieldAmount,
    effectiveEmployerNetCost,
  } = taxShield;

  const employeeNetCash = activeTaxResult.annualInHandSalary;
  const statutoryAndTaxToll = breakdown.ctcAnnual - employeeNetCash;

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3.5" id="employer-cost-card">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-700" />
          <h3 className="text-xs font-bold text-slate-800">
            Employer Net Outlay & Tax Shield
          </h3>
        </div>
        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
          Eff. Corp Tax: {corporateTaxRate}%
        </span>
      </div>

      {/* Main KPI: Effective Employer Outlay */}
      <div className="p-3.5 rounded-lg bg-slate-900 text-white space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium">Effective Net Outlay to Company</span>
          <span className="text-emerald-400 font-mono font-semibold">
            Shield: -{formatINRCompact(corporateTaxShieldAmount)}
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white">
            {formatINR(effectiveEmployerNetCost)}
            <span className="text-xs font-normal text-slate-400 ml-1">/year</span>
          </div>
          <div className="text-xs font-mono text-slate-400">
            {formatINR(effectiveEmployerNetCost / 12)}/mo
          </div>
        </div>

        <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 flex items-center justify-between font-mono">
          <span>Stated Gross CTC:</span>
          <span className="text-white font-semibold">{formatINR(taxShield.grossCTC)}</span>
        </div>
      </div>

      {/* Corporate Tax Structure: Base + Surcharge + Higher Education Cess */}
      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1.5">
        <div className="flex items-center justify-between font-semibold text-slate-800">
          <span>{taxProfileName}</span>
          <span className="font-mono text-slate-900">{corporateTaxRate.toFixed(2)}%</span>
        </div>
        <div className="grid grid-cols-3 gap-1 text-[11px] font-mono text-slate-600 pt-1 border-t border-slate-200">
          <div>
            <span className="text-slate-400 block text-[9px]">Base Tax</span>
            <span className="font-semibold text-slate-900">{baseCorporateTaxRate}%</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[9px]">Surcharge</span>
            <span className="font-semibold text-slate-900">{surchargeRatePercent}%</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[9px]">HE Cess</span>
            <span className="font-semibold text-slate-900">{cessRatePercent}%</span>
          </div>
        </div>
      </div>

      {/* Corporate Deductible Expenses */}
      <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
        <div className="bg-slate-100 p-2 font-semibold text-slate-700 flex justify-between text-[11px]">
          <span>Corporate Tax Deductible Expenses</span>
          <span className="font-mono">{formatINR(deductibleExpenses.totalDeductible)}</span>
        </div>

        <div className="p-2.5 space-y-1.5 text-slate-600 text-[11px]">
          <div className="flex justify-between">
            <span>Basic Pay & Allowances:</span>
            <span className="font-mono text-slate-900">{formatINR(deductibleExpenses.basicAndAllowances)}</span>
          </div>
          <div className="flex justify-between">
            <span>Employer PF & Gratuity:</span>
            <span className="font-mono text-slate-900">
              {formatINR(deductibleExpenses.employerPF + deductibleExpenses.gratuity)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Employer NPS (Sec 36(1)(iv)):</span>
            <span className="font-mono text-slate-900">{formatINR(deductibleExpenses.employerNPS)}</span>
          </div>
          <div className="flex justify-between">
            <span>RSU Cross-Charged:</span>
            <span className="font-mono text-slate-900">{formatINR(deductibleExpenses.rsuCrossChargeDeductible)}</span>
          </div>
        </div>
      </div>

      {/* Non-deductible alert */}
      {nonDeductibleExpenses.totalNonDeductible > 0 && (
        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[11px]">
            <span className="font-semibold">Non-deductible RSU outlay: </span>
            {formatINR(nonDeductibleExpenses.totalNonDeductible)} is not corporate tax-deductible (cross-charge off).
          </div>
        </div>
      )}

      {/* Distribution summary */}
      <div className="space-y-1 text-xs">
        <div className="flex justify-between text-slate-600 text-[11px]">
          <span>CTC Realization</span>
          <span className="font-mono font-medium">
            Take-Home: {((employeeNetCash / breakdown.ctcAnnual) * 100).toFixed(0)}% • Taxes/Retirals: {((statutoryAndTaxToll / breakdown.ctcAnnual) * 100).toFixed(0)}%
          </span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 h-full"
            style={{ width: `${(employeeNetCash / breakdown.ctcAnnual) * 100}%` }}
          />
          <div
            className="bg-slate-400 h-full"
            style={{ width: `${(statutoryAndTaxToll / breakdown.ctcAnnual) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
