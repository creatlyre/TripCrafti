import React from 'react';
import type { Dictionary } from '@/lib/i18n';
import type { Itinerary, Trip } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Ticket } from 'lucide-react';

interface PublicItineraryViewProps {
  trip: Trip;
  itinerary: Itinerary;
  dictionary: Dictionary;
}

const PublicItineraryView: React.FC<PublicItineraryViewProps> = ({ trip, itinerary, dictionary }) => {
  const { itineraryView } = dictionary;
  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString(dictionary.langSwitcher.label === 'Język' ? 'pl-PL' : 'en-US', {
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 font-sans text-gray-800 dark:text-gray-200">
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
          {trip.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-lg text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            <span>{trip.destination}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <span>
              {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
            </span>
          </div>
        </div>
      </header>

      <div className="space-y-10">
        {itinerary.itinerary.map((day, dayIndex) => (
          <div key={day.day} className="relative pl-8 sm:pl-12">
            {/* Timeline line */}
            <div className="absolute left-4 sm:left-6 top-1 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

            {/* Day Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="absolute left-0 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gray-800 text-white flex items-center justify-center font-bold z-10 border-4 border-white dark:border-gray-900 text-sm sm:text-base">
                {day.day}
              </div>
              <div className="bg-gray-100 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">{day.date}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{day.theme}</p>
              </div>
            </div>

            {/* Activities */}
            <div className="space-y-4">
              {day.activities.map((activity, activityIndex) => (
                <Card key={activityIndex} className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className="flex-shrink-0 w-16 text-center">
                      <div className="text-xl font-bold text-gray-800 dark:text-gray-200">{activity.time}</div>
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">{activity.activity_name}</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{activity.description}</p>
                    </div>
                    {activity.estimated_cost > 0 && (
                      <div className="flex-shrink-0 ml-4">
                        <Badge variant="secondary" className="gap-1.5">
                          <Ticket className="w-3.5 h-3.5" />
                          {activity.estimated_cost} {activity.currency}
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
      <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          {dictionary.footer.copyright.replace('TripCrafti', 'TripCrafti Itinerary')}
        </p>
      </footer>
    </div>
  );
};

export default PublicItineraryView;