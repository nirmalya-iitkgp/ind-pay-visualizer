import React from 'react';
import { EmployerTaxShield, CompensationBreakdown, TaxCalculationResult } from '../types';
import { formatINR, formatINRCompact, formatPercent } from '../utils/formatters';
import { Building2, Shield, AlertTriangle, TrendingDown, DollarSign } from 'lucide-react';

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
  const { deductibleExpenses, nonDeductibleExpenses, corporateTaxRate, corporateTaxShieldAmount, effectiveEmployerNetCost } = taxShield;

  // Split calculations
  const employerNetCost = effectiveEmployerNetCost;
  const employeeNetCash = activeTaxResult.annualInHandSalary;
  const statutoryAndTaxToll = breakdown.ctcAnnual - employeeNetCash;

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-4" id="employer-cost-card">
      
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Employer Corporate Outlay & Tax Shield
          </h2>
        </div>
        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
          Corp Tax: {corporateTaxRate}%
        </span>
      </div>

      {/* Main KPI: Effective Employer Outlay */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-800 text-white shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-200">
            Effective Net Cost to Employer
          </span>
          <span className="text-[11px] text-emerald-300 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded">
            Tax Shield: -{formatINRCompact(corporateTaxShieldAmount)}
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-black tracking-tight text-white">
            {formatINR(effectiveEmployerNetCost)}
            <span className="text-xs font-normal text-indigo-200 ml-1">/ year</span>
          </div>
          <div className="text-xs font-mono text-indigo-300">
            {formatINR(effectiveEmployerNetCost / 12)}/mo
          </div>
        </div>

        <div className="text-[11px] text-indigo-200/80 pt-1 border-t border-indigo-800/60 flex items-center justify-between">
          <span>Gross Stated CTC:</span>
          <span className="font-mono font-bold text-white">{formatINR(taxShield.grossCTC)}</span>
        </div>
      </div>

      {/* Deductibility Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
        <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 font-bold text-slate-700 flex justify-between">
          <span>Corporate Tax Deductible Expenses</span>
          <span>{formatINR(deductibleExpenses.totalDeductible)}</span>
        </div>
        
        <div className="p-3 space-y-2 text-slate-600 divide-y divide-slate-100">
          <div className="flex justify-between">
            <span>Salary & Flexible Allowances:</span>
            <span className="font-mono text-slate-900">{formatINR(deductibleExpenses.basicAndAllowances)}</span>
          </div>
          <div className="flex justify-between pt-1.5">
            <span>Employer PF & Gratuity Contributions:</span>
            <span className="font-mono text-slate-900">{formatINR(deductibleExpenses.employerPF + deductibleExpenses.gratuity)}</span>
          </div>
          <div className="flex justify-between pt-1.5">
            <span>Employer NPS Contribution:</span>
            <span className="font-mono text-slate-900">{formatINR(deductibleExpenses.employerNPS)}</span>
          </div>
          <div className="flex justify-between pt-1.5">
            <span>RSU Cross-Charged Expense:</span>
            <span className="font-mono text-slate-900">{formatINR(deductibleExpenses.rsuCrossChargeDeductible)}</span>
          </div>
        </div>
      </div>

      {/* Non-Deductible Warning (if any) */}
      {nonDeductibleExpenses.totalNonDeductible > 0 && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Non-Deductible RSU Outlay: </span>
            <span>
              ₹{(nonDeductibleExpenses.totalNonDeductible / 100000).toFixed(2)}L in RSU perquisite is non-deductible because parent cross-charging is disabled in firm policy.
            </span>
          </div>
        </div>
      )}

      {/* Value Distribution Bar (Employer vs Employee vs Tax Toll) */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-xs font-semibold text-slate-700">
          <span>Total CTC Realization Breakdown</span>
        </div>

        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          <div
            className="bg-emerald-500 h-full"
            style={{ width: `${(employeeNetCash / breakdown.ctcAnnual) * 100}%` }}
            title={`Employee Net Take-Home: ${formatINR(employeeNetCash)}`}
          />
          <div
            className="bg-amber-500 h-full"
            style={{ width: `${(statutoryAndTaxToll / breakdown.ctcAnnual) * 100}%` }}
            title={`Income Tax & Statutory Toll: ${formatINR(statutoryAndTaxToll)}`}
          />
        </div>

        <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Employee Take-Home ({( (employeeNetCash / breakdown.ctcAnnual) * 100 ).toFixed(0)}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Tax & Retiral Toll ({( (statutoryAndTaxToll / breakdown.ctcAnnual) * 100 ).toFixed(0)}%)</span>
          </div>
        </div>
      </div>

    </div>
  );
};
