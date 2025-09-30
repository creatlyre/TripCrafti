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

const preferencesSchema = z.object({
  interests: z.array(z.string()).min(1, "Wybierz co najmniej jedną kategorię"),
  travelStyle: z.enum(["Relaxed", "Balanced", "Intense"]),
  budget: z.string(),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

interface ItineraryPreferencesFormProps {
  tripId: string;
  onSubmit: (data: ItineraryPreferences) => void;
  isGenerating: boolean;
  language: string;
  tripBudget?: number | null;
}

export const ItineraryPreferencesFormEnhanced: React.FC<ItineraryPreferencesFormProps> = ({
  tripId,
  onSubmit,
  isGenerating,
  language,
  tripBudget,
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
    },
  });

  const toggleInterest = (interest: string) => {
    const newInterests = selectedInterests.includes(interest)
      ? selectedInterests.filter(i => i !== interest)
      : [...selectedInterests, interest];
    setSelectedInterests(newInterests);
    // Update react-hook-form's internal field so Zod validation sees the selected interests
    setValue("interests", newInterests as any, { shouldValidate: true, shouldDirty: true });
  };

  const onFormSubmit = (data: PreferencesFormData) => {
    onSubmit({ ...data, interests: selectedInterests, language });
  };

  // Ensure language conforms to supported Lang union; fallback handled in getDictionary
  const dict = getDictionary(language as any).itineraryPreferences;
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