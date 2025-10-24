import React, { useEffect, useState, useCallback } from 'react';

import type { Lang } from '@/lib/i18n';
import type { Trip, GeneratedItinerary, Itinerary, ItineraryPreferences } from '@/types';

import { useAuth } from '@/components/hooks/useAuth';
import { DictionaryProvider } from '@/components/hooks/useDictionary';
import { getDictionary } from '@/lib/i18n';

import { CreateTripModal } from './dashboard/CreateTripModal';
import { TripDetailsModal } from './dashboard/TripDetailsModal';
import { TripList } from './dashboard/TripList';
import { EnhancedTripOverview } from './EnhancedTripOverview';
import SmartTripTemplates from './SmartTripTemplates';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from './ui/dialog';

export function TripDashboard({ lang = 'pl' }: { lang?: Lang }) {
  const { user, session, loading: authLoading } = useAuth();
  const dashboardDict = getDictionary(lang).dashboard;
  if (!dashboardDict) {
    throw new Error('Dashboard dictionary not found');
  }
  const dict = dashboardDict;

  const [trips, setTrips] = useState<(Trip & { itineraries: GeneratedItinerary[] })[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<(Trip & { itineraries: GeneratedItinerary[] }) | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [deletingTrip, setDeletingTrip] = useState<Trip | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [itineraryError, setItineraryError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showEnhancedOverview, setShowEnhancedOverview] = useState(false);

  const loadTrips = useCallback(
    async (showLoadingSpinner = true) => {
      if (showLoadingSpinner) {
        setLoading(true);
      }
      try {
        const res = await fetch('/api/trips', {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
        });
        if (!res.ok) throw new Error('Failed to fetch trips');
        const data = await res.json();
        setTrips(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    },
    [session]
  );

  useEffect(() => {
    if (!authLoading && user) {
      loadTrips();
    }
  }, [authLoading, user, loadTrips]);

  const handleOpenTrip = (trip: Trip & { itineraries: GeneratedItinerary[] }, tab?: string) => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setSelectedTrip(trip);
    setActiveTab(tab || 'overview');
  };

  const handleTabChange = useCallback(
    (newTab: string) => {
      if (activeTab === 'itinerary' && newTab !== 'itinerary' && pollingInterval && !isGenerating) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      setActiveTab(newTab);
    },
    [activeTab, pollingInterval, isGenerating]
  );

  async function handleGenerateItinerary(preferences: ItineraryPreferences) {
    if (!selectedTrip) return;
    setIsGenerating(true);
    setItineraryError(null);
    try {
      const res = await fetch(`/api/trips/${selectedTrip.id}/itinerary`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify(preferences),
      });

      if (res.status === 202) {
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }

        const poll = setInterval(async () => {
          if (activeTab !== 'itinerary' || !selectedTrip) {
            clearInterval(poll);
            setPollingInterval(null);
            return;
          }

          try {
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
                  setItineraryError('Failed to generate itinerary. Check server logs for details.');
                }
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
        try {
          body = await res.json();
        } catch {}
        const messageParts = [body.error || 'Failed to start itinerary generation'];
        if (body.details)
          messageParts.push('-', typeof body.details === 'string' ? body.details : JSON.stringify(body.details));
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
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ generated_plan_json: plan }),
      });
      if (!res.ok) throw new Error('Failed to save itinerary');
      await loadTrips(false);
    } catch (e: any) {
      setItineraryError(e.message);
    }
  }

  function handleAddEvent(event: Event) {
    if (!selectedTrip || !selectedTrip.itineraries[0]?.generated_plan_json) return;

    const currentItinerary = selectedTrip.itineraries[0].generated_plan_json;
    const eventDate = new Date(event.start).toISOString().split('T')[0];

    const dayIndex = currentItinerary.days.findIndex((d) => d.date === eventDate);

    if (dayIndex === -1) {
      // TODO: Handle case where event date is not in the itinerary
      console.warn('Event date not found in itinerary');
      return;
    }

    const newActivity = {
      type: 'event',
      time: new Date(event.start).toTimeString().slice(0, 5),
      description: event.title,
      details: event.description,
    };

    const updatedItinerary = {
      ...currentItinerary,
      days: currentItinerary.days.map((day, index) => {
        if (index === dayIndex) {
          return {
            ...day,
            activities: [...day.activities, newActivity],
          };
        }
        return day;
      }),
    };

    handleSaveItinerary(selectedTrip.itineraries[0].id, updatedItinerary);
  }

  async function confirmDelete() {
    if (!deletingTrip) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/trips/${deletingTrip.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Delete failed');
      }
      if (selectedTrip && selectedTrip.id === deletingTrip.id) {
        setSelectedTrip(null);
      }
      setDeletingTrip(null);
      await loadTrips(false);
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    } finally {
      setDeleteLoading(false);
    }
  }

  if (authLoading && !user) {
    return <p className="text-sm text-muted-foreground">{dict.checking}</p>;
  }
  if (!user) {
    return (
      <div className="text-sm text-center space-y-4">
        <p className="text-muted-foreground">{dict.authGate?.mustBeSignedIn || 'You must be signed in'}</p>
        <Button asChild>
          <a href={`/login?lang=${lang}`}>{dict.authGate?.goToLogin || 'Go to login'}</a>
        </Button>
      </div>
    );
  }

  return (
    <DictionaryProvider initialLang={lang}>
      <div className="space-y-8">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-100">{dict.heading}</h1>
            <p className="text-sm text-slate-400 mt-1">{dict.sub}</p>
            {trips && trips.length > 0 && (
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500/60"></div>
                  {trips.filter((t) => t.itineraries?.length > 0).length} {lang === 'pl' ? 'z planami' : 'with plans'}
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500/60"></div>
                  {
                    trips.filter((t) => {
                      const now = Date.now();
                      const start = new Date(t.start_date).getTime();
                      const end = new Date(t.end_date).getTime();
                      return start <= now && now <= end;
                    }).length
                  }{' '}
                  {lang === 'pl' ? 'aktywne' : 'active'}
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-indigo-500/60"></div>
                  {trips.length} {lang === 'pl' ? 'łącznie' : 'total'}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => loadTrips(true)}
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all duration-200"
              disabled={loading && trips !== null}
            >
              {loading && trips !== null ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                  {dict.loading}
                </div>
              ) : (
                dict.refresh
              )}
            </Button>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/30"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {dict.create.add}
              </span>
            </Button>
          </div>

          {/* View Navigation */}
          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => {
                setShowTemplates(false);
                setShowEnhancedOverview(false);
                setSelectedTrip(null); // Reset selected trip when going back to list
              }}
              variant={!showTemplates && !showEnhancedOverview ? 'default' : 'outline'}
              size="sm"
            >
              {dict.heading}
            </Button>
            <Button
              onClick={() => {
                setShowTemplates(true);
                setShowEnhancedOverview(false);
              }}
              variant={showTemplates ? 'default' : 'outline'}
              size="sm"
            >
              {lang === 'pl' ? 'Szablony' : 'Templates'}
            </Button>
            <Button
              onClick={() => {
                setShowEnhancedOverview(true);
                setShowTemplates(false);
              }}
              variant={showEnhancedOverview ? 'default' : 'outline'}
              size="sm"
            >
              {dict.tabs?.overview || 'Overview'}
            </Button>
          </div>
        </header>

        <CreateTripModal
          isOpen={isCreateModalOpen}
          onOpenChange={setCreateModalOpen}
          lang={lang}
          session={session}
          onTripCreated={() => loadTrips(false)}
        />

        {selectedTrip && (
          <TripDetailsModal
            trip={selectedTrip}
            isOpen={!!selectedTrip}
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                if (pollingInterval) {
                  clearInterval(pollingInterval);
                  setPollingInterval(null);
                }
                setSelectedTrip(null);
                setActiveTab('overview');
                setIsGenerating(false);
              }
            }}
            lang={lang}
            dict={dict}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onItineraryGenerate={handleGenerateItinerary}
            onItinerarySave={handleSaveItinerary}
            isGenerating={isGenerating}
            itineraryError={itineraryError}
            onAddEvent={handleAddEvent}
          />
        )}

        {/* Conditional Views */}
        {showTemplates && (
          <div className="mb-6">
            <SmartTripTemplates
              lang={lang}
              onCreateFromTemplate={async (template, customization) => {
                try {
                  // Create trip using the same logic as CreateTripModal
                  const tripData = {
                    title: customization.title,
                    destination: customization.destination,
                    start_date: customization.startDate || new Date().toISOString().split('T')[0],
                    end_date: customization.startDate
                      ? new Date(
                          new Date(customization.startDate).getTime() +
                            (customization.duration - 1) * 24 * 60 * 60 * 1000
                        )
                          .toISOString()
                          .split('T')[0]
                      : new Date(Date.now() + customization.duration * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    budget: customization.budget,
                    currency: customization.currency, // Use selected currency instead of hardcoded USD
                    notes: customization.notes,
                  };

                  const res = await fetch('/api/trips', {
                    method: 'POST',
                    headers: {
                      'content-type': 'application/json',
                      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
                    },
                    body: JSON.stringify(tripData),
                  });

                  if (res.ok) {
                    loadTrips(false);
                    setShowTemplates(false);
                  }
                } catch (error) {
                  console.error('Failed to create trip from template:', error);
                }
              }}
            />
          </div>
        )}

        {showEnhancedOverview && trips && trips.length > 0 && (
          <div className="mb-6 space-y-4">
            {trips.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                <span className="text-sm text-slate-400 self-center">
                  {lang === 'pl' ? 'Wybierz podróż:' : 'Select trip:'}
                </span>
                {trips.slice(0, 3).map((trip) => (
                  <Button
                    key={trip.id}
                    onClick={() => setSelectedTrip(trip)}
                    variant={selectedTrip?.id === trip.id ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs"
                  >
                    {trip.title}
                  </Button>
                ))}
              </div>
            )}
            <EnhancedTripOverview
              trip={selectedTrip || trips[0]}
              lang={lang}
              onNavigateToTab={(tab) => {
                setSelectedTrip(selectedTrip || trips[0]);
                setActiveTab(tab || 'overview');
              }}
            />
          </div>
        )}

        {!showTemplates && !showEnhancedOverview && (
          <TripList
            trips={trips}
            loading={loading}
            onOpenTrip={handleOpenTrip}
            onDeleteTrip={setDeletingTrip}
            lang={lang}
            onAddTrip={() => setCreateModalOpen(true)}
          />
        )}

        <Dialog
          open={!!deletingTrip}
          onOpenChange={(o) => {
            if (!o) setDeletingTrip(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dict.delete?.heading}</DialogTitle>
              <DialogDescription>{dict.delete?.body}</DialogDescription>
            </DialogHeader>
            <div className="text-sm space-y-2">
              {deletingTrip && (
                <p className="font-medium">
                  {deletingTrip.title} — {deletingTrip.destination}
                </p>
              )}
              <p className="text-xs text-muted-foreground">{dict.delete?.cascadingNote}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeletingTrip(null)} disabled={deleteLoading}>
                {dict.delete?.cancel}
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-500 text-white"
              >
                {deleteLoading ? dict.status?.deleting || dict.delete?.confirm : dict.delete?.confirm}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DictionaryProvider>
  );
}

export default TripDashboard;
