import React from 'react';

import type { PackingItem, ChecklistItem } from '@/types';

import { useDictionary } from '@/components/hooks/useDictionary';

import TemplateLoader from './TemplateLoader';

interface PackingListActionsProps {
  onCheckList: () => void;
  onClearList: () => void;
  onCategorizeList: () => void;
  onLoadTemplate: (items: PackingItem[], checklist: ChecklistItem[], templateName: string) => void;
  isLoading: boolean;
  isListEmpty: boolean;
}

const PackingListActions: React.FC<PackingListActionsProps> = ({
  onCheckList,
  onClearList,
  isLoading,
  isListEmpty,
  onCategorizeList,
  onLoadTemplate,
}) => {
  const dict = useDictionary();
  const assistant = dict.packing?.assistant;
  const assistantFull = dict.packingAssistant; // existing detailed assistant dictionary
  const ui = dict.ui?.common;
  return (
    <div className="space-y-4">
      <p className="text-slate-500 dark:text-slate-400 text-sm">
        {assistant?.actionsHelp || 'Załaduj gotowy szablon, użyj AI do weryfikacji, kategoryzuj lub wyczyść listę.'}
      </p>

      <div className="flex flex-col space-y-3">
        <TemplateLoader onLoadTemplate={onLoadTemplate} isLoading={isLoading} />

        <button
          onClick={onCheckList}
          disabled={isLoading || isListEmpty}
          className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? ui?.loading || 'Sprawdzanie...' : assistantFull?.validation?.confirm || 'Sprawdź listę z AI'}
        </button>
        <button
          onClick={onCategorizeList}
          disabled={isLoading || isListEmpty}
          className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? ui?.loading || 'Kategoryzowanie...' : 'Kategoryzuj z AI'}
        </button>
        <button
          onClick={onClearList}
          disabled={isLoading || isListEmpty}
          className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
        >
          {assistant?.clearList || 'Wyczyść listę'}
        </button>
      </div>
    </div>
  );
};

export default PackingListActions;
