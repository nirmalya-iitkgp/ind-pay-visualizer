import React, { useState } from 'react';
import { CompensationInputs, IndianState, CityTier } from '../types';
import { STATE_PT_CONFIGS, CITY_HRA_NUANCES } from '../utils/constants';
import { formatINR, formatINRCompact, sanitizeNumber } from '../utils/formatters';
import {
  IndianRupee,
  Home,
  MapPin,
  HelpCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
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
  const [showAllowancesAccordion, setShowAllowancesAccordion] = useState(false);
  const [showOldDeductionsAccordion, setShowOldDeductionsAccordion] = useState(false);
  const [showEquityAccordion, setShowEquityAccordion] = useState(false);
  const [showStateNuanceModal, setShowStateNuanceModal] = useState(false);

  const handleNumericChange = (key: keyof CompensationInputs, value: number) => {
    onChange({
      ...inputs,
      [key]: sanitizeNumber(value, 0),
    });
  };

  const currentStatePTConfig = STATE_PT_CONFIGS[inputs.state || 'karnataka'] || STATE_PT_CONFIGS.other;
  const currentCityNuance = CITY_HRA_NUANCES.find(
    (c) => c.cityName === inputs.selectedCity || c.state === inputs.state
  );

  const handleStateChange = (newState: IndianState) => {
    // Auto-match first major city of this state
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

  const isBasicCompliant = inputs.basicPercentOfCTC >= 50;

  return (
    <div className="space-y-4" id="compensation-inputs-panel">
      {/* 1. Total CTC Input Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="ctc-input" className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Annual CTC (Cost to Company)
          </label>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
            {formatINRCompact(inputs.ctcAnnual)}/yr
          </span>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold">
            ₹
          </div>
          <input
            id="ctc-input"
            type="number"
            min="100000"
            step="50000"
            value={inputs.ctcAnnual}
            onChange={(e) => handleNumericChange('ctcAnnual', parseFloat(e.target.value))}
            className="w-full pl-8 pr-3 py-2 text-base font-bold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder="e.g. 1800000"
          />
        </div>

        {/* Quick CTC Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {QUICK_CTC_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handleNumericChange('ctcAnnual', preset.value)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors ${
                inputs.ctcAnnual === preset.value
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. State Selection & Professional Tax / HRA Nuance */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3" id="state-location-card">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-indigo-600" />
            State & Professional Tax (PT)
          </span>
          <button
            type="button"
            onClick={() => setShowStateNuanceModal(true)}
            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <Info className="w-3 h-3" />
            <span>State Slabs & Nuances</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* State Dropdown */}
          <div>
            <label htmlFor="state-select" className="text-[11px] text-slate-500 font-medium block mb-1">
              Work Location (State)
            </label>
            <select
              id="state-select"
              value={inputs.state || 'karnataka'}
              onChange={(e) => handleStateChange(e.target.value as IndianState)}
              className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-900 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 bg-white"
            >
              {Object.values(STATE_PT_CONFIGS).map((cfg) => (
                <option key={cfg.state} value={cfg.state}>
                  {cfg.stateName}
                </option>
              ))}
            </select>
          </div>

          {/* City / Hub Selector */}
          <div>
            <label htmlFor="city-select" className="text-[11px] text-slate-500 font-medium block mb-1">
              City / Tech Hub (HRA & PT)
            </label>
            <select
              id="city-select"
              value={inputs.selectedCity || 'Bangalore (Bengaluru)'}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-900 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 bg-white"
            >
              {CITY_HRA_NUANCES.map((city) => (
                <option key={city.cityName} value={city.cityName}>
                  {city.cityName} ({city.cityTier === 'metro' ? '50% Metro' : '40% Non-Metro'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* State PT Status Banner */}
        <div className="p-2.5 rounded-lg text-xs bg-slate-50 border border-slate-200/80 flex items-start gap-2">
          <div className="pt-0.5 text-slate-500 shrink-0">
            <Info className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 text-[11px] leading-relaxed text-slate-700">
            <span className="font-bold text-slate-900">{currentStatePTConfig.stateName}: </span>
            {currentStatePTConfig.description}
          </div>
        </div>
      </div>

      {/* 3. Basic Pay & HRA Sliders */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
        {/* Basic Pay Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800">Basic Pay (% of CTC)</span>
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                  isBasicCompliant ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isBasicCompliant ? 'Code on Wages ✓' : 'Basic < 50%'}
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
            className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>20% (Startup flexi)</span>
            <span className="text-slate-600 font-medium">
              {formatINR((inputs.ctcAnnual * inputs.basicPercentOfCTC) / 100)}/yr
            </span>
            <span>70% (High PF/Gratuity)</span>
          </div>
        </div>

        {/* HRA Slider */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800">HRA (% of Basic Pay)</span>
            <span className="font-bold text-slate-900">{inputs.hraPercentOfBasic}%</span>
          </div>

          <input
            type="range"
            min="0"
            max="60"
            step="5"
            value={inputs.hraPercentOfBasic}
            onChange={(e) => handleNumericChange('hraPercentOfBasic', parseFloat(e.target.value))}
            className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>0%</span>
            <span className="text-slate-600 font-medium">
              {formatINR((((inputs.ctcAnnual * inputs.basicPercentOfCTC) / 100) * inputs.hraPercentOfBasic) / 100)}/yr
            </span>
            <span>50% (Standard Metro)</span>
          </div>
        </div>

        {/* Auto-balancing Spillover Indicator */}
        <div
          className={`p-2.5 rounded-lg text-xs flex items-center justify-between border ${
            isOverAllocated
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50/70 border-emerald-200/70 text-emerald-900'
          }`}
        >
          <div>
            <div className="font-bold">
              {isOverAllocated ? 'Over-Allocated!' : 'Special Allowance (Auto-Spillover):'}
            </div>
            <div className="text-[11px] opacity-80">
              {isOverAllocated ? 'Components exceed 100% of CTC' : 'Absorbs remaining unallocated CTC'}
            </div>
          </div>
          <span className="font-mono font-bold text-xs">{formatINR(unallocatedSpillover)}</span>
        </div>
      </div>

      {/* 4. Rent & City Details (For HRA Exemption) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Home className="w-3.5 h-3.5 text-emerald-600" />
            Rent & City Tier (HRA Exemption)
          </span>
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => onChange({ ...inputs, cityTier: 'metro' })}
              className={`px-2 py-0.5 rounded ${
                inputs.cityTier === 'metro' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              Metro (50%)
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...inputs, cityTier: 'non-metro' })}
              className={`px-2 py-0.5 rounded ${
                inputs.cityTier === 'non-metro' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-600'
              }`}
            >
              Non-Metro (40%)
            </button>
          </div>
        </div>

        <div>
          <label className="text-[11px] text-slate-500 font-medium block mb-1">
            Monthly Rent Paid (₹/month)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs font-bold">
              ₹
            </div>
            <input
              type="number"
              min="0"
              step="1000"
              value={inputs.monthlyRentPaid}
              onChange={(e) => handleNumericChange('monthlyRentPaid', parseFloat(e.target.value))}
              className="w-full pl-7 pr-3 py-1.5 text-xs font-semibold text-slate-900 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500"
              placeholder="e.g. 25000"
            />
          </div>
        </div>

        {currentCityNuance && (
          <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 leading-relaxed">
            <strong className="text-slate-700">{currentCityNuance.cityName}:</strong> {currentCityNuance.nuanceExplanation}
          </p>
        )}
      </div>

      {/* 5. Flexible Allowances & Variable Pay Accordion */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAllowancesAccordion(!showAllowancesAccordion)}
          className="w-full p-3 text-xs font-bold text-slate-800 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100 transition-colors"
        >
          <span>Allowances & Variable Pay Breakdown</span>
          {showAllowancesAccordion ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {showAllowancesAccordion && (
          <div className="p-4 space-y-3 text-xs border-t border-slate-100">
            <div>
              <label className="text-[11px] text-slate-600 font-medium block mb-1">
                Annual Variable / Performance Pay (₹)
              </label>
              <input
                type="number"
                min="0"
                step="10000"
                value={inputs.variablePayAnnual}
                onChange={(e) => handleNumericChange('variablePayAnnual', parseFloat(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] text-slate-600 font-medium block mb-1">LTA (Leave Travel) (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={inputs.ltaAnnual}
                  onChange={(e) => handleNumericChange('ltaAnnual', parseFloat(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-medium block mb-1">
                  Food Coupons / Meal Card (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="2400"
                  value={inputs.foodCouponAnnual}
                  onChange={(e) => handleNumericChange('foodCouponAnnual', parseFloat(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] text-slate-600 font-medium block mb-1">
                  Books & Periodicals (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="2000"
                  value={inputs.booksAndPeriodicalsAnnual}
                  onChange={(e) => handleNumericChange('booksAndPeriodicalsAnnual', parseFloat(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-medium block mb-1">
                  Communication / Phone (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="2000"
                  value={inputs.communicationAnnual}
                  onChange={(e) => handleNumericChange('communicationAnnual', parseFloat(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. Equity / RSU Components Accordion */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowEquityAccordion(!showEquityAccordion)}
          className="w-full p-3 text-xs font-bold text-slate-800 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100 transition-colors"
        >
          <span>RSU / ESOP Equity Grants</span>
          {showEquityAccordion ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {showEquityAccordion && (
          <div className="p-4 space-y-3 text-xs border-t border-slate-100">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] text-slate-700 font-semibold">
                  Vested RSUs / Perquisite (Current FY) (₹)
                </label>
                <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono">
                  Taxed at Salary Slab
                </span>
              </div>
              <input
                type="number"
                min="0"
                step="50000"
                value={inputs.rsuVestedValueAnnual}
                onChange={(e) => handleNumericChange('rsuVestedValueAnnual', parseFloat(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md"
                placeholder="0"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] text-slate-700 font-semibold">
                  Unvested RSU Grant (Future Potential) (₹)
                </label>
                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                  Not in Current Income
                </span>
              </div>
              <input
                type="number"
                min="0"
                step="50000"
                value={inputs.rsuUnvestedGrantAnnual}
                onChange={(e) => handleNumericChange('rsuUnvestedGrantAnnual', parseFloat(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md"
                placeholder="0"
              />
            </div>
          </div>
        )}
      </div>

      {/* 7. Old Tax Regime Deductions Accordion */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <button
          type="button"
          onClick={() => setShowOldDeductionsAccordion(!showOldDeductionsAccordion)}
          className="w-full p-3 text-xs font-bold text-slate-800 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100 transition-colors"
        >
          <span>Old Regime Deductions (80C, 80D, NPS, Home Loan)</span>
          {showOldDeductionsAccordion ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        {showOldDeductionsAccordion && (
          <div className="p-4 space-y-3 text-xs border-t border-slate-100">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] text-slate-600 font-medium block mb-1">
                  Section 80C (PPF, ELSS, EPF) (Max 1.5L)
                </label>
                <input
                  type="number"
                  min="0"
                  max="150000"
                  step="10000"
                  value={inputs.deduction80C}
                  onChange={(e) => handleNumericChange('deduction80C', parseFloat(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-medium block mb-1">
                  Section 80D (Health Insurance) (Max 1L)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100000"
                  step="5000"
                  value={inputs.deduction80D}
                  onChange={(e) => handleNumericChange('deduction80D', parseFloat(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] text-slate-600 font-medium block mb-1">
                  80CCD(1B) Self NPS (Max 50k)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50000"
                  step="5000"
                  value={inputs.deduction80CCD1B}
                  onChange={(e) => handleNumericChange('deduction80CCD1B', parseFloat(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-600 font-medium block mb-1">
                  Sec 24(b) Home Loan Interest (Max 2L)
                </label>
                <input
                  type="number"
                  min="0"
                  max="200000"
                  step="10000"
                  value={inputs.deductionHomeLoanInterest}
                  onChange={(e) => handleNumericChange('deductionHomeLoanInterest', parseFloat(e.target.value))}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* State & PT Informational Modal */}
      {showStateNuanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" />
                State Professional Tax & HRA Rules
              </h3>
              <button
                type="button"
                onClick={() => setShowStateNuanceModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100 space-y-1.5">
                <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Statutory Constitutional Ceiling: Article 276(2)
                </div>
                <p className="text-[11px] text-indigo-800 leading-relaxed">
                  Under Article 276(2) of the Constitution of India, the maximum Professional Tax payable by any salaried employee to a State or Municipal authority cannot exceed ₹2,500 per annum.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  State-by-State Professional Tax Breakdown
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                  {Object.values(STATE_PT_CONFIGS).map((cfg) => (
                    <div key={cfg.state} className="p-2.5 bg-white hover:bg-slate-50 flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900">{cfg.stateName}</div>
                        <div className="text-[11px] text-slate-600">{cfg.description}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap ${
                        cfg.hasProfessionalTax ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}>
                        {cfg.hasProfessionalTax ? `Max ₹${cfg.defaultAnnualTax}/yr` : 'Exempt (₹0)'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  HRA Metro vs Non-Metro Statutory Classification (Rule 2A)
                </h4>
                <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200/80 text-[11px] text-amber-900 space-y-1.5">
                  <p className="font-semibold">
                    The Income Tax Rules, 1962 (Rule 2A) designate strictly 4 cities as "Metro" (50% of Basic Pay): Mumbai, Delhi, Kolkata, and Chennai.
                  </p>
                  <p>
                    Key Tech Hubs like Bangalore, Hyderabad, Pune, Gurugram, and Noida are classified as Non-Metro (40% of Basic Pay), even though market residential rental rates match or exceed statutory metros.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowStateNuanceModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
