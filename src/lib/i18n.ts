export type Lang = "en" | "pl";

interface Dictionary {
  hero: {
    badge: string;
    heading: string;
    sub: string;
    cta: string;
  };
  section2: {
    heading: string;
    body: string;
  };
  detailedFeatures: {
    feature1: {
      headline: string;
      body: string;
    };
    feature2: {
      headline: string;
      body: string;
    };
    feature3: {
      headline: string;
      body: string;
    };
  };
  testimonials: {
    heading: string;
    t1: {
      text: string;
      author: string;
    };
    t2: {
      text: string;
      author: string;
    };
    t3: {
      text: string;
      author: string;
    };
  };
  cta: {
    headline: string;
    body: string;
  };
  features: { title: string; desc: string }[];
  footer: { copyright: string };
  login: {
    heading: string;
    sub: string;
    email: string;
    password: string;
    submit: string;
    disclaimer: string;
    back: string;
  };
  langSwitcher: { label: string; english: string; polish: string };
  dashboard?: {
    checking: string;
    heading: string;
    sub: string;
    refresh: string;
    loading: string;
    open: string;
    openPlan: string;
    dates: string;
    budget: string;
    create: {
      add: string;
      heading: string;
      description: string;
      title: string;
      destination: string;
      start: string;
      end: string;
      duration: string;
      or: string;
      budget: string;
      submit: string;
      cancel: string;
    };
    empty: {
      heading: string;
      description: string;
    };
  };
  itineraryPreferences?: {
    title: string;
    subtitle: string;
    interestsLabel: string;
    interestsHint: string;
    travelStyleLabel: string;
    budgetLabel: string;
    budgetAlreadySet?: string;
    budgetAmountLabel?: string;
    submit: string;
    generating: string;
    generated: string;
    noItineraryTitle: string;
    noItineraryBody: string;
    travelPartyLabel?: string;
    adultsPlaceholder?: string;
    kidsPlaceholder?: string;
    kidsAgesHint?: string;
    lodgingDistanceLabel?: string;
    lodgingPlaceholder?: string;
    distancePlaceholder?: string;
    distanceHelper?: string;
    tooltip: {
      travelParty: string;
      lodging: string;
      distance: string;
    };
    validation?: {
      adultsMin?: string; kidsCountInvalid?: string; kidsAgesMismatch?: string; distanceInvalid?: string;
    };
    travelStyles: { value: string; label: string; description: string }[];
    budgetOptions: { value: string; label: string }[];
    interests: { key: string; label: string }[];
  };
}

const year = new Date().getFullYear();

export const dictionaries: Record<Lang, Dictionary> = {
  pl: {
    hero: {
      badge: "Wszechstronne AI narzędzie podróżne",
      heading: "Planuj mądrze. Pakuj szybciej. Podróżuj wygodniej.",
      sub: "Twoje centrum dowodzenia podróżą. Połącz precyzyjną kontrolę z inteligentnym wsparciem AI i ciesz się każdą chwilą.",
      cta: "Zacznij Planować",
    },
    section2: {
      heading: "Twoja Podróż, Twoje Zasady",
      body: "TripCrafti to kompleksowe narzędzie, które towarzyszy Ci od inspiracji, przez planowanie i budżetowanie, aż po pakowanie. Skup się na doświadczaniu świata – my zajmiemy się resztą.",
    },
    detailedFeatures: {
      feature1: {
        headline: "Błyskawiczny Plan Podróży",
        body: "Podaj cel, daty i zainteresowania, a nasza AI w minutę stworzy spersonalizowany plan podróży, który możesz dowolnie modyfikować.",
      },
      feature2: {
        headline: "Inteligentne Listy Pakowania",
        body: "Nasz asystent AI na podstawie danych o Twojej podróży stworzy idealną listę rzeczy do zabrania. Nigdy więcej nie zapomnisz o niczym ważnym.",
      },
      feature3: {
        headline: "Świadomy Budżet",
        body: "Śledź wydatki w czasie rzeczywistym. Ustaw budżet i kontroluj finanse, ciesząc się podróżą bez stresu.",
      },
    },
    testimonials: {
      heading: "Zaufały nam tysiące podróżników",
      t1: {
        text: "TripCrafti zrewolucjonizowało moje podróże. Planowanie stało się proste i przyjemne, a ja mam więcej czasu na odkrywanie!",
        author: "Ania, Podróżniczka",
      },
      t2: {
        text: "Dzięki tej aplikacji oszczędzam godziny na planowaniu. Funkcja list pakowania to absolutny game-changer!",
        author: "Marek, Fotograf",
      },
      t3: {
        text: "Kontrola budżetu wreszcie stała się intuicyjna. Polecam każdemu, kto chce podróżować mądrze i bez stresu.",
        author: "Kasia, Digital Nomad",
      },
    },
    cta: {
      headline: "Gotowy na Nowy Wymiar Podróżowania?",
      body: "Dołącz do społeczności TripCrafti i zacznij swoją przygodę z inteligentnym planowaniem już dziś!",
    },
    features: [
      { title: "Planuj każdy detal", desc: "Organizuj wyjazdy, rezerwacje, aktywności i notatki w jednym miejscu." },
      {
        title: "Błyskawiczne itineraria AI",
        desc: "Wpisz cel, daty i zainteresowania – otrzymasz edytowalny plan dnia.",
      },
      {
        title: "Inteligentne listy pakowania",
        desc: "Adaptacyjne, kategoryzowane listy dostosowane do pogody i aktywności.",
      },
      { title: "Świadomy budżet", desc: "Śledź koszty dodając rezerwacje i aktywności – trzymaj kurs." },
      {
        title: "Kontrola hybrydowa",
        desc: "Łącz własną precyzję z podpowiedziami AI – akceptuj, modyfikuj, ulepszaj.",
      },
      { title: "Bezstresowe przygotowania", desc: "Od inspiracji do spakowania – mniej tarcia na każdym etapie." },
    ],
    footer: { copyright: `© ${year} TripCrafti. Wszelkie prawa zastrzeżone.` },
    login: {
      heading: "Logowanie",
      sub: "Logowanie poprzez Supabase zostanie wkrótce dodane.",
      email: "Email",
      password: "Hasło",
      submit: "Kontynuuj",
      disclaimer: "Formularz to placeholder – przyszła implementacja użyje Supabase.",
      back: "Powrót",
    },
    langSwitcher: { label: "Język", english: "Angielski", polish: "Polski" },
    dashboard: {
      checking: "Sprawdzanie statusu...",
      heading: "Twoje Podróże",
      sub: "Planuj, organizuj i rozwijaj swoje wyjazdy.",
      refresh: "Odśwież",
      loading: "Ładowanie...",
      open: "Otwórz",
      openPlan: "Otwórz plan",
      dates: "Daty",
      budget: "Budżet",
      create: {
        add: "Dodaj podróż",
        heading: "Utwórz nową podróż",
        description: "Zacznij od podstaw – później dodasz rezerwacje, wydatki i aktywności.",
        title: "Tytuł",
        destination: "Cel podróży",
        start: "Data startu",
        end: "Data końca",
        duration: "Liczba dni",
        or: "lub",
        budget: "Budżet (opcjonalnie)",
        submit: "Utwórz podróż",
        cancel: "Anuluj",
      },
      empty: {
        heading: "Nie masz jeszcze żadnych podróży",
        description: "Zacznij planować swoją następną przygodę, tworząc pierwszą podróż.",
      },
    },
    itineraryPreferences: {
      title: "Wygeneruj inteligentny plan podróży",
      subtitle: "Dostosuj preferencje, a my stworzymy dla Ciebie spersonalizowany plan aktywności",
      interestsLabel: "Zainteresowania",
      interestsHint: "(wybierz co najmniej jedno)",
      travelStyleLabel: "Styl podróży",
      budgetLabel: "Budżet",
  budgetAlreadySet: "Budżet został już zdefiniowany",
  budgetAmountLabel: "Kwota:",
      travelPartyLabel: "Skład podróży (opcjonalnie)",
      adultsPlaceholder: "Dorośli",
      kidsPlaceholder: "Dzieci",
      kidsAgesHint: "Podaj wiek dzieci (0-17)",
      lodgingDistanceLabel: "Nocleg i dystans (opcjonalnie)",
      lodgingPlaceholder: "Nazwa / URL / adres hotelu",
      distancePlaceholder: "Maks. km",
      distanceHelper: "Jeśli ustawisz dystans, priorytetem będą aktywności w tym promieniu od noclegu.",
      tooltip: {
        travelParty: "Pomaga dostosować plan do rodzin (tempo, atrakcje przyjazne dzieciom).",
        lodging: "Używane do skupiania rozpoczęcia i zakończenia dnia w pobliżu hotelu.",
        distance: "AI będzie preferować aktywności w promieniu podanej liczby kilometrów od noclegu.",
      },
      validation: {
        adultsMin: "Co najmniej 1 dorosły",
        kidsCountInvalid: "Liczba dzieci nie może być ujemna",
        kidsAgesMismatch: "Podaj wiek dla każdego dziecka",
        distanceInvalid: "Dystans 1–500 km",
      },
      submit: "Wygeneruj plan",
      generating: "Generowanie planu...",
      generated: "Plan podróży wygenerowany",
      noItineraryTitle: "Brak planu podróży",
      noItineraryBody: "Wygeneruj inteligentny plan podróży na podstawie swoich preferencji i zainteresowań.",
      travelStyles: [
        { value: "Relaxed", label: "Relaksacyjny", description: "Spokojne tempo, dużo czasu na relaks" },
        { value: "Balanced", label: "Zrównoważony", description: "Idealna równowaga między zwiedzaniem a odpoczynkiem" },
        { value: "Intense", label: "Intensywny", description: "Maksimum atrakcji, dynamiczne zwiedzanie" },
      ],
      budgetOptions: [
        { value: "Budget-Friendly", label: "Niski" },
        { value: "Mid-Range", label: "Średni" },
        { value: "Luxury", label: "Wysoki" },
      ],
      interests: [
        { key: "art", label: "Sztuka" },
        { key: "history", label: "Historia" },
        { key: "nature", label: "Przyroda" },
        { key: "food", label: "Jedzenie" },
        { key: "entertainment", label: "Rozrywka" },
        { key: "architecture", label: "Architektura" },
        { key: "adventure", label: "Przygoda / Adrenalina" },
        { key: "wildlife", label: "Fauna / Zoo" },
        { key: "beach", label: "Plaża" },
        { key: "shopping", label: "Zakupy" },
        { key: "wellness", label: "Wellness & Spa" },
        { key: "nightlife", label: "Życie nocne" },
        { key: "family", label: "Rodzinne" },
        { key: "photography", label: "Fotografia" },
        { key: "technology", label: "Technologia / Nauka" },
      ],
    },
  },
  en: {
    hero: {
      badge: "All-in-one AI travel workspace",
      heading: "Plan smarter. Pack faster. Travel easier.",
      sub: "Your travel command center. Combine precise control with intelligent AI support and enjoy every moment.",
      cta: "Start Planning",
    },
    section2: {
      heading: "Your Trip, Your Rules",
      body: "TripCrafti is a comprehensive tool that accompanies you from inspiration, through planning and budgeting, to packing. Focus on experiencing the world – we'll handle the rest.",
    },
    detailedFeatures: {
      feature1: {
        headline: "Instant Trip Plans",
        body: "Provide your destination, dates, and interests, and our AI will create a personalized travel plan in a minute, which you can freely modify.",
      },
      feature2: {
        headline: "Smart AI Packing Lists",
        body: "Our AI assistant will create the perfect packing list based on your trip data. Never forget anything important again.",
      },
      feature3: {
        headline: "Conscious Budgeting",
        body: "Track your expenses in real-time. Set a budget and control your finances, enjoying a stress-free trip.",
      },
    },
    testimonials: {
      heading: "Trusted by thousands of travelers",
      t1: {
        text: "TripCrafti has revolutionized my travels. Planning has become simple and enjoyable, and I have more time for exploring!",
        author: "Anna, Traveler",
      },
      t2: {
        text: "Thanks to this app, I save hours on planning. The packing list feature is an absolute game-changer!",
        author: "Mark, Photographer",
      },
      t3: {
        text: "Budget control has finally become intuitive. I recommend it to anyone who wants to travel smart and stress-free.",
        author: "Kate, Digital Nomad",
      },
    },
    cta: {
      headline: "Ready for a New Dimension of Travel?",
      body: "Join the TripCrafti community and start your adventure with smart planning today!",
    },
    features: [
      { title: "Plan Every Detail", desc: "Organize trips, bookings, activities and notes in one clear workspace." },
      {
        title: "Instant AI Itineraries",
        desc: "Turn destination, dates & interests into an editable day-by-day plan.",
      },
      { title: "Smart Packing Lists", desc: "Adaptive, categorized lists that adjust to weather & activities." },
      { title: "Budget Awareness", desc: "Track costs as you add bookings & activities—stay on target." },
      { title: "Hybrid Control", desc: "Blend manual precision with AI suggestions—accept, tweak, refine." },
      { title: "Stress-Free Prep", desc: "From inspiration to packed bag—reduce planning friction at every step." },
    ],
    footer: { copyright: `© ${year} TripCrafti. All rights reserved.` },
    login: {
      heading: "Log in",
      sub: "Authentication flow will be implemented with Supabase.",
      email: "Email",
      password: "Password",
      submit: "Continue",
      disclaimer: "Form is a non-functional placeholder. Future implementation will use Supabase auth.",
      back: "Back",
    },
    langSwitcher: { label: "Language", english: "English", polish: "Polish" },
    dashboard: {
      checking: "Checking status...",
      heading: "Your Trips",
      sub: "Plan, organize and enrich your journeys.",
      refresh: "Refresh",
      loading: "Loading...",
      open: "Open",
      openPlan: "Open Plan",
      dates: "Dates",
      budget: "Budget",
      create: {
        add: "Add Trip",
        heading: "Create a new trip",
        description: "Start with the basics - you can add reservations, expenses, and activities later.",
        title: "Title",
        destination: "Destination",
        start: "Start Date",
        end: "End Date",
        duration: "Number of days",
        or: "or",
        budget: "Budget (optional)",
        submit: "Create Trip",
        cancel: "Cancel",
      },
      empty: {
        heading: "You don't have any trips yet",
        description: "Start planning your next adventure by creating your first trip.",
      },
    },
    itineraryPreferences: {
      title: "Generate an intelligent travel plan",
      subtitle: "Adjust your preferences and we'll create a personalized activity plan for you",
      interestsLabel: "Interests",
      interestsHint: "(select at least one)",
      travelStyleLabel: "Travel style",
      budgetLabel: "Budget",
  budgetAlreadySet: "Budget already defined",
  budgetAmountLabel: "Amount:",
      travelPartyLabel: "Travel Party (optional)",
      adultsPlaceholder: "Adults",
      kidsPlaceholder: "Kids",
      kidsAgesHint: "Provide ages (0-17)",
      lodgingDistanceLabel: "Lodging & Distance (optional)",
      lodgingPlaceholder: "Hotel name / URL / address",
      distancePlaceholder: "Max km",
      distanceHelper: "If set, prioritize activities within this radius from lodging.",
      tooltip: {
        travelParty: "Helps tailor pacing & family-friendly activities.",
        lodging: "Used to cluster start/end of day near the hotel.",
        distance: "AI will prefer activities within the given km radius from lodging.",
      },
      validation: {
        adultsMin: "At least 1 adult",
        kidsCountInvalid: "Kids cannot be negative",
        kidsAgesMismatch: "Provide an age for each child",
        distanceInvalid: "Distance 1–500 km",
      },
      submit: "Generate plan",
      generating: "Generating plan...",
      generated: "Itinerary generated",
      noItineraryTitle: "No itinerary yet",
      noItineraryBody: "Generate an intelligent travel plan based on your preferences and interests.",
      travelStyles: [
        { value: "Relaxed", label: "Relaxed", description: "Slower pace with more downtime" },
        { value: "Balanced", label: "Balanced", description: "Ideal mix of sightseeing and rest" },
        { value: "Intense", label: "Intense", description: "Maximum attractions, dynamic pacing" },
      ],
      budgetOptions: [
        { value: "Budget-Friendly", label: "Low" },
        { value: "Mid-Range", label: "Medium" },
        { value: "Luxury", label: "High" },
      ],
      interests: [
        { key: "art", label: "Art" },
        { key: "history", label: "History" },
        { key: "nature", label: "Nature" },
        { key: "food", label: "Food" },
        { key: "entertainment", label: "Entertainment" },
        { key: "architecture", label: "Architecture" },
        { key: "adventure", label: "Adventure / Thrill" },
        { key: "wildlife", label: "Wildlife / Zoo" },
        { key: "beach", label: "Beach" },
        { key: "shopping", label: "Shopping" },
        { key: "wellness", label: "Wellness & Spa" },
        { key: "nightlife", label: "Nightlife" },
        { key: "family", label: "Family" },
        { key: "photography", label: "Photography" },
        { key: "technology", label: "Technology / Science" },
      ],
    },
  },
};

export function getDictionary(lang: Lang): Dictionary {
  return dictionaries[lang] ?? dictionaries.pl;
}
