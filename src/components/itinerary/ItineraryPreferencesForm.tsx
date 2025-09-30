import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ItineraryPreferences } from "@/types";
import { Input } from "../ui/input";

const interests = ["Sztuka", "Historia", "Przyroda", "Jedzenie", "Rozrywka"];

const travelStyleOptions: { label: string; value: ItineraryPreferences["travelStyle"] }[] = [
  { label: "Relaksacyjny", value: "Relaxed" },
  { label: "Zrównoważony", value: "Balanced" },
  { label: "Intensywny", value: "Intense" },
];

const budgetOptions: { label: string; value: string }[] = [
  { label: "Niski", value: "Budget-Friendly" },
  { label: "Średni", value: "Mid-Range" },
  { label: "Wysoki", value: "Luxury" },
];

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

export const ItineraryPreferencesForm: React.FC<ItineraryPreferencesFormProps> = ({
  tripId,
  onSubmit,
  isGenerating,
  language,
  tripBudget,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      interests: [],
      travelStyle: "Balanced",
      budget: tripBudget ? String(tripBudget) : "Mid-Range",
    },
  });

  const handleFormSubmit = (data: PreferencesFormData) => {
    onSubmit({ ...data, language });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wygeneruj inteligentny plan podróży</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Zainteresowania</label>
            <div className="mt-2 grid grid-cols-2 gap-4">
              {interests.map((interest) => (
                <div key={interest} className="flex items-center">
                  <input
                    id={interest}
                    type="checkbox"
                    value={interest}
                    {...register("interests")}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor={interest} className="ml-3 block text-sm text-gray-900">
                    {interest}
                  </label>
                </div>
              ))}
            </div>
            {errors.interests && <p className="mt-2 text-sm text-red-600">{errors.interests.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Styl podróży</label>
            <div className="mt-2 space-y-2">
              {travelStyleOptions.map((style) => (
                <div key={style.value} className="flex items-center">
                  <input
                    id={style.value}
                    type="radio"
                    value={style.value}
                    {...register("travelStyle")}
                    className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor={style.value} className="ml-3 block text-sm text-gray-900">
                    {style.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Budżet</label>
            <div className="mt-2">
              {tripBudget ? (
                <Input
                  type="text"
                  readOnly
                  value={`Zdefiniowany budżet: ${tripBudget}`}
                  className="block w-full rounded-md border-gray-300 bg-gray-100 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                />
              ) : (
                <select
                  {...register("budget")}
                  className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                >
                  {budgetOptions.map((budget) => (
                    <option key={budget.value} value={budget.value}>
                      {budget.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <Button type="submit" disabled={isGenerating}>
            {isGenerating ? "Generowanie..." : "Wygeneruj plan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
