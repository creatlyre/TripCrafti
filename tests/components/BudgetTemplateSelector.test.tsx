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
    // Expect at least one known template label (appears twice: list + preview)
    const cityInstances = screen.getAllByText(/City Break/i);
    expect(cityInstances.length).toBeGreaterThan(0);
    const search = screen.getByPlaceholderText(/Search/i);
    fireEvent.change(search, { target: { value: 'Business' } });
    const businessMatches = screen.getAllByText(/Business Trip/i);
    expect(businessMatches.length).toBeGreaterThan(0);
  });

  it('invokes onApply after selecting template and clicking apply', () => {
    const handler = vi.fn();
    render(<BudgetTemplateSelector onApply={handler} tripBudget={2000} />);
    // Select second template to ensure selection handler works
    const listItems = screen.getAllByRole('option');
    expect(listItems.length).toBeGreaterThan(1);
    fireEvent.click(listItems[1]);
    const applyBtn = screen.getByRole('button', { name: /Apply Template|Zastosuj szablon/i });
    fireEvent.click(applyBtn);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
