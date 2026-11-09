import React from 'react';
import { PresetTemplate } from '../types';
import { PRESET_TEMPLATES } from '../utils/constants';
import {
  FileText,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';

interface Props {
  onSelectPreset: (preset: PresetTemplate) => void;
  onOpenPolicyModal: () => void;
  onOpenPaySlipModal: () => void;
  onReset: () => void;
}

export const Navbar: React.FC<Props> = ({
  onSelectPreset,
  onOpenPolicyModal,
  onOpenPaySlipModal,
  onReset,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200" id="app-header">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/app-icon.png"
              alt="Tax Icon"
              className="w-7 h-7 rounded-lg object-cover shadow-xs shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 tracking-tight truncate">
                Indian Tax & CTC Calculator
              </h1>
            </div>
          </div>

          {/* Quick Presets & Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              id="preset-selector"
              onChange={(e) => {
                const preset = PRESET_TEMPLATES.find((p) => p.id === e.target.value);
                if (preset) onSelectPreset(preset);
              }}
              defaultValue=""
              className="text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200 rounded-md px-2.5 py-1 hover:bg-white focus:outline-hidden cursor-pointer"
            >
              <option value="" disabled>Load Preset...</option>
              {PRESET_TEMPLATES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={onOpenPaySlipModal}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-white border border-slate-200 rounded-md transition-colors"
              title="View Monthly Salary Slip"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Pay Slip</span>
            </button>

            <button
              type="button"
              onClick={onOpenPolicyModal}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-white border border-slate-200 rounded-md transition-colors"
              title="Company Policy & Retiral Settings"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Policy</span>
            </button>

            <button
              type="button"
              onClick={onReset}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
              title="Reset to defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
