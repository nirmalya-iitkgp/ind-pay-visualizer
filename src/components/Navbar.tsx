import React from 'react';
import { AppMode, PresetTemplate } from '../types';
import { PRESET_TEMPLATES } from '../utils/constants';
import {
  SlidersHorizontal,
  FileText,
  TrendingUp,
  RotateCcw,
  User,
  Building,
} from 'lucide-react';

interface Props {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onSelectPreset: (preset: PresetTemplate) => void;
  onOpenPolicyModal: () => void;
  onOpenRSUModal: () => void;
  onOpenPaySlipModal: () => void;
  onReset: () => void;
}

export const Navbar: React.FC<Props> = ({
  mode,
  onModeChange,
  onSelectPreset,
  onOpenPolicyModal,
  onOpenRSUModal,
  onOpenPaySlipModal,
  onReset,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200" id="app-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* App Title & Branding */}
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/app-icon.png"
              alt="Tax Icon"
              className="w-8 h-8 rounded-lg object-cover shadow-xs shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
                  Indian Tax & CTC Visualizer
                </h1>
                <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  FY 2024-26
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate hidden sm:block">
                Interactive Compensation Structure & Tax Engine
              </p>
            </div>
          </div>

          {/* Top Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            
            {/* Mode Switcher */}
            <div className="bg-slate-100 p-0.5 rounded-lg flex items-center border border-slate-200 text-xs" id="mode-switcher">
              <button
                id="mode-btn-employee"
                type="button"
                onClick={() => onModeChange('employee')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  mode === 'employee'
                    ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Employee</span>
              </button>
              <button
                id="mode-btn-employer"
                type="button"
                onClick={() => onModeChange('employer')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  mode === 'employer'
                    ? 'bg-white text-indigo-800 shadow-xs border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Employer</span>
              </button>
            </div>

            {/* Industry Presets Selector */}
            <select
              id="preset-selector"
              onChange={(e) => {
                const preset = PRESET_TEMPLATES.find((p) => p.id === e.target.value);
                if (preset) onSelectPreset(preset);
              }}
              defaultValue=""
              className="text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-400 cursor-pointer max-w-[130px] sm:max-w-none truncate"
            >
              <option value="" disabled>Presets...</option>
              {PRESET_TEMPLATES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                id="btn-policy-settings"
                type="button"
                onClick={onOpenPolicyModal}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg transition-colors"
                title="Configure Company Policy rules"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden lg:inline">Policy</span>
              </button>

              <button
                id="btn-rsu-modal"
                type="button"
                onClick={onOpenRSUModal}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg transition-colors"
                title="Model RSU & Equity Tax"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden lg:inline">RSU</span>
              </button>

              <button
                id="btn-payslip-modal"
                type="button"
                onClick={onOpenPaySlipModal}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-white border border-slate-200 rounded-lg transition-colors"
                title="View Monthly Pay Slip"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden lg:inline">Pay Slip</span>
              </button>

              <button
                id="btn-reset-all"
                type="button"
                onClick={onReset}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                title="Reset to defaults"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
