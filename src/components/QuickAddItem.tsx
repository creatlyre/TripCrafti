import React from 'react';
import { ITEM_LIBRARY, ITEM_LIBRARY_CATEGORIES } from '@/lib/itemLibrary';
import type { ItemDefinition } from '@/types';

interface QuickAddItemProps {
  onAddItem: (item: ItemDefinition) => void;
}

const QuickAddItem: React.FC<QuickAddItemProps> = ({ onAddItem }) => {

    return (
        <div className="space-y-4">
             <p className="text-slate-500 dark:text-slate-400 text-sm">Dodaj najczęstsze przedmioty do listy jednym kliknięciem.</p>
             {ITEM_LIBRARY_CATEGORIES.map((group) => (
                <div key={group.title}>
                    <h3 className="font-semibold text-slate-600 dark:text-slate-300 mb-2 text-base">{group.title}</h3>
                    <div className="flex flex-wrap gap-2">
                        {group.itemIds.map((itemId) => {
                            const item = ITEM_LIBRARY[itemId];
                            if (!item) return null;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onAddItem(item)}
                                    className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-colors"
                                    aria-label={`Dodaj ${item.name}`}
                                >
                                    + {item.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default QuickAddItem;