import React from 'react';

import type { Lang } from '@/lib/i18n';
import type { Trip, GeneratedItinerary } from '@/types';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

// Icons as components
const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const CurrencyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
    />
  </svg>
);

const MapIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

interface TripOverviewPanelProps {
  trip: Trip;
  itineraries: GeneratedItinerary[];
  lang: Lang;
}

export const TripOverviewPanel: React.FC<TripOverviewPanelProps> = ({ trip, itineraries, lang }) => {
  // Calculate trip duration
  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);
  const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate days until trip
  const today = new Date();
  const daysUntilTrip = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Determine trip status
  const getStatus = () => {
    if (daysUntilTrip < 0) return { text: lang === 'pl' ? 'Zakończona' : 'Completed', variant: 'default' as const };
    if (daysUntilTrip === 0) return { text: lang === 'pl' ? 'Dzisiaj!' : 'Today!', variant: 'success' as const };
    if (daysUntilTrip <= 7) return { text: lang === 'pl' ? 'Nadchodząca' : 'Upcoming', variant: 'warning' as const };
    return { text: lang === 'pl' ? 'Planowana' : 'Planned', variant: 'info' as const };
  };

  const status = getStatus();

  // Calculate planning progress (based on having itinerary)
  const planningProgress = itineraries.length > 0 ? 100 : 20;

  // Format dates for display
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 border border-slate-200 dark:border-slate-700">
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{trip.title}</h1>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <MapIcon />
                <span className="text-lg">{trip.destination}</span>
              </div>
            </div>
            <Badge variant={status.variant} className="text-xs font-medium shadow-sm">
              {status.text}
            </Badge>
          </div>

          {daysUntilTrip > 0 && (
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {lang === 'pl' ? `${daysUntilTrip} dni do wyjazdu` : `${daysUntilTrip} days until departure`}
            </div>
          )}
        </div>

        {/* Decorative background pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-5 text-slate-400">
          <svg viewBox="0 0 100 100" fill="currentColor">
            <circle cx="50" cy="50" r="40" />
          </svg>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <CalendarIcon />
              </div>
              <div>
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                  {lang === 'pl' ? 'Początek' : 'Start Date'}
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {formatDate(trip.start_date)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20 border-green-100 dark:border-green-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <CalendarIcon />
              </div>
              <div>
                <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
                  {lang === 'pl' ? 'Koniec' : 'End Date'}
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDate(trip.end_date)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <ClockIcon />
              </div>
              <div>
                <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                  {lang === 'pl' ? 'Długość' : 'Duration'}
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {durationDays} {lang === 'pl' ? 'dni' : 'days'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                <CurrencyIcon />
              </div>
              <div>
                <p className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                  {lang === 'pl' ? 'Budżet' : 'Budget'}
                </p>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {trip.budget ? `${trip.budget}` : lang === 'pl' ? 'Nie ustalono' : 'Not set'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Planning Progress */}
      <Card className="bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-slate-900 dark:text-slate-100">
              {lang === 'pl' ? 'Postęp planowania' : 'Planning Progress'}
            </CardTitle>
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{planningProgress}%</span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress
            value={planningProgress}
            className="mb-3"
            variant={planningProgress === 100 ? 'success' : 'default'}
          />
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{lang === 'pl' ? 'Podstawowe informacje' : 'Basic information'}</span>
            <span>
              {itineraries.length > 0
                ? lang === 'pl'
                  ? 'Plan podróży gotowy'
                  : 'Itinerary ready'
                : lang === 'pl'
                  ? 'Brak planu podróży'
                  : 'No itinerary yet'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
