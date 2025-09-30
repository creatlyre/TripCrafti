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
  onSave: (itineraryId: string, newPlan: Itinerary) => void;
}

export const ItineraryView: React.FC<ItineraryViewProps> = ({ itineraryId, initialPlan, onSave }) => {
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
      {plan.itinerary.map((day, dayIndex) => (
        <Card key={day.day}>
          <CardHeader>
            <CardTitle>
              Dzień {day.day} ({day.date}) - {day.theme}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {day.activities.map((activity, activityIndex) => {
              const editId = `day-${dayIndex}-activity-${activityIndex}`;
              const isCurrentlyEditing = isEditing === editId;

              return (
                <div key={activityIndex} className="rounded-lg border p-4">
                  {isCurrentlyEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={activity.activity_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleActivityChange(dayIndex, activityIndex, "activity_name", e.target.value)}
                        className="text-lg font-bold"
                      />
                      <Input
                        value={activity.time}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleActivityChange(dayIndex, activityIndex, "time", e.target.value)}
                        className="text-sm text-gray-500"
                      />
                      <Textarea
                        value={activity.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleActivityChange(dayIndex, activityIndex, "description", e.target.value)}
                      />
                      <div className="flex items-center">
                        <Input
                          type="number"
                          value={activity.estimated_cost}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleActivityChange(dayIndex, activityIndex, "estimated_cost", parseFloat(e.target.value))}
                          className="w-24"
                        />
                        <span className="ml-2">{activity.currency}</span>
                      </div>
                      <Button onClick={handleSave} size="sm">Zapisz</Button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between">
                        <h4 className="text-lg font-bold">{activity.activity_name}</h4>
                        <div className="flex items-center space-x-2">
                           <Button onClick={() => setIsEditing(editId)} variant="outline" size="sm">Edytuj</Button>
                           <Button onClick={() => handleRemoveActivity(dayIndex, activityIndex)} variant="destructive" size="sm">Usuń</Button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">{activity.time}</p>
                      <p className="mt-2">{activity.description}</p>
                      <p className="mt-2 text-sm font-semibold">
                        Szacowany koszt: {activity.estimated_cost} {activity.currency}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
