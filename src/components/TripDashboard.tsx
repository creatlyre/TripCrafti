/**
 * TripDashboard
 * Authenticated user panel with improved UI/UX.
 * - Trip creation form is in a modal dialog.
 * - A new, actionable empty state guides new users.
 */
import React, { useEffect, useState } from "react";
import type { Trip, TripInput } from "@/types";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "./ui/dialog";
import type { Lang } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";
import { useAuth } from "@/components/hooks/useAuth";

const SuitcaseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M8 6h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
    <path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <path d="M12 20v-8" />
  </svg>
);

interface CreateFormState extends TripInput {}

const empty: CreateFormState = {
  title: "",
  destination: "",
  start_date: "",
  end_date: "",
  budget: undefined,
};

interface TripDashboardProps {
  lang?: Lang;
}

export function TripDashboard({ lang = "pl" }: TripDashboardProps) {
  const { user, session, loading: authLoading } = useAuth();
  const dict = getDictionary(lang).dashboard!;
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateFormState>(empty);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [dateInputMode, setDateInputMode] = useState<"end_date" | "duration">("end_date");
  const [duration, setDuration] = useState<number | undefined>(undefined);

  async function loadTrips(showLoadingSpinner = true) {
    if (showLoadingSpinner) {
      setLoading(true);
    }
    try {
      const res = await fetch("/api/trips", {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });
      if (!res.ok) throw new Error("Failed to fetch trips");
      const data = await res.json();
      setTrips(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && user) {
      loadTrips();
    }
  }, [authLoading, user]);

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
      };
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create trip");
      }
      setForm(empty);
      setCreateModalOpen(false);
      await loadTrips(false); // Refresh list without full loading spinner
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
    if (!isCreateModalOpen) {
      setForm(empty);
      setError(null);
      setDuration(undefined);
    }
  }, [isCreateModalOpen]);

  useEffect(() => {
    if (form.start_date && duration) {
      const startDate = new Date(form.start_date);
      startDate.setDate(startDate.getDate() + duration);
      const newEndDate = startDate.toISOString().split("T")[0];
      onChange("end_date", newEndDate);
    }
  }, [form.start_date, duration]);

  if (authLoading && !user) {
    return <p className="text-sm text-muted-foreground">{dict.checking}</p>;
  }
  if (!user) {
    return (
      <div className="text-sm text-center space-y-4">
        <p className="text-muted-foreground">{lang === "pl" ? "Musisz być zalogowany" : "You must be signed in"}</p>
        <Button asChild>
          <a href={`/login?lang=${lang}`}>{lang === "pl" ? "Przejdź do logowania" : "Go to login"}</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{dict.heading}</h1>
          <p className="text-sm text-muted-foreground">{dict.sub}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => loadTrips(true)} variant="secondary" disabled={loading && trips !== null}>
            {loading && trips !== null ? dict.loading : dict.refresh}
          </Button>
          <Button onClick={() => setCreateModalOpen(true)}>{dict.create.add}</Button>
        </div>
      </header>

      <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
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
                onChange={(e) => onChange("title", e.target.value)}
                className="h-9 rounded-md border bg-transparent px-3 text-sm"
                placeholder={lang === "pl" ? "Lato we Włoszech" : "Summer in Italy"}
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
                onChange={(e) => onChange("destination", e.target.value)}
                className="h-9 rounded-md border bg-transparent px-3 text-sm"
                placeholder={lang === "pl" ? "Toskania" : "Tuscany"}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="budget" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {dict.create.budget}
              </label>
              <input
                id="budget"
                type="number"
                min={0}
                value={form.budget ?? ""}
                onChange={(e) => onChange("budget", e.target.value)}
                className="h-9 rounded-md border bg-transparent px-3 text-sm"
                placeholder="1200"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="start_date" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {dict.create.start}
              </label>
              <input
                id="start_date"
                type="date"
                required
                value={form.start_date}
                onChange={(e) => onChange("start_date", e.target.value)}
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
                onChange={(e) => onChange("end_date", e.target.value)}
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
                value={duration ?? ""}
                onChange={(e) => setDuration(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                className="h-9 rounded-md border bg-transparent px-3 text-sm"
                placeholder={lang === "pl" ? "np. 7" : "e.g. 7"}
              />
            </div>
          </form>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
              {dict.create.cancel}
            </Button>
            <Button type="submit" onClick={submitCreate} disabled={creating}>
              {creating ? (lang === "pl" ? "Tworzenie…" : "Creating…") : dict.create.submit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section aria-labelledby="trips-list-heading">
        <h2 id="trips-list-heading" className="sr-only">
          Existing trips
        </h2>

        {loading && trips === null && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-hidden>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card/50 animate-pulse h-48" />
            ))}
          </div>
        )}

        {!loading && trips && trips.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 py-20 text-center">
            <SuitcaseIcon className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">{dict.empty.heading}</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">{dict.empty.description}</p>
            <Button onClick={() => setCreateModalOpen(true)}>{dict.create.add}</Button>
          </div>
        )}

        {trips && trips.length > 0 && (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {trips.map((t) => (
              <li key={t.id} className="group">
                <Card className="h-full flex flex-col transition-all duration-200 group-hover:border-primary/60 group-hover:shadow-lg">
                  <div className="w-full h-32 bg-secondary/50 rounded-t-lg flex items-center justify-center text-muted-foreground text-sm">
                    [ Image for {t.destination} ]
                  </div>
                  <CardHeader>
                    <CardTitle className="text-base font-medium">{t.title}</CardTitle>
                    <CardDescription>{t.destination}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground space-y-1.5 flex-grow">
                    <p>
                      <strong className="font-medium text-foreground">{dict.dates}:</strong> {t.start_date} →{" "}
                      {t.end_date}
                    </p>
                    {t.budget != null && (
                      <p>
                        <strong className="font-medium text-foreground">{dict.budget}:</strong> {t.budget}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button size="sm" variant="outline">
                      {dict.open}
                    </Button>
                  </CardFooter>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
export default TripDashboard;
