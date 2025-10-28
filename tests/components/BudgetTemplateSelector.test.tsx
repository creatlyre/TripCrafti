import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import { describe, it, expect, vi } from 'vitest';

import BudgetTemplateSelector from '@/components/budget/BudgetTemplateSelector';

vi.mock('@/lib/i18n', async () => {
  const actual = (await vi.importActual('@/lib/i18n')) as Record<string, unknown> & {
    getDictionary: (lang: string) => unknown; // existing types from module
  };
  return { ...actual, getDictionary: (lang: string) => actual.getDictionary(lang) };
});

describe('BudgetTemplateSelector', () => {
  it('renders templates and filters by search', () => {
    const handler = vi.fn();
    render(<BudgetTemplateSelector onApply={handler} tripBudget={1000} />);
    // Expect at least one known template label
    expect(screen.getByText(/City Break/i)).toBeInTheDocument();
    const search = screen.getByPlaceholderText(/Search/i);
    fireEvent.change(search, { target: { value: 'Business' } });
    expect(screen.getByText(/Business Trip/i)).toBeInTheDocument();
  });

  it('invokes onApply when apply button clicked', () => {
    const handler = vi.fn();
    render(<BudgetTemplateSelector onApply={handler} tripBudget={2000} />);
    const btn = screen.getAllByRole('button', { name: /Apply|Zastosuj/i })[0];
    fireEvent.click(btn);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
