import React, { useState, useMemo } from 'react';
import { CompensationInputs, CompanyPolicy } from '../types';
import { computeCompensationBreakdown, computeNewTax, computeOldTax } from '../utils/taxCalculations';
import { formatINR, formatINRCompact } from '../utils/formatters';
import { TrendingUp, Activity, HelpCircle } from 'lucide-react';

interface Props {
  inputs: CompensationInputs;
  policy: CompanyPolicy;
}

interface DataPoint {
  ctc: number;
  newTakeHome: number;
  oldTakeHome: number;
  newTax: number;
  oldTax: number;
  newMarginalRate: number;
  newSurcharge: number;
  newRelief: number;
}

export const TaxSensitivityLineChart: React.FC<Props> = ({ inputs, policy }) => {
  const [chartMode, setChartMode] = useState<'takehome' | 'marginal'>('takehome');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Sample points across representative CTC levels from 6L to 1.5 Cr
  const dataPoints: DataPoint[] = useMemo(() => {
    const ctcValues = [
      600000, 800000, 1000000, 1200000, 1500000, 1800000, 2200000, 2600000,
      3000000, 3600000, 4200000, 4800000, 5000000, 5200000, 5500000, 6000000,
      7000000, 8000000, 9500000, 10000000, 10500000, 12000000, 15000000,
    ];

    return ctcValues.map((val) => {
      const mockInputs: CompensationInputs = {
        ...inputs,
        ctcAnnual: val,
      };
      const b = computeCompensationBreakdown(mockInputs, policy);
      const nTax = computeNewTax(b, mockInputs);
      const oTax = computeOldTax(b, mockInputs);

      return {
        ctc: val,
        newTakeHome: nTax.annualInHandSalary,
        oldTakeHome: oTax.annualInHandSalary,
        newTax: nTax.totalTaxLiabilityAnnual,
        oldTax: oTax.totalTaxLiabilityAnnual,
        newMarginalRate: nTax.effectiveTaxRatePercent,
        newSurcharge: nTax.surchargeAmount,
        newRelief: nTax.marginalRelief,
      };
    });
  }, [inputs, policy]);

  // Chart dimensions
  const width = 640;
  const height = 240;
  const padding = { top: 20, right: 30, bottom: 35, left: 55 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const minCTC = dataPoints[0].ctc;
  const maxCTC = dataPoints[dataPoints.length - 1].ctc;

  // Max and Min values for Y axis based on chart mode
  const yValues =
    chartMode === 'takehome'
      ? dataPoints.flatMap((d) => [d.newTakeHome, d.oldTakeHome])
      : dataPoints.flatMap((d) => [d.newMarginalRate]);

  const minY = 0;
  const maxY = Math.max(...yValues) * 1.05;

  const getX = (ctc: number) => {
    return padding.left + ((ctc - minCTC) / (maxCTC - minCTC)) * innerWidth;
  };

  const getY = (val: number) => {
    return padding.top + innerHeight - (val / maxY) * innerHeight;
  };

  // Generate SVG path strings
  const newPathD = useMemo(() => {
    return dataPoints.reduce((acc, pt, i) => {
      const x = getX(pt.ctc);
      const y = getY(chartMode === 'takehome' ? pt.newTakeHome : pt.newMarginalRate);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [dataPoints, chartMode, maxY]);

  const oldPathD = useMemo(() => {
    if (chartMode !== 'takehome') return '';
    return dataPoints.reduce((acc, pt, i) => {
      const x = getX(pt.ctc);
      const y = getY(pt.oldTakeHome);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [dataPoints, chartMode, maxY]);

  // Area under New Regime curve
  const areaD = useMemo(() => {
    if (chartMode !== 'takehome') return '';
    const firstX = getX(dataPoints[0].ctc);
    const lastX = getX(dataPoints[dataPoints.length - 1].ctc);
    const baseY = padding.top + innerHeight;
    return `${newPathD} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  }, [newPathD, chartMode]);

  // Current user's coordinate
  const userCTC = Math.min(maxCTC, Math.max(minCTC, inputs.ctcAnnual));
  const userX = getX(userCTC);
  const currentBreakdown = computeCompensationBreakdown(inputs, policy);
  const currentNewTax = computeNewTax(currentBreakdown, inputs);
  const currentOldTax = computeOldTax(currentBreakdown, inputs);
  const userYNew = getY(
    chartMode === 'takehome'
      ? currentNewTax.annualInHandSalary
      : currentNewTax.effectiveTaxRatePercent
  );

  // Active hover point
  const activePoint = hoverIndex !== null ? dataPoints[hoverIndex] : null;

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3" id="tax-line-graphics">
      {/* Header with Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Compensation & Tax Trajectory
          </h3>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <div className="bg-slate-100 p-0.5 rounded-lg flex items-center text-xs">
            <button
              type="button"
              onClick={() => setChartMode('takehome')}
              className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors ${
                chartMode === 'takehome'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Take-Home Pay
            </button>
            <button
              type="button"
              onClick={() => setChartMode('marginal')}
              className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-colors ${
                chartMode === 'marginal'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Effective Tax Rate & Relief
            </button>
          </div>
        </div>
      </div>

      {/* SVG Line Graph */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="takehomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0.25, 0.5, 0.75, 1].map((pct) => {
            const y = padding.top + innerHeight * (1 - pct);
            const val = maxY * pct;
            return (
              <g key={pct}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + innerWidth}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px] fill-slate-400 font-mono"
                >
                  {chartMode === 'takehome' ? formatINRCompact(val) : `${val.toFixed(0)}%`}
                </text>
              </g>
            );
          })}

          {/* Surcharge cliff zones (at ₹50L and ₹1Cr) */}
          <line
            x1={getX(5000000)}
            y1={padding.top}
            x2={getX(5000000)}
            y2={padding.top + innerHeight}
            stroke="#F59E0B"
            strokeDasharray="2 2"
            strokeWidth="1.2"
          />
          <text
            x={getX(5000000)}
            y={padding.top + 10}
            textAnchor="middle"
            className="text-[8px] fill-amber-600 font-bold"
          >
            ₹50L Surcharge
          </text>

          <line
            x1={getX(10000000)}
            y1={padding.top}
            x2={getX(10000000)}
            y2={padding.top + innerHeight}
            stroke="#F59E0B"
            strokeDasharray="2 2"
            strokeWidth="1.2"
          />
          <text
            x={getX(10000000)}
            y={padding.top + 10}
            textAnchor="middle"
            className="text-[8px] fill-amber-600 font-bold"
          >
            ₹1Cr Surcharge
          </text>

          {/* Area fill */}
          {chartMode === 'takehome' && <path d={areaD} fill="url(#takehomeGrad)" />}

          {/* Old Regime Line (Take-Home mode) */}
          {chartMode === 'takehome' && (
            <path
              d={oldPathD}
              fill="none"
              stroke="#6366F1"
              strokeWidth="2.2"
              strokeDasharray="4 2"
            />
          )}

          {/* New Regime Line */}
          <path
            d={newPathD}
            fill="none"
            stroke={chartMode === 'takehome' ? '#10B981' : '#6366F1'}
            strokeWidth="2.8"
          />

          {/* Current User CTC marker */}
          <line
            x1={userX}
            y1={padding.top}
            x2={userX}
            y2={padding.top + innerHeight}
            stroke="#0F172A"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <circle
            cx={userX}
            cy={userYNew}
            r="5"
            fill={chartMode === 'takehome' ? '#10B981' : '#6366F1'}
            stroke="#FFFFFF"
            strokeWidth="2"
            className="animate-pulse"
          />

          {/* Interactive hover columns */}
          {dataPoints.map((pt, i) => {
            const x = getX(pt.ctc);
            return (
              <rect
                key={pt.ctc}
                x={x - 12}
                y={padding.top}
                width="24"
                height={innerHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
              />
            );
          })}

          {/* Active Hover Marker */}
          {activePoint && (
            <g>
              <line
                x1={getX(activePoint.ctc)}
                y1={padding.top}
                x2={getX(activePoint.ctc)}
                y2={padding.top + innerHeight}
                stroke="#64748B"
                strokeWidth="1"
              />
              <circle
                cx={getX(activePoint.ctc)}
                cy={getY(
                  chartMode === 'takehome' ? activePoint.newTakeHome : activePoint.newMarginalRate
                )}
                r="4.5"
                fill="#0F172A"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            </g>
          )}

          {/* X Axis Labels */}
          {[1000000, 2500000, 5000000, 7500000, 10000000, 15000000].map((ctc) => (
            <text
              key={ctc}
              x={getX(ctc)}
              y={padding.top + innerHeight + 16}
              textAnchor="middle"
              className="text-[9px] fill-slate-500 font-mono"
            >
              ₹{formatINRCompact(ctc)}
            </text>
          ))}
        </svg>

        {/* Hover Floating Details Card */}
        {activePoint && (
          <div className="mt-2 p-2.5 bg-slate-900 text-white rounded-lg text-xs flex flex-wrap items-center justify-between gap-3 shadow-md font-mono">
            <div>
              <span className="text-slate-400">CTC:</span>{' '}
              <span className="font-bold text-white">₹{formatINRCompact(activePoint.ctc)}</span>
            </div>
            <div>
              <span className="text-emerald-400">New Take-Home:</span>{' '}
              <span className="font-bold">₹{formatINRCompact(activePoint.newTakeHome)}</span>
            </div>
            <div>
              <span className="text-indigo-300">Old Take-Home:</span>{' '}
              <span className="font-bold">₹{formatINRCompact(activePoint.oldTakeHome)}</span>
            </div>
            <div>
              <span className="text-slate-300">Eff. Tax:</span>{' '}
              <span className="font-bold">{activePoint.newMarginalRate.toFixed(1)}%</span>
            </div>
            {activePoint.newRelief > 0 && (
              <div className="text-amber-300">
                <span>Marginal Relief:</span>{' '}
                <span className="font-bold">₹{formatINRCompact(activePoint.newRelief)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Line Legend */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-emerald-500 rounded-full" />
            <span className="font-medium">New Tax Regime</span>
          </div>
          {chartMode === 'takehome' && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 bg-indigo-500 border-dashed border-t rounded-full" />
              <span className="font-medium">Old Tax Regime</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-900" />
            <span className="text-slate-500">Current Position (₹{formatINRCompact(inputs.ctcAnnual)})</span>
          </div>
        </div>

        {currentNewTax.marginalRelief > 0 && (
          <div className="text-[11px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Marginal Relief Active: +₹{Math.round(currentNewTax.marginalRelief).toLocaleString('en-IN')} saved
          </div>
        )}
      </div>
    </div>
  );
};
