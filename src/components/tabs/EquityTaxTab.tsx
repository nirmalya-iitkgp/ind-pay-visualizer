import React, { useState } from 'react';
import { RSUTaxDetails } from '../../types';
import { computeRSUTaxation } from '../../utils/taxCalculations';
import { formatINR } from '../../utils/formatters';
import { TrendingUp, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';

interface Props {
  marginalTaxRate: number;
}

export const EquityTaxTab: React.FC<Props> = ({ marginalTaxRate }) => {
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
  });

  const result = computeRSUTaxation(details, marginalTaxRate);

  // SVG Vesting Timeline Graphic
  const svgW = 560;
  const svgH = 110;
  const pad = { left: 40, right: 40, y: 55 };
  const lineW = svgW - pad.left - pad.right;

  const years = [1, 2, 3, 4];
  const unitsPerYear = Math.round(details.totalGrantedUnits / 4);

  return (
    <div className="space-y-4 max-w-4xl mx-auto" id="equity-tax-tab">
      {/* Intro Box */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>RSU & Startup ESOP Stock Taxation</span>
        </div>
        <p className="text-xs text-slate-600">
          Indian tax law taxes employee stock in two separate stages: when shares vest (Salary TDS), and when shares are sold (Capital Gains).
        </p>
      </div>

      {/* Grant Setup Controls */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
        <h3 className="text-xs font-bold text-slate-900">1. Your Stock Grant Details</h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Total Granted Units
            </label>
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
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              FMV at Vesting (USD $)
            </label>
            <input
              type="number"
              min="1"
              value={details.fmvAtVestingUSD}
              onChange={(e) =>
                setDetails({
                  ...details,
                  fmvAtVestingUSD: Math.max(1, parseFloat(e.target.value) || 1),
                })
              }
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              USD/INR Exchange Rate
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
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-600 block mb-1">
              Stock Type
            </label>
            <select
              value={details.isDomesticListed ? 'domestic' : 'foreign'}
              onChange={(e) =>
                setDetails({
                  ...details,
                  isDomesticListed: e.target.value === 'domestic',
                })
              }
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-xs font-semibold"
            >
              <option value="foreign">Foreign / US MNC</option>
              <option value="domestic">Indian Listed</option>
            </select>
          </div>
        </div>

        {/* DPIIT Startup ESOP Deferral Toggle */}
        <div className="pt-2 border-t border-slate-100">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={details.isDPIITStartupEligible || false}
              onChange={(e) =>
                setDetails({
                  ...details,
                  isDPIITStartupEligible: e.target.checked,
                })
              }
              className="w-4 h-4 rounded text-slate-900 focus:ring-slate-400"
            />
            <span>DPIIT Startup Provision (Section 80-IAC / Section 192(1C) ESOP Tax Deferral)</span>
          </label>
          <p className="text-[11px] text-slate-500 ml-6 mt-0.5">
            Defers TDS payment on stock options for up to 5 years (60 months) from end of FY, or until you sell / leave the startup.
          </p>
        </div>
      </div>

      {/* Line Graphic: 4-Year Vesting Timeline */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              4-Year Vesting Milestone Line
            </h3>
            <p className="text-[11px] text-slate-500">
              Each milestone triggers Stage 1 salary perquisite tax
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700">
            {unitsPerYear} units / year
          </span>
        </div>

        <div className="w-full overflow-hidden">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto select-none">
            {/* Timeline base line */}
            <line
              x1={pad.left}
              y1={pad.y}
              x2={pad.left + lineW}
              y2={pad.y}
              stroke="#E2E8F0"
              strokeWidth="3"
            />

            {/* Active completed segment for year 1 */}
            <line
              x1={pad.left}
              y1={pad.y}
              x2={pad.left + lineW * 0.25}
              y2={pad.y}
              stroke="#10B981"
              strokeWidth="3"
            />

            {/* Milestone points */}
            {years.map((yr, idx) => {
              const cx = pad.left + (idx / 3) * lineW;
              const isCurrent = yr === 1;
              return (
                <g key={yr}>
                  <circle
                    cx={cx}
                    cy={pad.y}
                    r={isCurrent ? 7 : 5}
                    fill={isCurrent ? '#10B981' : '#94A3B8'}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  <text
                    x={cx}
                    y={pad.y - 14}
                    textAnchor="middle"
                    className="text-[10px] font-bold fill-slate-800"
                  >
                    Year {yr} ({25}%)
                  </text>
                  <text
                    x={cx}
                    y={pad.y + 20}
                    textAnchor="middle"
                    className="text-[10px] font-mono fill-slate-500"
                  >
                    {unitsPerYear} units
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Stage 1 & Stage 2 Tax Realization Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Stage 1: Vesting */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-900">
            <span>Stage 1: Vesting Perquisite Tax</span>
            <span className="font-mono text-emerald-700">{formatINR(result.perquisiteValueINR)}</span>
          </div>
          <div className="text-xs text-slate-600">
            Perquisite value = {result.unitsVestingCurrentFY} units × ${details.fmvAtVestingUSD} × ₹{details.usdToInrRate}
          </div>

          {result.isTdsDeferred ? (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong>TDS is Deferred: ₹0 paid today!</strong>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Under Section 192(1C), tax payment of {formatINR(result.perquisiteTaxINR)} is deferred for up to 5 years or until you sell.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-xs font-mono text-rose-800 bg-rose-50 p-2 rounded border border-rose-200 flex justify-between">
              <span>Payroll TDS Withheld:</span>
              <span className="font-bold">{formatINR(result.perquisiteTaxINR)}</span>
            </div>
          )}
        </div>

        {/* Stage 2: Sale & Capital Gains */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-900">
            <span>Stage 2: Capital Gains upon Sale</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 font-mono">
              {details.holdingPeriodMonths}m holding
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
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

          <div className="p-2 rounded bg-slate-50 text-xs font-mono flex justify-between border border-slate-100">
            <span className="text-slate-600">Capital Gains Tax:</span>
            <span className="font-bold text-slate-900">{formatINR(result.capitalGainsTaxINR)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
