
import React, { useEffect, useState, useCallback } from 'react';

import type { Lang } from '@/lib/i18n';
import type { Trip, GeneratedItinerary, Itinerary, ItineraryPreferences } from '@/types';

import { useAuth } from '@/components/hooks/useAuth';
import { DictionaryProvider } from '@/components/hooks/useDictionary';
import { getDictionary } from '@/lib/i18n';
import { Button } from './ui/button';
import { CreateTripModal } from './dashboard/CreateTripModal';
import { TripList } from './dashboard/TripList';
import { TripDetailsModal } from './dashboard/TripDetailsModal';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from './ui/dialog';


export function TripDashboard({ lang = 'pl' }: { lang?: Lang }) {
  const { user, session, loading: authLoading } = useAuth();
  const dict = getDictionary(lang).dashboard!;
  const [trips, setTrips] = useState<(Trip & { itineraries: GeneratedItinerary[] })[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<(Trip & { itineraries: GeneratedItinerary[] }) | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [deletingTrip, setDeletingTrip] = useState<Trip | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [itineraryError, setItineraryError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);


  const loadTrips = useCallback(async (showLoadingSpinner = true) => {
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
  }, [session]);

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

  const handleTabChange = useCallback((newTab: string) => {
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
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-100">{dict.heading}</h1>
            <p className="text-sm text-slate-400 mt-1">{dict.sub}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => loadTrips(true)}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              disabled={loading && trips !== null}
            >
              {loading && trips !== null ? dict.loading : dict.refresh}
            </Button>
            <Button onClick={() => setCreateModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white">
              {dict.create.add}
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

        <TripList
            trips={trips}
            loading={loading}
            onOpenTrip={handleOpenTrip}
            onDeleteTrip={setDeletingTrip}
            lang={lang}
            onAddTrip={() => setCreateModalOpen(true)}
        />

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
