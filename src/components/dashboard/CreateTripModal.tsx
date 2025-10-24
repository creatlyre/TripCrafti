
import React, { useState, useEffect } from 'react';
import type { Lang } from '@/lib/i18n';
import { getDictionary } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TripInput } from '@/types';


interface CreateFormState extends TripInput {}

const empty: CreateFormState = {
  title: '',
  destination: '',
  start_date: '',
  end_date: '',
  budget: undefined,
  currency: '',
};

interface CreateTripModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  lang: Lang;
  session: any;
  onTripCreated: () => void;
}

export function CreateTripModal({ isOpen, onOpenChange, lang, session, onTripCreated }: CreateTripModalProps) {
  const dict = getDictionary(lang).dashboard!;
  const [form, setForm] = useState<CreateFormState>(empty);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | undefined>(undefined);

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const payload: TripInput = {
        title: form.title.trim(),
        destination: form.destination.trim(),
        start_date: form.start_date,
        end_date: form.end_date,
        budget: form.budget ? Number(form.budget) : undefined,
        currency: form.budget ? form.currency : undefined,
        lodging: (form as any).lodging?.trim() || undefined,
      };
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to create trip');
      }
      setForm(empty);
      onOpenChange(false);
      onTripCreated();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  function onChange<K extends keyof CreateFormState>(k: K, v: any) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  useEffect(() => {
    if (!isOpen) {
      setForm(empty);
      setError(null);
      setDuration(undefined);
    }
  }, [isOpen]);

  useEffect(() => {
    if (form.start_date && duration) {
      const startDate = new Date(form.start_date);
      startDate.setDate(startDate.getDate() + duration);
      const newEndDate = startDate.toISOString().split('T')[0];
      onChange('end_date', newEndDate);
    }
  }, [form.start_date, duration]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dict.create.heading}</DialogTitle>
          <DialogDescription>{dict.create.description}</DialogDescription>
        </DialogHeader>

        {error && (
          <div
            className="my-4 rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2 border border-destructive/30"
            role="alert"
          >
            {error}
          </div>
        )}

        <form onSubmit={submitCreate} className="grid gap-4 py-4 md:grid-cols-2" noValidate>
            <div className="flex flex-col gap-1.5 md:col-span-2">
                <label htmlFor="title" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {dict.create.title}
                </label>
                <input
                id="title"
                required
                value={form.title}
                onChange={(e) => onChange('title', e.target.value)}
                className="h-9 rounded-md border bg-transparent px-3 text-sm"
                placeholder={dict.form?.placeholders.titleExample}
                />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
                <label
                htmlFor="lodging"
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1"
                >
                {dict.form?.lodging.label}
                <span title={dict.form?.lodging.tooltip} className="text-muted-foreground cursor-help">
                    ⓘ
                </span>
                </label>
                <input
                id="lodging"
                value={(form as any).lodging || ''}
                onChange={(e) => onChange('lodging' as any, e.target.value)}
                className="h-9 rounded-md border bg-transparent px-3 text-sm"
                placeholder={dict.form?.placeholders.lodgingPlaceholder}
                />
            </div>
            <div className="flex flex-col gap-1.5">
                <label
                htmlFor="destination"
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                >
                {dict.create.destination}
                </label>
                <input
                id="destination"
                required
                value={form.destination}
                onChange={(e) => onChange('destination', e.target.value)}
                className="h-9 rounded-md border bg-transparent px-3 text-sm"
                placeholder={dict.form?.placeholders.destinationExample}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                <label htmlFor="budget" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {dict.create.budget}
                </label>
                <input
                    id="budget"
                    type="number"
                    min={0}
                    value={form.budget ?? ''}
                    onChange={(e) => onChange('budget', e.target.value)}
                    className="h-9 rounded-md border bg-transparent px-3 text-sm"
                    placeholder="1200"
                />
                </div>
                <div className="flex flex-col gap-1.5">
                <label
                    htmlFor="currency"
                    className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                >
                    {dict.form?.currency.label}
                </label>
                <Select
                    value={form.currency ?? ''}
                    onValueChange={(value) => onChange('currency', value)}
                    disabled={!form.budget}
                >
                    <SelectTrigger className="h-9 rounded-md border bg-transparent px-3 text-sm uppercase">
                    <SelectValue placeholder={dict.form?.currency.selectPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="PLN">PLN</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                </Select>
                </div>
            </div>
            <div className="flex flex-col gap-1.5">
                <label
                htmlFor="start_date"
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                >
                {dict.create.start}
                </label>
                <input
                id="start_date"
                type="date"
                required
                value={form.start_date}
                onChange={(e) => onChange('start_date', e.target.value)}
                className="h-9 rounded-md border bg-transparent px-3 text-sm"
                />
            </div>
            <div className="flex flex-col gap-1.5">
                <label htmlFor="end_date" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {dict.create.end}
                </label>
                <input
                id="end_date"
                type="date"
                required
                value={form.end_date}
                onChange={(e) => onChange('end_date', e.target.value)}
                className="h-9 rounded-md border bg-transparent px-3 text-sm"
                />
            </div>
            <div className="md:col-span-2 flex items-center justify-center gap-2">
                <div className="flex-1 border-t border-muted-foreground/20"></div>
                <span className="text-xs text-muted-foreground">{dict.create.or}</span>
                <div className="flex-1 border-t border-muted-foreground/20"></div>
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
                <label htmlFor="duration" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {dict.create.duration}
                </label>
                <input
                id="duration"
                type="number"
                min={1}
                value={duration ?? ''}
                onChange={(e) => setDuration(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                className="h-9 rounded-md border bg-transparent px-3 text-sm"
                placeholder={dict.form?.placeholders.durationExample}
                />
            </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {dict.create.cancel}
          </Button>
          <Button type="submit" onClick={submitCreate} disabled={creating}>
            {creating ? dict.status?.creating || dict.create.submit : dict.create.submit}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
