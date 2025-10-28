import React, { Suspense, lazy } from 'react';

import type { Lang } from '@/lib/i18n';
import type { Trip, GeneratedItinerary, Itinerary, ItineraryPreferences } from '@/types';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// Lazy load the tab components
const OverviewTab = lazy(() => import('./tabs/OverviewTab'));
const ItineraryTab = lazy(() => import('./tabs/ItineraryTab'));
const BudgetTab = lazy(() => import('./tabs/BudgetTab'));
const PackingTab = lazy(() => import('./tabs/PackingTab'));
const EventsTab = lazy(() => import('./tabs/EventsTab'));
const SettingsTab = lazy(() => import('./tabs/SettingsTab'));

interface TripDetailsModalProps {
  trip: Trip & { itineraries: GeneratedItinerary[] };
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  lang: Lang;
  dict: any; // Consider creating a more specific type for the dictionary
  activeTab: string;
  onTabChange: (tab: string) => void;
  onItineraryGenerate: (preferences: ItineraryPreferences) => void;
  onItinerarySave: (itineraryId: string, plan: Itinerary) => void;
  isGenerating: boolean;
  itineraryError: string | null;
  onAddEvent: (event: Event) => void;
}

export function TripDetailsModal({
  trip,
  isOpen,
  onOpenChange,
  lang,
  dict,
  activeTab,
  onTabChange,
  onItineraryGenerate,
  onItinerarySave,
  isGenerating,
  itineraryError,
  onAddEvent,
}: TripDetailsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-full max-h-[90vh] overflow-y-auto bg-slate-50/95 dark:bg-slate-900/95">
        <DialogTitle className="sr-only">
          {dict.tabs?.overview}: {trip.title}
        </DialogTitle>
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-6 border-b bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{trip.title}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">{trip.destination}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {trip?.lodging && (
                <span
                  className="text-xs text-slate-500 dark:text-slate-400 max-w-[240px] truncate"
                  title={trip.lodging || undefined}
                >
                  {dict?.dashboard?.tripDetails?.lodgingLabel || (lang === 'pl' ? 'Nocleg:' : 'Lodging:')}{' '}
                  {trip.lodging}
                </span>
              )}
              <button
                onClick={() => onOpenChange(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div>
            <Tabs value={activeTab} onValueChange={onTabChange} className="flex flex-col">
              <TabsList className="mx-6 mt-4 w-fit bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200 dark:border-slate-700">
                <TabsTrigger value="overview">{dict.tabs?.overview}</TabsTrigger>
                <TabsTrigger value="itinerary">{dict.tabs?.itinerary}</TabsTrigger>
                <TabsTrigger value="budget">{dict.tabs?.budget}</TabsTrigger>
                <TabsTrigger value="packing">{dict.tabs?.packing}</TabsTrigger>
                <TabsTrigger value="events">{dict.tabs?.events}</TabsTrigger>
                <TabsTrigger value="settings">{dict.tabs?.settings}</TabsTrigger>
              </TabsList>

              <div>
                <Suspense fallback={<div>Loading...</div>}>
                  <TabsContent value="overview" className="p-6 space-y-6 m-0">
                    {activeTab === 'overview' && <OverviewTab trip={trip} lang={lang} />}
                  </TabsContent>
                  <TabsContent
                    value="itinerary"
                    className="p-0 m-0 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900 dark:to-slate-800"
                  >
                    {activeTab === 'itinerary' && (
                      <ItineraryTab
                        trip={trip}
                        lang={lang}
                        onGenerate={onItineraryGenerate}
                        onSave={onItinerarySave}
                        isGenerating={isGenerating}
                        error={itineraryError}
                      />
                    )}
                  </TabsContent>
                  <TabsContent
                    value="budget"
                    className="p-6 m-0 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900 dark:to-slate-800 min-h-full"
                  >
                    {activeTab === 'budget' && <BudgetTab trip={trip} lang={lang} />}
                  </TabsContent>
                  <TabsContent value="packing" className="p-0 m-0 min-h-full">
                    {activeTab === 'packing' && <PackingTab trip={trip} lang={lang} />}
                  </TabsContent>
                  <TabsContent
                    value="events"
                    className="p-6 m-0 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900 dark:to-slate-800 min-h-full"
                  >
                    {activeTab === 'events' && <EventsTab trip={trip} lang={lang} onAddEvent={onAddEvent} />}
                  </TabsContent>
                  <TabsContent
                    value="settings"
                    className="p-6 m-0 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900 dark:to-slate-800 min-h-full"
                  >
                    {activeTab === 'settings' && <SettingsTab dict={dict} />}
                  </TabsContent>
                </Suspense>
              </div>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
