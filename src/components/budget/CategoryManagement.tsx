import React, { useEffect, useState, useMemo } from 'react';

import { getDictionary, type Lang } from '@/lib/i18n';

import type { BudgetCategory, BudgetMode } from '../../types';

import { BUDGET_CATEGORY_TEMPLATES, isRatio } from '../../lib/budget.templates';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';

interface Props {
  tripId: string;
  onCategoryAdded?: (c: BudgetCategory) => void;
  lang?: Lang;
  budgetMode?: BudgetMode;
}

const CategoryManagement: React.FC<Props> = ({ tripId, onCategoryAdded, lang = 'pl', budgetMode = 'simple' }) => {
  const dictFull = getDictionary(lang);
  const dict = dictFull.budget || {
    categories: {
      heading: 'Categories',
      add: 'Add',
      edit: 'Edit',
      newCategory: 'New Category',
      editCategory: 'Edit Category',
      name: 'Name',
      plannedAmount: 'Planned Amount',
      plannedAmountHint: 'Enter amount',
      iconOptional: 'Icon (optional)',
      iconPlaceholder: 'e.g. food',
      submitCreating: 'Adding...',
      submitUpdating: 'Updating...',
      submit: 'Create',
      update: 'Update',
      templates: 'Templates',
      selectTemplate: 'Select Template',
      applying: 'Applying...',
      apply: 'Apply',
      estPlannedTotal: 'Est. total:',
      ofTripBudget: '% of budget',
      budgetNotLoaded: 'Budget not loaded',
      budgetBasedAmounts: 'Budget-based amounts:',
      percentageExplanation: 'Percentages will be calculated',
      loading: 'Loading...',
      empty: 'No categories yet',
      confirmApplyTemplate: 'Add categories?',
      confirmDeleteCategory: 'Delete category?',
      simpleModeHint: 'Focus on variable spending',
    },
    errors: {
      loadCategories: 'Failed to load categories',
      createCategory: 'Failed to create',
      deleteFailed: 'Delete failed',
    },
    categoryTemplates: {},
  };
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', planned_amount: '', icon_name: '' });
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [applyingTemplateId, setApplyingTemplateId] = useState<string | null>(null);
  const [tripBudget, setTripBudget] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Total planned (for percent display)
  const totalPlanned = useMemo(() => categories.reduce((s, c) => s + (c.planned_amount || 0), 0), [categories]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/budget/categories`);
      if (!res.ok) throw new Error(dict.errors?.loadCategories || 'Failed to load categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [tripId]);
  // fetch trip to know overall budget (for ratio templates conversion)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/trips/${tripId}`); // assuming trip endpoint exists
        if (res.ok) {
          const data = await res.json();
          if (data?.trip?.budget) setTripBudget(Number(data.trip.budget));
        }
      } catch {
        /* ignore */
      }
    })();
  }, [tripId]);

  async function addCategory() {
    if (!form.name || !form.planned_amount) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        planned_amount: Number(form.planned_amount),
        icon_name: form.icon_name || undefined,
      };
      const res = await fetch(`/api/trips/${tripId}/budget/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(dict.errors?.createCategory || 'Failed to create category');
      await load();
      setForm({ name: '', planned_amount: '', icon_name: '' });
      setOpen(false);
      if (onCategoryAdded) {
        // naive: fetch last category (could optimize by returning from POST)
        const created = categories[categories.length - 1];
        if (created) onCategoryAdded(created);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function editCategory() {
    if (!editingCategory || !form.name || !form.planned_amount) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        planned_amount: Number(form.planned_amount),
        icon_name: form.icon_name || undefined,
      };
      const res = await fetch(`/api/trips/${tripId}/budget/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(dict.errors?.createCategory || 'Failed to update category');
      await load();
      setForm({ name: '', planned_amount: '', icon_name: '' });
      setEditingCategory(null);
      setEditOpen(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(category: BudgetCategory) {
    setEditingCategory(category);
    setForm({
      name: category.name,
      planned_amount: category.planned_amount.toString(),
      icon_name: category.icon_name || '',
    });
    setEditOpen(true);
  }

  async function applyTemplate(templateId: string) {
    const template = BUDGET_CATEGORY_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    if (categories.length > 0 && !confirm(dict.categories.confirmApplyTemplate)) return;
    setApplyingTemplateId(templateId);
    setError(null);
    try {
      const payloadCategories = template.categories.map((c) => {
        let planned = 0;
        if (isRatio(c.suggested_portion) && tripBudget) {
          planned = Number((tripBudget * (c.suggested_portion || 0)).toFixed(2));
        } else if (typeof c.suggested_portion === 'number') {
          planned = c.suggested_portion;
        } else {
          planned = 0;
        }
        return { name: c.name, planned_amount: planned, icon_name: c.icon_name };
      });
      const res = await fetch(`/api/trips/${tripId}/budget/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: payloadCategories }),
      });
      if (!res.ok) throw new Error(dict.errors?.loadCategories || 'Failed to apply template');
      await load();
      setTemplatesOpen(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setApplyingTemplateId(null);
    }
  }

  async function deleteCategory(id: string) {
    if (deletingId) return; // guard
    if (!confirm(dict.categories.confirmDeleteCategory || 'Delete this category?')) return;
    const prev = categories;
    setDeletingId(id);
    setCategories((cs) => cs.filter((c) => c.id !== id)); // optimistic
    setActionError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/budget/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || dict.errors?.deleteFailed || 'Delete failed');
      }
    } catch (e: any) {
      setCategories(prev); // revert
      setActionError(e.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{dict.categories.heading}</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              {dict.categories.add}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{dict.categories.newCategory}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">{dict.categories.name}</label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium">{dict.categories.plannedAmount}</label>
                <div className="text-[10px] text-slate-400 mb-1">{dict.categories.plannedAmountHint}</div>
                <Input
                  type="number"
                  value={form.planned_amount}
                  onChange={(e) => setForm((f) => ({ ...f, planned_amount: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium">{dict.categories.iconOptional}</label>
                <Input
                  value={form.icon_name}
                  onChange={(e) => setForm((f) => ({ ...f, icon_name: e.target.value }))}
                  placeholder={dict.categories.iconPlaceholder}
                />
              </div>
              {error && <div className="text-xs text-red-600">{error}</div>}
              <Button
                disabled={submitting || !form.name || !form.planned_amount}
                onClick={addCategory}
                className="w-full"
              >
                {submitting ? dict.categories.submitCreating : dict.categories.submit}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        {/* Edit Category Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{dict.categories.editCategory}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">{dict.categories.name}</label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium">{dict.categories.plannedAmount}</label>
                <div className="text-[10px] text-slate-400 mb-1">{dict.categories.plannedAmountHint}</div>
                <Input
                  type="number"
                  value={form.planned_amount}
                  onChange={(e) => setForm((f) => ({ ...f, planned_amount: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium">{dict.categories.iconOptional}</label>
                <Input
                  value={form.icon_name}
                  onChange={(e) => setForm((f) => ({ ...f, icon_name: e.target.value }))}
                  placeholder={dict.categories.iconPlaceholder}
                />
              </div>
              {error && <div className="text-xs text-red-600">{error}</div>}
              <Button
                disabled={submitting || !form.name || !form.planned_amount}
                onClick={editCategory}
                className="w-full"
              >
                {submitting ? dict.categories.submitUpdating : dict.categories.update}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={templatesOpen} onOpenChange={setTemplatesOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="secondary">
              {dict.categories.templates}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{dict.categories.selectTemplate}</DialogTitle>
            </DialogHeader>
            {tripBudget && (
              <div className="text-xs bg-blue-900/20 border border-blue-700 rounded p-2 mb-3">
                <div className="font-medium text-blue-200">{dict.categories.budgetBasedAmounts}</div>
                <div className="text-blue-300 text-[10px] mt-1">{dict.categories.percentageExplanation}</div>
              </div>
            )}
            <div className="space-y-4 text-xs">
              {BUDGET_CATEGORY_TEMPLATES.map((t) => {
                const loc = dict.categoryTemplates?.[t.id];
                // Use localized data from i18n system
                const label = loc?.label || `[Missing i18n: ${t.id}]`;
                const description = loc?.description || `[Missing i18n description: ${t.id}]`;
                const localizedCategories = loc?.categories || [];

                // Map template categories to localized names if available
                const categoriesForDisplay = t.categories.map((templateCat, index) => {
                  const localizedCat = localizedCategories[index];
                  return {
                    name: localizedCat?.name || templateCat.name, // fallback to template name if i18n missing
                    suggested_portion: templateCat.suggested_portion,
                    icon_name: templateCat.icon_name,
                  };
                });

                const totalPlanned = categoriesForDisplay.reduce((sum, c: any) => {
                  if (isRatio(c.suggested_portion) && tripBudget) return sum + tripBudget * (c.suggested_portion || 0);
                  if (typeof c.suggested_portion === 'number' && !isRatio(c.suggested_portion))
                    return sum + c.suggested_portion;
                  return sum;
                }, 0);
                return (
                  <div key={t.id} className="border rounded-md p-3 bg-slate-900/40 border-slate-700">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-slate-200">{label}</span>
                      <Button size="sm" disabled={applyingTemplateId === t.id} onClick={() => applyTemplate(t.id)}>
                        {applyingTemplateId === t.id ? dict.categories.applying : dict.categories.apply}
                      </Button>
                    </div>
                    <p className="text-slate-400 mb-2 leading-snug">{description}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {categoriesForDisplay.map((c: any) => {
                        const isPercentage = isRatio(c.suggested_portion);
                        const calculatedAmount =
                          isPercentage && tripBudget
                            ? (tripBudget * (c.suggested_portion || 0)).toFixed(2)
                            : (c.suggested_portion ?? 0);

                        return (
                          <div
                            key={c.name}
                            className="bg-slate-800/50 border border-slate-700 rounded px-2 py-1 flex flex-col"
                          >
                            <span className="truncate">{c.name}</span>
                            <div className="text-[10px] text-slate-400">
                              {isPercentage ? (
                                <div>
                                  <span className="text-slate-300">
                                    {Math.round((c.suggested_portion || 0) * 100)}%
                                  </span>
                                  {tripBudget && <span className="text-emerald-400 ml-1">≈ {calculatedAmount}</span>}
                                </div>
                              ) : (
                                <span>{calculatedAmount}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {tripBudget && (
                      <div className="mt-2 text-[10px] text-slate-500">
                        {dict.categories.estPlannedTotal} {totalPlanned.toFixed(2)} (
                        {tripBudget > 0 ? ((totalPlanned / tripBudget) * 100).toFixed(0) : 0}
                        {dict.categories.ofTripBudget})
                      </div>
                    )}
                  </div>
                );
              })}
              {tripBudget === null && (
                <div className="text-[10px] text-amber-500">{dict.categories.budgetNotLoaded}</div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {loading && <div className="text-xs text-muted-foreground">{dict.categories.loading}</div>}
      {error && !open && <div className="text-xs text-red-600">{error}</div>}
      {actionError && <div className="text-[11px] text-red-500">{actionError}</div>}
      {budgetMode === 'simple' && <div className="text-[10px] text-slate-500">{dict.categories.simpleModeHint}</div>}
      <div className="space-y-1 max-h-64 overflow-auto pr-1 rounded-md bg-slate-900/40 border border-slate-800">
        {categories.map((c) => (
          <div
            key={c.id}
            className="group flex items-center justify-between gap-3 px-3 py-2 text-xs border-b border-slate-800 last:border-b-0 hover:bg-slate-800/60 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-slate-200" title={c.name}>
                {c.name}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                {c.planned_amount.toFixed(2)}
                {totalPlanned ? ` · ${((c.planned_amount / totalPlanned) * 100).toFixed(0)}%` : ''}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                aria-label={`${dict.categories.edit} ${c.name}`}
                onClick={() => startEdit(c)}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-slate-400 hover:text-blue-400 transition text-[11px] px-2 py-1 rounded-md hover:bg-blue-500/10"
              >
                ✏️
              </button>
              <button
                aria-label={`Delete ${c.name}`}
                onClick={() => deleteCategory(c.id)}
                disabled={deletingId === c.id}
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50 text-slate-400 hover:text-red-400 transition text-[11px] px-2 py-1 rounded-md hover:bg-red-500/10"
              >
                {deletingId === c.id ? '…' : '✕'}
              </button>
            </div>
          </div>
        ))}
        {!loading && categories.length === 0 && (
          <div className="text-xs text-slate-500 py-6 text-center">
            {dict.categories.empty.replace('Add', dict.categories.add)}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryManagement;
