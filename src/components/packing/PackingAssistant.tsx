import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { PackingItem, GenerateDetails, ValidationResult, PackingListMeta, ChecklistItem, SavedList, ItemDefinition } from '@/types';
import { DEFAULT_CATEGORIES } from '@/components/packing/constants';
import Header from '@/components/packing/Header';
import ListGenerator from '@/components/packing/ListGenerator';
import PackingList from '@/components/packing/PackingList';
import ListActions from '@/components/packing/ListActions';
import CollapsibleSection from '@/components/packing/CollapsibleSection';
import Checklist from '@/components/packing/Checklist';
import QuickAddItem from '@/components/packing/QuickAddItem';

// Debounce hook for saving data
const useDebouncedEffect = (effect: () => void, deps: React.DependencyList, delay: number) => {
    const callback = useCallback(effect, deps);
    useEffect(() => {
        const handler = setTimeout(() => {
            callback();
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [callback, delay]);
};

interface PackingAssistantProps {
    tripId: string;
}

const PackingAssistant: React.FC<PackingAssistantProps> = ({ tripId }) => {
    const [packingItems, setPackingItems] = useState<PackingItem[]>([]);
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
    const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
    const [listMeta, setListMeta] = useState<PackingListMeta | null>(null);

    const [initialLoad, setInitialLoad] = useState(true);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [suggestions, setSuggestions] = useState<ValidationResult | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
    const [isCategorizedView, setIsCategorizedView] = useState<boolean>(true);

    // Modals state
    const [isConfirmationModalOpen, setConfirmationModalOpen] = useState(false);
    const [isValidationModalOpen, setValidationModalOpen] = useState(false);
    const [pendingDetails, setPendingDetails] = useState<GenerateDetails | null>(null);

    // Toast Notification State
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Theme state (remains client-side)
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            const storedTheme = window.localStorage.getItem('theme');
            if (storedTheme) return storedTheme;
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'light';
    });

    // --- DATA FETCHING & SAVING ---

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/trips/${tripId}/packing`);
            if (!response.ok) {
                throw new Error('Failed to fetch packing list');
            }
            const data: SavedList = await response.json();
            setPackingItems(data.packingItems || []);
            setChecklistItems(data.checklistItems || []);
            setCategories(data.categories && data.categories.length > 0 ? data.categories : DEFAULT_CATEGORIES);
            setListMeta(data.listMeta || null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching data.');
            setToast({ message: 'Error fetching packing list.', type: 'error' });
        } finally {
            setIsLoading(false);
            setInitialLoad(false);
        }
    }, [tripId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useDebouncedEffect(() => {
        if (initialLoad) return;

        const saveData = async () => {
            setIsSaving(true);
            try {
                const payload: SavedList = { packingItems, checklistItems, categories, listMeta };
                const response = await fetch(`/api/trips/${tripId}/packing`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (!response.ok) {
                    throw new Error('Failed to save packing list');
                }
                setToast({ message: 'List saved!', type: 'success' });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred while saving.');
                setToast({ message: 'Error saving list.', type: 'error' });
            } finally {
                setIsSaving(false);
            }
        };

        saveData();
    }, [packingItems, checklistItems, categories, listMeta], 1500); // 1.5-second debounce


    // --- EFFECTS ---

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    useEffect(() => {
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

    // --- FILTERING LOGIC ---
    const filteredPackingItems = useMemo(() => {
        if (!searchTerm.trim()) {
            return packingItems;
        }
        const lowercasedFilter = searchTerm.toLowerCase();
        return packingItems.filter(item =>
            item.name.toLowerCase().includes(lowercasedFilter) ||
            item.notes?.toLowerCase().includes(lowercasedFilter)
        );
    }, [packingItems, searchTerm]);

    const filteredCategories = useMemo(() => {
        if (!searchTerm.trim()) {
            return categories;
        }
        const visibleCategorySet = new Set(filteredPackingItems.map(item => item.category));
        return categories.filter(category => visibleCategorySet.has(category));
    }, [categories, filteredPackingItems, searchTerm]);

    // --- MODAL COMPONENTS ---

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
                    <textarea value={context} onChange={(e) => setContext(e.target.value)} placeholder="np. Prognoza pogody zmieniła się na znacznie cieplejszą." className="mt-4 w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200" rows={3}/>
                    <div className="mt-4 flex justify-end gap-3">
                        <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-600">Anuluj</button>
                        <button onClick={() => onConfirm(context)} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">Sprawdź listę</button>
                    </div>
                </div>
            </div>
        );
    };

    // --- LIST GENERATION & VALIDATION ---

    const proceedWithGeneration = async (details: GenerateDetails) => {
        setIsLoading(true);
        setError(null);
        setSuggestions(null);
        try {
            const response = await fetch('/api/ai/packing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'generate', payload: { details } })
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({ error: 'Failed to generate list' }));
                throw new Error(err.error);
            }
            const newList = await response.json();
            setPackingItems(newList.items);
            setChecklistItems(newList.checklist);
            const generatedCategories = [...new Set(newList.items.map((item: PackingItem) => item.category))];
            setCategories(prev => [...new Set([...DEFAULT_CATEGORIES, ...generatedCategories])]);
            setListMeta(newList.meta);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Wystąpił nieznany błąd podczas generowania listy.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateList = async (details: GenerateDetails) => {
        if (packingItems.length > 0 || checklistItems.length > 0) {
            setPendingDetails(details);
            setConfirmationModalOpen(true);
        } else {
            await proceedWithGeneration(details);
        }
    };

    const handleConfirmGeneration = async () => {
        if (pendingDetails) {
            await proceedWithGeneration(pendingDetails);
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
            setError('Lista jest pusta. Dodaj przedmioty lub załaduj listę, aby ją sprawdzić.');
            return;
        }
        setValidationModalOpen(true);
    };

    const handleConfirmValidation = async (context: string) => {
        setValidationModalOpen(false);
        setIsLoading(true);
        setError(null);
        setSuggestions(null);
        const changes = context.trim() ? { notes: context } : {};
        try {
            const response = await fetch('/api/ai/packing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'validate', payload: { currentList: packingItems, changes } })
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({ error: 'Failed to validate list' }));
                throw new Error(err.error);
            }
            const checkResult = await response.json();

            if(checkResult.error) {
                 setError(`Błąd walidacji: ${checkResult.error}`);
                 return;
            }
            if (checkResult.missing.length === 0 && checkResult.remove.length === 0 && checkResult.adjust.length === 0 && checkResult.replace.length === 0) {
                setSuggestions({
                    missing: [{name: 'Wszystko w porządku!', category: 'Info', reason: 'AI nie znalazło nic do dodania, usunięcia ani zmiany.'}],
                    remove: [], adjust: [], replace: []
                });
            } else {
                setSuggestions(checkResult);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Wystąpił nieznany błąd podczas sprawdzania listy.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelValidation = () => setValidationModalOpen(false);

    const handleCategorizeList = async () => {
        if (packingItems.length === 0) {
            setToast({ message: "Lista jest pusta, nie ma czego kategoryzować.", type: 'error' });
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/ai/packing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'categorize', payload: { items: packingItems, categories } })
            });
            if (!response.ok) {
                const err = await response.json().catch(() => ({ error: 'Failed to categorize list' }));
                throw new Error(err.error);
            }
            const result = await response.json();

            const categoryMap = new Map(result.map((item: {id: number, category: string}) => [item.id, item.category]));

            setPackingItems(prev => prev.map(item => {
                const newCategory = categoryMap.get(item.id);
                return newCategory ? { ...item, category: newCategory } : item;
            }));

            const newCategories = [...new Set(result.map((i: {category: string}) => i.category))];
            setCategories(prev => [...new Set([...prev, ...newCategories])]);

            setToast({ message: "Przedmioty zostały skategoryzowane!", type: 'success' });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Wystąpił nieznany błąd podczas kategoryzacji.');
        } finally {
            setIsLoading(false);
        }
    };

    // --- LIST MANAGEMENT (CRUD) ---

    const handleAddItem = (itemName: string, category: string, quantity: string, notes?: string) => {
        const trimmedName = itemName.trim();
        const trimmedCategory = category.trim();
        if (!trimmedName || !trimmedCategory) return;
        if (packingItems.some(item => item.name.toLowerCase() === trimmedName.toLowerCase())) {
            setToast({ message: `Przedmiot "${trimmedName}" już istnieje na liście.`, type: 'error' });
            return;
        }
        setError(null);
        const newItem: PackingItem = {
            id: Date.now(), name: trimmedName, qty: quantity || '1',
            category: trimmedCategory, packed: false, notes,
        };
        setPackingItems(prev => [...prev, newItem]);
        if (!categories.some(c => c.toLowerCase() === trimmedCategory.toLowerCase())) {
            setCategories(prev => [...prev, trimmedCategory]);
        }
    };

    const handleAddItemFromQuickAdd = (item: ItemDefinition) => {
        const trimmedName = item.name.trim();
        if (packingItems.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
            setToast({ message: `Przedmiot "${trimmedName}" już istnieje.`, type: 'error' });
            return;
        }
        handleAddItem(item.name, item.category, item.defaultQty, item.notes);
        setToast({ message: `Dodano: ${trimmedName}`, type: 'success' });
    };

    const handleAddCategory = (title: string) => {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) return;
        if (categories.some(c => c.toLowerCase() === trimmedTitle.toLowerCase())) {
            setToast({ message: `Kategoria "${trimmedTitle}" już istnieje.`, type: 'error' });
            return;
        }
        setError(null);
        setCategories(prev => [...prev, trimmedTitle]);
    };

    // --- Checklist CRUD ---
    const handleAddChecklistItem = (task: string) => {
        const trimmedTask = task.trim();
        if (!trimmedTask) return;
        const newItem: ChecklistItem = {
            id: Date.now(),
            task: trimmedTask,
            done: false,
        };
        setChecklistItems(prev => [...prev, newItem]);
        setToast({ message: 'Dodano nowe zadanie do checklisty.', type: 'success' });
    };

    const handleUpdateChecklistItem = (itemId: number, newTask: string) => {
        setChecklistItems(p => p.map(i => i.id === itemId ? { ...i, task: newTask.trim() } : i));
    };

    const handleDeleteChecklistItem = (itemId: number) => {
        setChecklistItems(prev => prev.filter(item => item.id !== itemId));
    };

    const handleToggleChecklistItem = (itemId: number) => {
        setChecklistItems(p => p.map(i => i.id === itemId ? { ...i, done: !i.done } : i));
    };

    const handleToggleItem = (itemId: number) => {
        setPackingItems(p => p.map(i => i.id === itemId ? { ...i, packed: !i.packed } : i));
    };

    const handleClearList = () => {
        setPackingItems([]);
        setChecklistItems([]);
        setCategories(DEFAULT_CATEGORIES);
        setSuggestions(null);
        setError(null);
        setListMeta(null);
    }

    const handleDeleteItem = useCallback((itemId: number) => {
        setPackingItems(prev => prev.filter(item => item.id !== itemId));
    }, []);

    const handleUpdateItem = useCallback((itemId: number, newName: string, newQty: string) => {
        setPackingItems(p => p.map(i => i.id === itemId ? { ...i, name: newName.trim(), qty: newQty.trim() } : i));
    }, []);

    const handleDeleteCategory = useCallback((categoryToDelete: string) => {
        if (packingItems.some(item => item.category === categoryToDelete)) {
            setToast({ message: "Nie można usunąć kategorii, która zawiera przedmioty.", type: 'error' });
            return;
        }
        setCategories(prev => prev.filter(c => c !== categoryToDelete));
        setToast({ message: `Kategoria "${categoryToDelete}" usunięta.`, type: 'success' });
    }, [packingItems]);

    const handleUpdateCategory = useCallback((oldName: string, newName: string) => {
        const trimmedNewName = newName.trim();
        if (!trimmedNewName || oldName === trimmedNewName) return;

        if (categories.some(c => c.toLowerCase() === trimmedNewName.toLowerCase() && c.toLowerCase() !== oldName.toLowerCase())) {
            setToast({ message: `Kategoria "${trimmedNewName}" już istnieje.`, type: 'error' });
            return;
        }
        setCategories(prev => prev.map(c => c === oldName ? trimmedNewName : c));
        setPackingItems(prev => prev.map(item => item.category === oldName ? { ...item, category: trimmedNewName } : item));
        setToast({ message: "Nazwa kategorii zaktualizowana.", type: 'success' });
    }, [categories]);

    // --- DRAG & DROP ---

    const handleDropItem = useCallback((draggedItemId: number, targetCategoryId: string, targetItemId: number | null) => {
        setPackingItems(prev => {
            const draggedItem = prev.find(item => item.id === draggedItemId);
            if (!draggedItem) return prev;
            let newList = prev.filter(item => item.id !== draggedItemId);
            const updatedItem = { ...draggedItem, category: targetCategoryId };
            if (targetItemId) {
                const targetIndex = newList.findIndex(item => item.id === targetItemId);
                newList.splice(targetIndex, 0, updatedItem);
            } else {
                const lastIndex = newList.map(i => i.category).lastIndexOf(targetCategoryId);
                newList.splice(lastIndex + 1, 0, updatedItem);
            }
            return newList;
        });
    }, []);

    const handleDropCategory = useCallback((draggedCategoryName: string, targetCategoryName: string) => {
        setCategories(prev => {
            const newList = prev.filter(c => c !== draggedCategoryName);
            const targetIndex = newList.findIndex(c => c === targetCategoryName);
            newList.splice(targetIndex, 0, draggedCategoryName);
            return newList;
        });
    }, []);

    const handleSortCategories = useCallback((sortBy: 'az' | 'za' | 'count') => {
        setCategories(prev => {
            const newCategories = [...prev];
            switch (sortBy) {
                case 'az': return newCategories.sort((a, b) => a.localeCompare(b));
                case 'za': return newCategories.sort((a, b) => b.localeCompare(a));
                case 'count': {
                    const counts = packingItems.reduce((acc, item) => ({...acc, [item.category]: (acc[item.category] || 0) + 1}), {} as Record<string, number>);
                    return newCategories.sort((a, b) => (counts[b] || 0) - (counts[a] || 0) || a.localeCompare(b));
                }
                default: return prev;
            }
        });
    }, [packingItems]);

    // --- INTERACTIVE AI SUGGESTIONS HANDLERS ---

    const handleApplyAddSuggestion = (item: { name: string; category: string; }) => {
        handleAddItem(item.name, item.category, '1');
        setToast({ message: `Dodano: ${item.name}`, type: 'success' });
        setSuggestions(prev => prev ? { ...prev, missing: prev.missing.filter(i => i.name !== item.name) } : null);
    };

    const handleApplyRemoveSuggestion = (item: { name: string; }) => {
        const itemToRemove = packingItems.find(p => p.name.toLowerCase() === item.name.toLowerCase());
        if (itemToRemove) {
            handleDeleteItem(itemToRemove.id);
            setToast({ message: `Usunięto: ${item.name}`, type: 'success' });
            setSuggestions(prev => prev ? { ...prev, remove: prev.remove.filter(i => i.name !== item.name) } : null);
        } else {
            setToast({ message: `Nie znaleziono "${item.name}"`, type: 'error' });
        }
    };

    const handleApplyAdjustSuggestion = (item: { name: string; field: string; suggested: any; }) => {
        setPackingItems(prev => prev.map(p => p.name.toLowerCase() === item.name.toLowerCase() ? { ...p, [item.field]: item.suggested } : p));
        setToast({ message: `Zmieniono: ${item.name}`, type: 'success' });
        setSuggestions(prev => prev ? { ...prev, adjust: prev.adjust.filter(i => i.name !== item.name) } : null);
    };

    const handleApplyReplaceSuggestion = (item: ValidationResult['replace'][0]) => {
        setPackingItems(prev => {
            const lowerCaseItemsToRemove = item.items_to_remove.map(i => i.toLowerCase());
            let newList = prev.filter(p => !lowerCaseItemsToRemove.includes(p.name.toLowerCase()));
            if (!newList.some(p => p.name.toLowerCase() === item.suggested_item.name.toLowerCase())) {
                const newItem: PackingItem = {
                    id: Date.now(),
                    name: item.suggested_item.name,
                    qty: '1',
                    category: item.suggested_item.category,
                    packed: false,
                };
                newList.push(newItem);
            }
            return newList;
        });
        setToast({ message: `Zastąpiono przez: ${item.suggested_item.name}`, type: 'success' });
        setSuggestions(prev => prev ? { ...prev, replace: prev.replace.filter(r => r.suggested_item.name !== item.suggested_item.name) } : null);
    };

    const renderSuggestions = () => {
        if (!suggestions) return null;

        const ActionButton: React.FC<{onClick: () => void, className: string, children: React.ReactNode}> = ({ onClick, className, children }) => (
            <button onClick={onClick} className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-md transition-colors ${className}`}>
                {children}
            </button>
        );

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
                <strong className="font-bold block mb-2">Sugestie AI:</strong>
                {renderList('Do dodania:', suggestions.missing, (item) => (
                    <ActionButton onClick={() => handleApplyAddSuggestion(item)} className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800">
                      [+] Dodaj
                    </ActionButton>
                ))}
                {renderList('Do usunięcia:', suggestions.remove, (item) => (
                     <ActionButton onClick={() => handleApplyRemoveSuggestion(item)} className="bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800">
                      [x] Usuń
                    </ActionButton>
                ))}
                {renderList('Do zmiany:', suggestions.adjust.map(a => ({name: a.name, reason: `Zmień ${a.field} z '${a.current}' na '${a.suggested}' - ${a.reason}`, ...a})), (item) => (
                     <ActionButton onClick={() => handleApplyAdjustSuggestion(item)} className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800">
                      [✓] Zmień
                    </ActionButton>
                ))}
                {renderReplaceList('Do zastąpienia (optymalizacja):', suggestions.replace)}
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
            <Header theme={theme} toggleTheme={toggleTheme} />

            {toast && (
                <div className={`fixed top-5 right-5 z-50 px-4 py-2 rounded-md shadow-lg text-sm font-medium text-white ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {toast.message}
                </div>
            )}

            <main className={`container mx-auto transition-all duration-300 ${isFullScreen ? 'p-0 md:p-0 max-w-full' : 'p-4 md:p-8'}`}>
                <div className={`${isFullScreen ? '' : 'grid grid-cols-1 lg:grid-cols-3 gap-8'}`}>
                    <div className={`lg:col-span-1 space-y-6 no-print ${isFullScreen ? 'hidden' : ''}`}>
                        <CollapsibleSection title="1. Wygeneruj nową listę">
                            <ListGenerator onGenerate={handleGenerateList} isLoading={isLoading} />
                        </CollapsibleSection>
                        <CollapsibleSection title="2. Zarządzaj listą">
                            <ListActions
                                onCheckList={handleValidateList}
                                onClearList={handleClearList}
                                isLoading={isLoading}
                                isListEmpty={packingItems.length === 0 && checklistItems.length === 0}
                                onCategorizeList={handleCategorizeList}
                            />
                        </CollapsibleSection>
                         <CollapsibleSection title="3. Szybkie dodawanie">
                            <QuickAddItem onAddItem={handleAddItemFromQuickAdd} />
                        </CollapsibleSection>
                         {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative dark:bg-red-900/20 dark:border-red-500/30 dark:text-red-200" role="alert">{error}</div>}
                         {suggestions && renderSuggestions()}
                    </div>

                    <div className={`lg:col-span-2 space-y-6 transition-all duration-300 ${isFullScreen ? 'lg:col-span-3' : ''}`}>
                        {listMeta && listMeta.archetype && !isFullScreen && (
                            <div className="bg-indigo-50 border-l-4 border-indigo-500 text-indigo-800 p-4 rounded-r-lg shadow dark:bg-indigo-900/20 dark:border-indigo-500 dark:text-indigo-200">
                                <p className="font-bold text-lg">Archetyp Podróży: <span className="font-normal">{listMeta.archetype}</span></p>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                    Cel: {listMeta.destination}, Dni: {listMeta.days}, Osoby: {listMeta.people.adults} dorosłych, {listMeta.people.children} dzieci
                                </p>
                            </div>
                        )}
                        {checklistItems.length > 0 && !isFullScreen && (
                            <Checklist
                                items={checklistItems}
                                onToggleItem={handleToggleChecklistItem}
                                onAddItem={handleAddChecklistItem}
                                onUpdateItem={handleUpdateChecklistItem}
                                onDeleteItem={handleDeleteChecklistItem}
                            />
                        )}
                        <PackingList
                            items={filteredPackingItems}
                            categories={filteredCategories}
                            onAddItem={handleAddItem}
                            onAddCategory={handleAddCategory}
                            onToggleItem={handleToggleItem}
                            onDeleteItem={handleDeleteItem}
                            onUpdateItem={handleUpdateItem}
                            onDropItem={handleDropItem}
                            onDropCategory={handleDropCategory}
                            onSortCategories={handleSortCategories}
                            onDeleteCategory={handleDeleteCategory}
                            onUpdateCategory={handleUpdateCategory}
                            isLoading={isLoading || isSaving}
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            totalItemCount={packingItems.length}
                            totalPackedCount={packingItems.filter(i => i.packed).length}
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