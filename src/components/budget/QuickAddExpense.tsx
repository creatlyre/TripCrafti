import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import type { BudgetCategory, Expense } from '../../types';
import { getDictionary, type Lang } from '@/lib/i18n';

interface Props { tripId: string; onAdded?: (e: Expense) => void; lang?: Lang; buttonVariant?: 'fab' | 'inline' }

const QuickAddExpense: React.FC<Props> = ({ tripId, onAdded, lang = 'pl', buttonVariant = 'fab' }) => {
  const dict = getDictionary(lang).budget!;
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
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (e: any) {
        // ignore
      } finally { setLoadingCats(false); }
    }
    loadCats();
  }, [open, tripId]);

  function update<K extends keyof typeof form>(key: K, val: (typeof form)[K]) { setForm(f => ({ ...f, [key]: val })); }

  async function submit() {
    setSubmitting(true); setError(null);
    try {
      const payload = {
        amount: Number(form.amount),
        currency: form.currency || 'EUR',
        description: form.description || undefined,
        category_id: form.category_id || undefined,
        is_prepaid: form.is_prepaid,
      };
      const res = await fetch(`/api/trips/${tripId}/expenses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Failed to add expense');
      const data = await res.json();
      onAdded?.(data.expense);
      setOpen(false);
      setForm({ amount: '', currency: '', description: '', category_id: '', is_prepaid: false });
    } catch (e: any) { setError(e.message); } finally { setSubmitting(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {buttonVariant === 'fab' ? (
          <button
            aria-label={dict.quickAdd.fabAria}
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-xl font-bold shadow-lg shadow-indigo-700/30 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400"
          >
            +
          </button>
        ) : (
          <Button size="sm" variant="default" className="text-[11px]">
            {dict.quickAdd.submit}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{dict.quickAdd.title}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium" htmlFor="expense-amount">{dict.quickAdd.amount}</label>
            <Input id="expense-amount" type="number" value={form.amount} onChange={e => update('amount', e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className="text-xs font-medium" htmlFor="expense-currency">{dict.quickAdd.currency}</label>
            <Input id="expense-currency" value={form.currency} onChange={e => update('currency', e.target.value.toUpperCase())} placeholder="EUR" maxLength={3} />
          </div>
          <div>
            <label className="text-xs font-medium" htmlFor="expense-category">{dict.quickAdd.category}</label>
            <Select value={form.category_id} onValueChange={v => update('category_id', v)}>
              <SelectTrigger><SelectValue placeholder={loadingCats ? dict.quickAdd.loadingCats : dict.quickAdd.selectCategory} /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium" htmlFor="expense-description">{dict.quickAdd.description}</label>
            <Textarea id="expense-description" value={form.description} onChange={e => update('description', e.target.value)} rows={3} />
          </div>
          <div className="flex items-center gap-2">
            <input id="prepaid" type="checkbox" checked={form.is_prepaid} onChange={e => update('is_prepaid', e.target.checked)} />
            <label htmlFor="prepaid" className="text-xs">{dict.quickAdd.prepaid}</label>
          </div>
          {error && <div className="text-xs text-red-600">{error}</div>}
          <Button disabled={submitting || !form.amount} onClick={submit} className="w-full">
            {submitting ? dict.quickAdd.adding : dict.quickAdd.submit}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickAddExpense;
