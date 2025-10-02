import React, { useState } from 'react';

import type { Lang } from '@/lib/i18n';
import type { GenerateDetails, ValidationResult, Trip, GeneratedItinerary } from '@/types';

import AddItemModal from '@/components/AddItemModal';
import CollapsibleSection from '@/components/CollapsibleSection';
import { useDictionary } from '@/components/hooks/useDictionary';
import { usePacking } from '@/components/hooks/usePacking';
import PackingChecklist from '@/components/PackingChecklist';
import PackingHeader from '@/components/PackingHeader';
import PackingList from '@/components/PackingList';
import PackingListActions from '@/components/PackingListActions';
import PackingListGenerator from '@/components/PackingListGenerator';
import PackingRegenerationPreview from '@/components/PackingRegenerationPreview';
import QuickAddItem from '@/components/QuickAddItem';

interface PackingAssistantProps {
  tripId: string;
  trip?: Trip & { itineraries: GeneratedItinerary[] };
  lang: Lang;
  /** Optional action slot rendered in the header (e.g. link back to dashboard) */
  actionSlot?: React.ReactNode;
  /** When true, show destructive bulk delete controls (only in dialog context, not full-screen) */
  enableBulkDelete?: boolean;
}

const PackingAssistant: React.FC<PackingAssistantProps> = ({
  tripId,
  trip,
  lang,
  actionSlot,
  enableBulkDelete = false,
}) => {
  const dictAll = useDictionary();
  const dictionary = dictAll.packingAssistant; // treat as optional downstream
  const {
    // State
    packingItems,
    checklistItems,
    // categories (unused)
    listMeta,
    regeneratedPreview,
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
    regenerateList,
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
    // addCategory (unused)
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
    applyRegeneratedPreview,
    discardRegeneratedPreview,
    addSingleFromPreview,
  } = usePacking({ tripId });

  const regenDict = dictionary?.regenerate;

  // UI state
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [isCategorizedView, setIsCategorizedView] = useState<boolean>(true);
  const toggleFullScreen = () => setIsFullScreen((p) => !p);

  // Modal states
  const [isConfirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [isValidationModalOpen, setValidationModalOpen] = useState(false);
  const [pendingDetails, setPendingDetails] = useState<GenerateDetails | null>(null);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isBulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isRegenerateModalOpen, setRegenerateModalOpen] = useState(false);
  const [isShareOpen, setShareOpen] = useState(false);
  const [shareCreating, setShareCreating] = useState(false);
  const [shareAllowEdits, setShareAllowEdits] = useState(true);
  const [shareExpiryHours, setShareExpiryHours] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const shareDict = dictionary?.share;
  // Scroll lock when share modal open
  React.useEffect(() => {
    if (!isShareOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isShareOpen]);
  // Regeneration modal UI stage: 'form' | 'loading' | 'preview'
  const [regenStage, setRegenStage] = useState<'form' | 'loading' | 'preview'>('form');
  const isRegenLocked = regenStage === 'loading';

  // Prevent ESC and background scroll / clicks during locked state
  React.useEffect(() => {
    if (!isRegenerateModalOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isRegenLocked) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };
    document.addEventListener('keydown', handleKey, true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey, true);
      document.body.style.overflow = originalOverflow;
    };
  }, [isRegenLocked, isRegenerateModalOpen]);

  // beforeunload protection while generation in progress
  React.useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isRegenLocked) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    if (isRegenLocked) {
      window.addEventListener('beforeunload', handler);
    }
    return () => window.removeEventListener('beforeunload', handler);
  }, [isRegenLocked]);

  // When opening regeneration modal reset stage
  React.useEffect(() => {
    if (isRegenerateModalOpen) {
      setRegenStage('form');
    }
  }, [isRegenerateModalOpen]);

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
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

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

  // Regenerate handled via list generator re-use (future improvement)

  const handleValidateList = async () => {
    if (packingItems.length === 0) {
      showToast(dictionary?.listEmptyError || 'List empty', 'error');
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
  const ConfirmationModal = ({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) => (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{dictionary?.confirmation?.title}</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{dictionary?.confirmation?.body}</p>
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600"
          >
            {dictionary?.confirmation.cancel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {dictionary?.confirmation.confirm}
          </button>
        </div>
      </div>
    </div>
  );

  interface ValidationModalProps {
    context: string;
    setContext: (v: string) => void;
    onConfirm: (context: string) => void;
    onCancel: () => void;
  }
  const ValidationModal: React.FC<ValidationModalProps> = ({ context, setContext, onConfirm, onCancel }) => (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{dictionary?.validation?.title}</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{dictionary?.validation?.body}</p>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder={dictionary?.validation?.placeholder}
          className="mt-4 w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
          rows={3}
        />
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600"
          >
            {dictionary?.validation?.cancel}
          </button>
          <button
            onClick={() => onConfirm(context)}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            {dictionary?.validation?.confirm}
          </button>
        </div>
      </div>
    </div>
  );

  const [validationContext, setValidationContext] = useState('');

  // Suggestions rendering
  const renderSuggestions = () => {
    if (!suggestions) return null;

    const ActionButton: React.FC<{ onClick: () => void; className: string; children: React.ReactNode }> = ({
      onClick,
      className,
      children,
    }) => (
      <button
        onClick={onClick}
        className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-md transition-colors ${className}`}
      >
        {children}
      </button>
    );

    const handleApplyAddSuggestion = (item: { name: string; category: string }) => {
      addItem(item.name, item.category, '1');
      showToast(dictionary?.itemAdded?.replace('{itemName}', item.name) || 'Added', 'success');
    };

    const handleApplyRemoveSuggestion = (item: { name: string }) => {
      const itemToRemove = packingItems.find((p) => p.name.toLowerCase() === item.name.toLowerCase());
      if (itemToRemove) {
        deleteItem(itemToRemove.id);
        showToast(dictionary?.itemRemoved?.replace('{itemName}', item.name) || 'Removed', 'success');
      } else {
        showToast(dictionary?.itemNotFound?.replace('{itemName}', item.name) || 'Not found', 'error');
      }
    };

    interface AdjustSuggestion {
      name: string;
      field: 'name' | 'qty';
      suggested: string | number;
      current: string | number;
      reason: string;
    }
    const handleApplyAdjustSuggestion = (item: AdjustSuggestion) => {
      const targetItem = packingItems.find((p) => p.name.toLowerCase() === item.name.toLowerCase());
      if (targetItem) {
        if (item.field === 'name' || item.field === 'qty') {
          updateItem(
            targetItem.id,
            item.field === 'name' ? String(item.suggested) : targetItem.name,
            item.field === 'qty' ? String(item.suggested) : String(targetItem.qty)
          );
        }
        showToast(dictionary?.itemUpdated?.replace('{itemName}', item.name) || 'Updated', 'success');
      }
    };

    const handleApplyReplaceSuggestion = (item: ValidationResult['replace'][0]) => {
      const lowerCaseItemsToRemove = item.items_to_remove.map((i) => i.toLowerCase());
      const itemsToRemove = packingItems.filter((p) => lowerCaseItemsToRemove.includes(p.name.toLowerCase()));

      itemsToRemove.forEach((itemToRemove) => deleteItem(itemToRemove.id));
      addItem(item.suggested_item.name, item.suggested_item.category, '1');
      showToast(dictionary?.itemsReplaced?.replace('{itemName}', item.suggested_item.name) || 'Replaced', 'success');
    };

    interface ListItem {
      name: string;
      reason?: string;
      category?: string;
      field?: 'name' | 'qty';
      suggested?: string | number;
      current?: string | number;
    }
    const renderList = (title: string, items: ListItem[], action?: (item: ListItem) => React.ReactNode) =>
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
      );

    const renderReplaceList = (title: string, items: ValidationResult['replace']) =>
      items.length > 0 && (
        <div key={title}>
          <h4 className="font-bold text-md mt-2 text-slate-700 dark:text-slate-200">{title}</h4>
          <ul className="list-disc pl-5 text-sm text-slate-600 dark:text-slate-300 space-y-2">
            {items.map((item, index) => (
              <li key={index} className="flex justify-between items-center">
                <div>
                  <div>{dictionary?.replaceItems?.replace('{items}', item.items_to_remove.join(', '))}</div>
                  <div>
                    {dictionary?.replaceWith?.replace(
                      '{item}',
                      `${item.suggested_item.name} (${item.suggested_item.category})`
                    )}
                  </div>
                  <div className="text-xs italic text-slate-500 dark:text-slate-400 mt-0.5">{item.reason}</div>
                </div>
                <ActionButton
                  onClick={() => handleApplyReplaceSuggestion(item)}
                  className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 self-center"
                >
                  {dictionary?.suggestions?.apply}
                </ActionButton>
              </li>
            ))}
          </ul>
        </div>
      );

    return (
      <div className="bg-blue-100 border border-blue-400 text-blue-800 px-4 py-3 rounded-lg relative dark:bg-blue-900/20 dark:border-blue-500/30 dark:text-blue-200">
        <strong className="font-bold block mb-2">{dictionary?.suggestionsAITitle}</strong>
        {renderList(dictionary?.suggestions?.add || 'Add', suggestions.missing, (item) => (
          <ActionButton
            onClick={() => item.category && handleApplyAddSuggestion({ name: item.name, category: item.category })}
            className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
          >
            {dictionary?.suggestions?.addActionButton}
          </ActionButton>
        ))}
        {renderList(dictionary?.suggestions?.remove || 'Remove', suggestions.remove, (item) => (
          <ActionButton
            onClick={() => handleApplyRemoveSuggestion(item)}
            className="bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
          >
            {dictionary?.suggestions?.removeActionButton}
          </ActionButton>
        ))}
        {renderList(
          dictionary?.suggestions?.adjust || 'Adjust',
          suggestions.adjust.map((a) => ({
            name: a.name,
            field: a.field as 'name' | 'qty',
            current: a.current as string | number,
            suggested: a.suggested as string | number,
            reason: dictionary?.suggestions?.adjustReason
              .replace('{field}', a.field)
              .replace('{current}', String(a.current))
              .replace('{suggested}', String(a.suggested))
              .replace('{reason}', a.reason),
          })),
          (item) => {
            if (!item.field || item.suggested === undefined || item.current === undefined) return null;
            const adjusted: AdjustSuggestion = {
              name: item.name,
              field: item.field,
              suggested: item.suggested,
              current: item.current,
              reason: item.reason || '',
            };
            return (
              <ActionButton
                onClick={() => handleApplyAdjustSuggestion(adjusted)}
                className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800"
              >
                {dictionary?.suggestions?.changeActionButton}
              </ActionButton>
            );
          }
        )}
        {renderReplaceList(dictionary?.suggestions?.replace || 'Replace', suggestions.replace)}
      </div>
    );
  };

  if (initialLoad) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-slate-500 dark:text-slate-400">{dictionary?.loading}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200 transition-colors duration-300 relative">
      {/* Global regeneration lock overlay */}
      {isRegenerateModalOpen && regenStage === 'loading' && (
        <div
          className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center pointer-events-auto"
          aria-busy="true"
          aria-live="assertive"
        >
          <div className="flex flex-col items-center gap-4 p-6 rounded-xl bg-white/90 dark:bg-slate-800/90 shadow-xl border border-purple-400/30">
            <div className="w-12 h-12 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 text-center max-w-xs">
              {regenDict?.loadingOverlay?.message ||
                'AI is generating a new list. Please do not close or refresh the page...'}
            </p>
            <p className="text-[11px] uppercase tracking-wide text-purple-600 dark:text-purple-300 font-semibold">
              {regenDict?.loadingOverlay?.costProtection || 'Cost protection'}
            </p>
          </div>
        </div>
      )}
      <PackingHeader theme={theme} toggleTheme={toggleTheme} actionSlot={actionSlot} />

      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-2 rounded-md shadow-lg text-sm font-medium text-white ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
        >
          {toast.message}
        </div>
      )}

      <main
        className={`container mx-auto transition-all duration-300 ${isFullScreen ? 'p-0 md:p-0 max-w-full' : 'p-4 md:p-8'}`}
      >
        <div className="w-full flex justify-end mb-4 no-print">
          <div className="flex flex-wrap gap-3">
            {(listMeta?.regenerationCount ?? 0) < 2 && (
              <button
                type="button"
                onClick={() => setRegenerateModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow px-5 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <span className="text-lg leading-none">♻</span>
                <span>{regenDict?.button || 'Re-generate (AI)'}</span>
                <span className="text-[10px] bg-purple-500/60 px-2 py-0.5 rounded-full">
                  {(listMeta?.regenerationCount ?? 0) + 1}/2
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setShareOpen(true);
                setShareCopied(false);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow px-5 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <span className="text-lg leading-none">🔗</span>
              <span>{shareDict?.button || 'Share'}</span>
            </button>
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow px-5 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <span className="text-lg leading-none">＋</span>
              <span>
                {dictAll.packing?.addItemModal.title ||
                  dictAll.ui?.common.add ||
                  (lang === 'pl' ? 'Dodaj przedmiot' : 'Add item')}
              </span>
            </button>
          </div>
        </div>
        {/* Layout behavior changes:
            - If there are no packing items AND no checklist items, we focus on generation / quick add (left panel only)
            - If there are items, we hide the left panel and expand the list to full width (user requested) */}
        <div className={`${isFullScreen ? '' : 'grid grid-cols-1 lg:grid-cols-3 gap-8'}`}>
          <div
            className={`lg:col-span-1 space-y-6 no-print ${isFullScreen || packingItems.length > 0 ? 'hidden' : ''}`}
          >
            <CollapsibleSection title={dictionary?.generateTitle || 'Generate'}>
              <PackingListGenerator onGenerate={handleGenerateList} isLoading={isLoading} trip={trip} uiLang={lang} />
            </CollapsibleSection>
            {(listMeta?.regenerationCount ?? 0) < 2 && (
              <CollapsibleSection title={regenDict?.title || 'Re-generate'}>
                <PackingListGenerator
                  onGenerate={regenerateList}
                  isLoading={isLoading}
                  trip={trip}
                  regenerateMode
                  uiLang={lang}
                />
              </CollapsibleSection>
            )}
            <CollapsibleSection title={dictionary?.manageTitle || 'Manage'}>
              <PackingListActions
                onCheckList={handleValidateList}
                onClearList={clearList}
                isLoading={isLoading}
                isListEmpty={packingItems.length === 0 && checklistItems.length > 0}
                onCategorizeList={categorizeList}
                onLoadTemplate={loadTemplate}
              />
            </CollapsibleSection>
            <CollapsibleSection title={dictionary?.quickAddTitle || 'Quick add'}>
              <QuickAddItem onAddItem={addItemFromLibrary} />
            </CollapsibleSection>
            {/* Preview intentionally moved to main column for visibility after initial generation */}
            {error && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative dark:bg-red-900/20 dark:border-red-500/30 dark:text-red-200"
                role="alert"
              >
                {error}
                <button onClick={clearError} className="absolute top-0 bottom-0 right-0 px-4 py-3">
                  <span className="sr-only">{dictionary?.errorDismiss}</span>×
                </button>
              </div>
            )}
            {suggestions && renderSuggestions()}
          </div>

          <div
            className={`space-y-6 transition-all duration-300 ${isFullScreen ? 'lg:col-span-3' : packingItems.length > 0 || checklistItems.length > 0 ? 'lg:col-span-3' : 'lg:col-span-2'}`}
          >
            {listMeta && listMeta.archetype && !isFullScreen && (
              <div className="bg-indigo-50 border-l-4 border-indigo-500 text-indigo-800 p-4 rounded-r-lg shadow dark:bg-indigo-900/20 dark:border-indigo-500 dark:text-indigo-200">
                <p className="font-bold text-lg">{dictionary?.archetype?.replace('{archetype}', listMeta.archetype)}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {dictionary?.metaDetails
                    .replace('{destination}', listMeta.destination)
                    .replace('{days}', String(listMeta.days))
                    .replace('{adults}', String(listMeta.people.adults))
                    .replace('{children}', String(listMeta.people.children))}
                </p>
              </div>
            )}
            {regeneratedPreview && regeneratedPreview.length > 0 && !isRegenerateModalOpen && (
              <div className="no-print">
                <PackingRegenerationPreview
                  items={regeneratedPreview}
                  onAddAll={() => applyRegeneratedPreview('all')}
                  onDiscard={discardRegeneratedPreview}
                  onAddSingle={(id) => addSingleFromPreview(id)}
                />
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
              onToggleCategorizedView={() => setIsCategorizedView((prev) => !prev)}
            />
          </div>
        </div>
      </main>

      {/* Bulk Delete destructive action (only when enabled and not full screen) */}
      {enableBulkDelete && !isFullScreen && (packingItems.length > 0 || checklistItems.length > 0) && (
        <div className="container mx-auto px-4 md:px-8 pb-8 mt-4">
          <div className="border-t border-red-500/20 pt-6">
            <button
              type="button"
              onClick={() => setBulkDeleteOpen(true)}
              className="w-full md:w-auto inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium px-5 py-2.5 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0h8m-9 0h10l-1-3H9l-1 3z"
                />
              </svg>
              {dictionary?.bulkDelete?.openButton || 'Delete entire list'}
            </button>
          </div>
        </div>
      )}

      {isBulkDeleteOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/55 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-slate-800 border border-red-500/30 shadow-xl relative">
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {dictionary?.bulkDelete?.title || 'Confirm list deletion'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {dictionary?.bulkDelete?.body ||
                      'This will remove all packing items, checklist entries and reset categories to defaults. This action cannot be undone. Are you sure you want to proceed?'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBulkDeleteOpen(false)}
                  className="inline-flex justify-center rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {dictionary?.confirmation?.cancel || dictAll.ui?.common.cancel || 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearList();
                    setBulkDeleteOpen(false);
                  }}
                  className="inline-flex justify-center items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-500 text-white shadow focus:outline-none focus:ring-2 focus:ring-red-400"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0h8m-9 0h10l-1-3H9l-1 3z"
                    />
                  </svg>
                  {dictionary?.bulkDelete?.deleteAll || 'Delete all'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isConfirmationModalOpen && (
        <ConfirmationModal onConfirm={handleConfirmGeneration} onCancel={handleCancelGeneration} />
      )}
      {isValidationModalOpen && (
        <ValidationModal
          context={validationContext}
          setContext={setValidationContext}
          onConfirm={handleConfirmValidation}
          onCancel={handleCancelValidation}
        />
      )}
      {isRegenerateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-slate-950/70"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-3xl bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 rounded-2xl shadow-2xl border border-slate-700/60 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-[0.07] bg-[radial-gradient(circle_at_30%_20%,#6366f1,transparent_60%),radial-gradient(circle_at_70%_80%,#8b5cf6,transparent_65%)]" />
            <div className="relative p-6 max-h-[80vh] flex flex-col">
              {regenStage !== 'loading' && (
                <button
                  onClick={() => {
                    if (regenStage === 'preview') {
                      discardRegeneratedPreview();
                    }
                    setRegenerateModalOpen(false);
                  }}
                  className="absolute top-3 right-3 text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label="Close"
                >
                  ✕
                </button>
              )}
              <h3 className="text-xl font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 tracking-tight">
                {regenDict?.title || 'Re-generate list'}
              </h3>
              {regenStage === 'form' && (
                <PackingListGenerator
                  onGenerate={async (d) => {
                    try {
                      setRegenStage('loading');
                      await regenerateList(d);
                      setRegenStage('preview');
                    } catch (e) {
                      showToast(
                        (e as Error).message ||
                          (lang === 'pl' ? 'Błąd podczas regeneracji listy' : 'Error regenerating list'),
                        'error'
                      );
                      setRegenStage('form');
                    }
                  }}
                  isLoading={regenStage !== 'form' || isLoading}
                  trip={trip}
                  regenerateMode
                  uiLang={lang}
                />
              )}
              {regenStage === 'loading' && (
                <div
                  className="flex flex-col items-center justify-center gap-5 py-16 relative"
                  role="status"
                  aria-busy="true"
                >
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full border-4 border-indigo-400/30 border-t-indigo-400 animate-spin" />
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-b-purple-500 animate-spin-slow" />
                  </div>
                  <p className="text-sm text-slate-300 font-medium tracking-wide">
                    {regenDict?.generatingNewList || 'Generating new list...'}
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-indigo-400/80">AI</p>
                  <span className="sr-only">{dictAll.ui?.common.pleaseWait || 'Please wait'}</span>
                </div>
              )}
              {regenStage === 'preview' && regeneratedPreview && regeneratedPreview.length > 0 && (
                <div className="space-y-5 overflow-hidden flex-1 flex flex-col">
                  <p className="text-sm text-slate-300">
                    {regenDict?.previewIntro ||
                      'A new list has been generated. You can add all or select individual items.'}
                  </p>
                  <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
                    <PackingRegenerationPreview
                      items={regeneratedPreview}
                      onAddAll={() => {
                        applyRegeneratedPreview('all');
                        setRegenerateModalOpen(false);
                      }}
                      onDiscard={() => {
                        discardRegeneratedPreview();
                        setRegenStage('form');
                      }}
                      onAddSingle={(id) => addSingleFromPreview(id)}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2 border-t border-slate-600/40">
                    <button
                      type="button"
                      onClick={() => {
                        discardRegeneratedPreview();
                        setRegenerateModalOpen(false);
                      }}
                      className="px-4 py-2 text-sm font-medium rounded-md bg-slate-700/70 hover:bg-slate-600 text-slate-200"
                    >
                      {dictAll.ui?.common.close || 'Close'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        applyRegeneratedPreview('all');
                        setRegenerateModalOpen(false);
                      }}
                      className="px-4 py-2 text-sm font-semibold rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow"
                    >
                      {regenDict?.addAll || 'Add all'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {isShareOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 shadow-xl relative">
            <button
              onClick={() => setShareOpen(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label={dictAll.ui?.common.close || 'Close'}
            >
              ✕
            </button>
            <div className="p-6 space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {shareDict?.title || 'Share packing list'}
              </h2>
              <div className="space-y-3">
                <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={shareAllowEdits}
                    onChange={(e) => setShareAllowEdits(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-teal-600 focus:ring-teal-500"
                  />
                  <span>
                    {shareDict?.allowEdits || 'Allow edits'}
                    {shareDict?.allowEditsHelp && (
                      <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {shareDict.allowEditsHelp}
                      </span>
                    )}
                  </span>
                </label>
                <label className="block text-sm text-slate-700 dark:text-slate-300">
                  <span>{shareDict?.expiryLabel || 'Expiry (hours, optional)'}</span>
                  <input
                    type="number"
                    min={1}
                    value={shareExpiryHours}
                    onChange={(e) => setShareExpiryHours(e.target.value)}
                    placeholder={shareDict?.expiryLabel || 'Expiry (hours, optional)'}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                  {shareDict?.expiryHelp && (
                    <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {shareDict.expiryHelp}
                    </span>
                  )}
                </label>
                {shareUrl && (
                  <div className="rounded-md bg-slate-100 dark:bg-slate-700 p-3 text-xs break-all text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                    {shareUrl}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-3 justify-end pt-2">
                {!shareUrl && (
                  <button
                    type="button"
                    disabled={shareCreating}
                    onClick={async () => {
                      setShareCreating(true);
                      setShareCopied(false);
                      try {
                        const body: Record<string, unknown> = { canModify: shareAllowEdits, lang };
                        const hrs = parseInt(shareExpiryHours, 10);
                        if (!Number.isNaN(hrs) && hrs > 0) body.expiresInHours = hrs;
                        const res = await fetch(`/api/trips/${tripId}/packing/share`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify(body),
                        });
                        if (!res.ok) throw new Error('Share failed');
                        const data = await res.json();
                        setShareUrl(data.url);
                        showToast(shareDict?.success || 'Link created', 'success');
                      } catch (e) {
                        showToast(shareDict?.error || (e as Error).message || 'Share failed', 'error');
                      } finally {
                        setShareCreating(false);
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-md bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  >
                    {shareCreating ? shareDict?.creating || 'Creating...' : shareDict?.create || 'Create link'}
                  </button>
                )}
                {shareUrl && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(shareUrl);
                        setShareCopied(true);
                        setTimeout(() => setShareCopied(false), 2000);
                      } catch {
                        // ignore clipboard errors (e.g. permissions)
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-md bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  >
                    {shareCopied ? shareDict?.copied || 'Copied!' : shareDict?.copy || 'Copy link'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShareOpen(false);
                    setShareUrl(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-sm font-medium px-4 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  {dictAll.ui?.common.close || 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAddItem={addItem}
        categories={filteredCategories}
        QuickAddSlot={<QuickAddItem onAddItem={addItemFromLibrary} />}
        onRegenerate={() => setRegenerateModalOpen(true)}
        canRegenerate={(listMeta?.regenerationCount ?? 0) < 2}
        regenerateInfo={(listMeta?.regenerationCount ?? 0) >= 2 ? regenDict?.limitReached : regenDict?.info || ''}
      />
    </div>
  );
};

export default PackingAssistant;
