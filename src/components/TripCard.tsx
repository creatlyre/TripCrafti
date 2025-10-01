import type { Trip, GeneratedItinerary } from "@/types";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { TripImage } from "./TripImage";

interface TripCardProps {
  trip: Trip & { itineraries: GeneratedItinerary[] };
  onOpen: (tab?: string) => void;
  onDelete?: (trip: Trip) => void;
  dict: {
    dates: string;
    budget: string;
    open: string;
    openPlan: string;
    deleteAction?: string;
    budgetLink?: string;
    budgetAria?: string;
  };
}

export const TripCard: React.FC<TripCardProps> = ({ trip, onOpen, onDelete, dict }) => {
  const hasItinerary = trip.itineraries && trip.itineraries.length > 0 && trip.itineraries[0].status === 'COMPLETED';

  return (
    <li className="group list-none">
      <Card
        className="h-full flex flex-col transition-all duration-300 ease-in-out bg-slate-900/50 border-slate-800 hover:border-indigo-500/70 hover:shadow-lg hover:shadow-indigo-500/10 cursor-pointer"
      >
        <div onClick={() => onOpen()} className="cursor-pointer">
          <TripImage destination={trip.destination} />
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-200">{trip.title}</CardTitle>
            <CardDescription className="text-slate-400">{trip.destination}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-400 space-y-2 flex-grow">
            <p>
              <strong className="font-medium text-slate-300">{dict.dates}:</strong> {trip.start_date} → {trip.end_date}
            </p>
            {trip.budget != null && (
              <p>
                <strong className="font-medium text-slate-300">{dict.budget}:</strong> {trip.budget.toLocaleString()} {trip.currency}
              </p>
            )}
            <p>
              <a href={`/app/${trip.id}`} onClick={e=>e.stopPropagation()} className="text-[11px] uppercase tracking-wide text-indigo-400 hover:text-indigo-300 font-medium">
                {dict.open} {"→"}
              </a>
            </p>
          </CardContent>
        </div>
        <CardFooter className="flex items-center justify-between gap-2 p-4 mt-auto">
          {dict.deleteAction && (
            <button
              type="button"
              onClick={() => onDelete && onDelete(trip)}
              className="text-xs text-red-400 hover:text-red-300 underline decoration-dotted"
            >
              {dict.deleteAction}
            </button>
          )}
          <a
            href={`/app/budget/${trip.id}`}
            onClick={e => e.stopPropagation()}
            className="text-xs px-2 py-1 rounded border border-slate-700 text-slate-300 hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-colors"
            aria-label={dict.budgetAria || 'Budget'}
          >{dict.budgetLink || dict.budget}</a>
          {hasItinerary ? (
            <Button
              size="sm"
              onClick={() => onOpen('itinerary')}
              className="bg-green-600 hover:bg-green-500 text-white group-hover:border-green-500 transition-colors"
            >
              {dict.openPlan}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpen()}
              className="border-slate-700 text-slate-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-colors"
            >
              {dict.open}
            </Button>
          )}
        </CardFooter>
      </Card>
    </li>
  );
};
