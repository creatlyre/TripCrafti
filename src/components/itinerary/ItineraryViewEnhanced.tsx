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
    <div className="space-y-6">
      {/* Itinerary Header */}
      <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Plan podróży wygenerowany</h3>
            <p className="text-sm text-muted-foreground">
              {plan.itinerary.length} dni · {plan.itinerary.reduce((total, day) => total + day.activities.length, 0)} aktywności
            </p>
          </div>
        </div>
        <Badge variant="success" className="text-xs">
          Gotowe
        </Badge>
      </div>

      {/* Days Timeline */}
      <div className="space-y-6">
        {plan.itinerary.map((day, dayIndex) => (
          <Card key={day.day} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-primary/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  {day.day}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{day.date}</CardTitle>
                  <p className="text-sm text-muted-foreground font-medium mt-1">{day.theme}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {day.activities.map((activity, activityIndex) => {
                  const editId = `day-${dayIndex}-activity-${activityIndex}`;
                  const isCurrentlyEditing = isEditing === editId;

                  return (
                    <div key={activityIndex} className={`p-6 border-b last:border-b-0 transition-all duration-200 ${
                      isCurrentlyEditing ? "bg-muted/20" : "hover:bg-muted/10"
                    }`}>
                      {isCurrentlyEditing ? (
                        <div className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Nazwa aktywności
                              </label>
                              <Input
                                value={activity.activity_name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleActivityChange(dayIndex, activityIndex, "activity_name", e.target.value)}
                                className="mt-1 text-lg font-semibold"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Godzina
                              </label>
                              <Input
                                value={activity.time}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleActivityChange(dayIndex, activityIndex, "time", e.target.value)}
                                className="mt-1"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Opis
                            </label>
                            <Textarea
                              value={activity.description}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleActivityChange(dayIndex, activityIndex, "description", e.target.value)}
                              className="mt-1"
                              rows={3}
                            />
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Szacowany koszt
                              </label>
                              <div className="flex items-center gap-2 mt-1">
                                <Input
                                  type="number"
                                  value={activity.estimated_cost}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleActivityChange(dayIndex, activityIndex, "estimated_cost", parseFloat(e.target.value))}
                                  className="w-24"
                                />
                                <span className="text-sm text-muted-foreground">{activity.currency}</span>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-6">
                              <Button onClick={handleSave} size="sm" variant="default">
                                Zapisz
                              </Button>
                              <Button onClick={() => setIsEditing(null)} size="sm" variant="outline">
                                Anuluj
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div>
                                  <h4 className="text-lg font-semibold text-foreground">{activity.activity_name}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {activity.time}
                                  </Badge>
                                </div>
                              </div>
                              
                              <p className="text-muted-foreground leading-relaxed mb-3">
                                {activity.description}
                              </p>
                              
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                                <span className="text-sm font-medium">
                                  {activity.estimated_cost} {activity.currency}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Button 
                                onClick={() => setIsEditing(editId)} 
                                variant="outline" 
                                size="sm"
                                className="text-xs"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edytuj
                              </Button>
                              <Button 
                                onClick={() => handleRemoveActivity(dayIndex, activityIndex)} 
                                variant="destructive" 
                                size="sm"
                                className="text-xs"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Usuń
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};