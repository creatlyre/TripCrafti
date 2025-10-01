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
  navigation?: { home: string; dashboard?: string };
  auth?: {
    signedInAs: string;
    signOut: string;
    signingOut: string;
    goToDashboard: string;
  };
  tripCard?: {
    budgetLink: string;
    budgetAria: string;
  };
  budget?: {
    dashboard: {
      title: string;
      filters: { all: string; excludePrepaid: string; onlyPrepaid: string };
      modes?: { simple: string; full: string };
      confirmDeleteExpense?: string;
      refresh: { action: string; refreshing: string };
      expenses: {
        heading: string;
        empty: string;
        prepaidBadge: string;
        fallbackTitle: string;
      };
    };
    summary: {
      totalBudget: string;
      plannedCategoriesShort: string;
      spent: string;
      spentPrepaidShort: string;
      remaining: string;
      percentUsed: string;
      onTrip: string;
      exclPreShort: string;
      dailyTarget: string;
      autoCalc: string;
      progress: string;
      categories: string;
      categoriesEmpty: string;
      uncategorized: string;
    };
    categories: {
      heading: string;
      add: string;
      newCategory: string;
      name: string;
      plannedAmount: string;
      iconOptional: string;
      iconPlaceholder: string;
      submitCreating: string;
      submit: string;
      templates: string;
      selectTemplate: string;
      applying: string;
      apply: string;
      estPlannedTotal: string;
      ofTripBudget: string;
      budgetNotLoaded: string;
      loading: string;
      empty: string;
      confirmApplyTemplate: string;
      confirmDeleteCategory?: string;
      simpleModeHint?: string;
    };
    categoryTemplates?: Record<string, { label: string; description: string; categories: { name: string; icon?: string; portion?: number; }[] }>; 
    quickAdd: {
      fabAria: string;
      title: string;
      amount: string;
      currency: string;
      category: string;
      loadingCats: string;
      selectCategory: string;
      description: string;
      prepaid: string;
      adding: string;
      submit: string;
    };
    page: {
      titleBase: string;
      titleForTrip: string; // use {title}
      breadcrumb: { dashboard: string; budget: string };
      overview: string;
      baseCurrency: string; // label prefix
      notFound: { heading: string; body: string; back: string };
    };
    errors?: {
      loadExpenses?: string;
      loadCategories?: string;
      createCategory?: string;
      deleteFailed?: string;
      summaryFailed?: string;
    };
  };
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
    delete?: {
      heading: string;
      body: string;
      confirm: string;
      cancel: string;
      cascadingNote: string;
        action?: string;
    };
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
    authGate?: {
      mustBeSignedIn: string;
      goToLogin: string;
    };
    form?: {
      placeholders: {
        titleExample: string;
        destinationExample: string;
        durationExample: string;
        lodgingPlaceholder: string;
      };
      lodging: {
        label: string;
        tooltip: string;
      };
      currency: {
        label: string;
        selectPlaceholder: string;
      };
    };
    tabs?: {
      overview: string;
      itinerary: string;
      budget: string;
      packing: string;
      settings: string;
    };
    status?: {
      creating: string;
      deleting: string;
    };
    itinerary?: {
      generated: string;
      errorLabel: string;
    };
    placeholders?: {
      budget: { title: string; body: string };
      packing: { title: string; body: string };
      settings: { title: string; body: string };
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
  navigation: { home: "Strona główna", dashboard: "Panel" },
    auth: {
      signedInAs: "Zalogowany jako",
      signOut: "Wyloguj",
      signingOut: "Wylogowywanie…",
      goToDashboard: "Przejdź do panelu",
    },
    tripCard: {
      budgetLink: "Budżet",
      budgetAria: "Otwórz panel budżetu",
    },
    budget: {
      dashboard: {
        title: "Panel budżetu",
        filters: { all: "Wszystkie", excludePrepaid: "Bez przedpłat", onlyPrepaid: "Przedpłacone" },
        modes: { simple: "Wydatki w trakcie", full: "Pełny" },
        confirmDeleteExpense: "Usunąć ten wydatek?",
        refresh: { action: "Odśwież", refreshing: "Odświeżanie…" },
        expenses: {
          heading: "Wydatki",
          empty: "Brak wydatków. Użyj przycisku + aby dodać.",
          prepaidBadge: "Przedpłata",
          fallbackTitle: "Wydatek",
        },
      },
      summary: {
        totalBudget: "Całkowity budżet",
        plannedCategoriesShort: "Plan kat:",
        spent: "Wydano",
        spentPrepaidShort: "Przedpłaty",
        remaining: "Pozostało",
        percentUsed: "% użyto",
        onTrip: "Na wyjeździe",
        exclPreShort: "Bez przedpł.",
        dailyTarget: "Dzienny cel",
        autoCalc: "Auto oblicz",
        progress: "Postęp budżetu",
        categories: "Kategorie",
        categoriesEmpty: "Brak wydatków. Dodaj pierwszy, aby zobaczyć podział.",
        uncategorized: "Bez kategorii",
      },
      categories: {
        heading: "Kategorie budżetu",
        add: "Dodaj",
        newCategory: "Nowa kategoria",
        name: "Nazwa",
        plannedAmount: "Kwota planowana",
        iconOptional: "Ikona (opcjonalnie)",
        iconPlaceholder: "np. food",
        submitCreating: "Dodawanie…",
        submit: "Utwórz kategorię",
        templates: "Szablony",
        selectTemplate: "Wybierz szablon",
        applying: "Stosowanie…",
        apply: "Zastosuj",
        estPlannedTotal: "Szac. suma plan:",
        ofTripBudget: "% budżetu podróży",
        budgetNotLoaded: "Budżet podróży niezaładowany; proporcje tylko jako %.",
        loading: "Ładowanie…",
        empty: "Brak kategorii. Kliknij Dodaj aby stworzyć pierwszą.",
        confirmApplyTemplate: "To doda kategorie do istniejącej listy. Kontynuować?",
        confirmDeleteCategory: "Usunąć tę kategorię?",
        simpleModeHint: "Skup się na zmiennych wydatkach w trakcie podróży (noclegi/bilety opłacone z góry oznacz jako przedpłaty).",
      },
      quickAdd: {
        fabAria: "Dodaj wydatek",
        title: "Szybkie dodanie wydatku",
        amount: "Kwota",
        currency: "Waluta",
        category: "Kategoria",
        loadingCats: "Ładowanie…",
        selectCategory: "Wybierz kategorię",
        description: "Opis",
        prepaid: "Przedpłata",
        adding: "Dodawanie…",
        submit: "Dodaj wydatek",
      },
      page: {
        titleBase: "Budżet",
        titleForTrip: "Budżet dla {title}",
        breadcrumb: { dashboard: "Panel", budget: "Budżet" },
        overview: "Przegląd budżetu",
        baseCurrency: "Waluta bazowa:",
        notFound: { heading: "Podróż nie znaleziona", body: "Ta podróż nie istnieje lub brak uprawnień.", back: "Powrót do panelu" },
      },
      errors: {
        loadExpenses: "Nie udało się załadować wydatków",
        loadCategories: "Nie udało się załadować kategorii",
        createCategory: "Nie udało się utworzyć kategorii",
        deleteFailed: "Usunięcie nie powiodło się",
        summaryFailed: "Nie udało się załadować podsumowania",
      },
    },
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
      delete: {
        heading: "Usuń podróż",
        body: "Tej operacji nie można cofnąć. Czy na pewno chcesz usunąć tę podróż oraz powiązane wygenerowane plany?",
        confirm: "Usuń",
        cancel: "Anuluj",
        cascadingNote: "Powiązane rekordy zostaną usunięte kaskadowo.",
        action: "Usuń podróż",
      },
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
      authGate: {
        mustBeSignedIn: "Musisz być zalogowany",
        goToLogin: "Przejdź do logowania",
      },
      form: {
        placeholders: {
          titleExample: "Lato we Włoszech",
          destinationExample: "Toskania",
          durationExample: "np. 7",
          lodgingPlaceholder: "Nazwa / URL / adres",
        },
        lodging: {
          label: "Hotel / nocleg (opcjonalnie)",
          tooltip: "Wykorzystane aby dostosować plan do lokalizacji noclegu",
        },
        currency: {
          label: "Waluta",
          selectPlaceholder: "Wybierz",
        },
      },
      tabs: {
        overview: "Przegląd",
        itinerary: "Plan podróży",
        budget: "Budżet",
        packing: "Pakowanie",
        settings: "Ustawienia",
      },
      status: {
        creating: "Tworzenie…",
        deleting: "Usuwanie…",
      },
      itinerary: {
        generated: "Plan podróży został wygenerowany",
        errorLabel: "Błąd",
      },
      placeholders: {
        budget: { title: "Zarządzanie budżetem", body: "Funkcja zarządzania budżetem będzie dostępna wkrótce." },
        packing: { title: "Asystent Pakowania", body: "Pozwól AI stworzyć idealną listę rzeczy do spakowania. Funkcja w przygotowaniu." },
        settings: { title: "Ustawienia podróży", body: "Opcje edycji i zarządzania podróżą będą dostępne wkrótce." },
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
  navigation: { home: "Home", dashboard: "Dashboard" },
    auth: {
      signedInAs: "Signed in as",
      signOut: "Sign Out",
      signingOut: "Signing out…",
      goToDashboard: "Go to dashboard",
    },
    tripCard: {
      budgetLink: "Budget",
      budgetAria: "Open budget dashboard",
    },
    budget: {
      dashboard: {
        title: "Budget Dashboard",
        filters: { all: "All", excludePrepaid: "No Prepaid", onlyPrepaid: "Prepaid" },
        modes: { simple: "On-Trip", full: "Full" },
        confirmDeleteExpense: "Delete this expense?",
        refresh: { action: "Refresh", refreshing: "Refreshing…" },
        expenses: {
          heading: "Expenses",
          empty: "No expenses yet. Use the + button to add one.",
          prepaidBadge: "Prepaid",
          fallbackTitle: "Expense",
        },
      },
      summary: {
        totalBudget: "Total Budget",
        plannedCategoriesShort: "Planned Cat:",
        spent: "Spent",
        spentPrepaidShort: "Prepaid",
        remaining: "Remaining",
        percentUsed: "% used",
        onTrip: "On-trip",
        exclPreShort: "Excl pre",
        dailyTarget: "Daily Target",
        autoCalc: "Auto calc",
        progress: "Budget Progress",
        categories: "Categories",
        categoriesEmpty: "No expenses yet. Add your first expense to see distribution.",
        uncategorized: "Uncategorized",
      },
      categories: {
        heading: "Budget Categories",
        add: "Add",
        newCategory: "New Category",
        name: "Name",
        plannedAmount: "Planned Amount",
        iconOptional: "Icon Name (optional)",
        iconPlaceholder: "e.g. food",
        submitCreating: "Adding...",
        submit: "Create Category",
        templates: "Templates",
        selectTemplate: "Select Template",
        applying: "Applying...",
        apply: "Apply",
        estPlannedTotal: "Est. planned total:",
        ofTripBudget: "% of trip budget",
        budgetNotLoaded: "Trip budget not loaded yet; ratio-based allocations will show as percentages only.",
        loading: "Loading...",
        empty: "No categories yet. Click Add to create your first.",
        confirmApplyTemplate: "This will add additional categories to your existing list. Continue?",
        confirmDeleteCategory: "Delete this category?",
        simpleModeHint: "Focus on variable on-trip spending (lodging / tickets paid upfront can be marked prepaid).",
      },
      quickAdd: {
        fabAria: "Add expense",
        title: "Quick Add Expense",
        amount: "Amount",
        currency: "Currency",
        category: "Category",
        loadingCats: "Loading...",
        selectCategory: "Select category",
        description: "Description",
        prepaid: "Prepaid",
        adding: "Adding...",
        submit: "Add Expense",
      },
      page: {
        titleBase: "Budget",
        titleForTrip: "Budget for {title}",
        breadcrumb: { dashboard: "Dashboard", budget: "Budget" },
        overview: "Budget Overview",
        baseCurrency: "Base Currency:",
        notFound: { heading: "Trip not found", body: "The trip you are trying to access does not exist or you do not have permission.", back: "Back to dashboard" },
      },
      errors: {
        loadExpenses: "Failed to load expenses",
        loadCategories: "Failed to load categories",
        createCategory: "Failed to create category",
        deleteFailed: "Delete failed",
        summaryFailed: "Failed to load summary",
      },
    },
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
      delete: {
        heading: "Delete trip",
        body: "This action cannot be undone. Are you sure you want to delete this trip and its generated itineraries?",
        confirm: "Delete",
        cancel: "Cancel",
        cascadingNote: "Related records will be removed via cascade.",
        action: "Delete trip",
      },
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
      authGate: {
        mustBeSignedIn: "You must be signed in",
        goToLogin: "Go to login",
      },
      form: {
        placeholders: {
          titleExample: "Summer in Italy",
          destinationExample: "Tuscany",
          durationExample: "e.g. 7",
          lodgingPlaceholder: "Name / URL / address",
        },
        lodging: {
          label: "Lodging (optional)",
          tooltip: "Used to tailor plan around lodging location",
        },
        currency: {
          label: "Currency",
          selectPlaceholder: "Select",
        },
      },
      tabs: {
        overview: "Overview",
        itinerary: "Itinerary",
        budget: "Budget",
        packing: "Packing",
        settings: "Settings",
      },
      status: {
        creating: "Creating…",
        deleting: "Deleting…",
      },
      itinerary: {
        generated: "Itinerary has been generated",
        errorLabel: "Error",
      },
      placeholders: {
        budget: { title: "Budget Management", body: "Budget management features coming soon." },
        packing: { title: "Packing Assistant", body: "Let AI create the perfect packing list. Feature on its way." },
        settings: { title: "Trip Settings", body: "Trip editing and management options coming soon." },
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
