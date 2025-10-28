/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useEffect, useState, useMemo, useCallback } from 'react';

import { getDictionary, type Lang } from '@/lib/i18n';

import type { BudgetCategory, BudgetMode } from '../../types';

import { BUDGET_CATEGORY_TEMPLATES, isRatio } from '../../lib/budget.templates';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import BudgetTemplateSelector from './BudgetTemplateSelector';

interface Props {
  tripId: string;
  onCategoryAdded?: (c: BudgetCategory) => void;
  lang?: Lang;
  budgetMode?: BudgetMode;
}

const CategoryManagement: React.FC<Props> = ({ tripId, onCategoryAdded, lang = 'pl', budgetMode = 'simple' }) => {
  const dict = getDictionary(lang).budget!;
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', planned_amount: '', icon_name: '' });
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [applyingTemplateId, setApplyingTemplateId] = useState<string | null>(null);
  const [tripBudget, setTripBudget] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Total planned (for percent display)
  const totalPlanned = useMemo(() => categories.reduce((s, c) => s + (c.planned_amount || 0), 0), [categories]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/budget/categories`);
      if (!res.ok) throw new Error(dict.errors?.loadCategories || 'Failed to load categories');
      const raw = await res.json();
      const data = raw as { categories?: BudgetCategory[] };
      setCategories(data.categories || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }, [tripId, dict.errors?.loadCategories]);

  useEffect(() => {
    load();
  }, [load]);
  // fetch trip to know overall budget (for ratio templates conversion)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/trips/${tripId}`); // assuming trip endpoint exists
        if (res.ok) {
          const raw = await res.json();
          const data = raw as { trip?: { budget?: number } };
          if (data.trip?.budget != null) setTripBudget(Number(data.trip.budget));
        }
      } catch {
        /* ignore */
      }
    })();
  }, [tripId]);

  async function addCategory() {
    if (!form.name) return; // planned amount now optional
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        planned_amount: form.planned_amount ? Number(form.planned_amount) : 0,
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error');
    } finally {
      setSubmitting(false);
    }
  }

  async function applyTemplate(templateId: string) {
    const template = BUDGET_CATEGORY_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    if (categories.length > 0 && !confirm(dict.categories?.confirmApplyTemplate || 'Apply template?')) return;
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
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unexpected error';
      setError(message);
    } finally {
      setApplyingTemplateId(null);
    }
  }

  async function deleteCategory(id: string) {
    if (deletingId) return; // guard
    if (!confirm(dict.categories?.confirmDeleteCategory || 'Delete this category?')) return;
    const prev = categories;
    setDeletingId(id);
    setCategories((cs) => cs.filter((c) => c.id !== id)); // optimistic
    setActionError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/budget/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const raw = await res.json().catch(() => ({}));
        const data = raw as { error?: string };
        throw new Error(data.error || dict.errors?.deleteFailed || 'Delete failed');
      }
    } catch (e) {
      setCategories(prev); // revert
      setActionError(e instanceof Error ? e.message : 'Unexpected error');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-lg font-semibold text-white">{dict.categories.heading}</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="group relative px-6 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan/90 text-brand-navy font-semibold hover:from-brand-cyan/90 hover:to-brand-cyan hover:scale-105 hover:shadow-xl hover:shadow-brand-cyan/30 transition-all duration-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 focus:ring-offset-2 focus:ring-offset-brand-navy border-2 border-brand-cyan/30 hover:border-brand-cyan/50">
              <span className="relative z-10 flex items-center gap-2">➕ {dict.categories.add}</span>
              <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm bg-brand-navy-light border-brand-navy-lighter">
            <DialogHeader>
              <DialogTitle className="text-lg text-white">{dict.categories.newCategory}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-brand-cyan">{dict.categories.name}</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 bg-brand-navy-dark border-brand-navy-lighter text-white placeholder:text-brand-cyan/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-brand-cyan">
                  {dict.categories.plannedAmount}
                  {lang === 'pl' ? ' (opcjonalnie)' : ' (optional)'}
                </label>
                <Input
                  type="number"
                  value={form.planned_amount}
                  onChange={(e) => setForm((f) => ({ ...f, planned_amount: e.target.value }))}
                  placeholder={lang === 'pl' ? 'np. 500' : 'e.g. 500'}
                  className="mt-1 bg-brand-navy-dark border-brand-navy-lighter text-white placeholder:text-brand-cyan/50"
                />
                <p className="mt-1 text-[11px] text-brand-cyan/60">
                  {lang === 'pl'
                    ? 'Pozostaw puste jeśli nie planujesz konkretnego limitu dla tej kategorii.'
                    : "Leave empty if you don't plan a specific limit for this category."}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-brand-cyan">{dict.categories.iconOptional}</label>
                <Input
                  value={form.icon_name}
                  onChange={(e) => setForm((f) => ({ ...f, icon_name: e.target.value }))}
                  placeholder={dict.categories.iconPlaceholder}
                  className="mt-1 bg-brand-navy-dark border-brand-navy-lighter text-white placeholder:text-brand-cyan/50"
                />
              </div>
              {error && <div className="text-sm text-brand-orange bg-brand-orange/10 p-3 rounded-lg">{error}</div>}
              <Button
                disabled={submitting || !form.name}
                onClick={addCategory}
                aria-label={dict.categories.submit}
                className="relative group w-full bg-brand-cyan text-brand-navy hover:bg-brand-cyan/90 font-medium border-2 border-brand-cyan/40 hover:border-brand-cyan focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-cyan/50 transition-all duration-300 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-brand-cyan/30 active:scale-95 disabled:opacity-50"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {submitting ? dict.categories.submitCreating : dict.categories.submit}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-brand-cyan/80 to-brand-cyan/60 opacity-0 group-hover:opacity-20 transition-opacity" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={templatesOpen} onOpenChange={setTemplatesOpen}>
          <DialogTrigger asChild>
            <button className="group relative px-6 py-3 rounded-xl bg-gradient-to-r from-brand-orange/20 to-brand-orange/10 text-brand-orange border-2 border-brand-orange/30 hover:from-brand-orange/30 hover:to-brand-orange/20 hover:border-brand-orange/50 hover:scale-105 hover:shadow-xl hover:shadow-brand-orange/20 transition-all duration-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:ring-offset-2 focus:ring-offset-brand-navy font-semibold">
              <span className="relative z-10 flex items-center gap-2">📋 {dict.categories.templates}</span>
              <div className="absolute inset-0 rounded-xl bg-brand-orange/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </DialogTrigger>
          <DialogContent className="dialog-template-category max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg text-white">{dict.categories.selectTemplate}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 text-sm">
              {dict.categories.templatesNote && (
                <div className="rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 p-3 text-brand-cyan/90 text-xs leading-relaxed">
                  {dict.categories.templatesNote}
                </div>
              )}
              <BudgetTemplateSelector
                lang={lang}
                tripBudget={tripBudget}
                applyingTemplateId={applyingTemplateId}
                onApply={applyTemplate}
              />
              {tripBudget === null && (
                <div className="text-xs text-brand-orange bg-brand-orange/10 p-3 rounded-lg">
                  {dict.categories.budgetNotLoaded}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {loading && <div className="text-sm text-brand-cyan/60">{dict.categories.loading}</div>}
      {error && !open && <div className="text-sm text-brand-orange bg-brand-orange/10 p-3 rounded-lg">{error}</div>}
      {actionError && <div className="text-sm text-brand-orange bg-brand-orange/10 p-3 rounded-lg">{actionError}</div>}
      {budgetMode === 'simple' && (
        <div className="text-sm text-brand-cyan/60 bg-brand-cyan/5 p-3 rounded-lg">
          {dict.categories.simpleModeHint}
        </div>
      )}
      <div className="space-y-2 max-h-80 overflow-auto pr-1 rounded-lg bg-brand-navy-light border border-brand-navy-lighter p-4">
        {categories.map((c) => (
          <div
            key={c.id}
            className="group flex items-center justify-between gap-4 px-4 py-3 text-sm border-b border-brand-navy-lighter/50 last:border-b-0 hover:bg-brand-navy-lighter/30 transition-colors rounded-lg"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-white" title={c.name}>
                {c.name}
              </p>
              <p className="text-sm text-brand-cyan/70 font-mono">
                {c.planned_amount.toFixed(2)}
                {totalPlanned ? ` · ${((c.planned_amount / totalPlanned) * 100).toFixed(0)}%` : ''}
              </p>
            </div>
            <button
              aria-label={'Delete category'}
              onClick={() => deleteCategory(c.id)}
              disabled={deletingId === c.id}
              className="group h-12 w-12 flex items-center justify-center opacity-100 md:opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50 text-brand-cyan/70 hover:text-brand-orange hover:bg-brand-orange/10 hover:scale-110 hover:shadow-lg hover:shadow-brand-orange/20 transition-all duration-300 rounded-xl border-2 border-transparent hover:border-brand-orange/30 font-bold text-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-orange/50 focus:ring-offset-2 focus:ring-offset-brand-navy"
            >
              <span className="relative z-10 transition-transform duration-300 group-hover:rotate-90">
                {deletingId === c.id ? '⏳' : '🗑️'}
              </span>
            </button>
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
