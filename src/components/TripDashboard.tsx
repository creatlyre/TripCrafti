/**
 * Authenticated user panel with improved UI/UX.
 * - Trip creation form is in a modal dialog.
 * - A new, actionable empty state guides new users.
 */
import React, { useEffect, useState, useCallback } from "react";
import type { Trip, TripInput, GeneratedItinerary, Itinerary, ItineraryPreferences } from "@/types";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import type { Lang } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";
import { useAuth } from "@/components/hooks/useAuth";
import { ItineraryPreferencesFormEnhanced as ItineraryPreferencesForm } from "./itinerary/ItineraryPreferencesFormEnhanced";
import { ItineraryViewEnhanced as ItineraryView } from "./itinerary/ItineraryViewEnhanced";
import { TripOverviewPanel } from "./TripOverviewPanel";
import BudgetSummaryWidget from './budget/BudgetSummary';
import QuickAddExpense from './budget/QuickAddExpense';
import { TripImage } from "./TripImage";
import { EmptyState } from "./EmptyState";
import { TripCard } from "./TripCard";
import { TripCardSkeleton } from "./TripCardSkeleton";
import PackingAssistant from "./PackingAssistant";

interface CreateFormState extends TripInput {}

const empty: CreateFormState = {
  title: "",
  destination: "",
  start_date: "",
  end_date: "",
  budget: undefined,
  currency: "",
};

interface TripDashboardProps {
  lang?: Lang;
}

export function TripDashboard({ lang = "pl" }: TripDashboardProps) {
  const { user, session, loading: authLoading } = useAuth();
  const rootDict = getDictionary(lang);
  const dict = rootDict.dashboard!;
  const [trips, setTrips] = useState<(Trip & { itineraries: GeneratedItinerary[] })[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateFormState>(empty);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<(Trip & { itineraries: GeneratedItinerary[] }) | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [deletingTrip, setDeletingTrip] = useState<Trip | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function handleOpenTrip(trip: (Trip & { itineraries: GeneratedItinerary[] }), tab?: string) {
    // Clean up any existing polling when switching trips
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setSelectedTrip(trip);
    if (tab) {
      setActiveTab(tab);
    } else {
      setActiveTab("overview");
    }
  }
  const [isGenerating, setIsGenerating] = useState(false);
  const [itineraryError, setItineraryError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

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

  async function handleDeleteTrip(trip: Trip) {
    setDeletingTrip(trip);
  }

  async function confirmDelete() {
    if (!deletingTrip) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/trips/${deletingTrip.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(()=>({}));
        throw new Error(body.error || 'Delete failed');
      }
      // If the currently opened trip is deleted, close dialog
      if (selectedTrip && selectedTrip.id === deletingTrip.id) {
        setSelectedTrip(null);
      }
      setDeletingTrip(null);
      await loadTrips(false);
    } catch (e:any) {
      console.error(e);
      // reuse generic error state area
      setError(e.message);
    } finally {
      setDeleteLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading && user) {
      loadTrips();
    }
  }, [authLoading, user]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Function to handle tab changes with polling cleanup
  const handleTabChange = useCallback((newTab: string) => {
    // If switching away from itinerary tab, clean up polling unless we're generating
    if (activeTab === 'itinerary' && newTab !== 'itinerary' && pollingInterval && !isGenerating) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setActiveTab(newTab);
  }, [activeTab, pollingInterval, isGenerating]);

  async function handleGenerateItinerary(preferences: ItineraryPreferences) {
    if (!selectedTrip) return;
    setIsGenerating(true);
    setItineraryError(null);
    try {
      console.log("DEBUG");
      const res = await fetch(`/api/trips/${selectedTrip.id}/itinerary`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(preferences),
      });

      if (res.status === 202) {
        // Clean up any existing polling first
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
        
        // Poll for completion, but only check the specific trip's itinerary status
        const poll = setInterval(async () => {
          // Only poll if we're still on the itinerary tab and the dialog is open
          if (activeTab !== 'itinerary' || !selectedTrip) {
            clearInterval(poll);
            setPollingInterval(null);
            return;
          }
          
          try {
            // Only fetch the specific trip's itineraries, not all trips
            const checkRes = await fetch(`/api/trips/${selectedTrip.id}`, {
              headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
            });
            if (checkRes.ok) {
              const updatedTripData = await checkRes.json();
              const latestItinerary = updatedTripData.itineraries?.[0];
              
              if (latestItinerary?.status === 'COMPLETED' || latestItinerary?.status === 'FAILED') {
                setIsGenerating(false);
                clearInterval(poll);
                setPollingInterval(null);
                if (latestItinerary.status === 'FAILED') {
                  setItineraryError("Failed to generate itinerary. Check server logs for details.");
                }
                // Update only the selected trip and refresh the trips list once at the end
                setSelectedTrip(updatedTripData);
                await loadTrips(false);
              }
            }
          } catch (pollError) {
            console.error('Error polling itinerary status:', pollError);
          }
        }, 5000);
        
        setPollingInterval(poll);
      } else {
        let body: any = {};
        try { body = await res.json(); } catch {}
        const messageParts = [body.error || 'Failed to start itinerary generation'];
        if (body.details) messageParts.push('-', typeof body.details === 'string' ? body.details : JSON.stringify(body.details));
        throw new Error(messageParts.join(' '));
      }
    } catch (e: any) {
      setItineraryError(e.message);
      setIsGenerating(false);
    }
  }

  async function handleSaveItinerary(itineraryId: string, plan: Itinerary) {
    try {
      const res = await fetch(`/api/itineraries/${itineraryId}`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ generated_plan_json: plan }),
      });
      if (!res.ok) throw new Error("Failed to save itinerary");
      await loadTrips(false);
    } catch (e: any) {
      setItineraryError(e.message);
    }
  }

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
        {/* Provide defensive fallbacks if mocked i18n dictionary omits authGate (tests do this) */}
        <p className="text-muted-foreground">{dict.authGate?.mustBeSignedIn || 'You must be signed in'}</p>
        <Button asChild>
          <a href={`/login?lang=${lang}`}>{dict.authGate?.goToLogin || 'Go to login'}</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">{dict.heading}</h1>
          <p className="text-sm text-slate-400 mt-1">{dict.sub}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => loadTrips(true)} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" disabled={loading && trips !== null}>
            {loading && trips !== null ? dict.loading : dict.refresh}
          </Button>
          <Button onClick={() => setCreateModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white">
            {dict.create.add}
          </Button>
        </div>
      </header>

      <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent
          className="max-h-[90vh] overflow-y-auto"
        >
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
                placeholder={dict.form?.placeholders.titleExample}
              />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label htmlFor="lodging" className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                {dict.form?.lodging.label}
                <span title={dict.form?.lodging.tooltip} className="text-muted-foreground cursor-help">ⓘ</span>
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
                onChange={(e) => onChange("destination", e.target.value)}
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
                  value={form.budget ?? ""}
                  onChange={(e) => onChange("budget", e.target.value)}
                  className="h-9 rounded-md border bg-transparent px-3 text-sm"
                  placeholder="1200"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="currency" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {dict.form?.currency.label}
                </label>
                <Select
                  value={form.currency ?? ""}
                  onValueChange={(value) => onChange("currency", value)}
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
                placeholder={dict.form?.placeholders.durationExample}
              />
            </div>
          </form>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
              {dict.create.cancel}
            </Button>
            <Button type="submit" onClick={submitCreate} disabled={creating}>
              {creating ? (dict.status?.creating || dict.create.submit) : dict.create.submit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedTrip} onOpenChange={(isOpen) => {
        if (!isOpen) {
          // Clean up polling when closing dialog
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
          setSelectedTrip(null);
          setActiveTab("overview");
          setIsGenerating(false);
        }
      }}>
        <DialogContent
          className="max-w-7xl w-full max-h-[90vh] overflow-y-auto bg-slate-50/95 dark:bg-slate-900/95"
        >
          {selectedTrip && (
            <>
              {/* Accessible dialog title (visually hidden to satisfy Radix accessibility requirement) */}
              <DialogTitle className="sr-only">
                {/* Trip details static label not yet in i18n, reusing overview tab */}
                {dict.tabs?.overview}: {selectedTrip.title}
              </DialogTitle>
              <div className="flex flex-col">
                {/* Header with close button (sticky remains for scrollable parent) */}
                <div className="flex items-center justify-between p-6 border-b bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm sticky top-0 z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{selectedTrip.title}</h2>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{selectedTrip.destination}</p>
                    </div>
                  </div>
                    <div className="flex items-center gap-3">
                      {selectedTrip?.lodging && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 max-w-[240px] truncate" title={selectedTrip.lodging || undefined}>
                          {lang==='pl' ? 'Nocleg:' : 'Lodging:'} {selectedTrip.lodging}
                        </span>
                      )}
                      <button
                        onClick={() => setSelectedTrip(null)}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                </div>

                {/* Main content area */}
                <div>
                  <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col">
                    <TabsList className="mx-6 mt-4 w-fit bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700">
                      <TabsTrigger value="overview">{dict.tabs?.overview}</TabsTrigger>
                      <TabsTrigger value="itinerary">{dict.tabs?.itinerary}</TabsTrigger>
                      <TabsTrigger value="budget">{dict.tabs?.budget}</TabsTrigger>
                      <TabsTrigger value="packing">{dict.tabs?.packing}</TabsTrigger>
                      <TabsTrigger value="settings">{dict.tabs?.settings}</TabsTrigger>
                    </TabsList>

                    <div>
                      <TabsContent value="overview" className="p-6 space-y-6 m-0">
                        <TripOverviewPanel 
                          trip={selectedTrip} 
                          itineraries={selectedTrip.itineraries || []} 
                          lang={lang} 
                        />
                      </TabsContent>

                      <TabsContent value="itinerary" className="p-0 m-0 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900 dark:to-slate-800">
                        <div className="p-6 space-y-4 pb-8">
                          {itineraryError && (
                            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-medium">{dict.itinerary?.errorLabel}</span>
                              </div>
                              <p className="mt-1 text-sm">{itineraryError}</p>
                            </div>
                          )}

                          {selectedTrip.itineraries && selectedTrip.itineraries.length > 0 && selectedTrip.itineraries[0].generated_plan_json ? (
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {dict.itinerary?.generated}
                              </div>
                              <ItineraryView
                                itineraryId={selectedTrip.itineraries[0].id}
                                initialPlan={selectedTrip.itineraries[0].generated_plan_json}
                                onSave={handleSaveItinerary}
                                tripId={selectedTrip.id}
                                tripCurrency={selectedTrip.currency}
                                lang={lang}
                              />
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="text-center py-8 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                  <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">
                                  {rootDict.itineraryPreferences?.noItineraryTitle}
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md mx-auto">
                                  {rootDict.itineraryPreferences?.noItineraryBody}
                                </p>
                              </div>
                              <div>
                                <ItineraryPreferencesForm
                                  tripId={selectedTrip.id}
                                  onSubmit={handleGenerateItinerary}
                                  isGenerating={isGenerating}
                                  language={lang}
                                  tripBudget={selectedTrip.budget}
                                  tripLodging={selectedTrip.lodging}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="budget" className="p-6 m-0 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900 dark:to-slate-800 min-h-full">
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{dict.tabs?.budget}</h3>
                            {selectedTrip && selectedTrip.budget && (
                              <span className="text-[11px] px-2 py-1 rounded bg-slate-800/60 text-slate-300 border border-slate-700">
                                {selectedTrip.currency}
                              </span>
                            )}
                          </div>
                          {selectedTrip && (
                            <div className="relative">
                              {/* Summary widget */}
                              <div className="mb-6">
                                <BudgetSummaryWidget tripId={selectedTrip.id} lang={lang} />
                              </div>
                              {/* Quick add expense inline button */}
                              <div className="flex items-center gap-3">
                                <QuickAddExpense tripId={selectedTrip.id} lang={lang} buttonVariant="inline" />
                                <a
                                  href={`/app/budget/${selectedTrip.id}`}
                                  className="text-[11px] px-3 py-2 rounded-md border border-slate-700 text-slate-300 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-colors"
                                >
                                  {lang === 'pl' ? 'Pełny widok' : 'Full view'}
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="packing" className="p-0 m-0 min-h-full">
                        <PackingAssistant 
                          tripId={selectedTrip.id} 
                          trip={selectedTrip} 
                          lang={lang}
                          actionSlot={(
                            <a
                              href={`/app/packing/${selectedTrip.id}?lang=${lang}`}
                              className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-md border border-indigo-500/50 bg-indigo-600/10 text-indigo-300 hover:bg-indigo-600/20 hover:text-white transition-colors"
                            >
                              {lang==='pl' ? 'Pełny widok pakowania' : 'Full packing view'}
                            </a>
                          )}
                          enableBulkDelete
                        />
                      </TabsContent>

                      <TabsContent value="settings" className="p-6 m-0 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900 dark:to-slate-800 min-h-full">
                        <div className="space-y-6">
                          <div className="text-center py-12 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                              <svg className="w-8 h-8 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-100">{dict.placeholders?.settings.title}</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md mx-auto">{dict.placeholders?.settings.body}</p>
                          </div>
                        </div>
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <section aria-labelledby="trips-list-heading">
        <h2 id="trips-list-heading" className="sr-only">
          Existing trips
        </h2>

        {loading && trips === null && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <TripCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && trips && trips.length === 0 && (
          <EmptyState
            onActionClick={() => setCreateModalOpen(true)}
            dict={{
              heading: dict.empty.heading,
              description: dict.empty.description,
              action: dict.create.add,
            }}
          />
        )}

        {trips && trips.length > 0 && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {trips.map((t) => (
              <TripCard
                key={t.id}
                trip={t}
                onOpen={(tab) => handleOpenTrip(t, tab)}
                onDelete={(trip)=> handleDeleteTrip(trip)}
                dict={{
                  dates: dict.dates,
                  budget: dict.budget,
                  open: dict.open,
                  openPlan: dict.openPlan,
                  deleteAction: dict.delete?.confirm,
                  budgetLink: rootDict.tripCard?.budgetLink,
                  budgetAria: rootDict.tripCard?.budgetAria,
                }}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deletingTrip} onOpenChange={(o)=>{ if(!o) setDeletingTrip(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dict.delete?.heading}</DialogTitle>
            <DialogDescription>
              {dict.delete?.body}
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm space-y-2">
            {deletingTrip && (
              <p className="font-medium">{deletingTrip.title} — {deletingTrip.destination}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {dict.delete?.cascadingNote}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={()=>setDeletingTrip(null)} disabled={deleteLoading}>
              {dict.delete?.cancel}
            </Button>
            <Button onClick={confirmDelete} disabled={deleteLoading} className="bg-red-600 hover:bg-red-500 text-white">
              {deleteLoading ? (dict.status?.deleting || dict.delete?.confirm) : (dict.delete?.confirm)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default TripDashboard;
