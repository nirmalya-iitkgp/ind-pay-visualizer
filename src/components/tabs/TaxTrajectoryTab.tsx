import React, { useState } from 'react';
import { CompensationInputs, CompanyPolicy } from '../../types';
import { TaxSensitivityLineChart } from '../TaxSensitivityLineChart';
import { formatINR, formatINRCompact } from '../../utils/formatters';
import { TrendingUp, ShieldAlert, Check } from 'lucide-react';

interface Props {
  inputs: CompensationInputs;
  policy: CompanyPolicy;
  onChangeInputs: (inputs: CompensationInputs) => void;
}

export const TaxTrajectoryTab: React.FC<Props> = ({
  inputs,
  policy,
  onChangeInputs,
}) => {
  const [targetCTC, setTargetCTC] = useState<number>(inputs.ctcAnnual);

  return (
    <div className="space-y-4 max-w-4xl mx-auto" id="tax-trajectory-tab">
      {/* Overview Card */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>Salary Growth, Surcharges & Marginal Relief</span>
        </div>
        <p className="text-xs text-slate-600">
          Explore how your tax rate and monthly in-hand cash change as your package grows from ₹6 Lakhs to ₹1.5 Crores.
        </p>
      </div>

      {/* Main Interactive Line Graphic */}
      <TaxSensitivityLineChart inputs={inputs} policy={policy} />

      {/* Layman Guide: Surcharges and Marginal Relief Cliff Smoothing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Surcharges */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            High-Earner Surcharges (Above ₹50L)
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            In India, when your taxable income crosses ₹50 Lakhs, the government charges a <strong>surcharge</strong> on top of your income tax:
          </p>
          <ul className="text-xs space-y-1 font-mono text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-100">
            <li>• ₹50L to ₹1 Crore: +10% surcharge on tax</li>
            <li>• ₹1 Cr to ₹2 Crores: +15% surcharge on tax</li>
            <li>• Above ₹2 Crores: +25% surcharge on tax</li>
          </ul>
        </div>

        {/* Marginal Relief */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            How "Marginal Relief" Protects You
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Without relief, earning ₹50,50,000 would trigger a sudden 10% tax surcharge on your <em>entire</em> tax bill, making you pay more than the extra ₹50,000 you earned!
          </p>
          <p className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded border border-emerald-200 leading-relaxed font-medium">
            <strong>The Legal Protection:</strong> Section 115BAC includes a statutory rule: the extra tax you pay can never exceed the extra income you earned over ₹50 Lakhs. The calculator automatically computes this relief.
          </p>
        </div>
      </div>

      {/* Future Package Simulator Slider */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-900">Simulate a Future Promotion or Offer</span>
          <span className="font-mono font-extrabold text-sm text-slate-900">
            {formatINR(inputs.ctcAnnual)}
          </span>
        </div>

        <input
          type="range"
          min="600000"
          max="15000000"
          step="200000"
          value={inputs.ctcAnnual}
          onChange={(e) =>
            onChangeInputs({
              ...inputs,
              ctcAnnual: parseFloat(e.target.value),
            })
          }
          className="w-full accent-slate-900 h-2 bg-slate-200 rounded-lg cursor-pointer"
        />

        <div className="flex justify-between text-[11px] font-mono text-slate-400">
          <span>₹6 LPA</span>
          <span>₹25 LPA</span>
          <span>₹50 LPA (Surcharge)</span>
          <span>₹1 Crore</span>
          <span>₹1.5 Crore</span>
        </div>
      </div>
    </div>
  );
};
