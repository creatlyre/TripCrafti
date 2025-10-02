import React, { useState, useMemo, useRef } from 'react';

import type { PackingItem } from '@/types';

import { useDictionary } from '@/components/hooks/useDictionary';
import PackingListItem from '@/components/PackingListItem';
import { CATEGORY_ICONS } from '@/lib/constants';
import { i18nFormat } from '@/lib/i18nFormat';

interface AddItemFormProps {
  category: string;
  onAddItem: (itemName: string, category: string, quantity: string) => void;
  listDict?: { addItemPlaceholder?: string; quantity?: string };
}

const AddItemForm: React.FC<AddItemFormProps> = ({ category, onAddItem, listDict }) => {
  const [newItemName, setNewItemName] = useState('');
  const [quantity, setQuantity] = useState('1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddItem(newItemName, category, quantity);
    setNewItemName('');
    setQuantity('1');
  };

  // Dictionary section provided by parent (so we don't call hooks in this child unnecessarily)

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mt-3 no-print">
      <input
        type="text"
        value={newItemName}
        onChange={(e) => setNewItemName(e.target.value)}
        placeholder={listDict?.addItemPlaceholder || 'Dodaj nowy przedmiot...'}
        className="flex-grow px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-600 dark:border-slate-500 dark:text-slate-200 dark:placeholder-slate-400"
        required
      />
      <input
        type="text"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        placeholder={listDict?.quantity || 'Ilość'}
        className="w-20 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-600 dark:border-slate-500 dark:text-slate-200 dark:placeholder-slate-400"
      />
      <button
        type="submit"
        className="px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        +
      </button>
    </form>
  );
};

interface PackingListProps {
  items: PackingItem[];
  categories: string[];
  onAddItem: (itemName: string, category: string, quantity: string) => void;
  onToggleItem: (itemId: number) => void;
  onDeleteItem: (itemId: number) => void;
  onUpdateItem: (itemId: number, newName: string, newQty: string) => void;
  onDropItem: (draggedItemId: number, targetCategoryId: string, targetItemId: number | null) => void;
  onDropCategory: (draggedCategoryName: string, targetCategoryName: string) => void;
  onSortCategories: (sortBy: 'az' | 'za' | 'count') => void;
  onDeleteCategory: (categoryName: string) => void;
  onUpdateCategory: (oldName: string, newName: string) => void;
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  totalItemCount: number;
  totalPackedCount: number;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  isCategorizedView: boolean;
  onToggleCategorizedView: () => void;
}

const CircularProgressBar: React.FC<{ progress: number }> = ({ progress }) => {
  const sqSize = 50;
  const strokeWidth = 5;
  const radius = (sqSize - strokeWidth) / 2;
  const viewBox = `0 0 ${sqSize} ${sqSize}`;
  const dashArray = radius * Math.PI * 2;
  const dashOffset = dashArray - (dashArray * progress) / 100;

  return (
    <svg width={sqSize} height={sqSize} viewBox={viewBox} className="">
      <circle
        className="stroke-current text-slate-200 dark:text-slate-700"
        cx={sqSize / 2}
        cy={sqSize / 2}
        r={radius}
        strokeWidth={`${strokeWidth}px`}
        fill="none"
      />
      <circle
        className="stroke-current text-green-500"
        cx={sqSize / 2}
        cy={sqSize / 2}
        r={radius}
        strokeWidth={`${strokeWidth}px`}
        strokeLinecap="round"
        fill="none"
        style={{
          strokeDasharray: dashArray,
          strokeDashoffset: dashOffset,
          transition: 'stroke-dashoffset 0.3s ease 0s',
        }}
      />
      <g className="pointer-events-none select-none" aria-hidden="true">
        <text
          className="fill-current text-slate-700 dark:text-slate-200 text-[10px] font-semibold"
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
        >
          {`${Math.round(progress)}%`}
        </text>
      </g>
    </svg>
  );
};

const ExpandIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v4h-4" />
  </svg>
);

const CompressIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10 14l-4 4m0 0v-4m0 4h4m6-10l4-4m0 0h-4m4 0v4m-6 10l4 4m0 0v-4m0 4h-4m-6-10l-4-4m0 0h4m-4 0v4"
    />
  </svg>
);

const PackingList: React.FC<PackingListProps> = ({
  items,
  categories,
  onAddItem,
  onToggleItem,
  onDeleteItem,
  onUpdateItem,
  onDropItem,
  onDropCategory,
  onSortCategories,
  onDeleteCategory,
  onUpdateCategory,
  isLoading,
  searchTerm,
  onSearchChange,
  totalItemCount,
  totalPackedCount,
  isFullScreen,
  onToggleFullScreen,
  isCategorizedView,
  onToggleCategorizedView,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [draggedItem, setDraggedItem] = useState<{ type: 'item' | 'category'; id: number | string } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{ type: 'item' | 'category'; id: number | string } | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
  const [editedCategoryValue, setEditedCategoryValue] = useState('');

  const areAllExpanded = useMemo(() => {
    if (categories.length === 0) return false;
    return categories.every((c) => expandedCategories.has(c));
  }, [categories, expandedCategories]);

  const overallProgress = useMemo(() => {
    if (totalItemCount === 0) return 0;
    return (totalPackedCount / totalItemCount) * 100;
  }, [totalItemCount, totalPackedCount]);

  const handleToggleAll = () => {
    if (areAllExpanded) {
      setExpandedCategories(new Set());
    } else {
      setExpandedCategories(new Set(categories));
    }
  };

  const handleToggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const handleEditCategoryStart = (categoryName: string) => {
    setEditingCategoryName(categoryName);
    setEditedCategoryValue(categoryName);
  };

  const handleEditCategoryCancel = () => {
    setEditingCategoryName(null);
    setEditedCategoryValue('');
  };

  const handleEditCategorySave = () => {
    if (editingCategoryName) {
      onUpdateCategory(editingCategoryName, editedCategoryValue);
    }
    handleEditCategoryCancel();
  };

  // Generic Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, type: 'item' | 'category', id: number | string) => {
    const payload = JSON.stringify({ type, id });
    e.dataTransfer.setData('application/json', payload);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItem({ type, id });
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetType: 'item' | 'category', targetId: number | string) => {
    e.preventDefault();
    e.stopPropagation();
    const payload = e.dataTransfer.getData('application/json');
    if (!payload) return;

    const dragged = JSON.parse(payload) as { type: 'item' | 'category'; id: number | string };
    if (dragged.id === targetId) return;

    if (dragged.type === 'item') {
      const targetCategory =
        targetType === 'item' ? items.find((i) => i.id === targetId)?.category : (targetId as string);

      if (targetCategory) {
        onDropItem(dragged.id as number, targetCategory, targetType === 'item' ? (targetId as number) : null);
      }
    } else if (dragged.type === 'category' && targetType === 'category') {
      onDropCategory(dragged.id as string, targetId as string);
    }
    setDragOverTarget(null);
  };

  // Touch Handlers for Mobile (simplified logic)
  const touchTimeoutRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent, type: 'item' | 'category', id: number | string) => {
    touchTimeoutRef.current = window.setTimeout(() => {
      setDraggedItem({ type, id });
    }, 200); // Long press to drag
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggedItem) return;
    const touch = e.touches[0];
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);

    const itemTarget = targetElement?.closest('[data-item-id]');
    const categoryTarget = targetElement?.closest('[data-category-id]');

    if (itemTarget) {
      const id = Number(itemTarget.getAttribute('data-item-id'));
      setDragOverTarget({ type: 'item', id });
    } else if (categoryTarget) {
      const id = categoryTarget.getAttribute('data-category-id');
      if (id) setDragOverTarget({ type: 'category', id });
    } else {
      setDragOverTarget(null);
    }
  };

  const handleTouchEnd = () => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
    if (draggedItem && dragOverTarget && draggedItem.id !== dragOverTarget.id) {
      if (draggedItem.type === 'item') {
        const targetCategory =
          dragOverTarget.type === 'item'
            ? items.find((i) => i.id === dragOverTarget.id)?.category
            : (dragOverTarget.id as string);
        if (targetCategory) {
          onDropItem(
            draggedItem.id as number,
            targetCategory,
            dragOverTarget.type === 'item' ? (dragOverTarget.id as number) : null
          );
        }
      } else if (draggedItem.type === 'category' && dragOverTarget.type === 'category') {
        onDropCategory(draggedItem.id as string, dragOverTarget.id as string);
      }
    }
    setDraggedItem(null);
    setDragOverTarget(null);
  };

  const dict = useDictionary();
  const listT = dict.packing?.list;
  const statusT = dict.packing?.status; // eslint-disable-line @typescript-eslint/no-unused-vars
  const ui = dict.ui?.common;

  const groupedItems = useMemo(() => {
    return items.reduce((acc: Record<string, PackingItem[]>, item) => {
      const category = item.category || listT?.noItemsInCategory || 'Inne';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});
  }, [items, listT?.noItemsInCategory]);

  const containerClasses = `bg-white dark:bg-slate-800 packing-list-container transition-all duration-300 flex flex-col ${
    isFullScreen ? 'h-full w-full shadow-none rounded-none' : 'p-6 rounded-lg shadow-md'
  }`;

  const contentWrapperClasses = isFullScreen ? 'flex-grow overflow-y-auto' : '';

  if (isLoading && totalItemCount === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md text-center packing-list-container">
        <p className="text-slate-500 dark:text-slate-400">
          {listT?.listGenerating || 'Generowanie listy, proszę czekać...'}
        </p>
      </div>
    );
  }

  if (totalItemCount === 0 && categories.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md packing-list-container">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">
            {listT?.emptyTitle || 'Twoja lista jest pusta'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            {listT?.emptyBody || "Wygeneruj nową listę lub użyj przycisku 'Dodaj przedmiot'."}
          </p>
          <div className="mt-4 mb-2 text-5xl text-slate-300 dark:text-slate-600">🧳</div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className={` ${isFullScreen ? 'p-4 md:p-6' : ''}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 border-b dark:border-slate-700 pb-4 gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {listT?.heading || 'Lista do spakowania'}
            </h2>
            {totalItemCount > 0 && <CircularProgressBar progress={overallProgress} />}
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-grow no-print">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={listT?.searchPlaceholder || 'Szukaj przedmiotów...'}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-300 rounded-full text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-slate-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            <button
              onClick={onToggleCategorizedView}
              className="flex-shrink-0 p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800 no-print"
              aria-label={isCategorizedView ? ui?.collapse || 'Pokaż listę płaską' : ui?.expand || 'Pokaż kategorie'}
            >
              {isCategorizedView ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2H5a2 2 0 00-2 2v2m14 0h-2M5 11H3"
                  />
                </svg>
              )}
            </button>
            <button
              onClick={onToggleFullScreen}
              className="flex-shrink-0 p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800 no-print"
              aria-label={
                isFullScreen ? ui?.collapse || 'Wyjdź z trybu pełnoekranowego' : ui?.expand || 'Tryb pełnoekranowy'
              }
            >
              {isFullScreen ? <CompressIcon /> : <ExpandIcon />}
            </button>
          </div>
        </div>
        {isCategorizedView && (
          <div className="flex items-center gap-2 flex-wrap mb-4 no-print">
            <button
              onClick={handleToggleAll}
              className="px-3 py-1 text-xs font-semibold text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={areAllExpanded ? ui?.collapse || 'Zwiń wszystko' : ui?.expand || 'Rozwiń wszystko'}
              disabled={categories.length === 0}
            >
              {areAllExpanded ? ui?.collapse || 'Zwiń wszystko' : ui?.expand || 'Rozwiń wszystko'}
            </button>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300 ml-2">
              {listT?.sortCategories || 'Sortuj kategorie:'}
            </span>
            <button
              onClick={() => onSortCategories('az')}
              className="px-2 py-1 text-xs font-semibold text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              aria-label="Sortuj A-Z"
            >
              A-Z
            </button>
            <button
              onClick={() => onSortCategories('za')}
              className="px-2 py-1 text-xs font-semibold text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              aria-label="Sortuj Z-A"
            >
              Z-A
            </button>
            <button
              onClick={() => onSortCategories('count')}
              className="px-2 py-1 text-xs font-semibold text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              aria-label="Sortuj po liczbie przedmiotów"
            >
              {listT?.itemsCount || '# Przedmiotów'}
            </button>
          </div>
        )}
      </div>

      <div className={contentWrapperClasses}>
        {isCategorizedView ? (
          <div className={`space-y-2 ${isFullScreen ? 'p-4 md:p-6 pt-0' : ''}`}>
            {/* Removed inline add forms to simplify UI; creation handled by floating modal */}
            {searchTerm.trim() && items.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-500 dark:text-slate-400">
                  {i18nFormat(listT?.searchNoResults, { query: searchTerm })}
                </p>
              </div>
            )}
            {categories.map((category) => {
              const categoryItems = groupedItems[category] || [];
              const packedCount = categoryItems.filter((item) => item.packed).length;
              const totalCount = categoryItems.length;
              const progress = totalCount > 0 ? (packedCount / totalCount) * 100 : 0;
              const isExpanded = expandedCategories.has(category);
              const isDragged = draggedItem?.type === 'category' && draggedItem.id === category;
              const isCategoryDropTarget =
                draggedItem?.type === 'item' && dragOverTarget?.type === 'category' && dragOverTarget.id === category;
              const isCategorySelfDropTarget = dragOverTarget?.type === 'category' && dragOverTarget.id === category;
              const IconComponent = CATEGORY_ICONS[category] || CATEGORY_ICONS.default;

              return (
                <div className="print:block" key={category}>
                  {isCategorySelfDropTarget && draggedItem?.type === 'category' && draggedItem.id !== category && (
                    <div className="h-2 my-1 border-2 border-dashed border-indigo-400 rounded-full"></div>
                  )}
                  <div
                    onClick={() => handleToggleCategory(category)}
                    data-category-id={category}
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, 'category', category)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, 'category', category)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverTarget({ type: 'category', id: category });
                    }}
                    onTouchStart={(e) => handleTouchStart(e, 'category', category)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className={`w-full flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer list-none transition-colors ${isDragged ? 'opacity-30' : ''} ${isCategoryDropTarget ? 'bg-indigo-100 dark:bg-indigo-900/50' : ''}`}
                  >
                    <div className="flex items-center flex-grow text-left group">
                      <IconComponent />
                      <div className="ml-3 flex-grow">
                        {editingCategoryName === category ? (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editedCategoryValue}
                              onChange={(e) => setEditedCategoryValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleEditCategorySave();
                                if (e.key === 'Escape') handleEditCategoryCancel();
                              }}
                              className="px-2 py-1 bg-white border border-indigo-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-slate-600 dark:border-slate-500 dark:text-slate-200"
                              autoFocus
                            />
                            <button
                              onClick={handleEditCategorySave}
                              className="p-1 text-green-600 hover:text-green-800"
                              aria-label="Zapisz nazwę"
                            >
                              ✓
                            </button>
                            <button
                              onClick={handleEditCategoryCancel}
                              className="p-1 text-red-600 hover:text-red-800"
                              aria-label="Anuluj"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-400">{category}</h3>
                        )}
                        {totalCount > 0 && !(editingCategoryName === category) && (
                          <div className="mt-1.5 pr-4">
                            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                              <span>{ui?.progress || 'Postęp'}</span>
                              <span>
                                {packedCount} / {totalCount}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5 mt-1">
                              <div
                                className="bg-green-500 h-1.5 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div
                        className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2 no-print"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleEditCategoryStart(category)}
                          className="p-1 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                          aria-label="Edytuj kategorię"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => onDeleteCategory(category)}
                          disabled={categoryItems.length > 0}
                          className="p-1 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-500 disabled:text-slate-300 dark:disabled:text-slate-600 disabled:cursor-not-allowed"
                          aria-label="Usuń kategorię"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-6 w-6 text-slate-400 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  <div
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100 visible' : 'max-h-0 opacity-0 invisible'}`}
                    onDrop={(e) => handleDrop(e, 'category', category)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverTarget({ type: 'category', id: category });
                    }}
                  >
                    <div className={`pt-1 pb-2 pl-2 pr-1 ${isExpanded ? 'mt-2' : ''}`}>
                      {categoryItems.length > 0 ? (
                        <ul className="space-y-1">
                          {categoryItems.map((item) => (
                            <React.Fragment key={item.id}>
                              {dragOverTarget?.type === 'item' &&
                                dragOverTarget.id === item.id &&
                                draggedItem?.id !== item.id && (
                                  <li className="h-10 my-1 border-2 border-dashed border-indigo-400 rounded-md bg-indigo-50 dark:bg-indigo-900/20"></li>
                                )}
                              <PackingListItem
                                item={item}
                                isDraggable={true}
                                isDragged={draggedItem?.type === 'item' && draggedItem.id === item.id}
                                onToggleItem={onToggleItem}
                                onDeleteItem={onDeleteItem}
                                onUpdateItem={onUpdateItem}
                                onDragStart={(e) => handleDragStart(e, 'item', item.id)}
                                onDragEnd={handleDragEnd}
                                onDrop={(e) => handleDrop(e, 'item', item.id)}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setDragOverTarget({ type: 'item', id: item.id });
                                }}
                                onTouchStart={(e) => handleTouchStart(e, 'item', item.id)}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                              />
                            </React.Fragment>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-400 italic px-2">
                          {listT?.noItemsInCategory || 'Brak przedmiotów w tej kategorii.'}
                        </p>
                      )}
                      <AddItemForm category={category} onAddItem={onAddItem} listDict={listT} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`space-y-2 ${isFullScreen ? 'p-4 md:p-6 pt-0' : ''}`}>
            {searchTerm.trim() && items.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-500 dark:text-slate-400">
                  {i18nFormat(listT?.searchNoResults, { query: searchTerm })}
                </p>
              </div>
            )}
            <ul className="space-y-1">
              {items.map((item) => (
                <PackingListItem
                  key={item.id}
                  item={item}
                  isDraggable={false}
                  isDragged={false}
                  onToggleItem={onToggleItem}
                  onDeleteItem={onDeleteItem}
                  onUpdateItem={onUpdateItem}
                  onDragStart={(e) => e.preventDefault()}
                  onDragEnd={() => {}}
                  onDrop={(e) => e.preventDefault()}
                  onDragOver={(e) => e.preventDefault()}
                  onTouchStart={() => {}}
                  onTouchMove={() => {}}
                  onTouchEnd={() => {}}
                />
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Inline forms removed in full screen as well */}
    </div>
  );
};

export default PackingList;
