import React, { useState } from 'react';
import { ComplianceAlert } from '../types';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  alerts: ComplianceAlert[];
}

export const SmartAlertsBanner: React.FC<Props> = ({ alerts }) => {
  const [showAllInfo, setShowAllInfo] = useState(false);

  if (!alerts || alerts.length === 0) return null;

  // Separate critical alerts (error, warning) from general info/success tips
  const criticalAlerts = alerts.filter((a) => a.type === 'error' || a.type === 'warning');
  const infoAlerts = alerts.filter((a) => a.type === 'info' || a.type === 'success');

  return (
    <div className="space-y-2 mb-4" id="smart-alerts-container">
      {/* Critical Alerts (Always Visible) */}
      {criticalAlerts.map((alert) => {
        const isError = alert.type === 'error';
        const bgClass = isError
          ? 'bg-rose-50/90 border-rose-200 text-rose-900'
          : 'bg-amber-50/90 border-amber-200 text-amber-900';
        const icon = isError ? (
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        );

        return (
          <div
            key={alert.id}
            id={`alert-${alert.id}`}
            className={`px-3 py-2 rounded-lg border flex items-start gap-2.5 text-xs transition-all ${bgClass}`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{alert.title}</span>
                {alert.sectionReference && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/80 font-mono font-medium opacity-80 shrink-0">
                    {alert.sectionReference}
                  </span>
                )}
              </div>
              <p className="mt-0.5 opacity-90 leading-snug">{alert.message}</p>
            </div>
          </div>
        );
      })}

      {/* Info / Policy Notes (Compact & Expandable if multiple) */}
      {infoAlerts.length > 0 && (
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2 text-xs text-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="font-medium text-slate-800 truncate">
                {infoAlerts[0].title}: <span className="text-slate-600 font-normal">{infoAlerts[0].message}</span>
              </span>
            </div>
            {infoAlerts.length > 1 && (
              <button
                type="button"
                onClick={() => setShowAllInfo(!showAllInfo)}
                className="text-[11px] font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 shrink-0 ml-2"
              >
                {showAllInfo ? 'Less' : `+${infoAlerts.length - 1} more`}
                {showAllInfo ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>

          {showAllInfo && infoAlerts.length > 1 && (
            <div className="mt-2 pt-2 border-t border-slate-200 space-y-1.5">
              {infoAlerts.slice(1).map((alert) => (
                <div key={alert.id} className="flex items-start gap-2 text-xs text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                  <div>
                    <span className="font-medium text-slate-800">{alert.title}:</span> {alert.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
