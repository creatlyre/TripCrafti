import { useState, useCallback, useMemo, useEffect } from 'react';

import type {
  PackingItem,
  ChecklistItem,
  PackingListMeta,
  GenerateDetails,
  ValidationResult,
  ItemDefinition,
} from '@/types';

import { DEFAULT_CATEGORIES, AUTO_SAVE_DELAY, TOAST_DURATION } from '@/lib/constants';
import { PackingService } from '@/lib/services/packingService';

interface UsePackingOptions {
  tripId: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

interface ToastMessage {
  message: string;
  type: 'success' | 'error';
}

interface UsePackingReturn {
  // State
  packingItems: PackingItem[];
  checklistItems: ChecklistItem[];
  categories: string[];
  listMeta: PackingListMeta | null;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  initialLoad: boolean;

  // Error and suggestions
  error: string | null;
  suggestions: ValidationResult | null;

  // Toast notifications
  toast: ToastMessage | null;

  // Search and view
  searchTerm: string;
  filteredPackingItems: PackingItem[];
  filteredCategories: string[];

  // Statistics
  packingStats: {
    total: number;
    packed: number;
    percentage: number;
  };

  // Actions
  fetchData: () => Promise<void>;
  saveData: () => Promise<void>;

  // List generation and validation
  generateList: (details: GenerateDetails) => Promise<void>;
  validateList: (context?: string) => Promise<void>;
  categorizeList: () => Promise<void>;
  clearList: () => void;
  loadTemplate: (items: PackingItem[], checklist: ChecklistItem[], templateName: string) => void;

  // Item management
  addItem: (name: string, category: string, quantity: string, notes?: string) => void;
  addItemFromLibrary: (item: ItemDefinition) => void;
  updateItem: (itemId: number, name: string, qty: string) => void;
  deleteItem: (itemId: number) => void;
  toggleItem: (itemId: number) => void;

  // Category management
  addCategory: (title: string) => void;
  deleteCategory: (categoryName: string) => void;
  updateCategory: (oldName: string, newName: string) => void;
  sortCategories: (sortBy: 'az' | 'za' | 'count') => void;

  // Checklist management
  addChecklistItem: (task: string) => void;
  updateChecklistItem: (itemId: number, task: string) => void;
  deleteChecklistItem: (itemId: number) => void;
  toggleChecklistItem: (itemId: number) => void;

  // Drag & Drop
  dropItem: (draggedItemId: number, targetCategoryId: string, targetItemId: number | null) => void;
  dropCategory: (draggedCategoryName: string, targetCategoryName: string) => void;

  // Search
  setSearchTerm: (term: string) => void;

  // Suggestions
  applySuggestions: (suggestions: ValidationResult) => void;
  clearSuggestions: () => void;

  // Toast
  showToast: (message: string, type: 'success' | 'error') => void;
  clearToast: () => void;

  // Error handling
  clearError: () => void;
}

// Debounce hook
function useDebounce<T extends (...args: any[]) => void>(callback: T, delay: number, deps: React.DependencyList): void {
  useEffect(() => {
    const handler = setTimeout(() => {
      callback();
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [...deps, delay]);
}

export function usePacking({
  tripId,
  autoSave = true,
  autoSaveDelay = AUTO_SAVE_DELAY,
}: UsePackingOptions): UsePackingReturn {
  // Core state
  const [packingItems, setPackingItems] = useState<PackingItem[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [listMeta, setListMeta] = useState<PackingListMeta | null>(null);

  // Loading and error states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [initialLoad, setInitialLoad] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [suggestions, setSuggestions] = useState<ValidationResult | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Computed values
  const filteredPackingItems = useMemo(
    () => PackingService.filterItems(packingItems, searchTerm),
    [packingItems, searchTerm]
  );

  const filteredCategories = useMemo(
    () => PackingService.getVisibleCategories(categories, filteredPackingItems),
    [categories, filteredPackingItems]
  );

  const packingStats = useMemo(() => PackingService.getPackingStats(packingItems), [packingItems]);

  // Data fetching
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/trips/${tripId}/packing`);
      if (!response.ok) {
        throw new Error('Failed to fetch packing list');
      }

      const data = await response.json();
      setPackingItems(data.packingItems || []);
      setChecklistItems(data.checklistItems || []);
      setCategories(data.categories && data.categories.length > 0 ? data.categories : DEFAULT_CATEGORIES);
      setListMeta(data.listMeta || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while fetching data.';
      setError(errorMessage);
      showToast('Error fetching packing list.', 'error');
    } finally {
      setIsLoading(false);
      setInitialLoad(false);
    }
  }, [tripId]);

  // Data saving
  const saveData = useCallback(async () => {
    if (initialLoad) return;

    setIsSaving(true);
    setError(null);

    try {
      const payload = { packingItems, checklistItems, categories, listMeta };
      const response = await fetch(`/api/trips/${tripId}/packing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save packing list');
      }

      if (autoSave) {
        showToast('List saved!', 'success');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while saving.';
      setError(errorMessage);
      showToast('Error saving list.', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [tripId, packingItems, checklistItems, categories, listMeta, initialLoad, autoSave]);

  // Auto-save with debounce
  useDebounce(saveData, autoSaveDelay, [packingItems, checklistItems, categories, listMeta]);

  // Toast management
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  // Auto-clear toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(clearToast, TOAST_DURATION);
      return () => clearTimeout(timer);
    }
  }, [toast, clearToast]);

  // Error management
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // List generation and AI features
  const generateList = useCallback(async (details: GenerateDetails) => {
    setIsLoading(true);
    setError(null);
    setSuggestions(null);

    try {
      const response = await fetch('/api/ai/packing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', payload: { details } }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to generate list' }));
        throw new Error(err.error);
      }

      const newList = await response.json();

      // Transform AI response to match our state
      const newItems = newList.items.map((item: any) => ({
        ...item,
        id: PackingService.generateItemId(),
        packed: false,
      }));

      const newChecklistItems = newList.checklist.map((item: any) => ({
        ...item,
        id: PackingService.generateItemId(),
      }));

      setPackingItems(newItems);
      setChecklistItems(newChecklistItems);

      const generatedCategories = [...new Set(newItems.map((item: PackingItem) => item.category))];
      setCategories((prev) => [...new Set([...DEFAULT_CATEGORIES, ...generatedCategories])] as string[]);
      setListMeta(newList.meta);

      showToast('New packing list generated!', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during generation.';
      setError(errorMessage);
      showToast('Error generating list.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const validateList = useCallback(
    async (context?: string) => {
      if (packingItems.length === 0) {
        setError('Lista jest pusta. Dodaj przedmioty lub załaduj listę, aby ją sprawdzić.');
        return;
      }

      setIsLoading(true);
      setError(null);
      setSuggestions(null);

      const changes = context?.trim() ? { notes: context } : {};

      try {
        const response = await fetch('/api/ai/packing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'validate', payload: { currentList: packingItems, changes } }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: 'Failed to validate list' }));
          throw new Error(err.error);
        }

        const checkResult = await response.json();

        if (checkResult.error) {
          setError(`Błąd walidacji: ${checkResult.error}`);
          return;
        }

        setSuggestions(checkResult);
        showToast('List validation complete!', 'success');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during validation.';
        setError(errorMessage);
        showToast('Error validating list.', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [packingItems]
  );

  const categorizeList = useCallback(async () => {
    if (packingItems.length === 0) {
      showToast('Lista jest pusta, nie ma czego kategoryzować.', 'error');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/packing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'categorize', payload: { items: packingItems, categories } }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to categorize list' }));
        throw new Error(err.error);
      }

      const result = await response.json();

      const updatedItems = PackingService.applyCategorization(packingItems, result);
      const newCategories = PackingService.getNewCategories(categories, result);

      setPackingItems(updatedItems);
      setCategories(newCategories);

      showToast('Przedmioty zostały skategoryzowane!', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during categorization.';
      setError(errorMessage);
      showToast('Error categorizing list.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [packingItems, categories]);

  const clearList = useCallback(() => {
    setPackingItems([]);
    setChecklistItems([]);
    setCategories(DEFAULT_CATEGORIES);
    setSuggestions(null);
    setError(null);
    setListMeta(null);
    showToast('List cleared!', 'success');
  }, []);

  const loadTemplate = useCallback((items: PackingItem[], checklist: ChecklistItem[], templateName: string) => {
    // Clear existing data first
    setPackingItems([]);
    setChecklistItems([]);
    setSuggestions(null);
    setError(null);
    setListMeta(null);

    // Load template data
    setPackingItems(items);
    setChecklistItems(checklist);

    // Update categories based on loaded items
    const newCategories = [...new Set(items.map((item) => item.category))];
    const mergedCategories = [...new Set([...DEFAULT_CATEGORIES, ...newCategories])];
    setCategories(mergedCategories);

    showToast(`Załadowano szablon: ${templateName}`, 'success');
  }, []);

  // Item management
  const addItem = useCallback(
    (name: string, category: string, quantity: string, notes?: string) => {
      const trimmedName = name.trim();
      const trimmedCategory = category.trim();

      if (!trimmedName || !trimmedCategory) return;

      if (PackingService.itemExists(packingItems, trimmedName)) {
        showToast(`Przedmiot "${trimmedName}" już istnieje na liście.`, 'error');
        return;
      }

      const newItem = PackingService.createPackingItem(trimmedName, trimmedCategory, quantity, notes);
      setPackingItems((prev) => [...prev, newItem]);

      if (!categories.some((c) => c.toLowerCase() === trimmedCategory.toLowerCase())) {
        setCategories((prev) => [...prev, trimmedCategory]);
      }

      setError(null);
    },
    [packingItems, categories]
  );

  const addItemFromLibrary = useCallback(
    (item: ItemDefinition) => {
      if (PackingService.itemExists(packingItems, item.name)) {
        showToast(`Przedmiot "${item.name}" już istnieje.`, 'error');
        return;
      }

      addItem(item.name, item.category, item.defaultQty, item.notes);
      showToast(`Dodano: ${item.name}`, 'success');
    },
    [packingItems, addItem]
  );

  const updateItem = useCallback((itemId: number, name: string, qty: string) => {
    setPackingItems((prev) => PackingService.updatePackingItem(prev, itemId, { name: name.trim(), qty: qty.trim() }));
  }, []);

  const deleteItem = useCallback((itemId: number) => {
    setPackingItems((prev) => PackingService.removePackingItem(prev, itemId));
  }, []);

  const toggleItem = useCallback((itemId: number) => {
    setPackingItems((prev) => PackingService.togglePackedStatus(prev, itemId));
  }, []);

  // Category management
  const addCategory = useCallback(
    (title: string) => {
      const trimmedTitle = title.trim();
      if (!trimmedTitle) return;

      if (categories.some((c) => c.toLowerCase() === trimmedTitle.toLowerCase())) {
        showToast(`Kategoria "${trimmedTitle}" już istnieje.`, 'error');
        return;
      }

      setCategories((prev) => [...prev, trimmedTitle]);
      setError(null);
    },
    [categories]
  );

  const deleteCategory = useCallback(
    (categoryToDelete: string) => {
      if (packingItems.some((item) => item.category === categoryToDelete)) {
        showToast('Nie można usunąć kategorii, która zawiera przedmioty.', 'error');
        return;
      }

      setCategories((prev) => prev.filter((c) => c !== categoryToDelete));
      showToast(`Kategoria "${categoryToDelete}" usunięta.`, 'success');
    },
    [packingItems]
  );

  const updateCategory = useCallback(
    (oldName: string, newName: string) => {
      const trimmedNewName = newName.trim();
      if (!trimmedNewName || oldName === trimmedNewName) return;

      if (
        categories.some(
          (c) => c.toLowerCase() === trimmedNewName.toLowerCase() && c.toLowerCase() !== oldName.toLowerCase()
        )
      ) {
        showToast(`Kategoria "${trimmedNewName}" już istnieje.`, 'error');
        return;
      }

      setCategories((prev) => prev.map((c) => (c === oldName ? trimmedNewName : c)));
      setPackingItems((prev) =>
        prev.map((item) => (item.category === oldName ? { ...item, category: trimmedNewName } : item))
      );
      showToast('Nazwa kategorii zaktualizowana.', 'success');
    },
    [categories]
  );

  const sortCategories = useCallback(
    (sortBy: 'az' | 'za' | 'count') => {
      setCategories((prev) => PackingService.sortCategories(prev, sortBy, packingItems));
    },
    [packingItems]
  );

  // Checklist management
  const addChecklistItem = useCallback((task: string) => {
    const trimmedTask = task.trim();
    if (!trimmedTask) return;

    const newItem: ChecklistItem = {
      id: PackingService.generateItemId(),
      task: trimmedTask,
      done: false,
    };

    setChecklistItems((prev) => [...prev, newItem]);
    showToast('Dodano nowe zadanie do checklisty.', 'success');
  }, []);

  const updateChecklistItem = useCallback((itemId: number, task: string) => {
    setChecklistItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, task: task.trim() } : item)));
  }, []);

  const deleteChecklistItem = useCallback((itemId: number) => {
    setChecklistItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const toggleChecklistItem = useCallback((itemId: number) => {
    setChecklistItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item)));
  }, []);

  // Drag & Drop
  const dropItem = useCallback((draggedItemId: number, targetCategoryId: string, targetItemId: number | null) => {
    setPackingItems((prev) => {
      const draggedItem = prev.find((item) => item.id === draggedItemId);
      if (!draggedItem) return prev;

      const newList = prev.filter((item) => item.id !== draggedItemId);
      const updatedItem = { ...draggedItem, category: targetCategoryId };

      if (targetItemId) {
        const targetIndex = newList.findIndex((item) => item.id === targetItemId);
        newList.splice(targetIndex, 0, updatedItem);
      } else {
        const lastIndex = newList.map((i) => i.category).lastIndexOf(targetCategoryId);
        newList.splice(lastIndex + 1, 0, updatedItem);
      }

      return newList;
    });
  }, []);

  const dropCategory = useCallback((draggedCategoryName: string, targetCategoryName: string) => {
    setCategories((prev) => {
      const newList = prev.filter((c) => c !== draggedCategoryName);
      const targetIndex = newList.findIndex((c) => c === targetCategoryName);
      newList.splice(targetIndex, 0, draggedCategoryName);
      return newList;
    });
  }, []);

  // Suggestions
  const applySuggestions = useCallback(
    (suggestions: ValidationResult) => {
      const { updatedItems, appliedChanges } = PackingService.applyValidationSuggestions(packingItems, suggestions);
      setPackingItems(updatedItems);
      setSuggestions(null);

      if (appliedChanges.length > 0) {
        showToast(`Applied ${appliedChanges.length} suggestions`, 'success');
      }
    },
    [packingItems]
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions(null);
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    // State
    packingItems,
    checklistItems,
    categories,
    listMeta,

    // Loading states
    isLoading,
    isSaving,
    initialLoad,

    // Error and suggestions
    error,
    suggestions,

    // Toast notifications
    toast,

    // Search and view
    searchTerm,
    filteredPackingItems,
    filteredCategories,

    // Statistics
    packingStats,

    // Actions
    fetchData,
    saveData,

    // List generation and validation
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

    // Search
    setSearchTerm,

    // Suggestions
    applySuggestions,
    clearSuggestions,

    // Toast
    showToast,
    clearToast,

    // Error handling
    clearError,
  };
}
