/**
 * TripDashboard
 * Authenticated user panel showing:
 *  - Trip creation form (minimal fields; extend later with activities, bookings, expenses)
 *  - List of existing trips with quick metadata
 *  - Accessible semantics (headings, sr-only labels, ARIA where useful)
 *  - Optimistic refresh button & clear empty state
 */
import React, { useEffect, useState } from 'react';
import type { Trip, TripInput } from '@/types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import type { Lang } from '@/lib/i18n';
import { getDictionary } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/hooks/useAuth';

interface CreateFormState extends TripInput {}

const empty: CreateFormState = {
  title: '',
  destination: '',
  start_date: '',
  end_date: '',
  budget: undefined
};

interface TripDashboardProps { lang?: Lang }

export function TripDashboard({ lang = 'pl' }: TripDashboardProps) {
  const { user, session, loading: authLoading, refresh } = useAuth();
  const dict = getDictionary(lang).dashboard!;
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateFormState>(empty);
  const [error, setError] = useState<string | null>(null);
  const [forceShell, setForceShell] = useState(false);
  useEffect(() => {
    if (!authLoading && user) return;
    const id = setTimeout(() => setForceShell(true), 1500);
    return () => clearTimeout(id);
  }, [authLoading, user]);

  async function loadTrips() {
    // If we already have trips, treat as background refresh (don't flip full-page loading state)
    setLoading(trips === null);
    try {
      const res = await fetch('/api/trips', {
        headers: session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : undefined
      });
      if (!res.ok) throw new Error('Failed to fetch trips');
      const data = await res.json();
      setTrips(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Load trips once user session resolved and exists.
  useEffect(() => {
    if (!authLoading && user && trips === null) {
      loadTrips();
    }
  }, [authLoading, user, trips]);

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
        budget: form.budget ? Number(form.budget) : undefined
      };
  const res = await fetch('/api/trips', { method: 'POST', headers: { 'content-type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to create trip');
      }
      setForm(empty);
      await loadTrips();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  function onChange<K extends keyof CreateFormState>(k: K, v: any) {
    setForm(f => ({ ...f, [k]: v }));
  }

  if (authLoading && !user && !forceShell) {
    return <p className="text-sm text-muted-foreground">{dict.checking}</p>;
  }
  if (!user) {
    return (
      <div className="text-sm text-center space-y-4">
        <p className="text-muted-foreground">{lang === 'pl' ? 'Musisz być zalogowany aby zobaczyć swoje podróże.' : 'You must be signed in to view your trips.'}</p>
        <Button asChild>
          <a href={`/login?lang=${lang}`}>{lang === 'pl' ? 'Przejdź do logowania' : 'Go to login'}</a>
        </Button>
      </div>
    );
  }

  const debug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug');

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{dict.heading}</h1>
          <p className="text-sm text-muted-foreground">{dict.sub}</p>
        </div>
        <Button onClick={loadTrips} variant="secondary" disabled={loading}>
          {loading ? dict.loading : dict.refresh}
        </Button>
      </header>

      {debug && (
        <Card className="border-yellow-500/40 bg-yellow-500/5 text-xs">
          <CardHeader>
            <CardTitle className="text-sm">Auth Debug</CardTitle>
            <CardDescription>Dev-only panel (remove ?debug to hide)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 font-mono break-all">
            <p><strong>User ID:</strong> {user?.id || 'null'}</p>
            <p><strong>Access token:</strong> {session?.access_token ? `${session.access_token.slice(0, 12)}…${session.access_token.slice(-6)}` : 'null'}</p>
            <p><strong>Trips loaded:</strong> {trips ? trips.length : '—'}</p>
            <div className="pt-2">
              <Button size="sm" variant="outline" onClick={() => { refresh(); loadTrips(); }}>Force Refresh</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <section aria-labelledby="create-trip-heading" className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle id="create-trip-heading" className="text-lg">{dict.create.heading}</CardTitle>
            <CardDescription>{dict.create.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {error && <div className="mb-4 rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2 border border-destructive/30" role="alert">{error}</div>}
            <form onSubmit={submitCreate} className="grid gap-4 md:grid-cols-2" aria-describedby="trip-form-hint">
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label htmlFor="title" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{dict.create.title}</label>
                <input id="title" required value={form.title} onChange={e => onChange('title', e.target.value)} className="h-9 rounded-md border bg-background/60 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring border-input" placeholder={lang === 'pl' ? 'Lato we Włoszech' : 'Summer in Italy'} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="destination" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{dict.create.destination}</label>
                <input id="destination" required value={form.destination} onChange={e => onChange('destination', e.target.value)} className="h-9 rounded-md border bg-background/60 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring border-input" placeholder={lang === 'pl' ? 'Toskania' : 'Tuscany'} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="budget" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{dict.create.budget}</label>
                <input id="budget" type="number" min={0} value={form.budget ?? ''} onChange={e => onChange('budget', e.target.value)} className="h-9 rounded-md border bg-background/60 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring border-input" placeholder="1200" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="start_date" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{dict.create.start}</label>
                <input id="start_date" type="date" required value={form.start_date} onChange={e => onChange('start_date', e.target.value)} className="h-9 rounded-md border bg-background/60 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring border-input" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="end_date" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{dict.create.end}</label>
                <input id="end_date" type="date" required value={form.end_date} onChange={e => onChange('end_date', e.target.value)} className="h-9 rounded-md border bg-background/60 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring border-input" />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={creating}>{creating ? (lang === 'pl' ? 'Tworzenie…' : 'Creating…') : dict.create.submit}</Button>
              </div>
            </form>
            <p id="trip-form-hint" className="sr-only">{dict.create.requiredHint}</p>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="trips-list-heading">
        <h2 id="trips-list-heading" className="sr-only">Existing trips</h2>
        {loading && trips === null && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-hidden>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-800/60 bg-slate-900/40 animate-pulse h-40" />
            ))}
          </div>
        )}
        {!loading && trips && trips.length === 0 && (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{dict.empty}</div>
        )}
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {trips?.map(t => (
            <li key={t.id}>
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-base font-medium flex items-center justify-between">
                    <span>{t.title}</span>
                  </CardTitle>
                  <CardDescription>{t.destination}</CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground space-y-1">
                  <p><strong className="font-medium text-foreground">{dict.dates}:</strong> {t.start_date} → {t.end_date}</p>
                  {t.budget != null && <p><strong className="font-medium text-foreground">{dict.budget}:</strong> {t.budget}</p>}
                </CardContent>
                <CardFooter className="mt-auto flex justify-end">
                  <Button size="sm" variant="outline">{dict.open}</Button>
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default TripDashboard;
