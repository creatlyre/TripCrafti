import type {
  GenerateDetails,
  ValidationResult,
  PackingItem,
  AIPackingListResponse,
  CategorizationResult,
} from '@/types';

/**
 * Service for handling packing list operations - client-side API calls only
 * AI logic is handled in API routes to avoid server dependencies on client
 */
export class PackingService {
  /**
   * Generate a new packing list using AI via API call
   */
  static async generateList(details: GenerateDetails): Promise<AIPackingListResponse> {
    try {
      const response = await fetch('/api/ai/packing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate',
          payload: {
            details,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error generating packing list:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to generate packing list');
    }
  }

  /**
   * Validate an existing packing list with optional context changes
   */
  static async validateList(currentList: PackingItem[], changes?: { notes?: string }): Promise<ValidationResult> {
    try {
      const response = await fetch('/api/ai/packing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'validate',
          payload: {
            currentList,
            changes: changes || {},
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error validating packing list:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to validate packing list');
    }
  }

  /**
   * Categorize packing list items using AI
   */
  static async categorizeItems(items: PackingItem[], categories: string[]): Promise<CategorizationResult[]> {
    try {
      const response = await fetch('/api/ai/packing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'categorize',
          payload: {
            items,
            categories,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error categorizing packing list:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to categorize packing list');
    }
  }

  /**
   * Apply categorization results to packing items
   */
  static applyCategorization(items: PackingItem[], categorization: CategorizationResult[]): PackingItem[] {
    const categoryMap = new Map(categorization.map((item) => [item.id, item.category]));

    return items.map((item) => {
      const newCategory = categoryMap.get(item.id);
      return newCategory ? { ...item, category: newCategory } : item;
    });
  }

  /**
   * Get new categories from categorization results
   */
  static getNewCategories(existingCategories: string[], categorization: CategorizationResult[]): string[] {
    const newCategories = [...new Set(categorization.map((item) => item.category))];
    return [...new Set([...existingCategories, ...newCategories])];
  }

  /**
   * Apply validation suggestions to packing items
   */
  static applyValidationSuggestions(
    items: PackingItem[],
    suggestions: ValidationResult
  ): {
    updatedItems: PackingItem[];
    appliedChanges: string[];
  } {
    let updatedItems = [...items];
    const appliedChanges: string[] = [];

    // Apply add suggestions
    suggestions.missing.forEach((suggestion) => {
      const exists = updatedItems.some((item) => item.name.toLowerCase() === suggestion.name.toLowerCase());

      if (!exists) {
        const newItem: PackingItem = {
          id: Date.now() + Math.random(),
          name: suggestion.name,
          qty: '1',
          category: suggestion.category,
          packed: false,
        };
        updatedItems.push(newItem);
        appliedChanges.push(`Added: ${suggestion.name}`);
      }
    });

    // Apply remove suggestions
    suggestions.remove.forEach((suggestion) => {
      updatedItems = updatedItems.filter((item) => item.name.toLowerCase() !== suggestion.name.toLowerCase());
      appliedChanges.push(`Removed: ${suggestion.name}`);
    });

    // Apply adjustment suggestions
    suggestions.adjust.forEach((suggestion) => {
      updatedItems = updatedItems.map((item) => {
        if (item.name.toLowerCase() === suggestion.name.toLowerCase()) {
          return { ...item, [suggestion.field]: suggestion.suggested };
        }
        return item;
      });
      appliedChanges.push(`Adjusted: ${suggestion.name}`);
    });

    // Apply replace suggestions
    suggestions.replace.forEach((suggestion) => {
      const lowerCaseItemsToRemove = suggestion.items_to_remove.map((name) => name.toLowerCase());

      // Remove items to be replaced
      updatedItems = updatedItems.filter((item) => !lowerCaseItemsToRemove.includes(item.name.toLowerCase()));

      // Add suggested replacement if it doesn't exist
      const exists = updatedItems.some(
        (item) => item.name.toLowerCase() === suggestion.suggested_item.name.toLowerCase()
      );

      if (!exists) {
        const newItem: PackingItem = {
          id: Date.now() + Math.random(),
          name: suggestion.suggested_item.name,
          qty: '1',
          category: suggestion.suggested_item.category,
          packed: false,
        };
        updatedItems.push(newItem);
      }

      appliedChanges.push(`Replaced: ${suggestion.items_to_remove.join(', ')} with ${suggestion.suggested_item.name}`);
    });

    return { updatedItems, appliedChanges };
  }

  /**
   * Generate unique item ID for new items
   */
  static generateItemId(): number {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  /**
   * Check if item already exists in the list
   */
  static itemExists(items: PackingItem[], itemName: string): boolean {
    return items.some((item) => item.name.toLowerCase() === itemName.trim().toLowerCase());
  }

  /**
   * Create a new packing item
   */
  static createPackingItem(name: string, category: string, quantity: string, notes?: string): PackingItem {
    return {
      id: this.generateItemId(),
      name: name.trim(),
      qty: quantity || '1',
      category: category.trim(),
      packed: false,
      notes,
    };
  }

  /**
   * Update packing item
   */
  static updatePackingItem(
    items: PackingItem[],
    itemId: number,
    updates: Partial<Omit<PackingItem, 'id'>>
  ): PackingItem[] {
    return items.map((item) => (item.id === itemId ? { ...item, ...updates } : item));
  }

  /**
   * Remove packing item
   */
  static removePackingItem(items: PackingItem[], itemId: number): PackingItem[] {
    return items.filter((item) => item.id !== itemId);
  }

  /**
   * Toggle packed status of item
   */
  static togglePackedStatus(items: PackingItem[], itemId: number): PackingItem[] {
    return items.map((item) => (item.id === itemId ? { ...item, packed: !item.packed } : item));
  }

  /**
   * Filter items by search term
   */
  static filterItems(items: PackingItem[], searchTerm: string): PackingItem[] {
    if (!searchTerm.trim()) {
      return items;
    }

    const lowercaseFilter = searchTerm.toLowerCase();
    return items.filter(
      (item) => item.name.toLowerCase().includes(lowercaseFilter) || item.notes?.toLowerCase().includes(lowercaseFilter)
    );
  }

  /**
   * Get filtered categories based on visible items
   */
  static getVisibleCategories(categories: string[], visibleItems: PackingItem[]): string[] {
    if (visibleItems.length === 0) {
      return categories;
    }

    const visibleCategorySet = new Set(visibleItems.map((item) => item.category));
    return categories.filter((category) => visibleCategorySet.has(category));
  }

  /**
   * Sort categories by different criteria
   */
  static sortCategories(categories: string[], sortBy: 'az' | 'za' | 'count', items: PackingItem[]): string[] {
    const newCategories = [...categories];

    switch (sortBy) {
      case 'az':
        return newCategories.sort((a, b) => a.localeCompare(b));
      case 'za':
        return newCategories.sort((a, b) => b.localeCompare(a));
      case 'count': {
        const counts = items.reduce(
          (acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        return newCategories.sort((a, b) => (counts[b] || 0) - (counts[a] || 0) || a.localeCompare(b));
      }
      default:
        return categories;
    }
  }

  /**
   * Get packing statistics
   */
  static getPackingStats(items: PackingItem[]): {
    total: number;
    packed: number;
    percentage: number;
  } {
    const total = items.length;
    const packed = items.filter((item) => item.packed).length;
    const percentage = total > 0 ? Math.round((packed / total) * 100) : 0;

    return { total, packed, percentage };
  }
}
