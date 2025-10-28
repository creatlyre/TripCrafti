import { MoreHorizontal, Copy, Archive, Share2, Calendar, MapPin } from 'lucide-react';

import type { Trip, GeneratedItinerary } from '@/types';

import { TripImage } from './TripImage';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';

interface TripCardProps {
  trip: Trip & { itineraries: GeneratedItinerary[] };
  onOpen: (tab?: string) => void;
  onDelete?: (trip: Trip) => void;
  onDuplicate?: (trip: Trip) => void;
  onArchive?: (trip: Trip) => void;
  onShare?: (trip: Trip) => void;
  dict: {
    dates: string;
    budget: string;
    open: string;
    openPlan: string;
    deleteAction?: string;
    budgetLink?: string;
    budgetAria?: string;
    quickActions?: {
      duplicate: string;
      archive: string;
      share: string;
      more: string;
    };
    status?: {
      active: string;
      upcoming: string;
      past: string;
      itineraryReady: string;
      tomorrow: string;
      today: string;
      daysToGo: string;
    };
  };
}

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  onOpen,
  onDelete,
  onDuplicate,
  onArchive,
  onShare,
  dict,
}) => {
  const hasItinerary = trip.itineraries && trip.itineraries.length > 0 && trip.itineraries[0].status === 'COMPLETED';

  // Calculate trip status
  const today = new Date();
  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);
  const isActive = startDate <= today && today <= endDate;
  const isUpcoming = startDate > today;
  const isPast = endDate < today;

  const getStatusBadge = () => {
    if (isActive)
      return {
        text: dict.status?.active || 'Active',
        color: 'bg-green-500/20 text-green-300 border-green-500/30',
      };
    if (isUpcoming)
      return {
        text: dict.status?.upcoming || 'Upcoming',
        color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      };
    if (isPast)
      return {
        text: dict.status?.past || 'Past',
        color: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
      };
    return null;
  };

  const statusBadge = getStatusBadge();
  const daysUntil = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <li className="group list-none">
      <Card className="h-full flex flex-col transition-all duration-300 ease-in-out bg-slate-900/50 border-slate-800 hover:border-indigo-500/70 hover:shadow-lg hover:shadow-indigo-500/10 cursor-pointer relative overflow-hidden">
        {/* Status indicator */}
        {statusBadge && (
          <div
            className={`absolute top-3 right-3 px-2 py-1 text-xs font-medium rounded-md border ${statusBadge.color} z-10`}
          >
            {statusBadge.text}
          </div>
        )}

        <div onClick={() => onOpen()} className="cursor-pointer flex-1">
          <TripImage destination={trip.destination} />
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold text-slate-200 line-clamp-1">{trip.title}</CardTitle>
                <CardDescription className="text-slate-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  <span className="line-clamp-1">{trip.destination}</span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-slate-400 space-y-3 flex-grow pb-3">
            <div className="flex items-center gap-2 text-xs">
              <Calendar className="w-3 h-3" />
              <span className="font-medium text-slate-300">{dict.dates}:</span>
              <span>
                {trip.start_date} → {trip.end_date}
              </span>
            </div>
            {isUpcoming && daysUntil <= 30 && (
              <div className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                {daysUntil === 1
                  ? dict.status?.tomorrow || 'Tomorrow!'
                  : daysUntil === 0
                    ? dict.status?.today || 'Today!'
                    : `${daysUntil} ${dict.status?.daysToGo || 'days to go'}`}
              </div>
            )}
            {trip.budget != null && (
              <p className="flex items-center gap-2">
                <strong className="font-medium text-slate-300">{dict.budget}:</strong>
                <span className="font-mono">
                  {trip.budget.toLocaleString()} {trip.currency}
                </span>
              </p>
            )}
            {hasItinerary && (
              <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                {dict.status?.itineraryReady || 'Travel plan ready'}
              </div>
            )}
          </CardContent>
        </div>

        <CardFooter className="flex items-center justify-between gap-2 p-4 mt-auto border-t border-slate-800/50">
          <div className="flex items-center gap-2">
            {dict.deleteAction && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete && onDelete(trip);
                }}
                className="text-xs text-red-400 hover:text-red-300 underline decoration-dotted transition-colors"
              >
                {dict.deleteAction}
              </button>
            )}
            <a
              href={`/app/budget/${trip.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs px-2 py-1 rounded border border-slate-700 text-slate-300 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-colors"
              aria-label={dict.budgetAria || 'Budget'}
            >
              {dict.budgetLink || dict.budget}
            </a>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Actions Dropdown */}
            {(onDuplicate || onArchive || onShare) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                    <span className="sr-only">{dict.quickActions?.more || 'More actions'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {onDuplicate && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate(trip);
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {dict.quickActions?.duplicate || 'Duplicate'}
                    </DropdownMenuItem>
                  )}
                  {onShare && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onShare(trip);
                      }}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      {dict.quickActions?.share || 'Share'}
                    </DropdownMenuItem>
                  )}
                  {onArchive && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onArchive(trip);
                        }}
                      >
                        <Archive className="w-4 h-4 mr-2" />
                        {dict.quickActions?.archive || 'Archive'}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {hasItinerary ? (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen('itinerary');
                }}
                className="bg-green-600 hover:bg-green-500 text-white group-hover:border-green-500 transition-colors"
              >
                {dict.openPlan}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen();
                }}
                className="border-slate-700 text-slate-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-colors"
              >
                {dict.open}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </li>
  );
};
