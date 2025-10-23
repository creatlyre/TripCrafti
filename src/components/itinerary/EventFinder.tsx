import { ChevronDown, Filter, X, Search, Tag, Layers, Info, ExternalLink, MapPin, Calendar, Users } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import type { Event } from '@/lib/services/eventService';
import type { EventDetails } from '@/lib/services/eventService';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getDictionary, type Lang } from '@/lib/i18n';
import { logDebug, logError } from '@/lib/log';

interface Classification {
  id: string;
  name: string;
  type: 'segment' | 'genre' | 'subGenre' | 'type' | 'subType';
  category: string;
}

interface ClassificationData {
  segments: Classification[];
  genres: Classification[];
  subGenres: Classification[];
  types: Classification[];
  subTypes: Classification[];
  all: Classification[];
  grouped: Record<string, Classification[]>;
}

interface EventFinderProps {
  trip: {
    destination: string;
    start_date: string;
    end_date: string;
  };
  onAddEvent: (event: Event) => void;
  lang?: Lang;
}

export function EventFinder({ trip, onAddEvent, lang = 'pl' }: EventFinderProps) {
  const dict = getDictionary(lang).events?.finder;

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classificationData, setClassificationData] = useState<ClassificationData>({
    segments: [],
    genres: [],
    subGenres: [],
    types: [],
    subTypes: [],
    all: [],
    grouped: {},
  });
  const [selectedClassifications, setSelectedClassifications] = useState<string[]>([]);
  const [classificationsLoading, setClassificationsLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Main Categories');

  // New state for event details
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<Event | null>(null);
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [eventDetailsLoading, setEventDetailsLoading] = useState(false);
  const [eventDetailsError, setEventDetailsError] = useState<string | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchClassifications() {
      logDebug('EventFinder: Fetching event classifications...');
      setClassificationsLoading(true);
      try {
        const response = await fetch(`/api/events/classifications?locale=${lang}`);
        if (!response.ok) {
          throw new Error('Failed to fetch classifications');
        }
        const data = await response.json();
        logDebug('EventFinder: Fetched classifications', data);
        setClassificationData(data);
      } catch (error) {
        logError('EventFinder: Error fetching classifications', error);
      } finally {
        setClassificationsLoading(false);
      }
    }
    fetchClassifications();
  }, [lang]);

  async function findEvents() {
    logDebug('EventFinder: Starting event search...');
    setLoading(true);
    setError(null);
    try {
      const geocodeRes = await fetch(`/api/geocode?destination=${encodeURIComponent(trip.destination)}`);
      if (!geocodeRes.ok) {
        const body = await geocodeRes.json().catch(() => ({}));
        throw new Error(body.error || dict?.failedGeocodeDestination || 'Failed to geocode destination');
      }
      const location = await geocodeRes.json();
      logDebug('EventFinder: Location', location);

      let eventsUrl = `/api/events?lat=${location.lat}&long=${location.long}&startDate=${trip.start_date}&endDate=${trip.end_date}`;

      if (selectedClassifications.length > 0) {
        eventsUrl += `&classificationName=${selectedClassifications.join(',')}`;
      }

      logDebug('EventFinder: Fetching events from', eventsUrl);

      const eventsRes = await fetch(eventsUrl);
      if (!eventsRes.ok) {
        const body = await eventsRes.json().catch(() => ({}));
        throw new Error(body.error || dict?.failedFetchEvents || 'Failed to fetch events');
      }
      const data = await eventsRes.json();
      logDebug('EventFinder: Events data received', data);
      setEvents(data);
    } catch (e: unknown) {
      logError('EventFinder: Error in findEvents', e);
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError(dict?.unknownError || 'An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleClassificationChange(classificationName: string, checked: boolean) {
    logDebug('EventFinder: Classification change', { classificationName, checked });
    setSelectedClassifications((prev) => {
      if (checked) {
        return [...prev, classificationName];
      } else {
        return prev.filter((name) => name !== classificationName);
      }
    });
  }

  // Function to fetch event details
  async function fetchEventDetails(event: Event) {
    logDebug('EventFinder: Fetching event details for', event.id);
    setSelectedEventForDetails(event);
    setEventDetailsLoading(true);
    setEventDetailsError(null);
    setEventDetails(null);
    setIsDetailsDialogOpen(true);

    try {
      const response = await fetch(`/api/events/${event.id}/details?locale=${lang}`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || dict?.failedFetchEventDetails || 'Failed to fetch event details');
      }
      const details = await response.json();
      logDebug('EventFinder: Event details received', details);
      setEventDetails(details);
    } catch (e: unknown) {
      logError('EventFinder: Error fetching event details', e);
      if (e instanceof Error) {
        setEventDetailsError(e.message);
      } else {
        setEventDetailsError(dict?.failedLoadEventDetails || 'Failed to load event details');
      }
    } finally {
      setEventDetailsLoading(false);
    }
  }

  // Helper function to get the best image for web app display
  const getBestEventImage = (
    images?: { ratio?: string; url: string; width: number; height: number; fallback?: boolean }[]
  ) => {
    if (!images || images.length === 0) return null;

    // Priority order for web app display
    const priorityRatios = ['16:9', '4:3', '3:2'];

    for (const ratio of priorityRatios) {
      const image = images.find((img) => img.ratio === ratio && !img.fallback);
      if (image) return image;
    }

    // If no priority ratio found, try any non-fallback image
    const nonFallback = images.find((img) => !img.fallback);
    if (nonFallback) return nonFallback;

    // Fallback to first image
    return images[0];
  };

  // Helper function to translate category names
  const translateCategoryName = (categoryName: string): string => {
    if (!dict?.mainCategories) return categoryName;

    switch (categoryName) {
      case 'Main Categories':
        return dict.mainCategories.mainCategories;
      case 'Genres':
        return dict.mainCategories.genres;
      case 'Event Types':
        return dict.mainCategories.eventTypes;
      case 'Sub-Genres':
        return dict.mainCategories.subGenres;
      case 'Sub-Types':
        return dict.mainCategories.subTypes;
      default:
        return categoryName;
    }
  };

  // Get filtered classifications based on search and selected category
  const getFilteredClassifications = () => {
    let classifications =
      selectedCategory === 'all' ? classificationData.all : classificationData.grouped[selectedCategory] || [];

    if (searchFilter) {
      classifications = classifications.filter((c) => c.name.toLowerCase().includes(searchFilter.toLowerCase()));
    }

    return classifications;
  };

  const clearAllFilters = () => {
    setSelectedClassifications([]);
    setSearchFilter('');
    setSelectedCategory('Main Categories');
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Main Categories':
        return <Layers className="w-4 h-4" />;
      case 'Genres':
        return <Tag className="w-4 h-4" />;
      case 'Sub-Genres':
        return <Filter className="w-3 h-3" />;
      case 'Event Types':
        return <Tag className="w-4 h-4" />;
      case 'Sub-Types':
        return <Filter className="w-3 h-3" />;
      default:
        return <Filter className="w-4 h-4" />;
    }
  };

  // Get category display data with better organization
  const getCategoryDisplayData = () => {
    const categoryOrder = ['Main Categories', 'Genres', 'Event Types', 'Sub-Genres', 'Sub-Types'];
    const priorityCategories = ['Main Categories', 'Genres', 'Event Types'];

    return categoryOrder.map((category) => {
      // Get translated name for known categories
      let translatedName = category;
      if (dict?.mainCategories) {
        switch (category) {
          case 'Main Categories':
            translatedName = dict.mainCategories.mainCategories;
            break;
          case 'Genres':
            translatedName = dict.mainCategories.genres;
            break;
          case 'Event Types':
            translatedName = dict.mainCategories.eventTypes;
            break;
          case 'Sub-Genres':
            translatedName = dict.mainCategories.subGenres;
            break;
          case 'Sub-Types':
            translatedName = dict.mainCategories.subTypes;
            break;
        }
      }

      return {
        key: category,
        name: translatedName,
        count: classificationData.grouped[category]?.length || 0,
        isPriority: priorityCategories.includes(category),
        items: classificationData.grouped[category] || [],
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{dict?.title || 'Event Categories'}</h3>
          <p className="text-sm text-slate-400">
            {dict?.subtitle || 'Choose categories to find events that match your interests'}
          </p>
        </div>
        {selectedClassifications.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearAllFilters} className="gap-2">
            <X className="w-4 h-4" />
            {dict?.clearAll || 'Clear all'}
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      {selectedClassifications.length > 0 && (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white">
              {selectedClassifications.length}{' '}
              {selectedClassifications.length === 1 ? dict?.filter || 'filter' : dict?.filters || 'filters'}{' '}
              {dict?.filtersActive || 'active'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedClassifications.map((name) => (
              <Badge
                key={name}
                variant="info"
                className="cursor-pointer hover:opacity-80 gap-1"
                onClick={() => handleClassificationChange(name, false)}
              >
                {name}
                <X className="w-3 h-3" />
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {classificationsLoading ? (
        <div className="bg-slate-800/30 rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">{dict?.loadingCategories || 'Loading categories...'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={dict?.searchCategories || 'Search categories...'}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Primary Category Tabs */}
          <div className="bg-slate-800/50 rounded-lg p-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {getCategoryDisplayData()
                .filter((cat) => cat.isPriority)
                .map((category) => (
                  <button
                    key={category.key}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedCategory(category.key);
                    }}
                    className={`flex items-center justify-between gap-2 py-4 px-4 rounded-lg text-sm font-medium transition-all duration-200 min-h-[60px] ${
                      selectedCategory === category.key
                        ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400/50'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(category.name)}
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full min-w-[24px] text-center ${
                        selectedCategory === category.key ? 'bg-blue-700 text-white' : 'bg-slate-600 text-slate-300'
                      }`}
                    >
                      {category.count}
                    </span>
                  </button>
                ))}
            </div>
          </div>

          {/* Advanced Categories Toggle */}
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-slate-800/30 hover:bg-slate-800/50 rounded-lg border border-slate-700 transition-colors">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-white">
                  {dict?.advancedCategories || 'Advanced Categories'}
                </span>
                <span className="text-xs text-slate-400">
                  {dict?.advancedCategoriesDesc || 'Sub-genres, Sub-types'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-slate-800/30 rounded-lg">
                {getCategoryDisplayData()
                  .filter((cat) => !cat.isPriority)
                  .map((category) => (
                    <button
                      key={category.key}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedCategory(category.key);
                      }}
                      className={`flex items-center justify-between gap-2 py-3 px-3 rounded-md text-sm transition-all ${
                        selectedCategory === category.key
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(category.name)}
                        <span>{category.name}</span>
                      </div>
                      <span className="text-xs bg-slate-600 px-1.5 py-0.5 rounded">{category.count}</span>
                    </button>
                  ))}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Selected Category Items */}
          <div className="bg-slate-800/30 rounded-lg border border-slate-700">
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-white">
                  {selectedCategory === 'all'
                    ? dict?.allCategories || 'All Categories'
                    : (() => {
                        // Get translated name for the selected category
                        if (dict?.mainCategories) {
                          switch (selectedCategory) {
                            case 'Main Categories':
                              return dict.mainCategories.mainCategories;
                            case 'Genres':
                              return dict.mainCategories.genres;
                            case 'Event Types':
                              return dict.mainCategories.eventTypes;
                            case 'Sub-Genres':
                              return dict.mainCategories.subGenres;
                            case 'Sub-Types':
                              return dict.mainCategories.subTypes;
                            default:
                              return selectedCategory;
                          }
                        }
                        return selectedCategory;
                      })()}
                </h4>
                <span className="text-sm text-slate-400">
                  {getFilteredClassifications().length} {dict?.items || 'items'}
                </span>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {getFilteredClassifications().length === 0 ? (
                <div className="p-8 text-center">
                  <Search className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-slate-400">
                    {dict?.noCategoriesFound || 'No categories found matching your search'}
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {getFilteredClassifications().map((classification: Classification) => (
                    <div
                      key={classification.id}
                      className="flex items-center space-x-3 p-2 hover:bg-slate-700/50 rounded-md transition-colors"
                    >
                      <Checkbox
                        id={classification.id}
                        checked={selectedClassifications.includes(classification.name)}
                        onCheckedChange={(checked) =>
                          handleClassificationChange(classification.name, checked as boolean)
                        }
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <label htmlFor={classification.id} className="flex-1 text-sm cursor-pointer">
                        <span className="font-medium text-white">{classification.name}</span>
                        <span className="ml-2 text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded">
                          {translateCategoryName(classification.category)}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Search Button */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-1 rounded-lg">
        <Button
          onClick={findEvents}
          disabled={loading}
          size="lg"
          className="w-full bg-white text-blue-600 hover:bg-blue-50 font-semibold text-lg py-4 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
              {dict?.searchingEvents || 'Searching for events...'}
            </>
          ) : (
            <>
              <Search className="w-5 h-5 mr-3" />
              {dict?.findLocalEvents || 'Find Local Events'}
              {selectedClassifications.length > 0 && (
                <Badge variant="info" className="ml-2 bg-blue-100 text-blue-600">
                  {selectedClassifications.length}
                </Badge>
              )}
            </>
          )}
        </Button>
      </div>

      {/* Enhanced Events Results */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 font-medium">{error}</p>
        </div>
      )}

      {events.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-white">
              {dict?.foundEvents || 'Found Events'} ({events.length})
            </h4>
          </div>

          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="bg-slate-800/50 border border-slate-600 rounded-lg overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Event Image */}
                      {getBestEventImage(event.images) && (
                        <div className="flex-shrink-0">
                          <img
                            src={getBestEventImage(event.images)?.url}
                            alt={event.title}
                            className="w-16 h-16 rounded-lg object-cover border border-slate-600"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-white text-lg mb-1 line-clamp-2">{event.title}</h5>
                        <p className="text-sm text-slate-400 mb-2">
                          {(() => {
                            const date = new Date(event.start);
                            const hasSpecificTime =
                              !event.start.endsWith('T00:00:00') && !event.start.includes('T00:00:00');

                            if (hasSpecificTime) {
                              return date.toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              });
                            } else {
                              return date.toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              });
                            }
                          })()}
                        </p>
                        {event.address && <p className="text-xs text-slate-500 line-clamp-1">{event.address}</p>}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchEventDetails(event)}
                        className="text-blue-400 border-blue-400/30 hover:bg-blue-400/10 hover:border-blue-400/50"
                      >
                        <Info className="w-4 h-4 mr-1" />
                        {dict?.moreDetails || 'More Details'}
                      </Button>
                      <Button size="sm" onClick={() => onAddEvent(event)} className="bg-green-600 hover:bg-green-700">
                        {dict?.add || 'Add'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-bold">
              {selectedEventForDetails?.title || dict?.eventDetails || 'Event Details'}
            </DialogTitle>
            <DialogDescription>
              {dict?.eventDetailsDescription || 'Detailed information about this event'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 pr-2 min-h-0">
            {eventDetailsLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-slate-600">{dict?.loadingDetails || 'Loading event details...'}</span>
              </div>
            )}

            {eventDetailsError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">{eventDetailsError}</p>
              </div>
            )}

            {eventDetails && (
              <div className="space-y-6 pb-4">
                {/* Event Images */}
                {eventDetails.images && eventDetails.images.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info className="w-5 h-5" />
                        {dict?.eventImage || 'Event Image'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-center">
                        <div className="w-full max-w-md aspect-video rounded-lg overflow-hidden bg-slate-100 shadow-lg">
                          <img
                            src={getBestEventImage(eventDetails.images)?.url}
                            alt={eventDetails.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Basic Event Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      {dict?.basicInfo || 'Basic Information'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {eventDetails.description && (
                      <div>
                        <h4 className="font-medium mb-1">{dict?.description || 'Description'}</h4>
                        <p className="text-slate-600">{eventDetails.description}</p>
                      </div>
                    )}
                    {eventDetails.info && (
                      <div>
                        <h4 className="font-medium mb-1">{dict?.additionalInfo || 'Additional Information'}</h4>
                        <p className="text-slate-600">{eventDetails.info}</p>
                      </div>
                    )}
                    {eventDetails.pleaseNote && (
                      <div>
                        <h4 className="font-medium mb-1">{dict?.pleaseNote || 'Please Note'}</h4>
                        <p className="text-slate-600">{eventDetails.pleaseNote}</p>
                      </div>
                    )}
                    {eventDetails.url && (
                      <div>
                        <h4 className="font-medium mb-1">{dict?.officialWebsite || 'Official Website'}</h4>
                        <a
                          href={eventDetails.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
                        >
                          {dict?.visitOfficialWebsite || 'Visit Official Website'}
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Classifications */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="w-5 h-5" />
                      {dict?.allCategories || 'Categories'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {eventDetailsLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                        <span className="ml-2 text-slate-600">
                          {dict?.loadingCategories || 'Loading categories...'}
                        </span>
                      </div>
                    ) : eventDetails?.classifications && eventDetails.classifications.length > 0 ? (
                      <div className="space-y-4">
                        {eventDetails.classifications.map((classification, index) => (
                          <div
                            key={index}
                            className={`rounded-lg p-4 space-y-3 border-l-4 ${
                              classification.primary ? 'bg-blue-50 border-blue-500' : 'bg-slate-50 border-slate-300'
                            }`}
                          >
                            {classification.primary && (
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="info" className="text-xs">
                                  {dict?.primaryCategory || 'Primary Category'}
                                </Badge>
                              </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {classification.segment && (
                                <div className="space-y-1">
                                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                    {dict?.segment || 'Segment'}
                                  </span>
                                  <div className="text-sm font-semibold text-slate-900">
                                    {classification.segment.name}
                                  </div>
                                </div>
                              )}
                              {classification.genre && (
                                <div className="space-y-1">
                                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                    {dict?.mainCategories?.genres || 'Genre'}
                                  </span>
                                  <div className="text-sm font-semibold text-slate-900">
                                    {classification.genre.name}
                                  </div>
                                </div>
                              )}
                              {classification.subGenre && (
                                <div className="space-y-1">
                                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                    {dict?.mainCategories?.subGenres || 'Sub-Genre'}
                                  </span>
                                  <div className="text-sm font-semibold text-slate-900">
                                    {classification.subGenre.name}
                                  </div>
                                </div>
                              )}
                              {classification.type && (
                                <div className="space-y-1">
                                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                    {dict?.mainCategories?.eventTypes || 'Type'}
                                  </span>
                                  <div className="text-sm font-semibold text-slate-900">{classification.type.name}</div>
                                </div>
                              )}
                              {classification.subType && (
                                <div className="space-y-1">
                                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                                    {dict?.mainCategories?.subTypes || 'Sub-Type'}
                                  </span>
                                  <div className="text-sm font-semibold text-slate-900">
                                    {classification.subType.name}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                        <Tag className="w-12 h-12 text-slate-400" />
                        <div className="space-y-1">
                          <p className="text-slate-600 font-medium">
                            {dict?.noCategoriesAvailable || 'No categories available'}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Venue Information */}
                {eventDetails._embedded?.venues && eventDetails._embedded.venues.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        {dict?.venueInformation || 'Venue Information'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {eventDetails._embedded.venues.map((venue, index) => (
                        <div key={index} className="space-y-3">
                          <h4 className="font-semibold text-lg">{venue.name}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h5 className="font-medium mb-2">{dict?.address || 'Address'}</h5>
                              <address className="not-italic text-slate-600">
                                {venue.address.line1}
                                <br />
                                {venue.address.line2 && (
                                  <>
                                    {venue.address.line2}
                                    <br />
                                  </>
                                )}
                                {venue.city.name}
                                {venue.state && `, ${venue.state.name}`}
                                {venue.postalCode && ` ${venue.postalCode}`}
                                <br />
                                {venue.country.name}
                              </address>
                            </div>

                            {(venue.boxOfficeInfo || venue.parkingDetail || venue.accessibleSeatingDetail) && (
                              <div>
                                <h5 className="font-medium mb-2">{dict?.venueDetails || 'Venue Details'}</h5>
                                <div className="space-y-2 text-sm text-slate-600">
                                  {venue.boxOfficeInfo?.phoneNumberDetail && (
                                    <p>
                                      <strong>{dict?.phone || 'Phone:'}</strong> {venue.boxOfficeInfo.phoneNumberDetail}
                                    </p>
                                  )}
                                  {venue.boxOfficeInfo?.openHoursDetail && (
                                    <p>
                                      <strong>{dict?.hours || 'Hours:'}</strong> {venue.boxOfficeInfo.openHoursDetail}
                                    </p>
                                  )}
                                  {venue.parkingDetail && (
                                    <p>
                                      <strong>{dict?.parking || 'Parking:'}</strong> {venue.parkingDetail}
                                    </p>
                                  )}
                                  {venue.accessibleSeatingDetail && (
                                    <p>
                                      <strong>{dict?.accessibility || 'Accessibility:'}</strong>{' '}
                                      {venue.accessibleSeatingDetail}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Price Information */}
                {eventDetails.priceRanges && eventDetails.priceRanges.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        {dict?.priceInformation || 'Price Information'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        {eventDetails.priceRanges.map((range, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="font-medium">{range.type}</span>
                            <span className="font-semibold">
                              {range.min === range.max
                                ? `${range.min} ${range.currency}`
                                : `${range.min} - ${range.max} ${range.currency}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Attractions */}
                {eventDetails._embedded?.attractions && eventDetails._embedded.attractions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        {dict?.attractions || 'Attractions'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {eventDetails._embedded.attractions.map((attraction, index) => (
                          <div key={index} className="border-l-4 border-blue-500 pl-4">
                            <h4 className="font-semibold">{attraction.name}</h4>
                            {attraction.url && (
                              <a
                                href={attraction.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 mt-1"
                              >
                                {dict?.learnMore || 'Learn More'}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
