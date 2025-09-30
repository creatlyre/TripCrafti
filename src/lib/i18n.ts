export type Lang = "en" | "pl";

interface Dictionary {
  hero: {
    badge: string;
    heading: string;
    sub: string;
    cta: string;
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
      sub: "TripCrafti łączy manualną kontrolę z inteligencją AI abyś mógł bez wysiłku tworzyć niezapomniane wyjazdy – od wizji i budżetu po spakowaną torbę.",
      cta: "Zacznij – Zaloguj się",
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
      heading: "Plan smarter. Pack better. Travel lighter.",
      sub: "TripCrafti unifies manual precision with intelligent automation so you can design unforgettable journeys effortlessly — from vision and budgeting to the final packed bag.",
      cta: "Get Started – Log In",
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
