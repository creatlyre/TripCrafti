import React, { useState } from 'react';

import type { PackingItem } from '@/types';

interface PackingListItemProps {
  item: PackingItem;
  isDragged: boolean;
  isDraggable: boolean;
  onToggleItem: (itemId: number) => void;
  onDeleteItem: (itemId: number) => void;
  onUpdateItem: (itemId: number, newName: string, newQty: string) => void;
  onDragStart: (e: React.DragEvent<HTMLLIElement>) => void;
  onDragEnd: (e: React.DragEvent<HTMLLIElement>) => void;
  onDrop: (e: React.DragEvent<HTMLLIElement>, item: PackingItem) => void;
  onDragOver: (e: React.DragEvent<HTMLLIElement>) => void;
  onTouchStart: (e: React.TouchEvent<HTMLLIElement>) => void;
  onTouchMove: (e: React.TouchEvent<HTMLLIElement>) => void;
  onTouchEnd: (e: React.TouchEvent<HTMLLIElement>) => void;
  hideEditButton?: boolean;
  hideDeleteButton?: boolean;
  disabled?: boolean; // for shared view when cannot modify
}

const PackingListItem: React.FC<PackingListItemProps> = ({
  item,
  isDragged,
  isDraggable,
  onToggleItem,
  onDeleteItem,
  onUpdateItem,
  onDragStart,
  onDragEnd,
  onDrop,
  onDragOver,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  hideEditButton,
  hideDeleteButton,
  disabled,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(item.name);
  const [editedQty, setEditedQty] = useState(item.qty.toString());

  const handleSave = () => {
    if (editedName.trim()) {
      onUpdateItem(item.id, editedName, editedQty);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedName(item.name);
    setEditedQty(item.qty.toString());
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <li className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 p-2 rounded-md no-print">
        <input
          type="text"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          className="flex-grow px-2 py-1 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-slate-600 dark:border-slate-500 dark:text-slate-200"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
        />
        <input
          type="text"
          value={editedQty}
          onChange={(e) => setEditedQty(e.target.value)}
          className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-slate-600 dark:border-slate-500 dark:text-slate-200"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
        />
        <button onClick={handleSave} className="p-1 text-green-600 hover:text-green-800" aria-label="Zapisz zmianę">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <button onClick={handleCancel} className="p-1 text-red-600 hover:text-red-800" aria-label="Anuluj edycję">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </li>
    );
  }

  return (
    <li
      className={`group flex items-center bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${isDragged ? 'opacity-50' : ''} ${isDraggable ? 'cursor-move' : ''}`}
      draggable={isDraggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop(e, item)}
      onDragOver={onDragOver}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      data-item-id={item.id}
    >
      <input
        type="checkbox"
        id={`packing-${item.id}`}
        checked={item.packed}
        onChange={() => !disabled && onToggleItem(item.id)}
        className="h-5 w-5 rounded border-slate-300 dark:border-slate-500 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-600 dark:focus:ring-indigo-600 dark:focus:ring-offset-slate-800 cursor-pointer"
        disabled={disabled}
      />
      <label
        htmlFor={`packing-${item.id}`}
        className={`ml-4 flex-grow text-sm font-medium ${item.packed ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'} cursor-pointer`}
      >
        {item.name}
      </label>
      <span
        className={`px-2 py-1 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs rounded-full ${item.packed ? 'opacity-50' : ''}`}
      >
        {item.qty}
      </span>
      {!disabled && (!hideEditButton || !hideDeleteButton) && (
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity no-print">
          {!hideEditButton && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
              aria-label="Edytuj przedmiot"
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
          )}
          {!hideDeleteButton && (
            <button
              onClick={() => onDeleteItem(item.id)}
              className="p-1 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-500"
              aria-label="Usuń przedmiot"
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
          )}
        </div>
      )}
    </li>
  );
};

export default PackingListItem;
