import React from 'react';
import TemplateLoader from './TemplateLoader';
import type { PackingItem, ChecklistItem } from '@/types';
import { getDictionary } from '@/lib/i18n';

interface PackingListActionsProps {
  onCheckList: () => void;
  onClearList: () => void;
  onCategorizeList: () => void;
  onLoadTemplate: (items: PackingItem[], checklist: ChecklistItem[], templateName: string) => void;
  isLoading: boolean;
  isListEmpty: boolean;
  lang?: 'pl' | 'en';
}

const PackingListActions: React.FC<PackingListActionsProps> = ({
  onCheckList, onClearList, isLoading, isListEmpty,
  onCategorizeList, onLoadTemplate, lang = 'pl'
}) => {
  const dict = getDictionary(lang).packing?.actions;

  return (
    <div className="space-y-4">
  <p className="text-slate-500 dark:text-slate-400 text-sm">{dict?.description}</p>

      <div className="flex flex-col space-y-3">
  <TemplateLoader onLoadTemplate={onLoadTemplate} isLoading={isLoading} lang={lang} />
        
        <button
          onClick={onCheckList}
          disabled={isLoading || isListEmpty}
          className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? dict?.validating : dict?.validate}
        </button>
        <button
          onClick={onCategorizeList}
          disabled={isLoading || isListEmpty}
          className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? dict?.categorizing : dict?.categorize}
        </button>
        <button
          onClick={onClearList}
          disabled={isLoading || isListEmpty}
          className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
        >
          {dict?.clear}
        </button>
      </div>
    </div>
  );
};

export default PackingListActions;