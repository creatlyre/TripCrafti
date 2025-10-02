import React, { useState } from 'react';
import type { GenerateDetails, ValidationResult, Trip, GeneratedItinerary } from '@/types';
import { usePacking } from '@/components/hooks/usePacking';
import { getDictionary } from '@/lib/i18n';

// Import UI components
import PackingHeader from '@/components/PackingHeader';
import PackingListGenerator from '@/components/PackingListGenerator';
import PackingList from '@/components/PackingList';
import PackingListActions from '@/components/PackingListActions';
import CollapsibleSection from '@/components/CollapsibleSection';
import PackingChecklist from '@/components/PackingChecklist';
import QuickAddItem from '@/components/QuickAddItem';

interface PackingAssistantProps {
  tripId: string;
  trip?: Trip & { itineraries: GeneratedItinerary[] };
  lang?: 'pl' | 'en';
}

const PackingAssistant: React.FC<PackingAssistantProps> = ({ tripId, trip, lang = 'pl' }) => {
  const dictRoot = getDictionary(lang).packing;
  const {
    // State
    packingItems,
    checklistItems,
    categories,
    listMeta,
    filteredPackingItems,
    filteredCategories,
    packingStats,
    
    // Loading states
    isLoading,
    isSaving,
    initialLoad,
    
    // Error and suggestions
    error,
    suggestions,
    
    // Toast notifications
    toast,
    
    // Search
    searchTerm,
    setSearchTerm,
    
    // Actions
    generateList,
    validateList,
    categorizeList,
    clearList,
    loadTemplate,
    
    // Item management
    addItem,
    addItemFromLibrary,
    updateItem,
    deleteItem,
    toggleItem,
    
    // Category management
    addCategory,
    deleteCategory,
    updateCategory,
    sortCategories,
    
    // Checklist management
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    toggleChecklistItem,
    
    // Drag & Drop
    dropItem,
    dropCategory,
    
    // Toast and error handling
    showToast,
    clearError,
  } = usePacking({ tripId });

  // UI state
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [isCategorizedView, setIsCategorizedView] = useState<boolean>(true);
  
  // Modal states
  const [isConfirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [isValidationModalOpen, setValidationModalOpen] = useState(false);
  const [pendingDetails, setPendingDetails] = useState<GenerateDetails | null>(null);

  // Theme state (remains client-side)
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedTheme = window.localStorage.getItem('theme');
      if (storedTheme) return storedTheme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  // Theme management
  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      console.error("Could not save theme to localStorage", e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const toggleFullScreen = () => {
    setIsFullScreen(prev => !prev);
  };

  // Modal handlers
  const handleGenerateList = async (details: GenerateDetails) => {
    if (packingItems.length > 0 || checklistItems.length > 0) {
      setPendingDetails(details);
      setConfirmationModalOpen(true);
    } else {
      await generateList(details);
    }
  };

  const handleConfirmGeneration = async () => {
    if (pendingDetails) {
      await generateList(pendingDetails);
    }
    setConfirmationModalOpen(false);
    setPendingDetails(null);
  };

  const handleCancelGeneration = () => {
    setConfirmationModalOpen(false);
    setPendingDetails(null);
  };

  const handleValidateList = async () => {
    if (packingItems.length === 0) {
      showToast(dictRoot?.toasts.emptyListValidate || 'Empty', 'error');
      return;
    }
    setValidationModalOpen(true);
  };

  const handleConfirmValidation = async (context: string) => {
    setValidationModalOpen(false);
    await validateList(context);
  };

  const handleCancelValidation = () => setValidationModalOpen(false);

  // Modal components
  const ConfirmationModal = ({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void; }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Potwierdzenie</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Masz już listę. Wygenerowanie nowej listy spowoduje zastąpienie bieżącej. Czy na pewno chcesz kontynuować?
        </p>
        <div className="mt-4 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600">
            Anuluj
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Tak, wygeneruj nową
          </button>
        </div>
      </div>
    </div>
  );

  const ValidationModal = ({ onConfirm, onCancel }: { onConfirm: (context: string) => void; onCancel: () => void; }) => {
    const [context, setContext] = useState('');
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" aria-modal="true" role="dialog">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Sprawdź listę z kontekstem</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Czy coś się zmieniło w Twoich planach? Opisz to, a AI uwzględni to w sugestiach.
          </p>
          <textarea 
            value={context} 
            onChange={(e) => setContext(e.target.value)} 
            placeholder="np. Prognoza pogody zmieniła się na znacznie cieplejszą." 
            className="mt-4 w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" 
            rows={3}
          />
          <div className="mt-4 flex justify-end gap-3">
            <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600">Anuluj</button>
            <button onClick={() => onConfirm(context)} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">Sprawdź listę</button>
          </div>
        </div>
      </div>
    );
  };

  // Suggestions rendering
  const renderSuggestions = () => {
    if (!suggestions) return null;

    const ActionButton: React.FC<{onClick: () => void, className: string, children: React.ReactNode}> = ({ onClick, className, children }) => (
      <button onClick={onClick} className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-md transition-colors ${className}`}>
        {children}
      </button>
    );

    const handleApplyAddSuggestion = (item: { name: string; category: string; }) => {
      addItem(item.name, item.category, '1');
      showToast(`${dictRoot?.toasts.added}: ${item.name}`, 'success');
    };

    const handleApplyRemoveSuggestion = (item: { name: string; }) => {
      const itemToRemove = packingItems.find(p => p.name.toLowerCase() === item.name.toLowerCase());
      if (itemToRemove) {
        deleteItem(itemToRemove.id);
        showToast(`${dictRoot?.toasts.removed}: ${item.name}`, 'success');
      } else {
        showToast(`${dictRoot?.toasts.notFound} "${item.name}"`, 'error');
      }
    };

    const handleApplyAdjustSuggestion = (item: { name: string; field: string; suggested: any; }) => {
      const targetItem = packingItems.find(p => p.name.toLowerCase() === item.name.toLowerCase());
      if (targetItem) {
        if (item.field === 'name' || item.field === 'qty') {
          updateItem(targetItem.id, item.field === 'name' ? item.suggested : targetItem.name, item.field === 'qty' ? item.suggested : targetItem.qty);
        }
        showToast(`${dictRoot?.toasts.changed}: ${item.name}`, 'success');
      }
    };

    const handleApplyReplaceSuggestion = (item: ValidationResult['replace'][0]) => {
      const lowerCaseItemsToRemove = item.items_to_remove.map(i => i.toLowerCase());
      const itemsToRemove = packingItems.filter(p => lowerCaseItemsToRemove.includes(p.name.toLowerCase()));
      
      itemsToRemove.forEach(itemToRemove => deleteItem(itemToRemove.id));
      addItem(item.suggested_item.name, item.suggested_item.category, '1');
      showToast(`${dictRoot?.toasts.replaced}: ${item.suggested_item.name}`, 'success');
    };

    const renderList = (title: string, items: {name: string, reason?: string, category?: string}[], action?: (item: any) => React.ReactNode) => (
      items.length > 0 && (
        <div key={title}>
          <h4 className="font-bold text-md mt-2 text-slate-700 dark:text-slate-200">{title}</h4>
          <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-300 space-y-1">
            {items.map((item, index) => (
              <li key={index} className="flex justify-between items-center">
                <span>
                  <strong>{item.name}</strong>
                  {item.category && ` (${item.category})`}
                  {item.reason && `: ${item.reason}`}
                </span>
                {action && action(item)}
              </li>
            ))}
          </ul>
        </div>
      )
    );

    const renderReplaceList = (title: string, items: ValidationResult['replace']) => (
      items.length > 0 && (
        <div key={title}>
          <h4 className="font-bold text-md mt-2 text-slate-700 dark:text-slate-200">{title}</h4>
          <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-300 space-y-2">
            {items.map((item, index) => (
              <li key={index} className="flex justify-between items-center">
                <div>
                  <div>Zastąp: <strong>{item.items_to_remove.join(', ')}</strong></div>
                  <div>Przez: <strong>{item.suggested_item.name}</strong> ({item.suggested_item.category})</div>
                  <div className="text-xs italic text-slate-500 dark:text-slate-400 mt-0.5">{item.reason}</div>
                </div>
                <ActionButton onClick={() => handleApplyReplaceSuggestion(item)} className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 self-center">
                  [✓] Zastosuj
                </ActionButton>
              </li>
            ))}
          </ul>
        </div>
      )
    );

    return (
      <div className="bg-blue-100 border border-blue-400 text-blue-800 px-4 py-3 rounded-lg relative dark:bg-blue-900/20 dark:border-blue-500/30 dark:text-blue-200">
        <strong className="font-bold block mb-2">{dictRoot?.suggestions.heading}</strong>
        {renderList(dictRoot?.suggestions.add || 'Add:', suggestions.missing, (item) => (
          <ActionButton onClick={() => handleApplyAddSuggestion(item)} className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800">
            [+] Dodaj
          </ActionButton>
        ))}
        {renderList(dictRoot?.suggestions.remove || 'Remove:', suggestions.remove, (item) => (
          <ActionButton onClick={() => handleApplyRemoveSuggestion(item)} className="bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800">
            [x] Usuń
          </ActionButton>
        ))}
        {renderList(dictRoot?.suggestions.adjust || 'Adjust:', suggestions.adjust.map(a => ({...a, reason: dictRoot?.suggestions.change ? dictRoot.suggestions.change(a.field, a.current, a.suggested, a.reason) : a.reason})), (item) => (
          <ActionButton onClick={() => handleApplyAdjustSuggestion(item)} className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800">
            [✓] Zmień
          </ActionButton>
        ))}
        {renderReplaceList(dictRoot?.suggestions.replace || 'Replace:', suggestions.replace)}
      </div>
    );
  };

  if (initialLoad) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-slate-500 dark:text-slate-400">Loading packing list...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <PackingHeader theme={theme} toggleTheme={toggleTheme} />

      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-2 rounded-md shadow-lg text-sm font-medium text-white ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {toast.message}
        </div>
      )}

      <main className={`container mx-auto transition-all duration-300 ${isFullScreen ? 'p-0 md:p-0 max-w-full' : 'p-4 md:p-8'}`}>
        <div className={`${isFullScreen ? '' : 'grid grid-cols-1 lg:grid-cols-3 gap-8'}`}>
          <div className={`lg:col-span-1 space-y-6 no-print ${isFullScreen ? 'hidden' : ''}`}>
            <CollapsibleSection title={dictRoot?.sections.generate || 'Generate list'}>
              <PackingListGenerator onGenerate={handleGenerateList} isLoading={isLoading} trip={trip} lang={lang} />
            </CollapsibleSection>
            <CollapsibleSection title={dictRoot?.sections.manage || 'Manage'}>
              <PackingListActions
                onCheckList={handleValidateList}
                onClearList={clearList}
                isLoading={isLoading}
                isListEmpty={packingItems.length === 0 && checklistItems.length === 0}
                onCategorizeList={categorizeList}
                onLoadTemplate={loadTemplate}
                lang={lang}
              />
            </CollapsibleSection>
            <CollapsibleSection title={dictRoot?.sections.quickAdd || 'Quick add'}>
              <QuickAddItem onAddItem={addItemFromLibrary} />
            </CollapsibleSection>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative dark:bg-red-900/20 dark:border-red-500/30 dark:text-red-200" role="alert">
                {error}
                <button onClick={clearError} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                  <span className="sr-only">Dismiss</span>
                  ×
                </button>
              </div>
            )}
            {suggestions && renderSuggestions()}
          </div>

          <div className={`lg:col-span-2 space-y-6 transition-all duration-300 ${isFullScreen ? 'lg:col-span-3' : ''}`}>
            {listMeta && listMeta.archetype && !isFullScreen && (
              <div className="bg-indigo-50 border-l-4 border-indigo-500 text-indigo-800 p-4 rounded-r-lg shadow dark:bg-indigo-900/20 dark:border-indigo-500 dark:text-indigo-200">
                <p className="font-bold text-lg">{dictRoot?.sections.archetype}: <span className="font-normal">{listMeta.archetype}</span></p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {dictRoot?.stats.destination}: {listMeta.destination}, {dictRoot?.stats.days}: {listMeta.days}, {dictRoot?.stats.adults}: {listMeta.people.adults} {dictRoot?.stats.children}: {listMeta.people.children}
                </p>
              </div>
            )}
            {checklistItems.length > 0 && !isFullScreen && (
              <PackingChecklist
                items={checklistItems}
                onToggleItem={toggleChecklistItem}
                onAddItem={addChecklistItem}
                onUpdateItem={updateChecklistItem}
                onDeleteItem={deleteChecklistItem}
              />
            )}
            <PackingList
              items={filteredPackingItems}
              categories={filteredCategories}
              onAddItem={addItem}
              onAddCategory={addCategory}
              onToggleItem={toggleItem}
              onDeleteItem={deleteItem}
              onUpdateItem={updateItem}
              onDropItem={dropItem}
              onDropCategory={dropCategory}
              onSortCategories={sortCategories}
              onDeleteCategory={deleteCategory}
              onUpdateCategory={updateCategory}
              isLoading={isLoading || isSaving}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              totalItemCount={packingItems.length}
              totalPackedCount={packingStats.packed}
              isFullScreen={isFullScreen}
              onToggleFullScreen={toggleFullScreen}
              isCategorizedView={isCategorizedView}
              onToggleCategorizedView={() => setIsCategorizedView(prev => !prev)}
            />
          </div>
        </div>
      </main>
      
      {isConfirmationModalOpen && <ConfirmationModal onConfirm={handleConfirmGeneration} onCancel={handleCancelGeneration} />}
      {isValidationModalOpen && <ValidationModal onConfirm={handleConfirmValidation} onCancel={handleCancelValidation} />}
    </div>
  );
};

export default PackingAssistant;