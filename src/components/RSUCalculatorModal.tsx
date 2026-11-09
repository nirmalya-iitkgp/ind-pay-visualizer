import React, { useState } from 'react';
import { RSUTaxDetails, VestingScheduleType, DispositionAction } from '../types';
import { computeRSUTaxation } from '../utils/taxCalculations';
import { formatINR } from '../utils/formatters';
import {
  X,
  TrendingUp,
  Globe,
  Building,
  AlertTriangle,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  marginalTaxRate: number;
}

export const RSUCalculatorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  marginalTaxRate,
}) => {
  const [details, setDetails] = useState<RSUTaxDetails>({
    grantPriceUSD: 50,
    usdToInrRate: 85,
    fmvAtVestingUSD: 100,
    unitsVested: 200,
    totalGrantedUnits: 800,
    vestingDurationYears: 4,
    currentTaxYearNumber: 1,
    vestingScheduleType: 'graded_equal',
    holdingPeriodMonths: 18,
    salePriceUSD: 130,
    soldUnits: 200,
    dispositionAction: 'sell_all',
    isDomesticListed: false,
    isDPIITStartupEligible: false,
    deferralYearsLimit: 5,
    hasReloadFeature: false,
    reloadGrantRatioPercent: 100,
    reloadFMVUSD: 100,
    reloadVestingPeriodMonths: 12,
  });

  if (!isOpen) return null;

  const result = computeRSUTaxation(details, marginalTaxRate);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      id="rsu-modal-overlay"
    >
      <div
        id="rsu-modal-card"
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold tracking-tight">
              RSU & Startup ESOP Tax Engine
            </h2>
          </div>
          <button
            id="close-rsu-modal-btn"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-slate-700">
          
          {/* Equity Type & Startup Deferral */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Equity Classification
                </label>
                <div className="flex rounded-md border border-slate-200 bg-white p-0.5 font-medium">
                  <button
                    type="button"
                    onClick={() => setDetails({ ...details, isDomesticListed: false })}
                    className={`flex-1 py-1 rounded text-center ${
                      !details.isDomesticListed ? 'bg-slate-900 text-white font-bold' : 'text-slate-600'
                    }`}
                  >
                    Foreign / US MNC
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetails({ ...details, isDomesticListed: true })}
                    className={`flex-1 py-1 rounded text-center ${
                      details.isDomesticListed ? 'bg-slate-900 text-white font-bold' : 'text-slate-600'
                    }`}
                  >
                    Domestic Listed
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Vesting Schedule
                </label>
                <select
                  value={details.vestingScheduleType || 'graded_equal'}
                  onChange={(e) =>
                    setDetails({
                      ...details,
                      vestingScheduleType: e.target.value as VestingScheduleType,
                    })
                  }
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white"
                >
                  <option value="graded_equal">Graded Equal (25% / yr)</option>
                  <option value="graded_backloaded">Backloaded (5/15/40/40)</option>
                  <option value="cliff">100% Cliff Vest</option>
                </select>
              </div>
            </div>

            {/* Section 80-IAC / 192(1C) Startup ESOP Deferral */}
            <div className="pt-2 border-t border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={details.isDPIITStartupEligible || false}
                  onChange={(e) =>
                    setDetails({
                      ...details,
                      isDPIITStartupEligible: e.target.checked,
                    })
                  }
                  className="rounded text-slate-900 focus:ring-slate-400 w-3.5 h-3.5"
                />
                <span>Eligible DPIIT Startup ESOP (Section 80-IAC / Section 192(1C) TDS Deferral)</span>
              </label>
              <p className="text-[10px] text-slate-500 mt-0.5 ml-5">
                Defers Stage 1 TDS payment for up to 5 years (60 months) from end of FY, or until share sale / resignation.
              </p>
            </div>
          </div>

          {/* Core Grant Figures */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-lg border border-slate-200">
            <div>
              <label className="text-[10px] text-slate-500 block mb-0.5">Total Grant Units</label>
              <input
                type="number"
                min="1"
                value={details.totalGrantedUnits}
                onChange={(e) =>
                  setDetails({
                    ...details,
                    totalGrantedUnits: Math.max(1, parseInt(e.target.value, 10) || 1),
                  })
                }
                className="w-full px-2 py-1 border border-slate-200 rounded font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 block mb-0.5">FMV at Vesting (USD $)</label>
              <input
                type="number"
                min="1"
                value={details.fmvAtVestingUSD}
                onChange={(e) =>
                  setDetails({
                    ...details,
                    fmvAtVestingUSD: Math.max(0.1, parseFloat(e.target.value) || 1),
                  })
                }
                className="w-full px-2 py-1 border border-slate-200 rounded font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 block mb-0.5">USD to INR Rate</label>
              <input
                type="number"
                min="1"
                value={details.usdToInrRate}
                onChange={(e) =>
                  setDetails({
                    ...details,
                    usdToInrRate: Math.max(1, parseFloat(e.target.value) || 85),
                  })
                }
                className="w-full px-2 py-1 border border-slate-200 rounded font-mono"
              />
            </div>
          </div>

          {/* Stage 1: Vesting Perquisite & TDS */}
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
            <div className="flex items-center justify-between font-semibold text-slate-800">
              <span>Stage 1: Current FY Vesting Perquisite</span>
              <span className="font-mono text-slate-900">{formatINR(result.perquisiteValueINR)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Units Vesting this FY:</span>
                <span className="font-mono font-bold text-slate-900">{result.unitsVestingCurrentFY} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Perquisite TDS ({marginalTaxRate}% slab):</span>
                <span className="font-mono font-bold text-slate-900">{formatINR(result.perquisiteTaxINR)}</span>
              </div>
            </div>

            {result.isTdsDeferred ? (
              <div className="mt-1.5 p-2 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded text-[11px] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>TDS Deferred:</strong> Current cash withholding is <strong>₹0</strong> (deferred under Sec 192(1C)).
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-[10px] text-slate-500">
                Withheld at payroll as Stage 1 TDS during vesting month.
              </div>
            )}
          </div>

          {/* Stage 2: Sale & Capital Gains */}
          <div className="p-3 rounded-lg border border-slate-200 space-y-2">
            <div className="flex items-center justify-between font-semibold text-slate-800">
              <span>Stage 2: Capital Gains at Liquidation</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  result.isDisqualifyingDisposition
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-emerald-100 text-emerald-900'
                }`}
              >
                {result.isDisqualifyingDisposition ? 'Disqualifying STCG' : 'Qualifying LTCG'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Disposition</label>
                <select
                  value={details.dispositionAction || 'sell_all'}
                  onChange={(e) =>
                    setDetails({
                      ...details,
                      dispositionAction: e.target.value as DispositionAction,
                    })
                  }
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white"
                >
                  <option value="sell_all">Sell 100%</option>
                  <option value="hold">Hold All</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Sale Price ($)</label>
                <input
                  type="number"
                  min="0"
                  value={details.salePriceUSD}
                  onChange={(e) =>
                    setDetails({
                      ...details,
                      salePriceUSD: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                  className="w-full px-2 py-1 border border-slate-200 rounded font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 block mb-0.5">Holding Months</label>
                <input
                  type="number"
                  min="0"
                  value={details.holdingPeriodMonths}
                  onChange={(e) =>
                    setDetails({
                      ...details,
                      holdingPeriodMonths: Math.max(0, parseFloat(e.target.value) || 0),
                    })
                  }
                  className="w-full px-2 py-1 border border-slate-200 rounded font-mono"
                />
              </div>
            </div>

            {result.capitalGainsINR > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[11px] font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Capital Gains:</span>
                  <span className="font-bold text-slate-900">{formatINR(result.capitalGainsINR)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tax ({result.capitalGainsTaxRatePercent}%):</span>
                  <span className="font-bold text-slate-900">{formatINR(result.capitalGainsTaxINR)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Net Realized Realization */}
          <div className="p-3 rounded-lg bg-slate-900 text-white flex items-center justify-between font-mono">
            <div>
              <div className="text-[10px] text-slate-400 uppercase">Net Realized Value</div>
              <div className="text-base font-bold text-emerald-400">
                {formatINR(result.netRealizedGainINR)}
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-400">
              <div>Total Tax: {formatINR(result.totalTaxPaidINR)}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
