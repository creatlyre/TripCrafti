import { render, screen, waitFor } from '@testing-library/react';

import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { BudgetCategory, Expense } from '@/types';

import QuickAddExpense from '@/components/budget/QuickAddExpense';

// Polyfill for Radix UI components in JSDOM
if (typeof Element.prototype.scrollIntoView === 'undefined') {
  Element.prototype.scrollIntoView = vi.fn();
}
if (typeof Element.prototype.hasPointerCapture === 'undefined') {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
}
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

const mockCategories: BudgetCategory[] = [
  { id: 'cat1', name: 'Food', trip_id: 'trip1', user_id: 'user1' },
  { id: 'cat2', name: 'Transport', trip_id: 'trip1', user_id: 'user1' },
];

const mockDict = {
  budget: {
    quickAdd: {
      fabAria: 'Add Expense',
      title: 'Add New Expense',
      amount: 'Amount',
      currency: 'Currency',
      category: 'Category',
      selectCategory: 'Select a category',
      loadingCats: 'Loading categories...',
      description: 'Description',
      prepaid: 'This is a prepaid expense',
      submit: 'Add Expense',
      adding: 'Adding...',
    },
  },
};

// Mock i18n
vi.mock('@/lib/i18n', () => ({
  getDictionary: () => mockDict,
}));

describe('QuickAddExpense', () => {
  const user = userEvent.setup();
  const onAdded = vi.fn();
  const tripId = 'trip1';

  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as vi.Mock).mockClear();
  });

  it('renders the trigger button and opens the dialog on click', async () => {
    render(<QuickAddExpense tripId={tripId} onAdded={onAdded} lang="en" buttonVariant="inline" />);

    const triggerButton = screen.getByRole('button', { name: mockDict.budget.quickAdd.submit });
    expect(triggerButton).toBeInTheDocument();

    await user.click(triggerButton);

    expect(await screen.findByText(mockDict.budget.quickAdd.title)).toBeInTheDocument();
    expect(screen.getByLabelText(mockDict.budget.quickAdd.amount)).toBeInTheDocument();
  });

  it('fetches and displays budget categories when dialog opens', async () => {
    (fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ categories: mockCategories }),
    });

    render(<QuickAddExpense tripId={tripId} onAdded={onAdded} lang="en" buttonVariant="inline" />);
    await user.click(screen.getByRole('button', { name: mockDict.budget.quickAdd.submit }));

    expect(fetch).toHaveBeenCalledWith(`/api/trips/${tripId}/budget/categories`);

    const categorySelect = screen.getByRole('combobox');
    await user.click(categorySelect);

    await waitFor(() => {
      expect(screen.getByText('Food')).toBeInTheDocument();
      expect(screen.getByText('Transport')).toBeInTheDocument();
    });
  });

  it('allows filling the form and submits the data correctly', async () => {
    const newExpense: Expense = {
      id: 'exp1',
      trip_id: tripId,
      amount: 12.34,
      currency: 'USD',
      description: 'Lunch',
      category_id: 'cat1',
      is_prepaid: true,
      expense_date: new Date().toISOString(),
    };

    (fetch as vi.Mock).mockImplementation((url: string) => {
      if (url.includes('categories')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ categories: mockCategories }),
        });
      }
      if (url.includes('expenses')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ expense: newExpense }),
        });
      }
      return Promise.reject(new Error('Unknown fetch call'));
    });

    render(<QuickAddExpense tripId={tripId} onAdded={onAdded} lang="en" buttonVariant="inline" />);
    await user.click(screen.getByRole('button', { name: mockDict.budget.quickAdd.submit }));

    // Fill form
    await user.type(screen.getByLabelText(mockDict.budget.quickAdd.amount), '12.34');
    await user.clear(screen.getByLabelText(mockDict.budget.quickAdd.currency));
    await user.type(screen.getByLabelText(mockDict.budget.quickAdd.currency), 'USD');
    await user.type(screen.getByLabelText(mockDict.budget.quickAdd.description), 'Lunch');
    await user.click(screen.getByLabelText(mockDict.budget.quickAdd.prepaid));

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByText('Food'));

    // Submit
    const submitButton = screen.getByRole('button', { name: mockDict.budget.quickAdd.submit });
    await user.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(`/api/trips/${tripId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 12.34,
          currency: 'USD',
          description: 'Lunch',
          category_id: 'cat1',
          is_prepaid: true,
        }),
      });
    });

    expect(onAdded).toHaveBeenCalledWith(newExpense);
    await waitFor(() => {
      expect(screen.queryByText(mockDict.budget.quickAdd.title)).not.toBeInTheDocument();
    });
  });

  it('shows an error message if submission fails', async () => {
    (fetch as vi.Mock).mockImplementation((url: string, options) => {
      if (url.toString().includes('categories')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ categories: mockCategories }) });
      }
      if (url.toString().includes('expenses') && options?.method === 'POST') {
        return Promise.resolve({ ok: false, json: () => Promise.resolve({ error: 'Failed to add expense' }) });
      }
      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });

    render(<QuickAddExpense tripId={tripId} onAdded={onAdded} lang="en" buttonVariant="inline" />);
    await user.click(screen.getByRole('button', { name: mockDict.budget.quickAdd.submit }));

    await user.type(screen.getByLabelText(mockDict.budget.quickAdd.amount), '50');

    const submitButton = screen.getByRole('button', { name: mockDict.budget.quickAdd.submit });
    await user.click(submitButton);

    expect(await screen.findByText('Failed to add expense')).toBeInTheDocument();
    expect(onAdded).not.toHaveBeenCalled();
    expect(screen.getByText(mockDict.budget.quickAdd.title)).toBeInTheDocument(); // Dialog stays open
  });

  it('disables submit button when amount is missing', async () => {
    render(<QuickAddExpense tripId={tripId} onAdded={onAdded} lang="en" buttonVariant="inline" />);
    await user.click(screen.getByRole('button', { name: mockDict.budget.quickAdd.submit }));

    const submitButton = screen.getByRole('button', { name: mockDict.budget.quickAdd.submit });
    expect(submitButton).toBeDisabled();

    await user.type(screen.getByLabelText(mockDict.budget.quickAdd.amount), '10');
    expect(submitButton).not.toBeDisabled();
  });
});
