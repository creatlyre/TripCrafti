import { ChevronDown, Filter, X, Search, Tag, Layers } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import type { Event } from '@/lib/services/eventService';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
        throw new Error(body.error || 'Failed to geocode destination');
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
        throw new Error(body.error || 'Failed to fetch events');
      }
      const data = await eventsRes.json();
      logDebug('EventFinder: Events data received', data);
      setEvents(data);
    } catch (e: unknown) {
      logError('EventFinder: Error in findEvents', e);
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unknown error occurred');
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
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-800/50 rounded-lg">
            {getCategoryDisplayData()
              .filter((cat) => cat.isPriority)
              .map((category) => (
                <button
                  key={category.key}
                  onClick={() => setSelectedCategory(category.key)}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-md text-sm font-medium transition-all ${
                    selectedCategory === category.key
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {getCategoryIcon(category.name)}
                  <span className="hidden sm:inline">{category.name}</span>
                  <span className="text-xs bg-slate-600 px-2 py-0.5 rounded-full">{category.count}</span>
                </button>
              ))}
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
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800/30 rounded-lg">
                {getCategoryDisplayData()
                  .filter((cat) => !cat.isPriority)
                  .map((category) => (
                    <button
                      key={category.key}
                      onClick={() => setSelectedCategory(category.key)}
                      className={`flex items-center justify-between gap-2 py-2 px-3 rounded-md text-sm transition-all ${
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

      {/* Search Button */}
      <Button onClick={findEvents} disabled={loading} size="lg" className="w-full">
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            {dict?.searchingEvents || 'Searching for events...'}
          </>
        ) : (
          <>
            <Search className="w-4 h-4 mr-2" />
            {dict?.findLocalEvents || 'Find Local Events'}
          </>
        )}
      </Button>
      {error && <p className="text-red-500">{error}</p>}
      {events.length > 0 && (
        <ul className="space-y-2">
          {events.map((event) => (
            <li key={event.id} className="p-2 bg-slate-800 rounded-md">
              <Collapsible>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CollapsibleTrigger>
                      <ChevronDown className="w-4 h-4" />
                    </CollapsibleTrigger>
                    <div>
                      <p className="font-semibold">{event.title}</p>
                      <p className="text-sm text-slate-400">{new Date(event.start).toLocaleString()}</p>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => onAddEvent(event)}>
                    {dict?.add || 'Add'}
                  </Button>
                </div>
                <CollapsibleContent className="mt-2 space-y-1 text-sm text-slate-300 pl-6">
                  {event.address && (
                    <p>
                      {dict?.address || 'Address:'} {event.address}
                    </p>
                  )}
                  {event.description && <p className="text-xs italic">{event.description}</p>}
                </CollapsibleContent>
              </Collapsible>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
