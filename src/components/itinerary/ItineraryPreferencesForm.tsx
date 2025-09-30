import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    watch,
    formState: { errors },
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      interests: [],
      travelStyle: "Balanced",
      budget: tripBudget ? String(tripBudget) : "Mid-Range",
    },
  });

  const onFormSubmit = (data: PreferencesFormData) => {
    onSubmit({ ...data, language });
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center pb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <CardTitle className="text-xl">Wygeneruj inteligentny plan podróży</CardTitle>
        <p className="text-muted-foreground text-sm">
          Dostosuj preferencje, a my stworzymy dla Ciebie spersonalizowany plan aktywności
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
          {/* Interests Section */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-foreground">
              Zainteresowania
              <span className="text-xs text-muted-foreground ml-2">(wybierz co najmniej jedno)</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {interests.map((interest) => (
                <label
                  key={interest}
                  className="flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-muted-foreground/40 peer-checked:border-primary peer-checked:bg-primary/5"
                >
                  <input
                    type="checkbox"
                    value={interest}
                    {...register("interests")}
                    className="peer sr-only"
                  />
                  <div className="w-4 h-4 rounded border-2 border-muted-foreground/40 peer-checked:bg-primary peer-checked:border-primary flex items-center justify-center transition-colors mr-3">
                    <svg className="w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium peer-checked:text-primary">
                    {interest}
                  </span>
                </label>
              ))}
            </div>
            {errors.interests && (
              <p className="text-sm text-red-500 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errors.interests.message}
              </p>
            )}
          </div>

          {/* Travel Style Section */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-foreground">Styl podróży</label>
            <div className="space-y-3">
              {travelStyleOptions.map((style) => (
                <label
                  key={style.value}
                  className="flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-muted-foreground/40 peer-checked:border-primary peer-checked:bg-primary/5"
                >
                  <input
                    type="radio"
                    value={style.value}
                    {...register("travelStyle")}
                    className="peer sr-only"
                  />
                  <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/40 peer-checked:border-primary mr-3 flex items-center justify-center transition-colors">
                    <div className="w-2 h-2 rounded-full bg-primary opacity-0 peer-checked:opacity-100" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-sm peer-checked:text-primary">
                      {style.label}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {style.value === "Relaxed" && "Spokojne tempo, dużo czasu na relaks"}
                      {style.value === "Balanced" && "Idealna równowaga między zwiedzaniem a odpoczynkiem"}
                      {style.value === "Intense" && "Maksimum atrakcji, dynamiczne zwiedzanie"}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Budget Section */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-foreground">Budżet</label>
            {tripBudget ? (
              <div className="p-4 rounded-lg bg-muted/50 border border-muted-foreground/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Budżet został już zdefiniowany</p>
                    <p className="text-xs text-muted-foreground">
                      Kwota: <span className="font-medium">{tripBudget}</span>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {budgetOptions.map((budget) => (
                  <label
                    key={budget.value}
                    className="flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-muted-foreground/40 peer-checked:border-primary peer-checked:bg-primary/5"
                  >
                    <input
                      type="radio"
                      value={budget.value}
                      {...register("budget")}
                      className="peer sr-only"
                    />
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/40 peer-checked:border-primary mr-3 flex items-center justify-center transition-colors">
                      <div className="w-2 h-2 rounded-full bg-primary opacity-0 peer-checked:opacity-100" />
                    </div>
                    <span className="font-medium text-sm peer-checked:text-primary">
                      {budget.label}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={isGenerating} 
              className="w-full h-12 text-base font-medium"
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generowanie planu...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Wygeneruj plan
                </div>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
