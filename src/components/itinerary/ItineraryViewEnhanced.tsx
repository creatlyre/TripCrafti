import React, { useState } from "react";
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
}

export const ItineraryViewEnhanced: React.FC<ItineraryViewProps> = ({ itineraryId, initialPlan, onSave }) => {
  const [plan, setPlan] = useState<Itinerary>(initialPlan);
  const [isEditing, setIsEditing] = useState<string | null>(null); // e.g., "day-1-activity-0"

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

  return (
    <div className="space-y-8">
      {/* Itinerary Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">Plan podróży wygenerowany</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {plan.itinerary.length} dni · {plan.itinerary.reduce((total, day) => total + day.activities.length, 0)} aktywności
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs font-medium border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-300">
          Gotowe
        </Badge>
      </div>

      {/* Days Timeline */}
      <div className="space-y-8">
        {plan.itinerary.map((day, dayIndex) => (
          <div key={day.day} className="relative pl-10">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"></div>
            
            {/* Day Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="absolute left-0 w-10 h-10 rounded-full bg-slate-800 text-slate-100 flex items-center justify-center font-bold z-10 border-4 border-slate-900">
                {day.day}
              </div>
              <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-slate-700">
                <h3 className="text-lg font-semibold text-slate-100">{day.date}</h3>
                <p className="text-sm text-slate-400 font-medium">{day.theme}</p>
              </div>
            </div>

            {/* Activities */}
            <div className="space-y-4">
              {day.activities.map((activity, activityIndex) => {
                const editId = `day-${dayIndex}-activity-${activityIndex}`;
                const isCurrentlyEditing = isEditing === editId;

                return (
                  <Card key={activityIndex} className={`transition-all duration-300 overflow-hidden ${
                    isCurrentlyEditing ? "bg-slate-800/90 border-indigo-500/50" : "bg-slate-800/50 border-slate-700/50 hover:border-slate-600"
                  }`}>
                    {isCurrentlyEditing ? (
                      <CardContent className="p-4 space-y-4">
                        <div className="grid md:grid-cols-5 gap-4">
                          <div className="md:col-span-3">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                              Nazwa aktywności
                            </label>
                            <Input
                              value={activity.activity_name}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleActivityChange(dayIndex, activityIndex, "activity_name", e.target.value)}
                              className="mt-1 text-base font-semibold bg-slate-700/50 border-slate-600 text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                              Godzina
                            </label>
                            <Input
                              value={activity.time}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleActivityChange(dayIndex, activityIndex, "time", e.target.value)}
                              className="mt-1 bg-slate-700/50 border-slate-600 text-slate-100"
                            />
                          </div>
                          <div className="flex items-end">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={activity.estimated_cost}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleActivityChange(dayIndex, activityIndex, "estimated_cost", parseFloat(e.target.value))}
                                className="w-24 bg-slate-700/50 border-slate-600 text-slate-100"
                              />
                              <span className="text-sm text-slate-400">{activity.currency}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                            Opis
                          </label>
                          <Textarea
                            value={activity.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleActivityChange(dayIndex, activityIndex, "description", e.target.value)}
                            className="mt-1 bg-slate-700/50 border-slate-600 text-slate-300"
                            rows={2}
                          />
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button onClick={() => setIsEditing(null)} size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                            Anuluj
                          </Button>
                          <Button onClick={handleSave} size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                            Zapisz
                          </Button>
                        </div>
                      </CardContent>
                    ) : (
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center justify-center w-16">
                              <div className="text-xl font-bold text-slate-200">{activity.time.split(':')[0]}</div>
                              <div className="text-sm text-slate-400">:{activity.time.split(':')[1]}</div>
                            </div>
                            <div className="h-16 w-px bg-slate-700"></div>
                            <div>
                              <h4 className="text-base font-semibold text-slate-100">{activity.activity_name}</h4>
                              <p className="text-slate-400 text-sm leading-relaxed mt-1">
                                {activity.description}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end justify-between h-full gap-2">
                             <div className="text-sm font-medium text-slate-300 whitespace-nowrap">
                                {activity.estimated_cost > 0 ? `${activity.estimated_cost} ${activity.currency}` : 'Darmowe'}
                              </div>
                            <div className="flex items-center space-x-2">
                              <Button 
                                onClick={() => setIsEditing(editId)} 
                                variant="ghost" 
                                size="icon"
                                className="text-slate-400 hover:text-white hover:bg-slate-700"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </Button>
                              <Button 
                                onClick={() => handleRemoveActivity(dayIndex, activityIndex)} 
                                variant="ghost" 
                                size="icon"
                                className="text-red-500/70 hover:text-red-500 hover:bg-red-900/50"
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
    </div>
  );
};