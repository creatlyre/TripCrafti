export type Lang = 'en' | 'pl';

interface DictionarySection {
  [key: string]: string;
}

interface Dictionary {
  hero: {
    badge: string;
    heading: string;
    sub: string;
    cta: string;
  };
  features: Array<{ title: string; desc: string }>;
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
    create: {
      heading: string;
      description: string;
      title: string;
      destination: string;
      budget: string;
      start: string;
      end: string;
      submit: string;
      requiredHint: string;
    };
    empty: string;
    listLabel: string;
    loading: string;
    redirecting: string;
    checking: string;
    open: string;
    dates: string;
    budget: string;
  };
}

const year = new Date().getFullYear();

export const dictionaries: Record<Lang, Dictionary> = {
  pl: {
    hero: {
      badge: 'Wszechstronne AI narzędzie podróżne',
      heading: 'Planuj mądrze. Pakuj szybciej. Podróżuj wygodniej.',
      sub: 'TripCraft łączy manualną kontrolę z inteligencją AI abyś mógł bez wysiłku tworzyć niezapomniane wyjazdy – od wizji i budżetu po spakowaną torbę.',
      cta: 'Zacznij – Zaloguj się',
    },
    features: [
      { title: 'Planuj każdy detal', desc: 'Organizuj wyjazdy, rezerwacje, aktywności i notatki w jednym miejscu.' },
      { title: 'Błyskawiczne itineraria AI', desc: 'Wpisz cel, daty i zainteresowania – otrzymasz edytowalny plan dnia.' },
      { title: 'Inteligentne listy pakowania', desc: 'Adaptacyjne, kategoryzowane listy dostosowane do pogody i aktywności.' },
      { title: 'Świadomy budżet', desc: 'Śledź koszty dodając rezerwacje i aktywności – trzymaj kurs.' },
      { title: 'Kontrola hybrydowa', desc: 'Łącz własną precyzję z podpowiedziami AI – akceptuj, modyfikuj, ulepszaj.' },
      { title: 'Bezstresowe przygotowania', desc: 'Od inspiracji do spakowania – mniej tarcia na każdym etapie.' },
    ],
    footer: { copyright: `© ${year} TripCraft. Wszelkie prawa zastrzeżone.` },
    login: {
      heading: 'Logowanie',
      sub: 'Logowanie poprzez Supabase zostanie wkrótce dodane.',
      email: 'Email',
      password: 'Hasło',
      submit: 'Kontynuuj',
      disclaimer: 'Formularz to placeholder – przyszła implementacja użyje Supabase.',
      back: 'Powrót',
    },
    langSwitcher: { label: 'Język', english: 'Angielski', polish: 'Polski' },
    dashboard: {
      heading: 'Twoje Podróże',
      sub: 'Planuj, organizuj i rozwijaj swoje wyjazdy.',
      refresh: 'Odśwież',
      create: {
        heading: 'Utwórz nową podróż',
        description: 'Zacznij od podstaw – później dodasz rezerwacje, wydatki i aktywności.',
        title: 'Tytuł',
        destination: 'Cel',
        budget: 'Budżet (opcjonalnie)',
        start: 'Data startu',
        end: 'Data końca',
        submit: 'Utwórz podróż',
        requiredHint: 'Wszystkie pola oprócz budżetu są wymagane.'
      },
      empty: 'Brak podróży. Utwórz pierwszą powyżej.',
      listLabel: 'Istniejące podróże',
      loading: 'Ładowanie podróży…',
      redirecting: 'Przekierowanie do logowania…',
      checking: 'Sprawdzanie sesji…',
      open: 'Otwórz',
      dates: 'Daty',
      budget: 'Budżet'
    },
  },
  en: {
    hero: {
      badge: 'All-in-one AI travel workspace',
      heading: 'Plan smarter. Pack better. Travel lighter.',
      sub: 'TripCraft unifies manual precision with intelligent automation so you can design unforgettable journeys effortlessly — from vision and budgeting to the final packed bag.',
      cta: 'Get Started – Log In',
    },
    features: [
      { title: 'Plan Every Detail', desc: 'Organize trips, bookings, activities and notes in one clear workspace.' },
      { title: 'Instant AI Itineraries', desc: 'Turn destination, dates & interests into an editable day-by-day plan.' },
      { title: 'Smart Packing Lists', desc: 'Adaptive, categorized lists that adjust to weather & activities.' },
      { title: 'Budget Awareness', desc: 'Track costs as you add bookings & activities—stay on target.' },
      { title: 'Hybrid Control', desc: 'Blend manual precision with AI suggestions—accept, tweak, refine.' },
      { title: 'Stress-Free Prep', desc: 'From inspiration to packed bag—reduce planning friction at every step.' },
    ],
    footer: { copyright: `© ${year} TripCraft. All rights reserved.` },
    login: {
      heading: 'Log in',
      sub: 'Authentication flow will be implemented with Supabase.',
      email: 'Email',
      password: 'Password',
      submit: 'Continue',
      disclaimer: 'Form is a non-functional placeholder. Future implementation will use Supabase auth.',
      back: 'Back',
    },
    langSwitcher: { label: 'Language', english: 'English', polish: 'Polish' },
    dashboard: {
      heading: 'Your Trips',
      sub: 'Plan, organize and enrich your journeys.',
      refresh: 'Refresh',
      create: {
        heading: 'Create a new trip',
        description: 'Start with the basics. You can later add bookings, expenses and activities.',
        title: 'Title',
        destination: 'Destination',
        budget: 'Budget (optional)',
        start: 'Start date',
        end: 'End date',
        submit: 'Create Trip',
        requiredHint: 'All fields except budget are required.'
      },
      empty: 'No trips yet. Create your first one above.',
      listLabel: 'Existing trips',
      loading: 'Loading trips…',
      redirecting: 'Redirecting to login…',
      checking: 'Checking session…',
      open: 'Open',
      dates: 'Dates',
      budget: 'Budget'
    },
  },
};

export function getDictionary(lang: Lang): Dictionary {
  return dictionaries[lang] ?? dictionaries.pl;
}
