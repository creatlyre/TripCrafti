import React, { useState } from "react";
import { getDictionary } from '@/lib/i18n';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// This should match the JSON structure from the AI
interface Activity {
  time: string;
  activity_name: string;
  description: string;
  estimated_cost: number;
  currency: string;
}

interface DayPlan {
  day: number;
  date: string;
  theme: string;
  activities: Activity[];
}

interface Itinerary {
  itinerary: DayPlan[];
}

interface ItineraryViewProps {
  itineraryId: string;
  initialPlan: Itinerary;
  onSave: (itineraryId: string, plan: Itinerary) => void;
  tripId?: string; // needed for adding expenses
  tripCurrency?: string | null; // optional base currency
  lang?: 'pl' | 'en';
}

export const ItineraryViewEnhanced: React.FC<ItineraryViewProps> = ({ itineraryId, initialPlan, onSave, tripId, tripCurrency, lang = 'pl' }) => {
  const [plan, setPlan] = useState<Itinerary>(initialPlan);
  const [isEditing, setIsEditing] = useState<string | null>(null); // e.g., "day-1-activity-0"
  // Track which activities have been added as expenses (client-only; id composed from indices + name + cost)
  const [added, setAdded] = useState<Set<string>>(new Set());
  const dict = getDictionary(lang);

  const handleActivityChange = (dayIndex: number, activityIndex: number, field: keyof Activity, value: string | number) => {
    const newPlan = { ...plan };
    (newPlan.itinerary[dayIndex].activities[activityIndex] as any)[field] = value;
    setPlan(newPlan);
  };

  const handleRemoveActivity = (dayIndex: number, activityIndex: number) => {
    const newPlan = { ...plan };
    newPlan.itinerary[dayIndex].activities.splice(activityIndex, 1);
    setPlan(newPlan);
    onSave(itineraryId, newPlan); // Save immediately on removal
  };

  const handleSave = () => {
    onSave(itineraryId, plan);
    setIsEditing(null);
  };

  function activityKey(dayIndex: number, activityIndex: number, act: Activity) {
    return `${dayIndex}-${activityIndex}-${act.activity_name}-${act.estimated_cost}`;
  }

  const [addingKey, setAddingKey] = useState<string | null>(null);
  const [announce, setAnnounce] = useState<string>("");

  async function addActivityAsExpense(dayIndex: number, activityIndex: number) {
    if (!tripId) return;
    const act = plan.itinerary[dayIndex].activities[activityIndex];
    if (!act) return;
    if (!(act.estimated_cost > 0)) return;
    const key = activityKey(dayIndex, activityIndex, act);
    if (added.has(key) || addingKey === key) return;
    setAddingKey(key);
    setAnnounce((dict.budget?.itineraryAdd?.adding) || 'Dodawanie...');
    const payload = {
      amount: act.estimated_cost,
      currency: act.currency || tripCurrency || 'EUR',
      description: `${act.activity_name}`.slice(0, 140),
      is_prepaid: false,
    };
    let success = false;
    try {
      const res = await fetch(`/api/trips/${tripId}/expenses`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        setAdded(prev => new Set(prev).add(key));
        success = true;
        setAnnounce((dict.budget?.itineraryAdd?.added) || 'Dodano');
      } else {
        console.warn('[Itinerary] addActivityAsExpense failed', await res.text());
        setAnnounce((dict.budget?.itineraryAdd?.error) || 'Błąd dodawania');
      }
    } catch (e) {
      console.warn('[Itinerary] addActivityAsExpense error', e);
      setAnnounce((dict.budget?.itineraryAdd?.error) || 'Błąd dodawania');
    } finally {
      // Briefly hold spinner if too fast (<150ms) for better perceived feedback
      setTimeout(() => { setAddingKey(null); if (!success) { /* keep message */ } }, 150);
    }
  }

  return (
    <div className="space-y-8">
      {/* Itinerary Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm gap-2">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-gray-100">Plan podróży wygenerowany</h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {plan.itinerary.length} dni · {plan.itinerary.reduce((total, day) => total + day.activities.length, 0)} aktywności
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs font-medium border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-300 self-start sm:self-center">
          Gotowe
        </Badge>
      </div>

      {/* Days Timeline */}
      <div className="space-y-8">
        {plan.itinerary.map((day, dayIndex) => (
          <div key={day.day} className="relative pl-12 sm:pl-16">
            {/* Timeline line */}
            <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
            
            {/* Day Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="absolute left-0 w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-800 text-gray-100 flex items-center justify-center font-bold z-10 border-4 sm:border-[6px] border-slate-900 text-xl sm:text-2xl">
                {day.day}
              </div>
              <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-700">
                <h3 className="text-base sm:text-lg font-semibold text-gray-100">{day.date}</h3>
                <p className="text-xs sm:text-sm text-gray-400 font-medium">{day.theme}</p>
              </div>
            </div>

            {/* Activities */}
            <div className="space-y-4">
              {day.activities.map((activity, activityIndex) => {
                const editId = `day-${dayIndex}-activity-${activityIndex}`;
                const isCurrentlyEditing = isEditing === editId;

                return (
                  <Card key={activityIndex} className={`transition-all duration-300 overflow-hidden ${
                    isCurrentlyEditing ? "bg-gray-800/90 border-indigo-500/50" : "bg-gray-800 border-gray-700 hover:border-gray-600"
                  }`}>
                    {isCurrentlyEditing ? (
                      <CardContent className="p-3 sm:p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div className="md:col-span-5">
                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                              Nazwa aktywności
                            </label>
                            <Input
                              value={activity.activity_name}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleActivityChange(dayIndex, activityIndex, "activity_name", e.target.value)}
                              className="mt-1 text-base font-semibold bg-gray-700/50 border-gray-600 text-gray-100"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                              Godzina
                            </label>
                            <Input
                              value={activity.time}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleActivityChange(dayIndex, activityIndex, "time", e.target.value)}
                              className="mt-1 bg-gray-700/50 border-gray-600 text-gray-100"
                            />
                          </div>
                          <div className="md:col-span-3 flex items-end">
                             <div className="grid grid-cols-2 gap-2 w-full">
                              <div>
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                  Koszt
                                </label>
                                <Input
                                  type="number"
                                  value={activity.estimated_cost}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleActivityChange(dayIndex, activityIndex, "estimated_cost", parseFloat(e.target.value))}
                                  className="mt-1 w-full bg-gray-700/50 border-gray-600 text-gray-100"
                                />
                              </div>
                               <div>
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                  Waluta
                                </label>
                                <Input
                                  value={activity.currency}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleActivityChange(dayIndex, activityIndex, "currency", e.target.value)}
                                  className="mt-1 w-full bg-gray-700/50 border-gray-600 text-gray-100"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                            Opis
                          </label>
                          <Textarea
                            value={activity.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleActivityChange(dayIndex, activityIndex, "description", e.target.value)}
                            className="mt-1 bg-gray-700/50 border-gray-600 text-gray-300"
                            rows={3}
                          />
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button onClick={() => setIsEditing(null)} size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                            Anuluj
                          </Button>
                          <Button onClick={handleSave} size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                            Zapisz
                          </Button>
                        </div>
                      </CardContent>
                    ) : (
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                          <div className="flex items-start gap-3 sm:gap-4 flex-grow">
                            <div className="flex flex-col items-center justify-center w-12 sm:w-16 flex-shrink-0">
                              <div className="text-xl sm:text-2xl font-bold text-gray-200">{activity.time.split(':')[0]}</div>
                              <div className="text-sm sm:text-base text-gray-400">:{activity.time.split(':')[1]}</div>
                            </div>
                            <div className="h-auto sm:h-16 w-px bg-gray-700 self-stretch"></div>
                            <div className="flex-grow">
                              <h4 className="text-base sm:text-lg font-semibold text-gray-100">{activity.activity_name}</h4>
                              <p className="text-gray-300 text-sm leading-relaxed mt-1">
                                {activity.description}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-700/50 gap-2 flex-shrink-0">
                             <div className="text-sm font-semibold text-gray-200 whitespace-nowrap">
                                {activity.estimated_cost > 0 ? `${activity.estimated_cost.toLocaleString()} ${activity.currency}` : 'Darmowe'}
                              </div>
                            <div className="flex items-center space-x-1 sm:space-x-2">
                              <Button 
                                onClick={() => setIsEditing(editId)} 
                                variant="ghost" 
                                size="icon"
                                className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-full"
                                title="Edytuj"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </Button>
                              {tripId && actHasCost(activity) && (() => {
                                const key = activityKey(dayIndex, activityIndex, activity);
                                const already = added.has(key);
                                const isAdding = addingKey === key && !already;
                                const labelIdle = dict.budget?.itineraryAdd?.button || 'Dodaj do wydatków';
                                const labelAdding = dict.budget?.itineraryAdd?.adding || 'Dodawanie...';
                                const labelAdded = dict.budget?.itineraryAdd?.added || 'Dodano';
                                return (
                                  <Button
                                    onClick={() => addActivityAsExpense(dayIndex, activityIndex)}
                                    variant={already ? 'outline' : (isAdding ? 'outline' : 'ghost')}
                                    size="sm"
                                    disabled={already || isAdding}
                                    className={`relative overflow-hidden group ${already ? 'text-emerald-400 border-emerald-600 bg-emerald-900/30' : isAdding ? 'border-emerald-500 text-emerald-300' : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/30'} transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none`}
                                    title={already ? labelAdded : (isAdding ? labelAdding : labelIdle)}
                                    aria-live="polite"
                                  >
                                    {isAdding && (
                                      <span className="absolute inset-0 flex items-center justify-center">
                                        <svg className="animate-spin h-4 w-4 text-emerald-300" viewBox="0 0 24 24" fill="none">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                        </svg>
                                      </span>
                                    )}
                                    {!isAdding && already && (
                                      <span className="flex items-center gap-1 text-xs">
                                        <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        <span className="hidden sm:inline">{labelAdded}</span>
                                      </span>
                                    )}
                                    {!isAdding && !already && <span className="text-xs sm:text-sm">{labelIdle}</span>}
                                    <span className="sr-only">{already ? labelAdded : (isAdding ? labelAdding : labelIdle)}</span>
                                  </Button>
                                );
                              })()}
                              <Button 
                                onClick={() => handleRemoveActivity(dayIndex, activityIndex)} 
                                variant="ghost" 
                                size="icon"
                                className="text-red-500/70 hover:text-red-500 hover:bg-red-900/50 rounded-full"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    <div className="sr-only" aria-live="polite">{announce}</div>
    </div>
  );
};

function actHasCost(a: Activity) { return a.estimated_cost != null && a.estimated_cost > 0; }