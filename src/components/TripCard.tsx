import type { Trip, GeneratedItinerary } from "@/types";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "./ui/card";
import { TripImage } from "./TripImage";

interface TripCardProps {
  trip: Trip & { itineraries: GeneratedItinerary[] };
  onOpen: (tab?: string) => void;
  dict: {
    dates: string;
    budget: string;
    open: string;
    openPlan: string;
  };
}

export const TripCard: React.FC<TripCardProps> = ({ trip, onOpen, dict }) => {
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
          </CardContent>
        </div>
        <CardFooter className="flex justify-end p-4 mt-auto">
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
