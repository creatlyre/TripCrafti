import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ItineraryPreferences } from "@/types";
import { Input } from "../ui/input";
import { getDictionary } from "@/lib/i18n";

const baseNumber = (msg: string) => z.number({ invalid_type_error: msg });
const preferencesSchema = z.object({
  interests: z.array(z.string()).min(1, "Select at least one"),
  travelStyle: z.enum(["Relaxed", "Balanced", "Intense"]),
  budget: z.string(),
  adultsCount: baseNumber("Invalid")
    .int("Invalid")
    .min(1, "adultsMin")
    .max(20, "Too many")
    .optional()
    .or(z.nan().transform(() => undefined)),
  kidsCount: baseNumber("Invalid")
    .int("Invalid")
    .min(0, "kidsCountInvalid")
    .max(20, "Too many")
    .optional()
    .or(z.nan().transform(() => undefined)),
  kidsAges: z
    .array(
      baseNumber("Invalid")
        .int("Invalid")
        .min(0, "Age >= 0")
        .max(17, "<18")
    )
    .optional()
    .refine((arr) => !arr || arr.length <= 20, "Too many"),
  hotelNameOrUrl: z
    .string()
    .max(300, "Too long")
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),
  maxTravelDistanceKm: baseNumber("Invalid")
    .min(1, "distanceInvalid")
    .max(500, "distanceInvalid")
    .optional()
    .or(z.nan().transform(() => undefined)),
}).refine((data) => {
  if (typeof data.kidsCount === 'number' && data.kidsCount > 0) {
    const ages = data.kidsAges || [];
    return ages.length === data.kidsCount && ages.every(a => typeof a === 'number');
  }
  return true;
}, { message: 'kidsAgesMismatch', path: ['kidsAges'] });

type PreferencesFormData = z.infer<typeof preferencesSchema>;

interface ItineraryPreferencesFormProps {
  tripId: string;
  onSubmit: (data: ItineraryPreferences) => void;
  isGenerating: boolean;
  language: string;
  tripBudget?: number | null;
  /** Lodging already saved on trip entity (prefills hotelNameOrUrl) */
  tripLodging?: string | null;
}

export const ItineraryPreferencesFormEnhanced: React.FC<ItineraryPreferencesFormProps> = ({
  tripId,
  onSubmit,
  isGenerating,
  language,
  tripBudget,
  tripLodging,
}) => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      interests: [],
      travelStyle: "Balanced",
      budget: tripBudget ? String(tripBudget) : "Mid-Range",
      hotelNameOrUrl: tripLodging || undefined,
    },
  });

  const toggleInterest = (interest: string) => {
    const newInterests = selectedInterests.includes(interest)
      ? selectedInterests.filter(i => i !== interest)
      : [...selectedInterests, interest];
    setSelectedInterests(newInterests);
    // Update react-hook-form so validation sees the selected interests
    setValue("interests", newInterests as any, { shouldValidate: true, shouldDirty: true });
  };

  const onFormSubmit = (data: PreferencesFormData) => {
    // Align kidsAges length with kidsCount if provided
    let kidsAges = data.kidsAges;
    if (typeof data.kidsCount === 'number') {
      kidsAges = (kidsAges || []).slice(0, data.kidsCount);
    } else {
      kidsAges = undefined;
    }

    onSubmit({
      ...data,
      interests: selectedInterests,
      language,
      kidsAges,
    } as any);
  };

  // Ensure language conforms to supported Lang union; fallback handled in getDictionary
  const dict = getDictionary(language as any).itineraryPreferences;
  const validationMap: Record<string,string|undefined> = {
    adultsMin: dict?.validation?.adultsMin,
    kidsCountInvalid: dict?.validation?.kidsCountInvalid,
    kidsAgesMismatch: dict?.validation?.kidsAgesMismatch,
    distanceInvalid: dict?.validation?.distanceInvalid,
  };
  const interests = dict?.interests ?? [];
  const travelStyleOptions = dict?.travelStyles ?? [];
  const budgetOptions = dict?.budgetOptions ?? [];

  return (
    <Card className="max-w-2xl mx-auto bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-xl">
      <CardHeader className="text-center pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-t-lg">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <CardTitle className="text-lg text-slate-900 dark:text-slate-100">{dict?.title}</CardTitle>
        <p className="text-slate-600 dark:text-slate-400 text-xs">{dict?.subtitle}</p>
      </CardHeader>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Interests Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {dict?.interestsLabel}
              {dict?.interestsHint && (
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">{dict.interestsHint}</span>
              )}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {interests.map((interestObj) => {
                const interest = interestObj.label;
                const isSelected = selectedInterests.includes(interest);
                return (
                  <div
                    key={interestObj.key}
                    onClick={() => toggleInterest(interest)}
                    className={`p-2 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-sm"
                        : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-500"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-3 h-3 rounded border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? "bg-blue-500 border-blue-500"
                            : "border-slate-300 dark:border-slate-600"
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-xs font-medium ${isSelected ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-300"}`}>{interestObj.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {errors.interests && (
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errors.interests.message}
              </p>
            )}
            {/* Hidden input to ensure the field is registered even though we manage it manually */}
            <input type="hidden" value={selectedInterests.join("||")} {...register("interests")} />
          </div>

          {/* Travel Style Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100">{dict?.travelStyleLabel}</label>
            <div className="space-y-2">
              {travelStyleOptions.map((style) => (
                <label
                  key={style.value}
                  className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    watch("travelStyle") === style.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-sm"
                      : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-500"
                  }`}
                >
                  <input
                    type="radio"
                    {...register("travelStyle")}
                    value={style.value}
                    className="sr-only"
                  />
                  <div
                    className={`w-3 h-3 rounded-full border-2 mr-3 flex items-center justify-center transition-colors ${
                      watch("travelStyle") === style.value
                        ? "border-blue-500"
                        : "border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    {watch("travelStyle") === style.value && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <span className={`font-medium text-sm ${watch("travelStyle") === style.value ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-300"}`}>{style.label}</span>
                    {style.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{style.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Budget Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-900 dark:text-slate-100">{dict?.budgetLabel}</label>
            {tripBudget ? (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-green-800 dark:text-green-200">{dict?.budgetAlreadySet}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {dict?.budgetAmountLabel} <span className="font-medium">{tripBudget}</span>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {budgetOptions.map((budget) => (
                  <label
                    key={budget.value}
                    className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                      watch("budget") === budget.value
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-sm"
                        : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-500"
                    }`}
                  >
                    <input
                      type="radio"
                      {...register("budget")}
                      value={budget.value}
                      className="sr-only"
                    />
                    <div
                      className={`w-3 h-3 rounded-full border-2 mr-3 flex items-center justify-center transition-colors ${
                        watch("budget") === budget.value
                          ? "border-blue-500"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {watch("budget") === budget.value && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <span className={`font-medium text-sm ${watch("budget") === budget.value ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-300"}`}>{budget.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Optional Traveler Composition */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
              {dict?.travelPartyLabel}
              {dict?.tooltip?.travelParty && (
                <span title={dict.tooltip.travelParty} className="cursor-help text-slate-400 dark:text-slate-500">ⓘ</span>
              )}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Input
                  type="number"
                  placeholder={dict?.adultsPlaceholder || 'Adults'}
                  min={1}
                  {...register('adultsCount', { valueAsNumber: true })}
                  className="text-sm"
                />
                {errors.adultsCount && <p className="text-xs text-red-600 dark:text-red-400">{validationMap[errors.adultsCount.message || ''] || errors.adultsCount.message}</p>}
              </div>
              <div className="space-y-1">
                <Input
                  type="number"
                  placeholder={dict?.kidsPlaceholder || 'Kids'}
                  min={0}
                  {...register('kidsCount', { valueAsNumber: true })}
                  className="text-sm"
                />
                {errors.kidsCount && <p className="text-xs text-red-600 dark:text-red-400">{validationMap[errors.kidsCount.message || ''] || errors.kidsCount.message}</p>}
              </div>
            </div>
            {/* Kids ages section only renders when kidsCount is a valid positive number.
                Previous logic could render literal NaN due to JS && operator returning NaN.
                We guard explicitly against non-number / NaN values. */}
            {(() => {
              const kc = watch('kidsCount');
              const isValidPositive = typeof kc === 'number' && !Number.isNaN(kc) && kc > 0;
              return isValidPositive;
            })() && (
              <div className="space-y-2">
                <p className="text-xs text-slate-600 dark:text-slate-400">{dict?.kidsAgesHint}</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: Math.min(20, watch('kidsCount') || 0) }).map((_, idx) => (
                    <input
                      key={idx}
                      type="number"
                      aria-label={`Kid ${idx + 1} age`}
                      min={0}
                      max={17}
                      className="w-16 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-2 py-1 text-xs"
                      onChange={(e) => {
                        const val = e.target.value ? parseInt(e.target.value, 10) : NaN;
                        const current = watch('kidsAges') || [];
                        const next = [...current];
                        next[idx] = isNaN(val) ? undefined as any : val;
                        setValue('kidsAges', next.filter(v => v !== undefined) as any, { shouldDirty: true, shouldValidate: true });
                      }}
                    />
                  ))}
                </div>
                {errors.kidsAges && <p className="text-xs text-red-600 dark:text-red-400">{validationMap[errors.kidsAges.message || ''] || errors.kidsAges.message as any}</p>}
              </div>
            )}
          </div>

          {/* Optional Lodging & Distance */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
              {dict?.lodgingDistanceLabel}
              {dict?.tooltip?.lodging && (
                <span title={dict.tooltip.lodging} className="cursor-help text-slate-400 dark:text-slate-500">ⓘ</span>
              )}
            </label>
            <div className="space-y-2">
              <Input
                type="text"
                placeholder={dict?.lodgingPlaceholder || 'Hotel name / URL / address'}
                {...register('hotelNameOrUrl')}
                className="text-sm"
              />
              {errors.hotelNameOrUrl && <p className="text-xs text-red-600 dark:text-red-400">{errors.hotelNameOrUrl.message}</p>}
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder={dict?.distancePlaceholder || 'Max travel km'}
                  min={1}
                  {...register('maxTravelDistanceKm', { valueAsNumber: true })}
                  className="text-sm"
                />
                {errors.maxTravelDistanceKm && <p className="text-xs text-red-600 dark:text-red-400">{validationMap[errors.maxTravelDistanceKm.message || ''] || errors.maxTravelDistanceKm.message}</p>}
                {dict?.tooltip?.distance && (
                  <span title={dict.tooltip.distance} className="cursor-help text-slate-400 dark:text-slate-500">ⓘ</span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{dict?.distanceHelper}</p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isGenerating}
              className="w-full h-11 text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {dict?.generating}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {dict?.submit}
                </div>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};