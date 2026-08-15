import React, { useState } from 'react';
import { RSUTaxDetails, VestingScheduleType, DispositionAction } from '../types';
import { computeRSUTaxation } from '../utils/taxCalculations';
import { formatINR } from '../utils/formatters';
import {
  X,
  TrendingUp,
  Globe,
  Building,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
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
    isDomesticListed: false, // default foreign RSU
    hasReloadFeature: false,
    reloadGrantRatioPercent: 100,
    reloadFMVUSD: 100,
    reloadVestingPeriodMonths: 12,
  });

  if (!isOpen) return null;

  const result = computeRSUTaxation(details, marginalTaxRate);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
      id="rsu-modal-overlay"
    >
      <div
        id="rsu-modal-card"
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Advanced RSU & Equity Tax Architecture Modeler
              </h2>
              <p className="text-xs text-slate-300">
                Vesting Schedules • Reload Grants • Disqualifying Dispositions • FY 2024-25 / 2025-26 Tax Rules
              </p>
            </div>
          </div>
          <button
            id="close-rsu-modal-btn"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-sm text-slate-700">
          {/* 1. Equity Classification & Grant Fundamentals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="font-semibold text-xs text-slate-900 block mb-1">
                Equity Classification
              </span>
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setDetails({ ...details, isDomesticListed: false })}
                  className={`flex-1 py-1 rounded-md flex items-center justify-center gap-1 ${
                    !details.isDomesticListed
                      ? 'bg-slate-900 text-white shadow-xs font-bold'
                      : 'text-slate-600'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  Foreign / MNC (US RSU)
                </button>
                <button
                  type="button"
                  onClick={() => setDetails({ ...details, isDomesticListed: true })}
                  className={`flex-1 py-1 rounded-md flex items-center justify-center gap-1 ${
                    details.isDomesticListed
                      ? 'bg-slate-900 text-white shadow-xs font-bold'
                      : 'text-slate-600'
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  Domestic (NSE/BSE)
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {details.isDomesticListed
                  ? 'LTCG threshold: 12 months (12.5% tax with ₹1.25L exemption)'
                  : 'LTCG threshold: 24 months (12.5% tax; STCG taxed at income slab rate)'}
              </p>
            </div>

            <div>
              <span className="font-semibold text-xs text-slate-900 block mb-1">
                Vesting Schedule Type
              </span>
              <select
                value={details.vestingScheduleType || 'graded_equal'}
                onChange={(e) =>
                  setDetails({
                    ...details,
                    vestingScheduleType: e.target.value as VestingScheduleType,
                  })
                }
                className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-900 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-slate-900"
              >
                <option value="graded_equal">Graded Equal (e.g. 25% / 25% / 25% / 25%)</option>
                <option value="graded_backloaded">Graded Backloaded (Amazon style: 5% / 15% / 40% / 40%)</option>
                <option value="cliff">100% Cliff Vest (All at once after N years)</option>
              </select>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-600">
                <span>Duration:</span>
                <select
                  value={details.vestingDurationYears || 4}
                  onChange={(e) =>
                    setDetails({
                      ...details,
                      vestingDurationYears: parseInt(e.target.value, 10),
                    })
                  }
                  className="px-1.5 py-0.5 border border-slate-200 rounded text-xs bg-white font-bold"
                >
                  <option value={1}>1 Year</option>
                  <option value={2}>2 Years</option>
                  <option value={3}>3 Years</option>
                  <option value={4}>4 Years</option>
                  <option value={5}>5 Years</option>
                </select>
                <span>Current FY Year:</span>
                <select
                  value={details.currentTaxYearNumber || 1}
                  onChange={(e) =>
                    setDetails({
                      ...details,
                      currentTaxYearNumber: parseInt(e.target.value, 10),
                    })
                  }
                  className="px-1.5 py-0.5 border border-slate-200 rounded text-xs bg-white font-bold"
                >
                  {Array.from({ length: details.vestingDurationYears || 4 }).map((_, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      Year {idx + 1}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 2. Core Numbers (Grant, FMV, Units, Conversion) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Total Grant Units
              </label>
              <input
                type="number"
                min="1"
                value={details.totalGrantedUnits || details.unitsVested}
                onChange={(e) =>
                  setDetails({
                    ...details,
                    totalGrantedUnits: Math.max(1, parseFloat(e.target.value) || 0),
                  })
                }
                className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                FMV at Vesting (USD $)
              </label>
              <input
                type="number"
                min="0"
                value={details.fmvAtVestingUSD}
                onChange={(e) =>
                  setDetails({
                    ...details,
                    fmvAtVestingUSD: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                USD/INR Rate (SBI TT)
              </label>
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
                className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                Units Vesting in FY
              </label>
              <div className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-200 rounded-lg bg-slate-100 font-mono text-slate-900">
                {result.unitsVestingCurrentFY} units
              </div>
            </div>
          </div>

          {/* 3. Multi-Year Vesting Schedule Timeline Visualizer */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                Vesting Schedule Progression & Perquisite Values
              </span>
              <span className="text-[10px] text-slate-500">
                Current Year: <strong className="text-indigo-700">Year {details.currentTaxYearNumber || 1}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {result.vestingScheduleBreakdown.map((item) => (
                <div
                  key={item.year}
                  className={`p-2.5 rounded-lg border text-xs ${
                    item.isCurrentTaxYear
                      ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-400'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className={item.isCurrentTaxYear ? 'text-indigo-900' : 'text-slate-700'}>
                      Year {item.year}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 font-mono">
                      {item.vestPercentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1 font-mono">
                    {item.unitsVesting.toFixed(0)} units
                  </div>
                  <div className="text-[11px] font-bold text-slate-900 mt-0.5">
                    {formatINR(item.perquisiteINR)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Liquidation, Holding Period & Disqualifying Disposition */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                Liquidation, Holding Period & Disqualifying Disposition Check
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  result.isDisqualifyingDisposition
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}
              >
                {result.isDisqualifyingDisposition ? 'Disqualifying Early Sale (STCG)' : 'Qualifying LTCG Holding'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Liquidation Action
                </label>
                <select
                  value={details.dispositionAction || 'sell_all'}
                  onChange={(e) =>
                    setDetails({
                      ...details,
                      dispositionAction: e.target.value as DispositionAction,
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-900 border border-slate-300 rounded-md bg-white"
                >
                  <option value="sell_all">Sell 100% of Vested Units</option>
                  <option value="sell_partial">Sell Partial Units</option>
                  <option value="hold_all">Hold All (Zero Current Sale)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Sale Price (USD $)
                </label>
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
                  className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Holding Duration (Months)
                </label>
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
                  className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-md"
                />
              </div>
            </div>

            {result.isDisqualifyingDisposition && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Disqualifying Disposition Triggered: </strong>
                  Holding period of {details.holdingPeriodMonths} months is below the{' '}
                  {details.isDomesticListed ? '12-month' : '24-month'} statutory threshold. Gains of{' '}
                  {formatINR(result.capitalGainsINR)} are taxed at your slab rate (
                  {result.capitalGainsTaxRatePercent}%) rather than the concessional 12.5% LTCG rate, resulting in{' '}
                  <strong>{formatINR(result.disqualifyingTaxPenaltyINR)}</strong> higher tax outlay.
                </div>
              </div>
            )}
          </div>

            {/* 5. Reload RSU Feature Configuration */}
          <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-purple-950 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={details.hasReloadFeature || false}
                  onChange={(e) => setDetails({ ...details, hasReloadFeature: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <span>Enable Reload RSU Feature (Tax-Withheld Shares Auto-Regrant)</span>
              </label>
              <span className="text-[10px] bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded font-bold">
                Executive Tech Compensation
              </span>
            </div>

            {details.hasReloadFeature && (
              <div className="pt-2 border-t border-purple-200 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] font-semibold text-purple-900 block mb-1">
                      Reload Grant Ratio (%)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={details.reloadGrantRatioPercent || 100}
                      onChange={(e) =>
                        setDetails({
                          ...details,
                          reloadGrantRatioPercent: parseFloat(e.target.value) || 100,
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-purple-300 rounded bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-purple-900 block mb-1">
                      Reload Grant FMV (USD $)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={details.reloadFMVUSD || details.fmvAtVestingUSD}
                      onChange={(e) =>
                        setDetails({
                          ...details,
                          reloadFMVUSD: parseFloat(e.target.value) || details.fmvAtVestingUSD,
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-purple-300 rounded bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-purple-900 block mb-1">
                      Reload Vesting (Months)
                    </label>
                    <input
                      type="number"
                      min="6"
                      value={details.reloadVestingPeriodMonths || 12}
                      onChange={(e) =>
                        setDetails({
                          ...details,
                          reloadVestingPeriodMonths: parseFloat(e.target.value) || 12,
                        })
                      }
                      className="w-full px-2 py-1 text-xs border border-purple-300 rounded bg-white"
                    />
                  </div>
                </div>

                <div className="p-2 rounded bg-white/80 border border-purple-200 text-[11px] text-purple-900 leading-relaxed">
                  <RefreshCw className="w-3.5 h-3.5 inline mr-1 text-purple-700" />
                  {result.reloadExplanation}
                </div>
              </div>
            )}
          </div>

          {/* 6. Dual-Stage Tax Results Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Stage 1: Vesting Perquisite */}
            <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wide text-amber-900">
                  Stage 1: At Vesting (Payroll TDS)
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-bold">
                  Perquisite
                </span>
              </div>

              <div className="text-xl font-black text-amber-950 font-mono">
                {formatINR(result.perquisiteValueINR)}
              </div>
              <p className="text-[11px] text-amber-800">
                Taxed as salary perquisite at your marginal slab rate ({marginalTaxRate}%).
              </p>

              <div className="pt-2 border-t border-amber-200 flex justify-between text-xs font-bold text-amber-950">
                <span>Perquisite TDS Withheld:</span>
                <span className="font-mono">{formatINR(result.perquisiteTaxINR)}</span>
              </div>
            </div>

            {/* Stage 2: Sale & Capital Gains */}
            <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/90 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wide text-emerald-900">
                  Stage 2: At Sale (Capital Gains)
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold">
                  {result.isLTCG ? 'LTCG' : 'STCG'} ({result.capitalGainsTaxRatePercent}%)
                </span>
              </div>

              <div className="text-xl font-black text-emerald-950 font-mono">
                {formatINR(result.capitalGainsINR)}
              </div>
              <p className="text-[11px] text-emerald-800">
                Capital gain calculated over ₹{result.costOfAcquisitionPerUnitINR.toFixed(0)}/unit cost basis.
              </p>

              <div className="pt-2 border-t border-emerald-200 flex justify-between text-xs font-bold text-emerald-950">
                <span>Capital Gains Tax:</span>
                <span className="font-mono">{formatINR(result.capitalGainsTaxINR)}</span>
              </div>
            </div>
          </div>

          {/* 7. Overall Realized Net Gain Banner */}
          <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                Total Realized Cash / Value from RSU Grant
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-0.5">
                {formatINR(result.netRealizedGainINR)}
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="text-slate-400">Total Tax Paid (Stage 1 + Stage 2)</div>
              <div className="text-base font-bold text-rose-400 font-mono mt-0.5">
                {formatINR(result.totalTaxPaidINR)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs"
          >
            Close Modeler
          </button>
        </div>
      </div>
    </div>
  );
};
