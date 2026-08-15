import React from 'react';
import { CompanyPolicy } from '../types';
import { X, ShieldCheck, HelpCircle, Check, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  policy: CompanyPolicy;
  onUpdatePolicy: (policy: CompanyPolicy) => void;
}

export const PolicyConfigModal: React.FC<Props> = ({
  isOpen,
  onClose,
  policy,
  onUpdatePolicy,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4" id="policy-modal-overlay">
      <div
        id="policy-modal-card"
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Company Policy & Statutory Engine Settings</h2>
              <p className="text-xs text-slate-300">Configure Indian employer payroll and retiral compensation rules</p>
            </div>
          </div>
          <button
            id="close-policy-modal-btn"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-sm text-slate-700">
          
          {/* Section 1: Provident Fund (PF) Policy */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 text-sm">Provident Fund (PF) Rule</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">EPF Act, 1952</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label
                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                  policy.pfCapAtStatutoryLimit
                    ? 'bg-white border-emerald-500 ring-2 ring-emerald-100'
                    : 'bg-white/60 border-slate-200 hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="pfCap"
                  checked={policy.pfCapAtStatutoryLimit}
                  onChange={() => onUpdatePolicy({ ...policy, pfCapAtStatutoryLimit: true })}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-medium text-slate-900 text-xs">Capped at ₹15,000/mo</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    12% on statutory ceiling (₹1,800/mo = ₹21,600/yr). Maximizes monthly in-hand salary.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                  !policy.pfCapAtStatutoryLimit
                    ? 'bg-white border-emerald-500 ring-2 ring-emerald-100'
                    : 'bg-white/60 border-slate-200 hover:bg-white'
                }`}
              >
                <input
                  type="radio"
                  name="pfCap"
                  checked={!policy.pfCapAtStatutoryLimit}
                  onChange={() => onUpdatePolicy({ ...policy, pfCapAtStatutoryLimit: false })}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-medium text-slate-900 text-xs">Full 12% on Actual Basic</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Uncapped PF on total Basic Pay. Builds larger retirement corpus, reduces monthly take-home.
                  </div>
                </div>
              </label>
            </div>

            {/* VPF Toggle */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-medium text-xs text-slate-900">Voluntary Provident Fund (VPF)</span>
                <p className="text-[11px] text-slate-500">Enable additional voluntary employee contribution</p>
              </div>
              <div className="flex items-center gap-2">
                {policy.enableVPF && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="88"
                      value={policy.vpfPercentage}
                      onChange={(e) =>
                        onUpdatePolicy({
                          ...policy,
                          vpfPercentage: Math.max(0, Math.min(88, parseFloat(e.target.value) || 0)),
                        })
                      }
                      className="w-16 px-2 py-1 text-xs border border-slate-300 rounded font-medium text-right"
                    />
                    <span className="text-xs text-slate-500">% Basic</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onUpdatePolicy({ ...policy, enableVPF: !policy.enableVPF })}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    policy.enableVPF ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                      policy.enableVPF ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Gratuity & Retiral Policy */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 text-sm">Gratuity Accounting Policy</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">Payment of Gratuity Act, 1972</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="font-medium text-xs text-slate-900">Include Gratuity in Gross CTC</span>
                <p className="text-[11px] text-slate-500">
                  Standard 4.81% (15/26 of 1 month basic per completed year) included inside CTC component breakdown.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdatePolicy({
                    ...policy,
                    gratuityIncludedInCTC: !policy.gratuityIncludedInCTC,
                  })
                }
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  policy.gratuityIncludedInCTC ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                    policy.gratuityIncludedInCTC ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Section 3: Employer NPS & Superannuation */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 text-sm">Corporate NPS & Superannuation</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">Sec 80CCD(2) & 17(2)(vii)</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-xs text-slate-900">Employer NPS Contribution</span>
                <p className="text-[11px] text-slate-500">Tax deductible for employee under both Old and New Tax Regimes</p>
              </div>
              <div className="flex items-center gap-2">
                {policy.employerNpsEnabled && (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="1"
                      max="14"
                      value={policy.employerNpsPercent}
                      onChange={(e) =>
                        onUpdatePolicy({
                          ...policy,
                          employerNpsPercent: Math.max(0, Math.min(14, parseFloat(e.target.value) || 0)),
                        })
                      }
                      className="w-16 px-2 py-1 text-xs border border-slate-300 rounded font-medium text-right"
                    />
                    <span className="text-xs text-slate-500">% Basic</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() =>
                    onUpdatePolicy({
                      ...policy,
                      employerNpsEnabled: !policy.employerNpsEnabled,
                    })
                  }
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    policy.employerNpsEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                      policy.employerNpsEnabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Sec 17(2)(vii) Ceiling Rule:</strong> Combined Employer PF + Employer NPS + Superannuation exceeding <strong>₹7,50,000 annually</strong> is automatically treated as taxable salary perquisite.
              </span>
            </div>
          </div>

          {/* Section 4: RSU Cross-Charge & Corporate Tax Shield */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 text-sm">Equity Cross-Charge & Corporate Tax</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">Sec 37(1) Deductibility</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-xs text-slate-900">RSU/ESOP Cross-Charge to Indian Entity</span>
                <p className="text-[11px] text-slate-500">
                  When enabled, vested RSU expenses are invoiced to the Indian subsidiary, making them deductible corporate business expenses.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdatePolicy({
                    ...policy,
                    rsuCrossChargedToLocalEntity: !policy.rsuCrossChargedToLocalEntity,
                  })
                }
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  policy.rsuCrossChargedToLocalEntity ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                    policy.rsuCrossChargedToLocalEntity ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-medium text-xs text-slate-900">Effective Corporate Tax Rate</span>
                <p className="text-[11px] text-slate-500">Used to calculate Corporate Tax Shield savings on CTC</p>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.01"
                  min="15"
                  max="35"
                  value={policy.corporateTaxRate}
                  onChange={(e) =>
                    onUpdatePolicy({
                      ...policy,
                      corporateTaxRate: Math.max(0, Math.min(50, parseFloat(e.target.value) || 25.17)),
                    })
                  }
                  className="w-20 px-2 py-1 text-xs border border-slate-300 rounded font-medium text-right"
                />
                <span className="text-xs text-slate-500">%</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
          >
            Apply Policy Rules
          </button>
        </div>
      </div>
    </div>
  );
};
