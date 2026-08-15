import React from 'react';
import { CompensationBreakdown, TaxCalculationResult } from '../types';
import { formatINR } from '../utils/formatters';
import { X, Printer, Download, Check, Building2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  breakdown: CompensationBreakdown;
  taxResult: TaxCalculationResult;
}

export const SalarySlipModal: React.FC<Props> = ({
  isOpen,
  onClose,
  breakdown,
  taxResult,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const monthlyGross = breakdown.grossSalaryAnnual / 12;
  const monthlyBasic = breakdown.basicAnnual / 12;
  const monthlyHRA = breakdown.hraAnnual / 12;
  const monthlySpecial = breakdown.specialAllowanceAnnual / 12;
  const monthlyAllowances = (breakdown.ltaAnnual + breakdown.otherAllowancesAnnual) / 12;

  const monthlyEmpPF = breakdown.employeePFAnnual / 12;
  const monthlyEmpVPF = breakdown.employeeVPFAnnual / 12;
  const monthlyPT = breakdown.professionalTaxAnnual / 12;
  const monthlyTDS = taxResult.totalTaxLiabilityMonthly;

  const totalMonthlyDeductions = monthlyEmpPF + monthlyEmpVPF + monthlyPT + monthlyTDS;
  const netMonthlySalary = monthlyGross - totalMonthlyDeductions;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const summary = `MONTHLY SALARY SLIP BREAKDOWN
Gross Earnings: ${formatINR(monthlyGross)}/mo
- Basic Pay: ${formatINR(monthlyBasic)}
- HRA: ${formatINR(monthlyHRA)}
- Special Allowance: ${formatINR(monthlySpecial)}
- Other Allowances: ${formatINR(monthlyAllowances)}

Deductions: ${formatINR(totalMonthlyDeductions)}/mo
- Employee PF: ${formatINR(monthlyEmpPF)}
- VPF: ${formatINR(monthlyEmpVPF)}
- Professional Tax: ${formatINR(monthlyPT)}
- Income Tax (TDS): ${formatINR(monthlyTDS)}

NET IN-HAND TAKE HOME: ${formatINR(netMonthlySalary)}/mo (Annual: ${formatINR(netMonthlySalary * 12)})`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4" id="payslip-modal-overlay">
      <div
        id="payslip-modal-card"
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Monthly Salary Pay Slip View</h2>
              <p className="text-xs text-slate-300">Standard Indian Payroll Statement of Earnings & Deductions</p>
            </div>
          </div>
          <button
            id="close-payslip-modal-btn"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Pay Slip Card */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs text-slate-700 font-sans" id="printable-salary-slip">
          
          {/* Company Title */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">ACME Technologies India Pvt. Ltd.</h3>
              <p className="text-slate-500 text-[11px]">Bangalore, Karnataka, India • TAN: BLRA12345E</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-300">
                PAYSLIP FOR THE MONTH
              </span>
              <div className="text-slate-500 font-mono mt-1 text-[11px]">Tax Regime: {taxResult.regime.toUpperCase()}</div>
            </div>
          </div>

          {/* Dual Columns: Earnings vs Deductions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Earnings Column */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-100 px-3 py-2 font-bold text-slate-900 flex justify-between border-b border-slate-200">
                <span>EARNINGS</span>
                <span>AMOUNT (₹)</span>
              </div>
              <div className="p-3 space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="font-sans text-slate-700">Basic Pay</span>
                  <span className="font-semibold">{formatINR(monthlyBasic)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-slate-700">House Rent Allowance (HRA)</span>
                  <span className="font-semibold">{formatINR(monthlyHRA)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-slate-700">Special Allowance</span>
                  <span className="font-semibold">{formatINR(monthlySpecial)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-slate-700">Allowances & Flexi (LTA/Food)</span>
                  <span className="font-semibold">{formatINR(monthlyAllowances)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold font-sans text-slate-900 bg-slate-50 p-2 -mx-3 -mb-3">
                  <span>GROSS EARNINGS (A)</span>
                  <span className="font-mono">{formatINR(monthlyGross)}</span>
                </div>
              </div>
            </div>

            {/* Deductions Column */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-100 px-3 py-2 font-bold text-slate-900 flex justify-between border-b border-slate-200">
                <span>DEDUCTIONS</span>
                <span>AMOUNT (₹)</span>
              </div>
              <div className="p-3 space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="font-sans text-slate-700">Provident Fund (Employee PF)</span>
                  <span className="font-semibold">{formatINR(monthlyEmpPF)}</span>
                </div>
                {monthlyEmpVPF > 0 && (
                  <div className="flex justify-between">
                    <span className="font-sans text-slate-700">Voluntary PF (VPF)</span>
                    <span className="font-semibold">{formatINR(monthlyEmpVPF)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-sans text-slate-700">Professional Tax (PT)</span>
                  <span className="font-semibold">{formatINR(monthlyPT)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-slate-700">Income Tax (TDS)</span>
                  <span className="font-semibold text-rose-700">{formatINR(monthlyTDS)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold font-sans text-slate-900 bg-slate-50 p-2 -mx-3 -mb-3">
                  <span>TOTAL DEDUCTIONS (B)</span>
                  <span className="font-mono">{formatINR(totalMonthlyDeductions)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Net Pay Banner */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider">
                NET PAYABLE TO EMPLOYEE (A - B)
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-white mt-0.5">
                {formatINR(netMonthlySalary)}
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-400">
              <div>Annualized In-Hand: <strong className="text-white font-mono">{formatINR(netMonthlySalary * 12)}</strong></div>
              <div>Credited directly to Bank Salary Account</div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Download className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
