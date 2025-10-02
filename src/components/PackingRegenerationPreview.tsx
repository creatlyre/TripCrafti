import React from 'react';

import type { PackingItem } from '@/types';

import { useDictionary } from '@/components/hooks/useDictionary';

interface PackingRegenerationPreviewProps {
  items: PackingItem[];
  onAddAll: () => void;
  onDiscard: () => void;
  onAddSingle: (id: number) => void;
}

const PackingRegenerationPreview: React.FC<PackingRegenerationPreviewProps> = ({
  items,
  onAddAll,
  onDiscard,
  onAddSingle,
}) => {
  const dict = useDictionary();
  const regen = dict.packingAssistant?.regenerate;
  if (!items || items.length === 0) {
    return (
      <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <p className="text-sm text-slate-500 dark:text-slate-400">{regen?.empty || 'No new items.'}</p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={onDiscard}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-500"
          >
            {regen?.discard || 'Discard'}
          </button>
        </div>
      </div>
    );
  }

  // Group by category
  const grouped: Record<string, PackingItem[]> = items.reduce(
    (acc, item) => {
      acc[item.category] = acc[item.category] || [];
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, PackingItem[]>
  );

  return (
    <div className="p-4 rounded-lg border border-indigo-300 dark:border-indigo-600 bg-indigo-50/70 dark:bg-indigo-900/20 shadow-sm">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 tracking-wide uppercase">
          {regen?.previewHeading || 'Preview (AI)'} ({items.length})
        </h3>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={onAddAll}
            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-green-600 hover:bg-green-500 text-white shadow focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            {regen?.addAll || 'Add all'}
          </button>
          <button
            onClick={onDiscard}
            className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-500"
          >
            {regen?.discard || 'Discard'}
          </button>
        </div>
      </div>
      <div className="mt-4 space-y-4 max-h-80 overflow-y-auto pr-1">
        {Object.entries(grouped).map(([category, catItems]) => (
          <div
            key={category}
            className="rounded-md bg-white dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 p-3"
          >
            <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-2">
              {category}
            </h4>
            <ul className="space-y-1">
              {catItems.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-slate-700 dark:text-slate-200 truncate">
                    {item.name}
                    {item.qty && <span className="text-xs text-slate-400"> × {item.qty}</span>}
                  </span>
                  <button
                    onClick={() => onAddSingle(item.id)}
                    className="flex-shrink-0 px-2 py-1 text-xs rounded-md bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    {regen?.addItem || 'Add'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PackingRegenerationPreview;
