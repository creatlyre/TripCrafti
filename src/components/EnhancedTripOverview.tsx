import {
  Calendar,
  MapPin,
  Wallet,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Plane,
  Hotel,
  Camera,
  Users,
  ArrowRight,
  Target,
} from 'lucide-react';
import React from 'react';

import type { Lang } from '@/lib/i18n';
import type { Trip, GeneratedItinerary } from '@/types';

import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';

interface EnhancedTripOverviewProps {
  trip: Trip & { itineraries: GeneratedItinerary[] };
  lang: Lang;
  onNavigateToTab?: (tab: string) => void;
}

const StatusBadge: React.FC<{
  status: 'completed' | 'active' | 'upcoming' | 'planned';
  text: string;
}> = ({ status, text }) => {
  const variants = {
    completed: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    active: 'bg-green-500/20 text-green-300 border-green-500/30',
    upcoming: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    planned: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  };

  return (
    <Badge variant="outline" className={`${variants[status]} font-medium`}>
      {text}
    </Badge>
  );
};

const ProgressCard: React.FC<{
  title: string;
  progress: number;
  icon: React.ReactNode;
  status: string;
  recommendations?: string[];
  lang: Lang;
  onAction?: () => void;
  actionLabel?: string;
}> = ({ title, progress, icon, status, recommendations, lang, onAction, actionLabel }) => (
  <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-medium text-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          {title}
        </div>
        {progress === 100 && <CheckCircle className="w-4 h-4 text-green-400" />}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">{status}</span>
          <span className="text-slate-300 font-medium">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      {recommendations && recommendations.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400 font-medium">{lang === 'pl' ? 'Rekomendacje:' : 'Recommendations:'}</p>
          <ul className="space-y-1">
            {recommendations.map((rec, index) => (
              <li key={index} className="text-xs text-slate-500 flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0"></div>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
      {onAction && actionLabel && (
        <Button
          size="sm"
          variant="outline"
          onClick={onAction}
          className="w-full mt-3 text-xs border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/10"
        >
          {actionLabel}
          <ArrowRight className="w-3 h-3 ml-2" />
        </Button>
      )}
    </CardContent>
  </Card>
);

const SmartRecommendation: React.FC<{
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}> = ({ type, title, description, action }) => {
  const typeStyles = {
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    info: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    success: 'border-green-500/30 bg-green-500/10 text-green-300',
  };

  const typeIcons = {
    warning: <AlertTriangle className="w-4 h-4" />,
    info: <Target className="w-4 h-4" />,
    success: <CheckCircle className="w-4 h-4" />,
  };

  return (
    <Card className={`border ${typeStyles[type]}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {typeIcons[type]}
          <div className="flex-1">
            <h4 className="text-sm font-medium mb-1">{title}</h4>
            <p className="text-xs text-slate-400">{description}</p>
            {action && (
              <Button
                size="sm"
                variant="ghost"
                onClick={action.onClick}
                className="mt-2 h-auto p-0 text-xs hover:bg-transparent hover:text-white"
              >
                {action.label} →
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const EnhancedTripOverview: React.FC<EnhancedTripOverviewProps> = ({ trip, lang, onNavigateToTab }) => {
  // Calculate trip metrics
  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);
  const today = new Date();
  const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysUntilTrip = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Trip status logic
  const getTripStatus = () => {
    if (daysUntilTrip < 0) return { status: 'completed' as const, text: lang === 'pl' ? 'Zakończona' : 'Completed' };
    if (daysUntilTrip === 0) return { status: 'active' as const, text: lang === 'pl' ? 'Dzisiaj!' : 'Today!' };
    if (daysUntilTrip <= 7) return { status: 'upcoming' as const, text: lang === 'pl' ? 'Nadchodząca' : 'Upcoming' };
    return { status: 'planned' as const, text: lang === 'pl' ? 'Planowana' : 'Planned' };
  };

  const status = getTripStatus();

  // Planning progress calculations
  const hasItinerary = trip.itineraries && trip.itineraries.length > 0;
  const hasBudget = trip.budget && trip.budget > 0;

  const planningProgress = [
    hasItinerary ? 40 : 0, // Itinerary
    hasBudget ? 30 : 0, // Budget
    20, // Basic info (always complete if trip exists)
    10, // Additional details
  ].reduce((a, b) => a + b, 0);

  const budgetProgress = hasBudget ? 80 : 0; // Simplified for demo
  const packingProgress = 0; // To be calculated based on packing lists

  // Smart recommendations
  const getRecommendations = () => {
    const recommendations = [];

    if (!hasItinerary && daysUntilTrip <= 30) {
      recommendations.push({
        type: 'warning' as const,
        title: lang === 'pl' ? 'Brak planu podróży' : 'No itinerary yet',
        description:
          lang === 'pl'
            ? 'Utwórz plan podróży, aby lepiej zorganizować swoją wycieczkę.'
            : 'Create an itinerary to better organize your trip.',
        action: {
          label: lang === 'pl' ? 'Utwórz plan' : 'Create plan',
          onClick: () => onNavigateToTab?.('itinerary'),
        },
      });
    }

    if (!hasBudget) {
      recommendations.push({
        type: 'info' as const,
        title: lang === 'pl' ? 'Ustaw budżet' : 'Set a budget',
        description:
          lang === 'pl'
            ? 'Określ budżet, aby lepiej kontrolować wydatki podczas podróży.'
            : 'Set a budget to better control expenses during your trip.',
        action: {
          label: lang === 'pl' ? 'Zarządzaj budżetem' : 'Manage budget',
          onClick: () => onNavigateToTab?.('budget'),
        },
      });
    }

    if (daysUntilTrip <= 14 && daysUntilTrip > 0) {
      recommendations.push({
        type: 'info' as const,
        title: lang === 'pl' ? 'Czas na pakowanie' : 'Time to pack',
        description:
          lang === 'pl'
            ? 'Zostało mniej niż 2 tygodnie. Wygeneruj listę rzeczy do spakowania.'
            : 'Less than 2 weeks left. Generate a packing list.',
        action: {
          label: lang === 'pl' ? 'Lista pakowania' : 'Packing list',
          onClick: () => onNavigateToTab?.('packing'),
        },
      });
    }

    if (hasItinerary && hasBudget && daysUntilTrip > 7) {
      recommendations.push({
        type: 'success' as const,
        title: lang === 'pl' ? 'Świetnie przygotowana podróż!' : 'Well-prepared trip!',
        description:
          lang === 'pl'
            ? 'Masz plan i budżet. Możesz teraz dodać szczegóły lub sprawdzić lokalne wydarzenia.'
            : 'You have a plan and budget. You can now add details or check local events.',
        action: {
          label: lang === 'pl' ? 'Zobacz wydarzenia' : 'View events',
          onClick: () => onNavigateToTab?.('events'),
        },
      });
    }

    return recommendations;
  };

  const recommendations = getRecommendations();

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-100">{trip.title}</h1>
                <StatusBadge status={status.status} text={status.text} />
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {trip.destination}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {durationDays} {lang === 'pl' ? 'dni' : 'days'}
                </div>
                {trip.budget && (
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    {trip.budget.toLocaleString()} {trip.currency}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-100">{daysUntilTrip > 0 ? daysUntilTrip : 0}</div>
              <div className="text-xs text-slate-400">
                {daysUntilTrip > 0
                  ? lang === 'pl'
                    ? 'dni do wyjazdu'
                    : 'days to go'
                  : lang === 'pl'
                    ? 'dni temu'
                    : 'days ago'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ProgressCard
          title={lang === 'pl' ? 'Planowanie' : 'Planning'}
          progress={planningProgress}
          icon={<Target className="w-4 h-4 text-indigo-400" />}
          status={
            planningProgress === 100
              ? lang === 'pl'
                ? 'Kompletne'
                : 'Complete'
              : lang === 'pl'
                ? 'W toku'
                : 'In progress'
          }
          recommendations={
            planningProgress < 100
              ? [lang === 'pl' ? 'Dodaj plan podróży' : 'Add itinerary', lang === 'pl' ? 'Ustaw budżet' : 'Set budget']
              : undefined
          }
          lang={lang}
          onAction={planningProgress < 100 ? () => onNavigateToTab?.('itinerary') : undefined}
          actionLabel={
            planningProgress < 100 ? (lang === 'pl' ? 'Kontynuuj planowanie' : 'Continue planning') : undefined
          }
        />

        <ProgressCard
          title={lang === 'pl' ? 'Budżet' : 'Budget'}
          progress={budgetProgress}
          icon={<Wallet className="w-4 h-4 text-green-400" />}
          status={
            budgetProgress > 0 ? (lang === 'pl' ? 'Ustawiony' : 'Set up') : lang === 'pl' ? 'Nie ustawiony' : 'Not set'
          }
          recommendations={
            budgetProgress === 0 ? [lang === 'pl' ? 'Określ budżet podróży' : 'Set trip budget'] : undefined
          }
          lang={lang}
          onAction={budgetProgress === 0 ? () => onNavigateToTab?.('budget') : undefined}
          actionLabel={budgetProgress === 0 ? (lang === 'pl' ? 'Ustaw budżet' : 'Set budget') : undefined}
        />

        <ProgressCard
          title={lang === 'pl' ? 'Pakowanie' : 'Packing'}
          progress={packingProgress}
          icon={<Camera className="w-4 h-4 text-purple-400" />}
          status={
            packingProgress > 0
              ? lang === 'pl'
                ? 'W toku'
                : 'In progress'
              : lang === 'pl'
                ? 'Nie rozpoczęte'
                : 'Not started'
          }
          recommendations={
            packingProgress === 0 && daysUntilTrip <= 14
              ? [lang === 'pl' ? 'Wygeneruj listę pakowania' : 'Generate packing list']
              : undefined
          }
          lang={lang}
          onAction={packingProgress === 0 ? () => onNavigateToTab?.('packing') : undefined}
          actionLabel={packingProgress === 0 ? (lang === 'pl' ? 'Rozpocznij pakowanie' : 'Start packing') : undefined}
        />
      </div>

      {/* Smart Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-200">
            {lang === 'pl' ? 'Inteligentne rekomendacje' : 'Smart recommendations'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec, index) => (
              <SmartRecommendation key={index} {...rec} />
            ))}
          </div>
        </div>
      )}

      {/* Trip Timeline */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {lang === 'pl' ? 'Harmonogram' : 'Timeline'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50">
              <Calendar className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-sm font-medium text-slate-200">
                  {lang === 'pl' ? 'Początek podróży' : 'Trip start'}
                </p>
                <p className="text-xs text-slate-400">{trip.start_date}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/50">
              <Plane className="w-4 h-4 text-green-400" />
              <div>
                <p className="text-sm font-medium text-slate-200">{lang === 'pl' ? 'Koniec podróży' : 'Trip end'}</p>
                <p className="text-xs text-slate-400">{trip.end_date}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedTripOverview;
