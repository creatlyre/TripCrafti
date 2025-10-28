import { render, screen, waitFor } from '@testing-library/react';

import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { Trip, Expense, BudgetCategory } from '@/types';

import BudgetDashboard from '@/components/budget/BudgetDashboard';

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

// Mock child components
vi.mock('@/components/budget/BudgetSummary', () => ({
  __esModule: true,
  default: () => <div data-testid="budget-summary-widget" />,
}));

const mockAddedExpense: Expense = {
  id: 'exp-new',
  trip_id: 'trip1',
  amount: 10,
  currency: 'USD',
  description: 'New Snack',
  category_id: 'cat1',
  is_prepaid: false,
  expense_date: '2024-01-04T10:00:00Z',
  amount_in_home_currency: 10,
  fx_rate: 1,
  fx_source: 'live',
};

vi.mock('@/components/budget/QuickAddExpense', () => ({
  __esModule: true,
  default: ({ onAdded }: { onAdded: (e: Expense) => void }) => (
    <button data-testid="quick-add-expense" onClick={() => onAdded(mockAddedExpense)}>
      Add Expense
    </button>
  ),
}));
vi.mock('@/components/budget/CategoryManagement', () => ({
  __esModule: true,
  default: () => <div data-testid="category-management" />,
}));
vi.mock('@/components/budget/BudgetPostTripReport', () => ({
  __esModule: true,
  default: () => <div data-testid="budget-post-trip-report" />,
}));

// Mock fetch
global.fetch = vi.fn();

const mockTrip: Trip = {
  id: 'trip1',
  user_id: 'user1',
  title: 'Test Trip',
  destination: 'Testville',
  start_date: '2024-01-01',
  end_date: '2024-01-10',
  currency: 'USD',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockCategories: BudgetCategory[] = [
  { id: 'cat1', name: 'Food', trip_id: 'trip1', user_id: 'user1' },
  { id: 'cat2', name: 'Transport', trip_id: 'trip1', user_id: 'user1' },
];

const mockExpenses: Expense[] = [
  {
    id: 'exp1',
    trip_id: 'trip1',
    amount: 100,
    currency: 'USD',
    description: 'Dinner',
    category: mockCategories[0],
    is_prepaid: false,
    expense_date: '2024-01-02T19:00:00Z',
    amount_in_home_currency: 100,
    fx_rate: 1,
    fx_source: 'live',
  },
  {
    id: 'exp2',
    trip_id: 'trip1',
    amount: 50,
    currency: 'USD',
    description: 'Taxi',
    category: mockCategories[1],
    is_prepaid: true,
    expense_date: '2024-01-02T12:00:00Z',
    amount_in_home_currency: 50,
    fx_rate: 1,
    fx_source: 'live',
  },
  {
    id: 'exp3',
    trip_id: 'trip1',
    amount: 25,
    currency: 'EUR',
    description: 'Coffee',
    category: mockCategories[0],
    is_prepaid: false,
    expense_date: '2024-01-03T09:00:00Z',
    amount_in_home_currency: 30,
    fx_rate: 1.2,
    fx_source: 'live',
  },
];

const mockDict = {
  budget: {
    dashboard: {
      title: 'Budget Dashboard',
      confirmDeleteExpense: 'Delete this expense?',
      modes: { simple: 'On-Trip', full: 'Full' },
      filters: { all: 'All', excludePrepaid: 'Exclude Prepaid', onlyPrepaid: 'Only Prepaid' },
      refresh: { action: 'Refresh', refreshing: 'Refreshing...' },
      expenses: { heading: 'Expenses', empty: 'No expenses yet.', fallbackTitle: 'Expense', prepaidBadge: 'Prepaid' },
    },
    errors: {
      loadExpenses: 'Failed to load expenses',
      deleteFailed: 'Delete failed',
    },
  },
};

vi.mock('@/lib/i18n', () => ({
  getDictionary: () => mockDict,
}));

describe('BudgetDashboard', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as vi.Mock).mockClear();
    window.confirm = vi.fn(() => true);
    (fetch as vi.Mock).mockImplementation((url, options) => {
      if (url.toString().includes('expenses') && options?.method === 'DELETE') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }
      if (url.toString().includes('expenses')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ expenses: mockExpenses }) });
      }
      return Promise.reject(new Error(`Unhandled fetch: ${url}`));
    });
  });

  it('fetches and displays expenses on initial render (in default "On-Trip" mode)', async () => {
    render(<BudgetDashboard trip={mockTrip} lang="en" />);

    // Initially, only non-prepaid expenses should be visible
    expect(await screen.findByText('Dinner')).toBeInTheDocument();
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.queryByText('Taxi')).not.toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(`/api/trips/${mockTrip.id}/expenses`);
  });

  it('shows a loading state initially and then removes it', async () => {
    render(<BudgetDashboard trip={mockTrip} lang="en" />);
    // The loading skeleton is a UL with specific styling. It's the only list initially.
    const skeletonList = screen.getByRole('list');
    expect(skeletonList).toHaveClass('animate-pulse');

    // Wait for the final content to appear
    await waitFor(() => {
      expect(screen.getByText('Dinner')).toBeInTheDocument();
    });

    // After loading, check that the lists no longer have the pulse class.
    const finalLists = screen.getAllByRole('list');
    expect(finalLists.length).toBe(2); // Two lists, one for each day
    finalLists.forEach((list) => {
      expect(list).not.toHaveClass('animate-pulse');
    });
  });

  it('shows an error message if fetching expenses fails', async () => {
    (fetch as vi.Mock).mockImplementationOnce(() => Promise.resolve({ ok: false }));
    render(<BudgetDashboard trip={mockTrip} lang="en" />);
    expect(await screen.findByText(mockDict.budget.errors.loadExpenses)).toBeInTheDocument();
  });

  it('filters expenses based on budget mode and prepaid status', async () => {
    render(<BudgetDashboard trip={mockTrip} lang="en" />);

    await waitFor(() => expect(screen.queryByText('Dinner')).toBeInTheDocument());

    // Default "On-Trip" (simple) mode should exclude prepaid
    expect(screen.queryByText('Taxi')).not.toBeInTheDocument();

    // Switch to "Full" mode
    const fullModeButton = screen.getByRole('button', { name: 'Full' });
    await user.click(fullModeButton);

    // "All" filter is default for "Full" mode, so Taxi should now be visible
    expect(await screen.findByText('Taxi')).toBeInTheDocument();
    expect(screen.getByText('Dinner')).toBeInTheDocument();

    // Filter to "Only Prepaid"
    const onlyPrepaidButton = screen.getByRole('button', { name: 'Only Prepaid' });
    await user.click(onlyPrepaidButton);
    expect(screen.queryByText('Dinner')).not.toBeInTheDocument();
    expect(screen.getByText('Taxi')).toBeInTheDocument();

    // Filter to "Exclude Prepaid"
    const excludePrepaidButton = screen.getByRole('button', { name: 'Exclude Prepaid' });
    await user.click(excludePrepaidButton);
    expect(screen.getByText('Dinner')).toBeInTheDocument();
    expect(screen.queryByText('Taxi')).not.toBeInTheDocument();
  });

  it('deletes an expense when delete button is clicked', async () => {
    render(<BudgetDashboard trip={mockTrip} lang="en" />);

    const dinnerExpense = await screen.findByText('Dinner');
    const expenseItem = dinnerExpense.closest('li');
    expect(expenseItem).not.toBeNull();

    const deleteButton = expenseItem!.querySelector('button[aria-label="Delete expense"]');
    expect(deleteButton).not.toBeNull();

    await user.hover(expenseItem!);
    await user.click(deleteButton!);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(`/api/trips/${mockTrip.id}/expenses/exp1`, { method: 'DELETE' });
      expect(screen.queryByText('Dinner')).not.toBeInTheDocument();
    });
  });

  it('re-fetches expenses on manual refresh', async () => {
    render(<BudgetDashboard trip={mockTrip} lang="en" />);

    await waitFor(() => expect(screen.queryByText('Dinner')).toBeInTheDocument());
    expect(fetch).toHaveBeenCalledTimes(1);

    const refreshButton = screen.getByRole('button', { name: mockDict.budget.dashboard.refresh.action });
    await user.click(refreshButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('optimistically adds a new expense via QuickAddExpense', async () => {
    render(<BudgetDashboard trip={mockTrip} lang="en" />);

    await waitFor(() => expect(screen.queryByText('Dinner')).toBeInTheDocument());
    expect(screen.queryByText('New Snack')).not.toBeInTheDocument();

    const addButton = screen.getByTestId('quick-add-expense');
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('New Snack')).toBeInTheDocument();
    });
  });
});
