import React from 'react';
import { ComplianceAlert } from '../types';
import { AlertCircle } from 'lucide-react';

interface Props {
  alerts: ComplianceAlert[];
}

export const SmartAlertsBanner: React.FC<Props> = ({ alerts }) => {
  if (!alerts || alerts.length === 0) return null;

  // Only display critical error/warning alerts that require immediate user action
  const critical = alerts.filter((a) => a.type === 'error');
  if (critical.length === 0) return null;

  return (
    <div className="mb-4 space-y-2" id="smart-alerts-container">
      {critical.map((alert) => (
        <div
          key={alert.id}
          className="px-3.5 py-2.5 rounded-lg border bg-rose-50 border-rose-200 text-rose-900 flex items-center justify-between text-xs"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{alert.title}:</span>
            <span className="opacity-90">{alert.message}</span>
          </div>
          {alert.sectionReference && (
            <span className="font-mono text-[10px] text-rose-700 bg-white/70 px-1.5 py-0.5 rounded border border-rose-200">
              {alert.sectionReference}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
