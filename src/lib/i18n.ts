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
  },
};

export function getDictionary(lang: Lang): Dictionary {
  return dictionaries[lang] ?? dictionaries.pl;
}
