import React, { useState } from 'react';
import { CompensationInputs, IndianState, CityTier } from '../types';
import { STATE_PT_CONFIGS, CITY_HRA_NUANCES } from '../utils/constants';
import { formatINR, formatINRCompact, sanitizeNumber } from '../utils/formatters';
import {
  MapPin,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Props {
  inputs: CompensationInputs;
  onChange: (inputs: CompensationInputs) => void;
  unallocatedSpillover: number;
  isOverAllocated: boolean;
}

const QUICK_CTC_PRESETS = [
  { label: '6L', value: 600000 },
  { label: '12L', value: 1200000 },
  { label: '18L', value: 1800000 },
  { label: '25L', value: 2500000 },
  { label: '50L', value: 5000000 },
  { label: '1Cr', value: 10000000 },
];

export const CompensationInputsPanel: React.FC<Props> = ({
  inputs,
  onChange,
  unallocatedSpillover,
  isOverAllocated,
}) => {
  const [showAllowances, setShowAllowances] = useState(false);
  const [showNPS, setShowNPS] = useState(false);
  const [showOldDeductions, setShowOldDeductions] = useState(false);
  const [showEquity, setShowEquity] = useState(false);

  const handleNumericChange = (key: keyof CompensationInputs, value: number) => {
    onChange({
      ...inputs,
      [key]: sanitizeNumber(value, 0),
    });
  };

  const currentStatePTConfig = STATE_PT_CONFIGS[inputs.state || 'karnataka'] || STATE_PT_CONFIGS.other;

  const handleStateChange = (newState: IndianState) => {
    const matchedCity = CITY_HRA_NUANCES.find((c) => c.state === newState);
    const newTier = matchedCity ? matchedCity.cityTier : 'non-metro';
    const newCityName = matchedCity ? matchedCity.cityName : 'Other City';
    const ptConfig = STATE_PT_CONFIGS[newState] || STATE_PT_CONFIGS.other;

    onChange({
      ...inputs,
      state: newState,
      cityTier: newTier,
      selectedCity: newCityName,
      professionalTaxAnnual: ptConfig.defaultAnnualTax,
      customProfessionalTaxOverride: false,
    });
  };

  const handleCityChange = (cityName: string) => {
    const city = CITY_HRA_NUANCES.find((c) => c.cityName === cityName);
    if (city) {
      const ptConfig = STATE_PT_CONFIGS[city.state] || STATE_PT_CONFIGS.other;
      onChange({
        ...inputs,
        state: city.state,
        cityTier: city.cityTier,
        selectedCity: city.cityName,
        professionalTaxAnnual: ptConfig.defaultAnnualTax,
      });
    } else {
      onChange({
        ...inputs,
        selectedCity: cityName,
      });
    }
  };

  return (
    <div className="space-y-3" id="compensation-inputs-panel">
      {/* 1. Total CTC */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <label htmlFor="ctc-input" className="text-xs font-semibold text-slate-700">
            Annual Cost to Company (CTC)
          </label>
          <span className="text-xs font-mono font-bold text-emerald-800">
            {formatINR(inputs.ctcAnnual)}
          </span>
        </div>

        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">
            ₹
          </span>
          <input
            id="ctc-input"
            type="number"
            min="100000"
            step="50000"
            value={inputs.ctcAnnual}
            onChange={(e) => handleNumericChange('ctcAnnual', parseFloat(e.target.value))}
            className="w-full pl-7 pr-3 py-1.5 text-base font-bold text-slate-900 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-400"
            placeholder="1800000"
          />
        </div>

        <div className="flex flex-wrap gap-1">
          {QUICK_CTC_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handleNumericChange('ctcAnnual', preset.value)}
              className={`px-2 py-0.5 text-xs font-semibold rounded border transition-colors ${
                inputs.ctcAnnual === preset.value
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. State & Location */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            Work Location & Professional Tax
          </span>
          <span className="font-mono text-slate-500 text-[11px]">
            PT: ₹{currentStatePTConfig.defaultAnnualTax}/yr
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="state-select" className="text-[10px] text-slate-500 block mb-0.5">
              State
            </label>
            <select
              id="state-select"
              value={inputs.state || 'karnataka'}
              onChange={(e) => handleStateChange(e.target.value as IndianState)}
              className="w-full px-2 py-1.5 text-xs font-semibold text-slate-900 border border-slate-200 rounded-md bg-slate-50"
            >
              {Object.values(STATE_PT_CONFIGS).map((cfg) => (
                <option key={cfg.state} value={cfg.state}>
                  {cfg.stateName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="city-select" className="text-[10px] text-slate-500 block mb-0.5">
              City / Tech Hub
            </label>
            <select
              id="city-select"
              value={inputs.selectedCity || 'Bangalore (Bengaluru)'}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full px-2 py-1.5 text-xs font-semibold text-slate-900 border border-slate-200 rounded-md bg-slate-50 truncate"
            >
              {CITY_HRA_NUANCES.map((city) => (
                <option key={city.cityName} value={city.cityName}>
                  {city.cityName} ({city.cityTier === 'metro' ? '50% Metro' : '40% Non-Metro'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. Basic & HRA Distribution */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        {/* Basic Pay */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Basic Pay</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px] font-mono">
                {formatINR((inputs.ctcAnnual * inputs.basicPercentOfCTC) / 100)}/yr
              </span>
              <span className="font-bold text-slate-900">{inputs.basicPercentOfCTC}%</span>
            </div>
          </div>
          <input
            type="range"
            min="20"
            max="70"
            step="1"
            value={inputs.basicPercentOfCTC}
            onChange={(e) => handleNumericChange('basicPercentOfCTC', parseFloat(e.target.value))}
            className="w-full accent-slate-800 h-1.5 bg-slate-200 rounded cursor-pointer"
          />
        </div>

        {/* HRA */}
        <div className="space-y-1 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">HRA (% of Basic)</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px] font-mono">
                {formatINR((((inputs.ctcAnnual * inputs.basicPercentOfCTC) / 100) * inputs.hraPercentOfBasic) / 100)}/yr
              </span>
              <span className="font-bold text-slate-900">{inputs.hraPercentOfBasic}%</span>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="60"
            step="5"
            value={inputs.hraPercentOfBasic}
            onChange={(e) => handleNumericChange('hraPercentOfBasic', parseFloat(e.target.value))}
            className="w-full accent-slate-800 h-1.5 bg-slate-200 rounded cursor-pointer"
          />
        </div>

        {/* Rent input for HRA exemption */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
          <label className="text-slate-600 font-medium shrink-0">Rent Paid (₹/mo):</label>
          <input
            type="number"
            min="0"
            step="1000"
            value={inputs.monthlyRentPaid}
            onChange={(e) => handleNumericChange('monthlyRentPaid', parseFloat(e.target.value))}
            className="w-32 px-2 py-1 text-xs font-semibold text-right border border-slate-200 rounded-md bg-slate-50"
            placeholder="25000"
          />
        </div>

        {/* Auto Spillover */}
        <div
          className={`p-2 rounded-md text-xs flex items-center justify-between ${
            isOverAllocated
              ? 'bg-rose-50 text-rose-900 border border-rose-200'
              : 'bg-slate-50 text-slate-800 border border-slate-200'
          }`}
        >
          <span className="font-medium">
            {isOverAllocated ? 'Over-Allocated!' : 'Special Allowance (Spillover):'}
          </span>
          <span className="font-mono font-bold">{formatINR(unallocatedSpillover)}</span>
        </div>
      </div>

      {/* 4. Allowances: LTA, Meal Coupons & Flexi */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAllowances(!showAllowances)}
          className="w-full p-3 text-xs font-semibold text-slate-800 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <span>Tax-Free Allowances (LTC, Meal Coupons, Flexi)</span>
          {showAllowances ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
        </button>

        {showAllowances && (
          <div className="p-3.5 space-y-2.5 text-xs border-t border-slate-100 bg-slate-50/50">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-600 block mb-0.5">
                  LTC / Leave Travel (Sec 10(5))
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={inputs.ltaAnnual}
                  onChange={(e) => handleNumericChange('ltaAnnual', parseFloat(e.target.value))}
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white font-mono"
                  placeholder="60000"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-600 block mb-0.5">
                  Meal Coupons (₹2.2k/mo = ₹26.4k/yr)
                </label>
                <input
                  type="number"
                  min="0"
                  step="2400"
                  value={inputs.foodCouponAnnual}
                  onChange={(e) => handleNumericChange('foodCouponAnnual', parseFloat(e.target.value))}
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white font-mono"
                  placeholder="26400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-600 block mb-0.5">
                  Annual Variable / Bonus (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={inputs.variablePayAnnual}
                  onChange={(e) => handleNumericChange('variablePayAnnual', parseFloat(e.target.value))}
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white font-mono"
                  placeholder="150000"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-600 block mb-0.5">
                  Books & Communication (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={inputs.booksAndPeriodicalsAnnual + inputs.communicationAnnual}
                  onChange={(e) => {
                    const half = parseFloat(e.target.value) / 2;
                    onChange({
                      ...inputs,
                      booksAndPeriodicalsAnnual: sanitizeNumber(half, 0),
                      communicationAnnual: sanitizeNumber(half, 0),
                    });
                  }}
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white font-mono"
                  placeholder="48000"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. NPS Employee Contribution (Tier-I & Tier-II) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowNPS(!showNPS)}
          className="w-full p-3 text-xs font-semibold text-slate-800 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <span>NPS Employee Contributions (Tier-I & Tier-II)</span>
          {showNPS ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
        </button>

        {showNPS && (
          <div className="p-3.5 space-y-2.5 text-xs border-t border-slate-100 bg-slate-50/50">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-600 block mb-0.5">
                  Tier-I Self Contribution (0-10% Basic)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="1"
                  value={inputs.employeeNpsTier1Percent || 0}
                  onChange={(e) => handleNumericChange('employeeNpsTier1Percent', parseFloat(e.target.value))}
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white font-mono"
                  placeholder="0"
                />
                <span className="text-[10px] text-slate-400">Deductible u/s 80CCD(1)</span>
              </div>

              <div>
                <label className="text-[10px] text-slate-600 block mb-0.5">
                  Tier-II Liquid Investment (₹/year)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={inputs.employeeNpsTier2Annual || 0}
                  onChange={(e) => handleNumericChange('employeeNpsTier2Annual', parseFloat(e.target.value))}
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white font-mono"
                  placeholder="0"
                />
                <span className="text-[10px] text-slate-400">Voluntary liquid wealth layer</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. Equity & RSUs */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowEquity(!showEquity)}
          className="w-full p-3 text-xs font-semibold text-slate-800 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <span>Equity & RSUs in CTC</span>
          {showEquity ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
        </button>

        {showEquity && (
          <div className="p-3.5 space-y-2 text-xs border-t border-slate-100 bg-slate-50/50">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-600 block mb-0.5">
                  Vested RSUs (Current FY) (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  value={inputs.rsuVestedValueAnnual}
                  onChange={(e) => handleNumericChange('rsuVestedValueAnnual', parseFloat(e.target.value))}
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white font-mono"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-600 block mb-0.5">
                  Unvested RSU Grant (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  value={inputs.rsuUnvestedGrantAnnual}
                  onChange={(e) => handleNumericChange('rsuUnvestedGrantAnnual', parseFloat(e.target.value))}
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white font-mono"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 7. Old Tax Regime Itemized Deductions */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowOldDeductions(!showOldDeductions)}
          className="w-full p-3 text-xs font-semibold text-slate-800 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <span>Old Regime Deductions (80C, 80D, 80CCD(1B), Home Loan)</span>
          {showOldDeductions ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
        </button>

        {showOldDeductions && (
          <div className="p-3.5 space-y-2 text-xs border-t border-slate-100 bg-slate-50/50">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-600 block mb-0.5">
                  Section 80C (PPF, ELSS) (Max 1.5L)
                </label>
                <input
                  type="number"
                  min="0"
                  max="150000"
                  step="10000"
                  value={inputs.deduction80C}
                  onChange={(e) => handleNumericChange('deduction80C', parseFloat(e.target.value))}
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-600 block mb-0.5">
                  Section 80D Health Insurance
                </label>
                <input
                  type="number"
                  min="0"
                  max="100000"
                  step="5000"
                  value={inputs.deduction80D}
                  onChange={(e) => handleNumericChange('deduction80D', parseFloat(e.target.value))}
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-600 block mb-0.5">
                  80CCD(1B) Self NPS (Max 50k)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50000"
                  step="5000"
                  value={inputs.deduction80CCD1B}
                  onChange={(e) => handleNumericChange('deduction80CCD1B', parseFloat(e.target.value))}
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-600 block mb-0.5">
                  Sec 24(b) Home Loan Interest (Max 2L)
                </label>
                <input
                  type="number"
                  min="0"
                  max="200000"
                  step="10000"
                  value={inputs.deductionHomeLoanInterest}
                  onChange={(e) => handleNumericChange('deductionHomeLoanInterest', parseFloat(e.target.value))}
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white font-mono"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
