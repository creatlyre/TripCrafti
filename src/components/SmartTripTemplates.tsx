import {
  Briefcase,
  Palmtree,
  Mountain,
  Users,
  Heart,
  Camera,
  Plane,
  Building,
  MapPin,
  Calendar,
  DollarSign,
  Sparkles,
} from 'lucide-react';
import React, { useState } from 'react';

import type { Lang } from '@/lib/i18n';

import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';

interface TripTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  defaultBudget?: number;
  defaultDuration: number;
  suggestedCategories: string[];
  tips: string[];
  popularDestinations: string[];
}

interface SmartTripTemplatesProps {
  lang: Lang;
  onCreateFromTemplate: (
    template: TripTemplate,
    customization: {
      title: string;
      destination: string;
      budget?: number;
      currency: string;
      duration: number;
      startDate?: string;
      notes?: string;
    }
  ) => void;
}

const SmartTripTemplates: React.FC<SmartTripTemplatesProps> = ({ lang, onCreateFromTemplate }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<TripTemplate | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customization, setCustomization] = useState({
    title: '',
    destination: '',
    budget: undefined as number | undefined,
    currency: 'EUR',
    duration: 7,
    startDate: '',
    notes: '',
    customDestination: false,
  });

  const templates: TripTemplate[] = [
    {
      id: 'business',
      name: lang === 'pl' ? 'Podróż służbowa' : 'Business Trip',
      description:
        lang === 'pl'
          ? 'Profesjonalna podróż z naciskiem na spotkania i networking'
          : 'Professional travel focused on meetings and networking',
      icon: <Briefcase className="w-6 h-6" />,
      color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      defaultBudget: 2000,
      defaultDuration: 3,
      suggestedCategories: [
        lang === 'pl' ? 'Transport' : 'Transportation',
        lang === 'pl' ? 'Zakwaterowanie' : 'Accommodation',
        lang === 'pl' ? 'Posiłki' : 'Meals',
        lang === 'pl' ? 'Materiały biurowe' : 'Business supplies',
      ],
      tips: [
        lang === 'pl' ? 'Zarezerwuj hotel blisko centrum biznesowego' : 'Book hotel near business district',
        lang === 'pl' ? 'Uwzględ czas na networking' : 'Plan time for networking',
        lang === 'pl' ? 'Spakuj ubrania formalne' : 'Pack formal attire',
      ],
      popularDestinations: ['London', 'New York', 'Singapore', 'Frankfurt', 'Dubai'],
    },
    {
      id: 'leisure',
      name: lang === 'pl' ? 'Wakacje' : 'Leisure Vacation',
      description:
        lang === 'pl' ? 'Relaksujące wakacje z rodziną lub przyjaciółmi' : 'Relaxing vacation with family or friends',
      icon: <Palmtree className="w-6 h-6" />,
      color: 'bg-green-500/20 text-green-300 border-green-500/30',
      defaultBudget: 3000,
      defaultDuration: 10,
      suggestedCategories: [
        lang === 'pl' ? 'Transport' : 'Transportation',
        lang === 'pl' ? 'Zakwaterowanie' : 'Accommodation',
        lang === 'pl' ? 'Jedzenie' : 'Food',
        lang === 'pl' ? 'Rozrywka' : 'Entertainment',
        lang === 'pl' ? 'Pamiątki' : 'Souvenirs',
      ],
      tips: [
        lang === 'pl' ? 'Zaplanuj dni relaksu' : 'Plan relaxation days',
        lang === 'pl' ? 'Sprawdź lokalne atrakcje' : 'Check local attractions',
        lang === 'pl' ? 'Nie planuj zbyt intensywnie' : "Don't overplan",
      ],
      popularDestinations: ['Bali', 'Santorini', 'Maldives', 'Hawaii', 'Costa Rica'],
    },
    {
      id: 'adventure',
      name: lang === 'pl' ? 'Przygoda' : 'Adventure',
      description:
        lang === 'pl' ? 'Aktywna podróż pełna adrenaliny i przygód' : 'Active travel full of adrenaline and adventures',
      icon: <Mountain className="w-6 h-6" />,
      color: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      defaultBudget: 2500,
      defaultDuration: 8,
      suggestedCategories: [
        lang === 'pl' ? 'Transport' : 'Transportation',
        lang === 'pl' ? 'Zakwaterowanie' : 'Accommodation',
        lang === 'pl' ? 'Sprzęt' : 'Equipment',
        lang === 'pl' ? 'Przewodnicy' : 'Guides',
        lang === 'pl' ? 'Ubezpieczenie' : 'Insurance',
      ],
      tips: [
        lang === 'pl' ? 'Sprawdź pogodę w sezonie' : 'Check seasonal weather',
        lang === 'pl' ? 'Spakuj odpowiedni sprzęt' : 'Pack proper equipment',
        lang === 'pl' ? 'Sprawdź wymagania fizyczne' : 'Check physical requirements',
      ],
      popularDestinations: ['Nepal', 'Patagonia', 'New Zealand', 'Iceland', 'Peru'],
    },
    {
      id: 'family',
      name: lang === 'pl' ? 'Rodzinne' : 'Family Trip',
      description:
        lang === 'pl'
          ? 'Podróż dostosowana do potrzeb całej rodziny'
          : 'Travel adapted to the needs of the whole family',
      icon: <Users className="w-6 h-6" />,
      color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      defaultBudget: 4000,
      defaultDuration: 12,
      suggestedCategories: [
        lang === 'pl' ? 'Transport' : 'Transportation',
        lang === 'pl' ? 'Zakwaterowanie' : 'Accommodation',
        lang === 'pl' ? 'Jedzenie' : 'Food',
        lang === 'pl' ? 'Zabawki i gry' : 'Toys and games',
        lang === 'pl' ? 'Opieka medyczna' : 'Medical care',
      ],
      tips: [
        lang === 'pl' ? 'Wybierz hotele przyjazne rodzinom' : 'Choose family-friendly hotels',
        lang === 'pl' ? 'Planuj krótsze etapy podróży' : 'Plan shorter travel segments',
        lang === 'pl' ? 'Zabierz ulubione przekąski dzieci' : "Bring kids' favorite snacks",
      ],
      popularDestinations: ['Orlando', 'Tokyo', 'Barcelona', 'Amsterdam', 'Copenhagen'],
    },
    {
      id: 'romantic',
      name: lang === 'pl' ? 'Romantyczna' : 'Romantic Getaway',
      description:
        lang === 'pl'
          ? 'Intymna podróż dla par w romantycznej atmosferze'
          : 'Intimate travel for couples in romantic atmosphere',
      icon: <Heart className="w-6 h-6" />,
      color: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
      defaultBudget: 3500,
      defaultDuration: 5,
      suggestedCategories: [
        lang === 'pl' ? 'Transport' : 'Transportation',
        lang === 'pl' ? 'Luksusowe zakwaterowanie' : 'Luxury accommodation',
        lang === 'pl' ? 'Kolacje' : 'Fine dining',
        lang === 'pl' ? 'Spa i wellness' : 'Spa and wellness',
        lang === 'pl' ? 'Prezenty' : 'Gifts',
      ],
      tips: [
        lang === 'pl' ? 'Zarezerwuj kolacje z widokiem' : 'Book dinners with a view',
        lang === 'pl' ? 'Wybierz hotele z spa' : 'Choose hotels with spa',
        lang === 'pl' ? 'Planuj niespodzianki' : 'Plan surprises',
      ],
      popularDestinations: ['Paris', 'Venice', 'Maldives', 'Kyoto', 'Tuscany'],
    },
    {
      id: 'photography',
      name: lang === 'pl' ? 'Fotograficzna' : 'Photography',
      description:
        lang === 'pl'
          ? 'Podróż skoncentrowana na fotografii i dokumentowaniu'
          : 'Travel focused on photography and documentation',
      icon: <Camera className="w-6 h-6" />,
      color: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      defaultBudget: 2800,
      defaultDuration: 9,
      suggestedCategories: [
        lang === 'pl' ? 'Transport' : 'Transportation',
        lang === 'pl' ? 'Zakwaterowanie' : 'Accommodation',
        lang === 'pl' ? 'Sprzęt fotograficzny' : 'Photography equipment',
        lang === 'pl' ? 'Przepustki' : 'Permits',
        lang === 'pl' ? 'Przewodnicy lokalni' : 'Local guides',
      ],
      tips: [
        lang === 'pl' ? 'Sprawdź najlepsze godziny dla zdjęć' : 'Check best hours for photos',
        lang === 'pl' ? 'Zaplanuj wschody i zachody słońca' : 'Plan sunrises and sunsets',
        lang === 'pl' ? 'Zabierz dodatkowe baterie' : 'Bring extra batteries',
      ],
      popularDestinations: ['Iceland', 'Morocco', 'Japan', 'Norway', 'Madagascar'],
    },
    {
      id: 'cultural',
      name: lang === 'pl' ? 'Kulturalna' : 'Cultural & Heritage',
      description:
        lang === 'pl'
          ? 'Odkryj historię i kulturę lokalnych społeczności'
          : 'Discover history and culture of local communities',
      icon: <Building className="w-6 h-6" />,
      color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      defaultBudget: 2200,
      defaultDuration: 8,
      suggestedCategories: [
        lang === 'pl' ? 'Transport' : 'Transportation',
        lang === 'pl' ? 'Zakwaterowanie' : 'Accommodation',
        lang === 'pl' ? 'Bilety do muzeów' : 'Museum tickets',
        lang === 'pl' ? 'Przewodnicy' : 'Guided tours',
        lang === 'pl' ? 'Jedzenie lokalne' : 'Local cuisine',
      ],
      tips: [
        lang === 'pl' ? 'Sprawdź godziny otwarcia muzeów' : 'Check museum opening hours',
        lang === 'pl' ? 'Zarezerwuj miejsca z wyprzedzeniem' : 'Book tickets in advance',
        lang === 'pl' ? 'Naucz się podstawowych zwrotów w lokalnym języku' : 'Learn basic local phrases',
      ],
      popularDestinations: ['Rome', 'Cairo', 'Athens', 'Istanbul', 'Angkor Wat'],
    },
    {
      id: 'wellness',
      name: lang === 'pl' ? 'Wellness & Spa' : 'Wellness & Spa',
      description:
        lang === 'pl' ? 'Podróż skoncentrowana na relaksie i odnowie' : 'Travel focused on relaxation and rejuvenation',
      icon: <Sparkles className="w-6 h-6" />,
      color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      defaultBudget: 3800,
      defaultDuration: 7,
      suggestedCategories: [
        lang === 'pl' ? 'Transport' : 'Transportation',
        lang === 'pl' ? 'Resort Spa' : 'Spa Resort',
        lang === 'pl' ? 'Zabiegi' : 'Treatments',
        lang === 'pl' ? 'Zdrowe jedzenie' : 'Healthy meals',
        lang === 'pl' ? 'Aktywności wellness' : 'Wellness activities',
      ],
      tips: [
        lang === 'pl' ? 'Zarezerwuj zabiegi z wyprzedzeniem' : 'Book treatments in advance',
        lang === 'pl' ? 'Spakuj wygodną odzież' : 'Pack comfortable clothing',
        lang === 'pl' ? 'Sprawdź dostępność jogi i medytacji' : 'Check yoga and meditation availability',
      ],
      popularDestinations: ['Bali', 'Tulum', 'Thailand', 'Slovenia', 'Costa Rica'],
    },
    {
      id: 'backpacking',
      name: lang === 'pl' ? 'Backpacking' : 'Budget Backpacking',
      description:
        lang === 'pl' ? 'Przygoda z plecakiem dla oszczędnych podróżników' : 'Budget adventure for thrifty travelers',
      icon: <Mountain className="w-6 h-6" />,
      color: 'bg-green-600/20 text-green-300 border-green-600/30',
      defaultBudget: 800,
      defaultDuration: 14,
      suggestedCategories: [
        lang === 'pl' ? 'Transport publiczny' : 'Public transport',
        lang === 'pl' ? 'Hostele' : 'Hostels',
        lang === 'pl' ? 'Jedzenie uliczne' : 'Street food',
        lang === 'pl' ? 'Sprzęt turystyczny' : 'Travel gear',
        lang === 'pl' ? 'Komunikacja' : 'Communication',
      ],
      tips: [
        lang === 'pl' ? 'Spakuj tylko niezbędne rzeczy' : 'Pack only essentials',
        lang === 'pl' ? 'Korzystaj z transportu publicznego' : 'Use public transportation',
        lang === 'pl' ? 'Wybierz hostele z dobrymi opiniami' : 'Choose well-reviewed hostels',
      ],
      popularDestinations: ['Vietnam', 'Guatemala', 'India', 'Eastern Europe', 'Southeast Asia'],
    },
    {
      id: 'luxury',
      name: lang === 'pl' ? 'Luksusowa' : 'Luxury Experience',
      description:
        lang === 'pl' ? 'Podróż najwyższej klasy z ekskluzywną obsługą' : 'Top-tier travel with exclusive service',
      icon: <Sparkles className="w-6 h-6" />,
      color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      defaultBudget: 8000,
      defaultDuration: 8,
      suggestedCategories: [
        lang === 'pl' ? 'Transport premium' : 'Premium transport',
        lang === 'pl' ? 'Hotele 5-gwiazdkowe' : '5-star hotels',
        lang === 'pl' ? 'Kolacje gourmet' : 'Gourmet dining',
        lang === 'pl' ? 'Przewodnicy prywatni' : 'Private guides',
        lang === 'pl' ? 'Ekskluzywne aktywności' : 'Exclusive activities',
      ],
      tips: [
        lang === 'pl' ? 'Zarezerwuj z wyprzedzeniem' : 'Book well in advance',
        lang === 'pl' ? 'Sprawdź usługi concierge' : 'Check concierge services',
        lang === 'pl' ? 'Rozważ prywatne transfery' : 'Consider private transfers',
      ],
      popularDestinations: ['Monaco', 'Maldives', 'Swiss Alps', 'Napa Valley', 'Dubai'],
    },
  ];

  const handleTemplateSelect = (template: TripTemplate) => {
    setSelectedTemplate(template);
    setCustomization({
      title: `${template.name} - ${new Date().getFullYear()}`,
      destination: '',
      budget: template.defaultBudget,
      currency: 'EUR',
      duration: template.defaultDuration,
      startDate: '',
      notes: '',
      customDestination: false,
    });
    setIsCustomizing(true);
  };

  const handleCreateTrip = () => {
    if (selectedTemplate && customization.title && customization.destination) {
      onCreateFromTemplate(selectedTemplate, customization);
      setIsCustomizing(false);
      setSelectedTemplate(null);
      setCustomization({
        title: '',
        destination: '',
        budget: undefined,
        currency: 'EUR',
        duration: 7,
        startDate: '',
        notes: '',
        customDestination: false,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-slate-200 flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-400" />
          {lang === 'pl' ? 'Inteligentne Szablony Podróży' : 'Smart Trip Templates'}
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          {lang === 'pl'
            ? 'Wybierz szablon dostosowany do typu podróży i rozpocznij planowanie z gotowymi rekomendacjami'
            : 'Choose a template tailored to your trip type and start planning with ready recommendations'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card
            key={template.id}
            className="bg-slate-900/50 border-slate-800 hover:border-slate-600 transition-all duration-200 cursor-pointer group"
            onClick={() => handleTemplateSelect(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg ${template.color}`}>{template.icon}</div>
                <Badge variant="outline" className="text-xs">
                  {template.defaultDuration} {lang === 'pl' ? 'dni' : 'days'}
                </Badge>
              </div>
              <CardTitle className="text-lg font-semibold text-slate-200 group-hover:text-white transition-colors">
                {template.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-400 leading-relaxed">{template.description}</p>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-slate-300 mb-1">
                    {lang === 'pl' ? 'Kategorie budżetu:' : 'Budget categories:'}
                  </p>
                  <p className="text-xs text-slate-500 mb-2">
                    {lang === 'pl' ? 'Automatycznie dodane do budżetu' : 'Auto-added to budget'}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {template.suggestedCategories.slice(0, 3).map((category, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                    {template.suggestedCategories.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.suggestedCategories.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-300 mb-2">
                    {lang === 'pl' ? 'Popularne destynacje:' : 'Popular destinations:'}
                  </p>
                  <p className="text-xs text-slate-500">{template.popularDestinations.slice(0, 3).join(', ')}</p>
                </div>

                {template.defaultBudget && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <DollarSign className="w-3 h-3" />
                    {lang === 'pl' ? 'Sugerowany budżet:' : 'Suggested budget:'} $
                    {template.defaultBudget.toLocaleString()}
                  </div>
                )}
              </div>

              <Button
                size="sm"
                className="w-full group-hover:bg-indigo-600 group-hover:text-white transition-colors"
                variant="outline"
              >
                {lang === 'pl' ? 'Użyj szablonu' : 'Use template'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Customization Dialog */}
      <Dialog open={isCustomizing} onOpenChange={setIsCustomizing}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTemplate?.icon}
              {lang === 'pl' ? 'Dostosuj podróż' : 'Customize trip'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">{lang === 'pl' ? 'Nazwa podróży' : 'Trip title'}</Label>
              <Input
                id="title"
                value={customization.title}
                onChange={(e) => setCustomization({ ...customization, title: e.target.value })}
                placeholder={lang === 'pl' ? 'Np. Wakacje w Grecji 2024' : 'e.g. Greece Vacation 2024'}
              />
            </div>

            <div>
              <Label htmlFor="destination">{lang === 'pl' ? 'Destynacja' : 'Destination'}</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={!customization.customDestination ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCustomization({ ...customization, customDestination: false, destination: '' })}
                  >
                    {lang === 'pl' ? 'Popularne' : 'Popular'}
                  </Button>
                  <Button
                    type="button"
                    variant={customization.customDestination ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCustomization({ ...customization, customDestination: true, destination: '' })}
                  >
                    {lang === 'pl' ? 'Własna' : 'Custom'}
                  </Button>
                </div>

                {customization.customDestination ? (
                  <Input
                    id="destination"
                    value={customization.destination}
                    onChange={(e) => setCustomization({ ...customization, destination: e.target.value })}
                    placeholder={lang === 'pl' ? 'Wpisz destynację...' : 'Enter destination...'}
                  />
                ) : (
                  <Select
                    value={customization.destination}
                    onValueChange={(value) => setCustomization({ ...customization, destination: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={lang === 'pl' ? 'Wybierz destynację' : 'Choose destination'} />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedTemplate?.popularDestinations.map((dest) => (
                        <SelectItem key={dest} value={dest}>
                          {dest}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">{lang === 'pl' ? 'Długość (dni)' : 'Duration (days)'}</Label>
                <Input
                  id="duration"
                  type="number"
                  value={customization.duration}
                  onChange={(e) => setCustomization({ ...customization, duration: parseInt(e.target.value) || 7 })}
                  min="1"
                  max="365"
                />
              </div>

              <div>
                <Label htmlFor="currency">{lang === 'pl' ? 'Waluta' : 'Currency'}</Label>
                <Select
                  value={customization.currency}
                  onValueChange={(value) => setCustomization({ ...customization, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="PLN">PLN (zł)</SelectItem>
                    <SelectItem value="CHF">CHF (₣)</SelectItem>
                    <SelectItem value="JPY">JPY (¥)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="budget">
                {lang === 'pl' ? `Budżet (${customization.currency})` : `Budget (${customization.currency})`}
              </Label>
              <Input
                id="budget"
                type="number"
                value={customization.budget || ''}
                onChange={(e) => setCustomization({ ...customization, budget: parseInt(e.target.value) || undefined })}
                placeholder={lang === 'pl' ? 'Opcjonalne' : 'Optional'}
              />
            </div>

            <div>
              <Label htmlFor="startDate">{lang === 'pl' ? 'Data rozpoczęcia' : 'Start date'}</Label>
              <Input
                id="startDate"
                type="date"
                value={customization.startDate}
                onChange={(e) => setCustomization({ ...customization, startDate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="notes">{lang === 'pl' ? 'Notatki' : 'Notes'}</Label>
              <Textarea
                id="notes"
                value={customization.notes}
                onChange={(e) => setCustomization({ ...customization, notes: e.target.value })}
                placeholder={lang === 'pl' ? 'Dodatkowe informacje...' : 'Additional information...'}
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsCustomizing(false)} className="flex-1">
                {lang === 'pl' ? 'Anuluj' : 'Cancel'}
              </Button>
              <Button
                onClick={handleCreateTrip}
                disabled={!customization.title || !customization.destination}
                className="flex-1"
              >
                {lang === 'pl' ? 'Utwórz podróż' : 'Create trip'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SmartTripTemplates;
