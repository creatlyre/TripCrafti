import React, { useEffect, useState } from 'react';

import { getDictionary, type Lang } from '@/lib/i18n';

import type { BudgetCategory, Expense } from '../../types';

import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

interface Props {
  tripId: string;
  onAdded?: (e: Expense) => void;
  lang?: Lang;
  buttonVariant?: 'fab' | 'inline';
}

const QuickAddExpense: React.FC<Props> = ({ tripId, onAdded, lang = 'pl', buttonVariant = 'fab' }) => {
  const dictBudget = getDictionary(lang).budget;
  if (!dictBudget) {
    throw new Error('Budget dictionary not found');
  }
  const dict = dictBudget;

  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [form, setForm] = useState({ amount: '', currency: '', description: '', category_id: '', is_prepaid: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    async function loadCats() {
      setLoadingCats(true);
      try {
        const res = await fetch(`/api/trips/${tripId}/budget/categories`);
        if (!res.ok) {
          throw new Error('Failed to load categories');
        }
        const json = (await res.json()) as unknown;
        const data = json as { categories?: BudgetCategory[] };
        setCategories(data.categories || []);
      } catch {
        // swallow load error; UI will show empty list
      } finally {
        setLoadingCats(false);
      }
    }
    loadCats();
  }, [open, tripId]);

  function update<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        amount: Number(form.amount),
        currency: form.currency || 'EUR',
        description: form.description || undefined,
        category_id: form.category_id || undefined,
        is_prepaid: form.is_prepaid,
      };
      const res = await fetch(`/api/trips/${tripId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to add expense');
      const raw = await res.json();
      const data = raw as { expense: Expense };
      onAdded?.(data.expense);
      // Dispatch global event so compact widgets can refresh immediately
      try {
        window.dispatchEvent(new CustomEvent('expense:added', { detail: { tripId, expense: data.expense } }));
      } catch {
        /* ignore */
      }
      setOpen(false);
      setForm({ amount: '', currency: '', description: '', category_id: '', is_prepaid: false });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {buttonVariant === 'fab' ? (
          <button
            aria-label={dict.quickAdd.fabAria}
            className="group fixed bottom-6 right-6 h-20 w-20 rounded-full bg-gradient-to-r from-brand-cyan to-brand-cyan/80 hover:from-brand-cyan hover:to-brand-cyan text-brand-navy text-3xl font-bold shadow-2xl shadow-brand-cyan/40 hover:shadow-brand-cyan/60 flex items-center justify-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-cyan/50 transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-brand-cyan/20 hover:border-brand-cyan/40"
          >
            <span aria-hidden className="relative z-10 transition-transform duration-300 group-hover:rotate-90">
              ➕
            </span>
            <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        ) : (
          <button
            aria-label={dict.quickAdd.submit}
            className="group relative text-sm px-6 py-3 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-cyan/90 text-brand-navy hover:from-brand-cyan/90 hover:to-brand-cyan font-semibold shadow-lg hover:shadow-xl hover:shadow-brand-cyan/30 border-2 border-brand-cyan/30 hover:border-brand-cyan/50 transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 focus:ring-offset-2 focus:ring-offset-brand-navy"
          >
            <span className="relative z-10 flex items-center gap-2">
              <span aria-hidden>➕</span> {dict.quickAdd.submit}
            </span>
            <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-brand-navy-dark/95 backdrop-blur-sm border-2 border-brand-cyan/40 shadow-2xl shadow-brand-cyan/20">
        <DialogHeader>
          <DialogTitle className="text-xl text-white font-bold flex items-center gap-2">
            {dict.quickAdd.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div>
            <label className="text-sm font-medium text-brand-cyan" htmlFor="expense-amount">
              {dict.quickAdd.amount}
            </label>
            <Input
              id="expense-amount"
              type="number"
              value={form.amount}
              onChange={(e) => update('amount', e.target.value)}
              placeholder="0.00"
              className="mt-1 bg-brand-navy-dark border-brand-navy-lighter text-white placeholder:text-brand-cyan/50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-brand-cyan" htmlFor="expense-currency">
              {dict.quickAdd.currency}
            </label>
            <Input
              id="expense-currency"
              value={form.currency}
              onChange={(e) => update('currency', e.target.value.toUpperCase())}
              placeholder="EUR"
              maxLength={3}
              className="mt-1 bg-brand-navy-dark border-brand-navy-lighter text-white placeholder:text-brand-cyan/50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-brand-cyan" htmlFor="expense-category">
              {dict.quickAdd.category}
            </label>
            <div className="mt-1 flex gap-2">
              <div className="flex-1">
                <Select value={form.category_id} onValueChange={(v) => update('category_id', v)}>
                  <SelectTrigger className="bg-brand-navy-dark border-brand-navy-lighter text-white">
                    <SelectValue placeholder={loadingCats ? dict.quickAdd.loadingCats : dict.quickAdd.selectCategory} />
                  </SelectTrigger>
                  <SelectContent className="bg-brand-navy-light border-brand-navy-lighter">
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-white hover:bg-brand-navy-lighter">
                        {c.name}
                      </SelectItem>
                    ))}
                    {categories.length === 0 && !loadingCats && (
                      <div className="p-3 text-sm text-brand-cyan/60 text-center">
                        {dict.quickAdd.noCategories || 'No categories available'}
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {categories.length === 0 && !loadingCats && (
                <button
                  type="button"
                  onClick={() => {
                    // Open category management modal - this is a simplified approach
                    // In production, you might want to open a proper category creation modal
                    const name = prompt(dict.quickAdd.newCategoryPrompt || 'Enter category name:');
                    const amount = prompt(dict.quickAdd.plannedAmountPrompt || 'Enter planned amount:');
                    if (name && amount) {
                      // Create category via API
                      fetch(`/api/trips/${tripId}/budget/categories`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          name,
                          planned_amount: Number(amount),
                        }),
                      }).then(async (res) => {
                        if (res.ok) {
                          // Reload categories
                          const res2 = await fetch(`/api/trips/${tripId}/budget/categories`);
                          const json2: unknown = await res2.json();
                          const data2 = json2 as { categories?: BudgetCategory[] } | undefined;
                          setCategories(data2?.categories || []);
                        }
                      });
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-brand-orange/20 text-brand-orange border border-brand-orange/30 hover:bg-brand-orange/30 hover:scale-105 transition-all duration-300 text-sm font-semibold"
                >
                  ➕
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-brand-cyan" htmlFor="expense-description">
              {dict.quickAdd.description}
            </label>
            <Textarea
              id="expense-description"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
              className="mt-1 bg-brand-navy-dark border-brand-navy-lighter text-white placeholder:text-brand-cyan/50"
            />
          </div>
          <div className="flex items-center gap-3">
            <input
              id="prepaid"
              type="checkbox"
              checked={form.is_prepaid}
              onChange={(e) => update('is_prepaid', e.target.checked)}
              className="h-4 w-4 rounded border-brand-navy-lighter bg-brand-navy-dark text-brand-cyan focus:ring-brand-cyan/50"
            />
            <label htmlFor="prepaid" className="text-sm text-white">
              {dict.quickAdd.prepaid}
            </label>
          </div>
          {error && <div className="text-sm text-brand-orange bg-brand-orange/10 p-3 rounded-lg">{error}</div>}
          <Button
            disabled={submitting || !form.amount}
            onClick={submit}
            aria-label={dict.quickAdd.submit}
            className="relative group w-full bg-brand-cyan text-brand-navy font-medium border-2 border-brand-cyan/40 hover:border-brand-cyan hover:bg-brand-cyan/90 hover:shadow-xl hover:shadow-brand-cyan/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-cyan/50 transition-all duration-300 rounded-xl overflow-hidden active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand-cyan disabled:hover:shadow-none disabled:hover:scale-100"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {submitting ? dict.quickAdd.adding : dict.quickAdd.submit}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-brand-cyan/80 to-brand-cyan/60 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickAddExpense;
