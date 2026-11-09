import React from 'react';
import { CompanyPolicy, CorporateTaxProfileType } from '../types';
import { CORPORATE_TAX_PROFILES } from '../utils/constants';
import { X, ShieldCheck } from 'lucide-react';

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

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      id="policy-modal-overlay"
    >
      <div
        id="policy-modal-card"
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold tracking-tight">Company Policy & Corporate Settings</h2>
          </div>
          <button
            id="close-policy-modal-btn"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-slate-700">
          
          {/* Section 1: Provident Fund (PF) Rule */}
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
            <span className="font-semibold text-slate-900 block">Provident Fund (PF) Statutory Rule</span>
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`p-2 rounded border cursor-pointer ${
                  policy.pfCapAtStatutoryLimit
                    ? 'bg-white border-slate-900 font-bold'
                    : 'bg-white/60 border-slate-200'
                }`}
              >
                <input
                  type="radio"
                  name="pfCap"
                  checked={policy.pfCapAtStatutoryLimit}
                  onChange={() => onUpdatePolicy({ ...policy, pfCapAtStatutoryLimit: true })}
                  className="sr-only"
                />
                <div>Capped at ₹15,000/mo</div>
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                  12% of ₹15k cap (₹1,800/mo = ₹21.6k/yr). Max in-hand.
                </div>
              </label>

              <label
                className={`p-2 rounded border cursor-pointer ${
                  !policy.pfCapAtStatutoryLimit
                    ? 'bg-white border-slate-900 font-bold'
                    : 'bg-white/60 border-slate-200'
                }`}
              >
                <input
                  type="radio"
                  name="pfCap"
                  checked={!policy.pfCapAtStatutoryLimit}
                  onChange={() => onUpdatePolicy({ ...policy, pfCapAtStatutoryLimit: false })}
                  className="sr-only"
                />
                <div>Full 12% on Actual Basic</div>
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                  Uncapped PF on total Basic Pay. Higher retirement corpus.
                </div>
              </label>
            </div>
          </div>

          {/* Section 2: Gratuity & NPS Policy */}
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
            <span className="font-semibold text-slate-900 block">Employer NPS (Section 80CCD(2))</span>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-800">Employer NPS Contribution</span>
                <p className="text-[10px] text-slate-500">Corporate retiral contribution up to 14% of Basic</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="14"
                  value={policy.employerNpsPercent}
                  onChange={(e) =>
                    onUpdatePolicy({
                      ...policy,
                      employerNpsEnabled: parseFloat(e.target.value) > 0,
                      employerNpsPercent: Math.max(0, Math.min(14, parseFloat(e.target.value) || 0)),
                    })
                  }
                  className="w-14 px-2 py-1 text-xs border border-slate-200 rounded font-mono text-right bg-white"
                />
                <span className="text-slate-500">% Basic</span>
              </div>
            </div>
          </div>

          {/* Section 3: Corporate Tax Profile & Surcharges */}
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2.5">
            <span className="font-semibold text-slate-900 block">
              Corporate Tax Regime & Surcharge Slab (Turnover-based)
            </span>

            <div>
              <label className="text-[10px] text-slate-500 block mb-0.5">Company Tax Profile</label>
              <select
                value={policy.corporateTaxProfile || 'sec_115baa'}
                onChange={(e) => handleProfileChange(e.target.value as CorporateTaxProfileType)}
                className="w-full px-2 py-1.5 text-xs font-semibold text-slate-900 border border-slate-200 rounded bg-white"
              >
                {Object.values(CORPORATE_TAX_PROFILES).map((prof) => (
                  <option key={prof.profile} value={prof.profile}>
                    {prof.name} — {prof.effectiveRate}%
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2 p-2 bg-white rounded border border-slate-200 text-center font-mono">
              <div>
                <span className="text-[9px] text-slate-400 block">Base Tax</span>
                <span className="font-bold text-slate-900">{policy.corporateBaseRate || 22}%</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block">Surcharge</span>
                <span className="font-bold text-slate-900">{policy.corporateSurchargeRate || 10}%</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block">4% HE Cess</span>
                <span className="font-bold text-slate-900">4%</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-600 font-medium">Effective Corporate Rate:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {policy.corporateTaxRate}%
              </span>
            </div>

            {/* RSU Cross Charge */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-800 font-medium">RSU Cross-Charging to Entity</span>
                <p className="text-[10px] text-slate-500">Makes RSU expense corporate tax-deductible u/s 37(1)</p>
              </div>
              <input
                type="checkbox"
                checked={policy.rsuCrossChargedToLocalEntity}
                onChange={(e) =>
                  onUpdatePolicy({
                    ...policy,
                    rsuCrossChargedToLocalEntity: e.target.checked,
                  })
                }
                className="rounded text-slate-900 w-4 h-4 cursor-pointer"
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};
