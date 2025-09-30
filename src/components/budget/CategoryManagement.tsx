import React, { useEffect, useState } from 'react';
import type { BudgetCategory } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Card, CardContent } from '../ui/card';
import { BUDGET_CATEGORY_TEMPLATES, isRatio } from '../../lib/budget.templates';

interface Props { tripId: string; onCategoryAdded?: (c: BudgetCategory)=>void }

const CategoryManagement: React.FC<Props> = ({ tripId, onCategoryAdded }) => {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', planned_amount: '', icon_name: '' });
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [applyingTemplateId, setApplyingTemplateId] = useState<string | null>(null);
  const [tripBudget, setTripBudget] = useState<number | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/budget/categories`);
      if (!res.ok) throw new Error('Failed to load categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [tripId]);
  // fetch trip to know overall budget (for ratio templates conversion)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/trips/${tripId}`); // assuming trip endpoint exists
        if (res.ok) {
          const data = await res.json();
          if (data?.trip?.budget) setTripBudget(Number(data.trip.budget));
        }
      } catch { /* ignore */ }
    })();
  }, [tripId]);

  async function addCategory() {
    if (!form.name || !form.planned_amount) return;
    setSubmitting(true); setError(null);
    try {
      const payload = { name: form.name, planned_amount: Number(form.planned_amount), icon_name: form.icon_name || undefined };
      const res = await fetch(`/api/trips/${tripId}/budget/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Failed to create category');
      await load();
      setForm({ name: '', planned_amount: '', icon_name: '' });
      setOpen(false);
      if (onCategoryAdded) {
        // naive: fetch last category (could optimize by returning from POST)
        const created = categories[categories.length -1];
        if (created) onCategoryAdded(created);
      }
    } catch (e: any) { setError(e.message); } finally { setSubmitting(false); }
  }

  async function applyTemplate(templateId: string) {
    const template = BUDGET_CATEGORY_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    if (categories.length > 0 && !confirm('This will add additional categories to your existing list. Continue?')) return;
    setApplyingTemplateId(templateId);
    setError(null);
    try {
      const payloadCategories = template.categories.map(c => {
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
        body: JSON.stringify({ categories: payloadCategories })
      });
      if (!res.ok) throw new Error('Failed to apply template');
      await load();
      setTemplatesOpen(false);
    } catch (e: any) { setError(e.message); } finally { setApplyingTemplateId(null); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Budget Categories</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">Add</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>New Category</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium">Name</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium">Planned Amount</label>
                <Input type="number" value={form.planned_amount} onChange={e => setForm(f => ({ ...f, planned_amount: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium">Icon Name (optional)</label>
                <Input value={form.icon_name} onChange={e => setForm(f => ({ ...f, icon_name: e.target.value }))} placeholder="e.g. food" />
              </div>
              {error && <div className="text-xs text-red-600">{error}</div>}
              <Button disabled={submitting || !form.name || !form.planned_amount} onClick={addCategory} className="w-full">
                {submitting ? 'Adding...' : 'Create Category'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={templatesOpen} onOpenChange={setTemplatesOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="secondary">Templates</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Select Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-xs">
              {BUDGET_CATEGORY_TEMPLATES.map(t => {
                const totalPlanned = t.categories.reduce((sum, c) => {
                  if (isRatio(c.suggested_portion) && tripBudget) return sum + tripBudget * (c.suggested_portion || 0);
                  if (typeof c.suggested_portion === 'number' && !isRatio(c.suggested_portion)) return sum + c.suggested_portion;
                  return sum;
                }, 0);
                return (
                  <div key={t.id} className="border rounded-md p-3 bg-slate-900/40 border-slate-700">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-slate-200">{t.label}</span>
                      <Button size="sm" disabled={applyingTemplateId === t.id} onClick={() => applyTemplate(t.id)}>
                        {applyingTemplateId === t.id ? 'Applying...' : 'Apply'}
                      </Button>
                    </div>
                    <p className="text-slate-400 mb-2 leading-snug">{t.description}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {t.categories.map(c => (
                        <div key={c.name} className="bg-slate-800/50 border border-slate-700 rounded px-2 py-1 flex flex-col">
                          <span className="truncate">{c.name}</span>
                          <span className="text-[10px] text-slate-400">{isRatio(c.suggested_portion) ? `${Math.round((c.suggested_portion || 0)*100)}%` : (c.suggested_portion ?? '-')}</span>
                        </div>
                      ))}
                    </div>
                    {tripBudget && <div className="mt-2 text-[10px] text-slate-500">Est. planned total: {totalPlanned.toFixed(2)} ({tripBudget > 0 ? ((totalPlanned / tripBudget) * 100).toFixed(0) : 0}% of trip budget)</div>}
                  </div>
                );
              })}
              {tripBudget === null && <div className="text-[10px] text-amber-500">Trip budget not loaded yet; ratio-based allocations will show as percentages only.</div>}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {loading && <div className="text-xs text-muted-foreground">Loading...</div>}
      {error && !open && <div className="text-xs text-red-600">{error}</div>}
      <div className="space-y-2 max-h-64 overflow-auto pr-1">
        {categories.map(c => (
          <Card key={c.id} className="border-slate-700 bg-slate-900/40">
            <CardContent className="p-2 flex items-center justify-between text-xs">
              <span className="truncate" title={c.name}>{c.name}</span>
              <span className="font-mono text-slate-300">{c.planned_amount.toFixed(2)}</span>
            </CardContent>
          </Card>
        ))}
        {!loading && categories.length === 0 && <div className="text-xs text-slate-500 border border-dashed border-slate-700 rounded p-4 text-center">
          No categories yet. Click <span className="font-medium">Add</span> to create your first.
        </div>}
      </div>
    </div>
  );
};

export default CategoryManagement;
