import React, { useState } from 'react';
import { Share2, Copy, Check, Loader2 } from 'lucide-react';
import { useItineraryShare } from '@/components/hooks/useItineraryShare';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getDictionary, type Lang } from '@/lib/i18n';

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
  tripId: string; // Required for sharing and adding expenses
  tripCurrency?: string | null;
  lang?: Lang;
}

export const ItineraryViewEnhanced: React.FC<ItineraryViewProps> = ({
  itineraryId,
  initialPlan,
  onSave,
  tripId,
  tripCurrency,
  lang = 'pl',
}) => {
  const [plan, setPlan] = useState<Itinerary>(initialPlan);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const dict = getDictionary(lang);
  const { isSharing, shareUrl, error, createShareLink, reset } = useItineraryShare({ tripId, lang });
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShareClick = async () => {
    reset(); // Clear previous state
    setIsShareDialogOpen(true);
    await createShareLink();
  };

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2s
    }
  };

  const handleActivityChange = (
    dayIndex: number,
    activityIndex: number,
    field: keyof Activity,
    value: string | number
  ) => {
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
  const [announce, setAnnounce] = useState<string>('');

  async function addActivityAsExpense(dayIndex: number, activityIndex: number) {
    if (!tripId) return;
    const act = plan.itinerary[dayIndex].activities[activityIndex];
    if (!act) return;
    if (!(act.estimated_cost > 0)) return;
    const key = activityKey(dayIndex, activityIndex, act);
    if (added.has(key) || addingKey === key) return;
    setAddingKey(key);
    setAnnounce(dict.budget?.itineraryAdd?.adding || 'Dodawanie...');
    const payload = {
      amount: act.estimated_cost,
      currency: act.currency || tripCurrency || 'EUR',
      description: `${act.activity_name}`.slice(0, 140),
      is_prepaid: false,
    };
    let success = false;
    try {
      const res = await fetch(`/api/trips/${tripId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setAdded((prev) => new Set(prev).add(key));
        success = true;
        setAnnounce(dict.budget?.itineraryAdd?.added || 'Dodano');
      } else {
        // console.warn('[Itinerary] addActivityAsExpense failed', await res.text());
        setAnnounce(dict.budget?.itineraryAdd?.error || 'Błąd dodawania');
      }
    } catch (e) {
      console.warn('[Itinerary] addActivityAsExpense error', e);
      setAnnounce(dict.budget?.itineraryAdd?.error || 'Błąd dodawania');
    } finally {
      // Briefly hold spinner if too fast (<150ms) for better perceived feedback
      setTimeout(() => {
        setAddingKey(null);
        if (!success) {
          /* keep message */
        }
      }, 150);
    }
  }

  return (
    <div className="space-y-8">
      {/* Itinerary Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
              {dict.itineraryView?.generatedHeading}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {dict.itineraryView?.summaryDays?.replace('{count}', String(plan.itinerary.length))} {'·'}{' '}
              {dict.itineraryView?.summaryActivities?.replace(
                '{count}',
                String(plan.itinerary.reduce((total, day) => total + day.activities.length, 0))
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-xs font-medium border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950 dark:text-green-300"
          >
            {dict.itineraryView?.statusReady}
          </Badge>
          <Button
            onClick={handleShareClick}
            size="sm"
            variant="outline"
            className="gap-2"
            aria-label={dict.itineraryView?.share?.button}
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">{dict.itineraryView?.share?.button}</span>
          </Button>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{dict.itineraryView?.share?.title}</DialogTitle>
            <DialogDescription>{dict.itineraryView?.share?.description}</DialogDescription>
          </DialogHeader>
          {isSharing && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <span className="sr-only">{dict.itineraryView?.share?.creating}</span>
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{dict.itineraryView?.share?.error}</p>}
          {shareUrl && (
            <div className="flex items-center space-x-2 pt-4">
              <div className="grid flex-1 gap-2">
                <Input id="link" defaultValue={shareUrl} readOnly className="h-9" />
              </div>
              <Button onClick={handleCopy} size="sm" className="px-3">
                <span className="sr-only">{copied ? dict.itineraryView?.share?.copied : dict.itineraryView?.share?.copy}</span>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Days Timeline */}
      <div className="space-y-8">
        {plan.itinerary.map((day, dayIndex) => (
          <div key={day.day} className="relative pl-10">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

            {/* Day Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="absolute left-0 w-10 h-10 rounded-full bg-gray-800 text-gray-100 flex items-center justify-center font-bold z-10 border-4 border-gray-900">
                {day.day}
              </div>
              <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-700">
                <h3 className="text-lg font-semibold text-gray-100">{day.date}</h3>
                <p className="text-sm text-gray-400 font-medium">{day.theme}</p>
              </div>
            </div>

            {/* Activities */}
            <div className="space-y-4">
              {day.activities.map((activity, activityIndex) => {
                const editId = `day-${dayIndex}-activity-${activityIndex}`;
                const isCurrentlyEditing = isEditing === editId;

                return (
                  <Card
                    key={activityIndex}
                    className={`transition-all duration-300 overflow-hidden ${
                      isCurrentlyEditing
                        ? 'bg-gray-800/90 border-indigo-500/50'
                        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    {isCurrentlyEditing ? (
                      <CardContent className="p-4 space-y-4">
                        <div className="grid md:grid-cols-5 gap-4">
                          <div className="md:col-span-3">
                            <label
                              htmlFor={`activity-name-${editId}`}
                              className="text-xs font-medium text-gray-400 uppercase tracking-wide"
                            >
                              {dict.itineraryView?.labels.name}
                            </label>
                            <Input
                              id={`activity-name-${editId}`}
                              value={activity.activity_name}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                handleActivityChange(dayIndex, activityIndex, 'activity_name', e.target.value)
                              }
                              className="mt-1 text-base font-semibold bg-gray-700/50 border-gray-600 text-gray-100"
                            />
                          </div>
                          <div>
                            <label
                              htmlFor={`activity-time-${editId}`}
                              className="text-xs font-medium text-gray-400 uppercase tracking-wide"
                            >
                              {dict.itineraryView?.labels.time}
                            </label>
                            <Input
                              id={`activity-time-${editId}`}
                              value={activity.time}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                handleActivityChange(dayIndex, activityIndex, 'time', e.target.value)
                              }
                              className="mt-1 bg-gray-700/50 border-gray-600 text-gray-100"
                            />
                          </div>
                          <div className="flex items-end">
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={activity.estimated_cost}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  handleActivityChange(
                                    dayIndex,
                                    activityIndex,
                                    'estimated_cost',
                                    parseFloat(e.target.value)
                                  )
                                }
                                className="w-24 bg-gray-700/50 border-gray-600 text-gray-100"
                              />
                              <span className="text-sm text-gray-400">{activity.currency}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor={`activity-desc-${editId}`}
                            className="text-xs font-medium text-gray-400 uppercase tracking-wide"
                          >
                            {dict.itineraryView?.labels.description}
                          </label>
                          <Textarea
                            id={`activity-desc-${editId}`}
                            value={activity.description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                              handleActivityChange(dayIndex, activityIndex, 'description', e.target.value)
                            }
                            className="mt-1 bg-gray-700/50 border-gray-600 text-gray-300"
                            rows={2}
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => setIsEditing(null)}
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            {dict.itineraryView?.labels.cancel}
                          </Button>
                          <Button
                            onClick={handleSave}
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-500 text-white"
                          >
                            {dict.itineraryView?.labels.save}
                          </Button>
                        </div>
                      </CardContent>
                    ) : (
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center justify-center w-16">
                              <div className="text-xl font-bold text-gray-200">{activity.time.split(':')[0]}</div>
                              <div className="text-sm text-gray-400">:{activity.time.split(':')[1]}</div>
                            </div>
                            <div className="h-16 w-px bg-gray-700"></div>
                            <div>
                              <h4 className="text-base font-semibold text-gray-100">{activity.activity_name}</h4>
                              <p className="text-gray-300 text-sm leading-relaxed mt-1">{activity.description}</p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end justify-between h-full gap-2">
                            <div className="text-sm font-medium text-gray-300 whitespace-nowrap">
                              {activity.estimated_cost > 0
                                ? `${activity.estimated_cost} ${activity.currency}`
                                : dict.itineraryView?.labels.free}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() => setIsEditing(editId)}
                                variant="ghost"
                                size="icon"
                                className="text-gray-400 hover:text-white hover:bg-gray-700"
                                title={dict.itineraryView?.labels.edit}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </Button>
                              {tripId &&
                                actHasCost(activity) &&
                                (() => {
                                  const key = activityKey(dayIndex, activityIndex, activity);
                                  const already = added.has(key);
                                  const isAdding = addingKey === key && !already;
                                  const labelIdle = dict.budget?.itineraryAdd?.button || 'Dodaj do wydatków';
                                  const labelAdding = dict.budget?.itineraryAdd?.adding || 'Dodawanie...';
                                  const labelAdded = dict.budget?.itineraryAdd?.added || 'Dodano';
                                  return (
                                    <Button
                                      onClick={() => addActivityAsExpense(dayIndex, activityIndex)}
                                      variant={already ? 'outline' : isAdding ? 'outline' : 'ghost'}
                                      size="sm"
                                      disabled={already || isAdding}
                                      className={`relative overflow-hidden group ${already ? 'text-emerald-400 border-emerald-600 bg-emerald-900/30' : isAdding ? 'border-emerald-500 text-emerald-300' : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/30'} transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none`}
                                      title={already ? labelAdded : isAdding ? labelAdding : labelIdle}
                                      aria-live="polite"
                                    >
                                      {isAdding && (
                                        <span className="absolute inset-0 flex items-center justify-center">
                                          <svg
                                            className="animate-spin h-4 w-4 text-emerald-300"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                          >
                                            <circle
                                              className="opacity-25"
                                              cx="12"
                                              cy="12"
                                              r="10"
                                              stroke="currentColor"
                                              strokeWidth="4"
                                            ></circle>
                                            <path
                                              className="opacity-75"
                                              fill="currentColor"
                                              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                            ></path>
                                          </svg>
                                        </span>
                                      )}
                                      {!isAdding && already && (
                                        <span className="flex items-center gap-1">
                                          <svg
                                            className="h-4 w-4 text-emerald-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth={2}
                                              d="M5 13l4 4L19 7"
                                            />
                                          </svg>
                                          {labelAdded}
                                        </span>
                                      )}
                                      {!isAdding && !already && labelIdle}
                                      <span className="sr-only">
                                        {already ? labelAdded : isAdding ? labelAdding : labelIdle}
                                      </span>
                                    </Button>
                                  );
                                })()}
                              <Button
                                onClick={() => handleRemoveActivity(dayIndex, activityIndex)}
                                variant="ghost"
                                size="icon"
                                className="text-red-500/70 hover:text-red-500 hover:bg-red-900/50"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
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
      <div className="sr-only" aria-live="polite">
        {announce}
      </div>
    </div>
  );
};

function actHasCost(a: Activity) {
  return a.estimated_cost != null && a.estimated_cost > 0;
}
