import React from 'react';

interface ListActionsProps {
  onCheckList: () => void;
  onClearList: () => void;
  onCategorizeList: () => void;
  isLoading: boolean;
  isListEmpty: boolean;
}

const ListActions: React.FC<ListActionsProps> = ({
  onCheckList, onClearList, isLoading, isListEmpty,
  onCategorizeList
}) => {

  return (
    <div className="space-y-4">
      <p className="text-slate-500 dark:text-slate-400 text-sm">Użyj AI do weryfikacji listy, automatycznie ją kategoryzuj, lub wyczyść wszystko.</p>

      <div className="flex flex-col space-y-3">
        <button
          onClick={onCheckList}
          disabled={isLoading || isListEmpty}
          className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Sprawdzanie...' : 'Sprawdź listę z AI'}
        </button>
        <button
          onClick={onCategorizeList}
          disabled={isLoading || isListEmpty}
          className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Kategoryzowanie...' : 'Kategoryzuj z AI'}
        </button>
        <button
          onClick={onClearList}
          disabled={isLoading || isListEmpty}
          className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
        >
          Wyczyść listę
        </button>
      </div>
    </div>
  );
};

export default ListActions;