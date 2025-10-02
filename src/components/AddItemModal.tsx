import React, { useState, useEffect, useRef } from 'react';

import { useDictionary } from '@/components/hooks/useDictionary';
import { mapCategoriesForSelect } from '@/lib/categoryLocalization';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (name: string, category: string, qty: string) => void;
  categories: string[];
  QuickAddSlot?: React.ReactNode; // for embedding quick add buttons
  onRegenerate?: () => void; // trigger AI regeneration preview
  canRegenerate?: boolean; // whether regeneration allowed
  regenerateInfo?: string; // info / limit text
}

const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onAddItem,
  categories,
  QuickAddSlot,
  onRegenerate,
  canRegenerate = true,
  regenerateInfo,
}) => {
  const dict = useDictionary();
  const t = dict.packing?.addItemModal;
  const ui = dict.ui?.common;
  const regenDict = dict.packingAssistant?.regenerate;
  const [name, setName] = useState('');
  const [qty, setQty] = useState('1');
  const [category, setCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTimeout(() => {
      const el = dialogRef.current?.querySelector<HTMLInputElement>('input[name="item-name"]');
      if (el) el.focus();
    }, 50);
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const reset = () => {
    setName('');
    setQty('1');
    setCategory('');
    setIsCustomCategory(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const finalCat = category.trim() || t?.categoryOther || 'Inne';
    onAddItem(name.trim(), finalCat, qty.trim() || '1');
    reset();
    onClose();
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setCategory(e.target.value);
  };

  if (!isOpen) return null;

  // Prepare localized category options (label shown, value preserved)
  const localizedCategories = mapCategoriesForSelect(categories, dict);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t?.title || 'Dodaj przedmiot'}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-fadeIn"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t?.title || 'Dodaj przedmiot'}</h3>
          <button
            onClick={() => {
              reset();
              onClose();
            }}
            aria-label={ui?.close || 'Zamknij'}
            className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {onRegenerate && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700">
              <div className="flex-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{regenerateInfo}</div>
              <button
                type="button"
                disabled={!canRegenerate}
                onClick={onRegenerate}
                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-indigo-600 disabled:bg-indigo-300 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {regenDict?.button || 'AI'}
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-1">
              <label className="block text-xs font-medium mb-1 text-slate-500 dark:text-slate-400" htmlFor="item-name">
                {t?.nameLabel || 'Nazwa'}
              </label>
              <input
                id="item-name"
                name="item-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={t?.namePlaceholder || 'np. Power bank'}
              />
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-medium mb-1 text-slate-500 dark:text-slate-400" htmlFor="item-qty">
                {t?.quantityLabel || 'Ilość'}
              </label>
              <input
                id="item-qty"
                type="text"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="1"
              />
            </div>
            {!isCustomCategory && (
              <div className="col-span-1 sm:col-span-2">
                <label
                  className="block text-xs font-medium mb-1 text-slate-500 dark:text-slate-400"
                  htmlFor="item-category"
                >
                  {t?.categoryLabel || 'Kategoria'}
                </label>
                <div className="flex gap-2 items-center">
                  <select
                    id="item-category"
                    value={category}
                    onChange={(e) => {
                      handleCategoryChange(e);
                      if (e.target.value === '__custom') {
                        setIsCustomCategory(true);
                        setCategory('');
                      }
                    }}
                    className="flex-grow px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">{t?.categoryOther || '(Inne)'}</option>
                    {localizedCategories
                      .sort((a, b) => a.label.localeCompare(b.label))
                      .map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    <option value="__custom">{t?.categoryNew || '+ Nowa kategoria...'}</option>
                  </select>
                </div>
              </div>
            )}
            {isCustomCategory && (
              <div className="col-span-1 sm:col-span-2">
                <label
                  className="block text-xs font-medium mb-1 text-slate-500 dark:text-slate-400"
                  htmlFor="item-custom-category"
                >
                  {t?.categoryNewPlaceholder || 'Nowa kategoria'}
                </label>
                <div className="flex gap-2">
                  <input
                    id="item-custom-category"
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex-grow px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={t?.categoryNewPlaceholder || 'Nowa kategoria'}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomCategory(false);
                      setCategory('');
                    }}
                    className="px-3 py-2 text-sm rounded-md bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-500"
                  >
                    ◀
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t?.categoryHelp || 'Jeśli kategoria istnieje możesz ją wybrać z listy. Nowe nazwy zostaną dodane.'}
                </p>
              </div>
            )}
          </div>
          {QuickAddSlot && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 max-h-56 overflow-y-auto">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                {t?.quickAddTitle || 'Szybkie dodawanie'}
              </h4>
              {QuickAddSlot}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                reset();
                onClose();
              }}
              className="px-4 py-2 text-sm rounded-md bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-500"
            >
              {t?.cancel || ui?.cancel || 'Anuluj'}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {t?.submit || ui?.add || 'Dodaj'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;
