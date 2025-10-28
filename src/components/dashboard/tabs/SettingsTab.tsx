
import React from 'react';

interface SettingsTabProps {
  dict: any;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ dict }) => {
  return (
    <div className="space-y-6">
      <div className="text-center py-12 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">
          {dict.placeholders?.settings.title}
        </h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md mx-auto">
          {dict.placeholders?.settings.body}
        </p>
      </div>
    </div>
  );
};

export default SettingsTab;
