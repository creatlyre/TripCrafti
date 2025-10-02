import type { PackingItem, ChecklistItem } from '@/types';

export interface PackingTemplateTranslation {
  name: string;
  description: string;
  checklistTasks?: string[]; // optional override / translation of checklist if needed
  categories?: Record<string, string>; // category name mapping (pl->en)
}

export interface PackingTemplate {
  id: string;
  name: string; // default (Polish) for backward compatibility
  description: string; // default (Polish)
  icon: string;
  categories: string[]; // stored internally in PL for consistency
  transport: string[]; // PL values used in filters
  accommodation: string[]; // PL values used in filters
  season: string[]; // PL values used in filters
  items: Omit<PackingItem, 'id' | 'packed'>[]; // item names in PL baseline
  checklist: Omit<ChecklistItem, 'id'>[]; // tasks in PL baseline
  translations?: {
    en?: PackingTemplateTranslation;
  };
}

// Base template with common essentials
const BASE_ESSENTIALS: Omit<PackingItem, 'id' | 'packed'>[] = [
  // Dokumenty i Finanse
  { "name": "Paszporty", "qty": "Wg potrzeb", "category": "Dokumenty i Finanse" },
  { "name": "Portfele", "qty": "Wg potrzeb", "category": "Dokumenty i Finanse" },
  { "name": "Bilety", "qty": "Wg potrzeb", "category": "Dokumenty i Finanse" },
  
  // Higiena podstawowa
  { "name": "Szczoteczki do zębów", "qty": "Wg potrzeb", "category": "Higiena i Kosmetyki" },
  { "name": "Pasta do zębów", "qty": "1", "category": "Higiena i Kosmetyki" },
  { "name": "Dezodorant", "qty": "1", "category": "Higiena i Kosmetyki" },
  
  // Elektronika podstawowa
  { "name": "Ładowarki do telefonów", "qty": "Wg potrzeb", "category": "Elektronika" },
  { "name": "Telefony", "qty": "Wg potrzeb", "category": "Elektronika" },
  
  // Apteczka podstawowa
  { "name": "Leki przeciwbólowe", "qty": "1", "category": "Apteczka" },
  { "name": "Plastry na skaleczenia", "qty": "1 zestaw", "category": "Apteczka" },
];

const BASE_CHECKLIST: Omit<ChecklistItem, 'id'>[] = [
  { "task": "Sprawdź pogodę na miejscu", "done": false },
  { "task": "Potwierdź rezerwacje", "done": false },
  { "task": "Zamknij wszystkie okna w domu", "done": false },
  { "task": "Sprawdź datę ważności dokumentów", "done": false },
];

// Your original comprehensive checklist
const COMPREHENSIVE_FAMILY_CHECKLIST: Omit<ChecklistItem, 'id'>[] = [
  { task: 'Naładować power bank', done: false },
  { task: 'Spakować ładowarkę do power banku', done: false },
  { task: 'Spakować prezenty', done: false },
  { task: 'Wyrzucić śmieci', done: false },
  { task: 'Uruchomić zmywarkę', done: false },
  { task: 'Opróżnić lodówkę z psujących się rzeczy', done: false },
  { task: 'Zamknąć okna', done: false },
  { task: 'Ustawić alarm', done: false },
  { task: 'Ustawić piec na tryb eko/wakacyjny', done: false },
  { task: 'Zmniejszyć temperaturę ogrzewania', done: false },
  { task: 'Opróżnić nawilżacz powietrza', done: false },
  { task: 'Wylać wodę z czajnika i dzbanka', done: false },
  { task: 'Wylać wodę z ekspresu do kawy', done: false },
];

// Template: Wakacje na plaży (samolotem)
const BEACH_VACATION_TEMPLATE: PackingTemplate = {
  id: 'beach-vacation-plane',
  name: 'Plaża Samolotem',
  description: 'Wakacje na plaży z podróżą samolotem - wszystko na relaks w ciepłym klimacie',
  icon: '🏖️',
  categories: ['Dokumenty i Finanse', 'Ubrania', 'Obuwie', 'Higiena i Kosmetyki', 'Apteczka', 'Elektronika', 'W Podróży (Podręczne)', 'Plaża'],
  transport: ['Samolot'],
  accommodation: ['Hotel', 'Apartament'],
  season: ['Lato'],
  items: [
    ...BASE_ESSENTIALS,
    // Specific beach items
    { "name": "Stroje kąpielowe", "qty": "2-3", "category": "Ubrania" },
    { "name": "Pareo/szalik plażowy", "qty": "1", "category": "Ubrania" },
    { "name": "Czapka od słońca", "qty": "1", "category": "Ubrania" },
    { "name": "Okulary przeciwsłoneczne", "qty": "1", "category": "Ubrania" },
    { "name": "Klapki plażowe", "qty": "1 para", "category": "Obuwie" },
    { "name": "Sandały", "qty": "1 para", "category": "Obuwie" },
    { "name": "Krem przeciwsłoneczny SPF 30+", "qty": "1", "category": "Higiena i Kosmetyki" },
    { "name": "Krem po opalaniu", "qty": "1", "category": "Higiena i Kosmetyki" },
    { "name": "Ręcznik plażowy", "qty": "1", "category": "Plaża" },
    { "name": "Torba plażowa", "qty": "1", "category": "Plaża" },
    { "name": "Bidon z wodą", "qty": "1", "category": "W Podróży (Podręczne)" },
    { "name": "Lekkie ubrania letnie", "qty": "5-7 zestawów", "category": "Ubrania" },
    { "name": "Sukienka/koszula na kolację", "qty": "1-2", "category": "Ubrania" },
  ],
  checklist: [
    ...BASE_CHECKLIST,
    { "task": "Sprawdź limity bagażu linii lotniczej", "done": false },
    { "task": "Zarejestruj się online na lot", "done": false },
    { "task": "Przygotuj dokumenty podróży do bagażu podręcznego", "done": false },
  ],
  translations: {
    en: {
      name: 'Beach (Flight)',
      description: 'Beach vacation traveling by plane – everything for relaxation in a warm climate',
      categories: {
        'Dokumenty i Finanse': 'Documents & Money',
        'Ubrania': 'Clothing',
        'Obuwie': 'Footwear',
        'Higiena i Kosmetyki': 'Toiletries',
        'Apteczka': 'First Aid',
        'Elektronika': 'Electronics',
        'W Podróży (Podręczne)': 'In Transit (Carry‑on)',
        'Plaża': 'Beach'
      }
    }
  }
};

// Template: Narty (autem)
const SKI_VACATION_TEMPLATE: PackingTemplate = {
  id: 'ski-vacation-car',
  name: 'Narty Autem',
  description: 'Wyjazd na narty z dojazdem własnym autem',
  icon: '🎿',
  categories: ['Dokumenty i Finanse', 'Ubrania', 'Obuwie', 'Higiena i Kosmetyki', 'Apteczka', 'Elektronika', 'Narty'],
  transport: ['Samochód'],
  accommodation: ['Hotel', 'Apartament', 'Pensjonat'],
  season: ['Zima'],
  items: [
    ...BASE_ESSENTIALS,
    // Ski specific items
    { "name": "Kurtka narciarska", "qty": "1", "category": "Ubrania" },
    { "name": "Spodnie narciarskie", "qty": "1", "category": "Ubrania" },
    { "name": "Bielizna termoaktywna", "qty": "2-3 zestawy", "category": "Ubrania" },
    { "name": "Fleece/polarek", "qty": "1-2", "category": "Ubrania" },
    { "name": "Skarpety narciarskie", "qty": "4-5 par", "category": "Ubrania" },
    { "name": "Rękawice narciarskie", "qty": "1 para + zapasowe", "category": "Ubrania" },
    { "name": "Czapka", "qty": "1", "category": "Ubrania" },
    { "name": "Komin/szalik", "qty": "1", "category": "Ubrania" },
    { "name": "Gogle narciarskie", "qty": "1", "category": "Narty" },
    { "name": "Kask narciarski", "qty": "1", "category": "Narty" },
    { "name": "Buty narciarskie", "qty": "1 para", "category": "Obuwie" },
    { "name": "Buty zimowe (po nartach)", "qty": "1 para", "category": "Obuwie" },
    { "name": "Krem przeciwsłoneczny górski SPF 50", "qty": "1", "category": "Higiena i Kosmetyki" },
    { "name": "Pomadka ochronna", "qty": "1", "category": "Higiena i Kosmetyki" },
  ],
  checklist: [
    ...BASE_CHECKLIST,
    { "task": "Sprawdź stan opon zimowych w aucie", "done": false },
    { "task": "Przygotuj łańcuchy śniegowe", "done": false },
    { "task": "Zarezerwuj skipassy online", "done": false },
    { "task": "Sprawdź prognozę pogody górskiej", "done": false },
  ],
  translations: {
    en: {
      name: 'Ski Trip (Car)',
      description: 'Ski holiday traveling by car',
      categories: {
        'Dokumenty i Finanse': 'Documents & Money',
        'Ubrania': 'Clothing',
        'Obuwie': 'Footwear',
        'Higiena i Kosmetyki': 'Toiletries',
        'Apteczka': 'First Aid',
        'Elektronika': 'Electronics',
        'Narty': 'Ski'
      }
    }
  }
};

// Template: Górskie wędrówki (autem)
const MOUNTAIN_HIKING_TEMPLATE: PackingTemplate = {
  id: 'mountain-hiking-car',
  name: 'Spacer w Górach Autem',
  description: 'Wycieczki górskie z noclegiem, dojazd autem',
  icon: '🥾',
  categories: ['Dokumenty i Finanse', 'Ubrania', 'Obuwie', 'Higiena i Kosmetyki', 'Apteczka', 'Elektronika', 'Trekking'],
  transport: ['Samochód'],
  accommodation: ['Schronisko', 'Pensjonat', 'Hotel'],
  season: ['Wiosna', 'Lato', 'Jesień'],
  items: [
    ...BASE_ESSENTIALS,
    // Hiking specific items
    { "name": "Plecak trekkingowy", "qty": "1", "category": "Trekking" },
    { "name": "Buty trekkingowe", "qty": "1 para", "category": "Obuwie" },
    { "name": "Kurtka przeciwdeszczowa", "qty": "1", "category": "Ubrania" },
    { "name": "Spodnie trekkingowe", "qty": "2 pary", "category": "Ubrania" },
    { "name": "Koszulki sportowe", "qty": "3-4", "category": "Ubrania" },
    { "name": "Fleece", "qty": "1", "category": "Ubrania" },
    { "name": "Czapka", "qty": "1", "category": "Ubrania" },
    { "name": "Rękawiczki", "qty": "1 para", "category": "Ubrania" },
    { "name": "Bidon na wodę", "qty": "1-2", "category": "Trekking" },
    { "name": "Kijki trekkingowe", "qty": "1 para", "category": "Trekking" },
    { "name": "Latarka czołowa", "qty": "1", "category": "Trekking" },
    { "name": "Powerbank", "qty": "1", "category": "Elektronika" },
    { "name": "Krem przeciwsłoneczny", "qty": "1", "category": "Higiena i Kosmetyki" },
    { "name": "Maść na odciski", "qty": "1", "category": "Apteczka" },
    { "name": "Bandaż elastyczny", "qty": "1", "category": "Apteczka" },
  ],
  checklist: [
    ...BASE_CHECKLIST,
    { "task": "Sprawdź trasy górskie i ich trudność", "done": false },
    { "task": "Poinformuj kogoś o planowanej trasie", "done": false },
    { "task": "Sprawdź godziny kursowania kolejek", "done": false },
    { "task": "Pobierz mapy offline na telefon", "done": false },
  ],
  translations: {
    en: {
      name: 'Mountain Hiking (Car)',
      description: 'Mountain hikes with lodging – arriving by car',
      categories: {
        'Dokumenty i Finanse': 'Documents & Money',
        'Ubrania': 'Clothing',
        'Obuwie': 'Footwear',
        'Higiena i Kosmetyki': 'Toiletries',
        'Apteczka': 'First Aid',
        'Elektronika': 'Electronics',
        'Trekking': 'Trekking'
      }
    }
  }
};

// Template: All Inclusive
const ALL_INCLUSIVE_TEMPLATE: PackingTemplate = {
  id: 'all-inclusive',
  name: 'All Inclusive Wakacje',
  description: 'Wakacje w hotelu all inclusive - minimalna lista pakowania',
  icon: '🍹',
  categories: ['Dokumenty i Finanse', 'Ubrania', 'Obuwie', 'Higiena i Kosmetyki', 'Apteczka', 'Elektronika', 'Plaża'],
  transport: ['Samolot'],
  accommodation: ['Hotel'],
  season: ['Lato'],
  items: [
    ...BASE_ESSENTIALS,
    // Minimal all-inclusive items
    { "name": "Stroje kąpielowe", "qty": "2", "category": "Ubrania" },
    { "name": "Sukienki/koszule letnie", "qty": "3-4", "category": "Ubrania" },
    { "name": "Szorty", "qty": "2-3", "category": "Ubrania" },
    { "name": "Klapki", "qty": "1 para", "category": "Obuwie" },
    { "name": "Sandały eleganckie", "qty": "1 para", "category": "Obuwie" },
    { "name": "Krem przeciwsłoneczny", "qty": "1", "category": "Higiena i Kosmetyki" },
    { "name": "Okulary przeciwsłoneczne", "qty": "1", "category": "Ubrania" },
    { "name": "Czapka", "qty": "1", "category": "Ubrania" },
    { "name": "Lekka książka/e-reader", "qty": "1", "category": "Rozrywka", "optional": true },
  ],
  checklist: [
    ...BASE_CHECKLIST,
    { "task": "Sprawdź, co jest wliczone w all inclusive", "done": false },
    { "task": "Zarezerwuj transfer z lotniska", "done": false },
    { "task": "Przygotuj gotówkę na napiwki", "done": false },
  ],
  translations: {
    en: {
      name: 'All Inclusive Holiday',
      description: 'All‑inclusive hotel stay – minimal packing essentials',
      categories: {
        'Dokumenty i Finanse': 'Documents & Money',
        'Ubrania': 'Clothing',
        'Obuwie': 'Footwear',
        'Higiena i Kosmetyki': 'Toiletries',
        'Apteczka': 'First Aid',
        'Elektronika': 'Electronics',
        'Plaża': 'Beach'
      }
    }
  }
};

// Current template with all your items
const COMPREHENSIVE_FAMILY_TEMPLATE: PackingTemplate = {
  id: 'comprehensive-family',
  name: 'Kompletna Lista Rodzinna',
  description: 'Twoja obecna kompletna lista - idealna dla rodzin z dziećmi',
  icon: '👨‍👩‍👧‍👦',
  categories: ['Dokumenty i Finanse', 'Ubrania', 'Obuwie', 'Higiena i Kosmetyki', 'Apteczka', 'Elektronika', 'Dzieci', 'Aktywności Specjalne', 'W Podróży (Podręczne)', 'Inne'],
  transport: ['Samolot', 'Samochód'],
  accommodation: ['Hotel', 'Apartament'],
  season: ['Lato'],
  items: [
    { "name": "Leki na sraczke", "qty": "1", "category": "Apteczka" },
    { "name": "Sól fizjologiczna", "qty": "1", "category": "Apteczka" },
    { "name": "Sól morska do nosa", "qty": "1", "category": "Apteczka" },
    { "name": "Plastry na skaleczenia", "qty": "1 zestaw", "category": "Apteczka" },
    { "name": "Plastry na blizne", "qty": "1", "category": "Apteczka" },
    { "name": "Waciki dezynfekujące", "qty": "1 op.", "category": "Apteczka" },
    { "name": "Octanisept", "qty": "1", "category": "Apteczka" },
    { "name": "Leki przeciwgorączkowe", "qty": "1", "category": "Apteczka" },
    { "name": "Aromactiv", "qty": "2", "category": "Apteczka" },
    { "name": "Probiotyki", "qty": "1", "category": "Apteczka" },
    { "name": "Penthanol na oparzenia", "qty": "1", "category": "Apteczka" },
    { "name": "Bepanthen", "qty": "1", "category": "Apteczka" },
    { "name": "Nożyczki do blizny", "qty": "1", "category": "Apteczka" },
    { "name": "Paszporty", "qty": "Wg potrzeb", "category": "Dokumenty i Finanse" },
    { "name": "Portfele", "qty": "Wg potrzeb", "category": "Dokumenty i Finanse" },
    { "name": "Euro", "qty": "Wg potrzeb", "category": "Dokumenty i Finanse" },
    { "name": "Bilety lotnicze", "qty": "Wg potrzeb", "category": "Dokumenty i Finanse" },
    { "name": "Duszek i krakacz", "qty": "1", "category": "Dzieci" },
    { "name": "Deska dla julki", "qty": "1", "category": "Dzieci" },
    { "name": "Makaron do pluwania", "qty": "1", "category": "Dzieci" },
    { "name": "Koc dla Julki", "qty": "1", "category": "Dzieci", "notes": "Do leżenia w pokoju" },
    { "name": "Wiaderko i foremki do piasku", "qty": "1 zestaw", "category": "Dzieci" },
    { "name": "Zabawki do samolotu", "qty": "Kilka", "category": "Dzieci" },
    { "name": "Puzzle", "qty": "1", "category": "Dzieci" },
    { "name": "Zabawki dla julki", "qty": "Kilka", "category": "Dzieci" },
    { "name": "Pampersy do plywania", "qty": "1 op.", "category": "Dzieci" },
    { "name": "Pampersy zwykle", "qty": "Zapas", "category": "Dzieci" },
    { "name": "Chusteczki nawilzajace", "qty": "1 op.", "category": "Dzieci" },
    { "name": "Ręczniki dla dziewczyn", "qty": "2", "category": "Dzieci" },
    { "name": "Pieluchy tetrowe", "qty": "Kilka", "category": "Dzieci" },
    { "name": "Wózek", "qty": "1", "category": "Dzieci" },
    { "name": "Chusta", "qty": "1", "category": "Dzieci" },
    { "name": "Lampka nocna", "qty": "2", "category": "Dzieci" },
    { "name": "Niania", "qty": "2", "category": "Dzieci" },
    { "name": "Ładowarki do telefonów", "qty": "2", "category": "Elektronika" },
    { "name": "Ładowarka do zegarka", "qty": "1", "category": "Elektronika" },
    { "name": "Telefony", "qty": "2", "category": "Elektronika" },
    { "name": "Kamerka go pro + ladowarka", "qty": "1", "category": "Elektronika" },
    { "name": "Laktator", "qty": "1", "category": "Elektronika" },
    { "name": "Waciki i patyczki do uszu", "qty": "1 op.", "category": "Higiena i Kosmetyki" },
    { "name": "Szczoteczki do zębów", "qty": "Wg potrzeb", "category": "Higiena i Kosmetyki" },
    { "name": "Pasty do zębów", "qty": "1", "category": "Higiena i Kosmetyki" },
    { "name": "Szczotka do włosów", "qty": "1", "category": "Higiena i Kosmetyki" },
    { "name": "Maszynka do golenia jednorazowa", "qty": "1", "category": "Higiena i Kosmetyki" },
    { "name": "Kosmetyki do kapieli", "qty": "1 zestaw", "category": "Higiena i Kosmetyki" },
    { "name": "Kremy przeciwsłoneczne", "qty": "1", "category": "Higiena i Kosmetyki" },
    { "name": "Kremy nawilżające", "qty": "1", "category": "Higiena i Kosmetyki" },
    { "name": "Nożyczki do paznokci", "qty": "1", "category": "Higiena i Kosmetyki" },
    { "name": "Cążki do paznokci", "qty": "1", "category": "Higiena i Kosmetyki" },
    { "name": "Pilnik do paznokci", "qty": "1", "category": "Higiena i Kosmetyki" },
    { "name": "Pomadka do ust", "qty": "1", "category": "Higiena i Kosmetyki" },
    { "name": "Dezodoranty", "qty": "1", "category": "Higiena i Kosmetyki" },
    { "name": "Perfumy", "qty": "1", "category": "Higiena i Kosmetyki" },
    { "name": "Okulary przeciwsloneczne", "qty": "Wg potrzeb", "category": "Inne" },
    { "name": "Kilka ksiazek", "qty": "2-3", "category": "Inne" },
    { "name": "Torba plażowa", "qty": "1", "category": "Inne" },
    { "name": "Klapki", "qty": "1 para", "category": "Obuwie" },
    { "name": "Sandaly", "qty": "1 para", "category": "Obuwie" },
    { "name": "Zabudowane buty", "qty": "1 para", "category": "Obuwie", "notes": "Na powrót" },
    { "name": "Stroje kapielowe", "qty": "2", "category": "Ubrania" },
    { "name": "Czapki od slonca", "qty": "Wg potrzeb", "category": "Ubrania" },
    { "name": "Ubrania", "qty": "Zestawy", "category": "Ubrania" },
    { "name": "Bielizna", "qty": "Zapas", "category": "Ubrania" },
    { "name": "Ubrania na powrót", "qty": "1 zestaw", "category": "Ubrania", "notes": "kurtki, dlugie rekawy, skarpety, czapki, szaliki" },
    { "name": "Bidon z wodą", "qty": "1", "category": "W Podróży (Podręczne)" },
    { "name": "Namiot plażowy", "qty": "1", "category": "Aktywności Specjalne", "optional": true }
  ],
  checklist: [
    ...COMPREHENSIVE_FAMILY_CHECKLIST,
  ],
  translations: {
    en: {
      name: 'Complete Family List',
      description: 'Comprehensive template – ideal for families with kids',
      categories: {
        'Dokumenty i Finanse': 'Documents & Money',
        'Ubrania': 'Clothing',
        'Obuwie': 'Footwear',
        'Higiena i Kosmetyki': 'Toiletries',
        'Apteczka': 'First Aid',
        'Elektronika': 'Electronics',
        'Dzieci': 'Kids',
        'Aktywności Specjalne': 'Special Activities',
        'W Podróży (Podręczne)': 'In Transit (Carry‑on)',
        'Inne': 'Other'
      }
    }
  }
};

// Additional Templates (bilingual)
const CITY_BREAK_TEMPLATE: PackingTemplate = {
  id: 'city-break-weekend',
  name: 'City Break Weekend',
  description: 'Lekka lista na 2–4 dniowy wypad do miasta',
  icon: '🏙️',
  categories: ['Dokumenty i Finanse', 'Ubrania', 'Obuwie', 'Higiena i Kosmetyki', 'Elektronika', 'Inne'],
  transport: ['Samolot', 'Pociąg', 'Samochód'],
  accommodation: ['Hotel', 'Apartament'],
  season: ['Wiosna', 'Lato', 'Jesień', 'Zima'],
  items: [
    ...BASE_ESSENTIALS,
    { name: 'Lekka kurtka', qty: '1', category: 'Ubrania' },
    { name: 'Koszulki', qty: '2-3', category: 'Ubrania' },
    { name: 'Spodnie/jeansy', qty: '1-2', category: 'Ubrania' },
    { name: 'Wygodne buty do chodzenia', qty: '1 para', category: 'Obuwie' },
    { name: 'Notatnik / długopis', qty: '1', category: 'Inne', optional: true },
  ],
  checklist: [
    ...BASE_CHECKLIST,
    { task: 'Pobierz mapy offline miasta', done: false },
  ],
  translations: {
    en: {
      name: 'City Break Weekend',
      description: 'Light list for a 2–4 day urban getaway',
      categories: {
        'Dokumenty i Finanse': 'Documents & Money',
        'Ubrania': 'Clothing',
        'Obuwie': 'Footwear',
        'Higiena i Kosmetyki': 'Toiletries',
        'Elektronika': 'Electronics',
        'Inne': 'Other'
      }
    }
  }
};

const BACKPACKING_TEMPLATE: PackingTemplate = {
  id: 'backpacking-adventure',
  name: 'Backpacking / Plecak',
  description: 'Minimalistyczna lista dla podróży z plecakiem',
  icon: '🎒',
  categories: ['Dokumenty i Finanse', 'Ubrania', 'Obuwie', 'Higiena i Kosmetyki', 'Apteczka', 'Elektronika', 'Trekking', 'Inne'],
  transport: ['Samolot', 'Pociąg', 'Autobus'],
  accommodation: ['Hostel', 'Schronisko', 'Kemping'],
  season: ['Wiosna', 'Lato', 'Jesień'],
  items: [
    ...BASE_ESSENTIALS,
    { name: 'Plecak 40L', qty: '1', category: 'Trekking' },
    { name: 'Koszulki z szybkim schnięciem', qty: '3', category: 'Ubrania' },
    { name: 'Bielizna szybkoschnąca', qty: '3', category: 'Ubrania' },
    { name: 'Ręcznik szybkoschnący', qty: '1', category: 'Higiena i Kosmetyki' },
    { name: 'Buty trekkingowe lekkie', qty: '1 para', category: 'Obuwie' },
    { name: 'Czołówka', qty: '1', category: 'Elektronika' },
    { name: 'Filtr do wody', qty: '1', category: 'Inne' },
  ],
  checklist: [
    ...BASE_CHECKLIST,
    { task: 'Sprawdź limity bagażu podręcznego', done: false },
  ],
  translations: {
    en: {
      name: 'Backpacking Adventure',
      description: 'Minimalist list for lightweight backpack travel',
      categories: {
        'Dokumenty i Finanse': 'Documents & Money',
        'Ubrania': 'Clothing',
        'Obuwie': 'Footwear',
        'Higiena i Kosmetyki': 'Toiletries',
        'Apteczka': 'First Aid',
        'Elektronika': 'Electronics',
        'Trekking': 'Trekking',
        'Inne': 'Other'
      }
    }
  }
};

const CAMPING_TEMPLATE: PackingTemplate = {
  id: 'camping-outdoor',
  name: 'Kemping Outdoor',
  description: 'Lista dla noclegu pod namiotem / biwak',
  icon: '🏕️',
  categories: ['Dokumenty i Finanse', 'Ubrania', 'Obuwie', 'Apteczka', 'Elektronika', 'Trekking', 'Inne'],
  transport: ['Samochód'],
  accommodation: ['Kemping'],
  season: ['Wiosna', 'Lato', 'Jesień'],
  items: [
    ...BASE_ESSENTIALS,
    { name: 'Namiot', qty: '1', category: 'Trekking' },
    { name: 'Śpiwór', qty: '1', category: 'Trekking' },
    { name: 'Karimata/mata', qty: '1', category: 'Trekking' },
    { name: 'Kuchenka turystyczna', qty: '1', category: 'Inne' },
    { name: 'Zapałki / zapalniczka', qty: '1', category: 'Inne' },
    { name: 'Sztućce turystyczne', qty: '1 zestaw', category: 'Inne' },
  ],
  checklist: [
    ...BASE_CHECKLIST,
    { task: 'Sprawdź zasady kempingu', done: false },
  ],
  translations: {
    en: {
      name: 'Camping Outdoor',
      description: 'Checklist for tent / campsite stay',
      categories: {
        'Dokumenty i Finanse': 'Documents & Money',
        'Ubrania': 'Clothing',
        'Obuwie': 'Footwear',
        'Apteczka': 'First Aid',
        'Elektronika': 'Electronics',
        'Trekking': 'Trekking',
        'Inne': 'Other'
      }
    }
  }
};

const ROAD_TRIP_TEMPLATE: PackingTemplate = {
  id: 'road-trip-car',
  name: 'Road Trip',
  description: 'Podróż samochodem z wieloma przystankami',
  icon: '🛣️',
  categories: ['Dokumenty i Finanse', 'Ubrania', 'Obuwie', 'Higiena i Kosmetyki', 'Elektronika', 'Inne'],
  transport: ['Samochód'],
  accommodation: ['Hotel', 'Apartament', 'Pensjonat'],
  season: ['Wiosna', 'Lato', 'Jesień', 'Zima'],
  items: [
    ...BASE_ESSENTIALS,
    { name: 'Organizer do samochodu', qty: '1', category: 'Inne' },
    { name: 'Ładowarka samochodowa', qty: '1', category: 'Elektronika' },
    { name: 'Przekąski na drogę', qty: 'Zapas', category: 'Inne' },
    { name: 'Mapa papierowa (backup)', qty: '1', category: 'Inne', optional: true },
  ],
  checklist: [
    ...BASE_CHECKLIST,
    { task: 'Sprawdź ciśnienie w oponach', done: false },
  ],
  translations: {
    en: {
      name: 'Road Trip',
      description: 'Car journey with multiple stops',
      categories: {
        'Dokumenty i Finanse': 'Documents & Money',
        'Ubrania': 'Clothing',
        'Obuwie': 'Footwear',
        'Higiena i Kosmetyki': 'Toiletries',
        'Elektronika': 'Electronics',
        'Inne': 'Other'
      }
    }
  }
};

const BUSINESS_TRIP_TEMPLATE: PackingTemplate = {
  id: 'business-trip',
  name: 'Podróż Służbowa',
  description: 'Lista dla wyjazdu biznesowego / konferencji',
  icon: '💼',
  categories: ['Dokumenty i Finanse', 'Ubrania', 'Obuwie', 'Elektronika', 'Higiena i Kosmetyki', 'Inne'],
  transport: ['Samolot', 'Pociąg'],
  accommodation: ['Hotel'],
  season: ['Wiosna', 'Lato', 'Jesień', 'Zima'],
  items: [
    ...BASE_ESSENTIALS,
    { name: 'Laptop', qty: '1', category: 'Elektronika' },
    { name: 'Ładowarka do laptopa', qty: '1', category: 'Elektronika' },
    { name: 'Elegancka koszula / bluzka', qty: '2', category: 'Ubrania' },
    { name: 'Spodnie garniturowe / eleganckie', qty: '1', category: 'Ubrania' },
    { name: 'Buty eleganckie', qty: '1 para', category: 'Obuwie' },
    { name: 'Wizytówki', qty: 'Kilka', category: 'Inne' },
  ],
  checklist: [
    ...BASE_CHECKLIST,
    { task: 'Przygotuj prezentację', done: false },
  ],
  translations: {
    en: {
      name: 'Business Trip',
      description: 'Checklist for business travel / conference',
      categories: {
        'Dokumenty i Finanse': 'Documents & Money',
        'Ubrania': 'Clothing',
        'Obuwie': 'Footwear',
        'Elektronika': 'Electronics',
        'Higiena i Kosmetyki': 'Toiletries',
        'Inne': 'Other'
      }
    }
  }
};

const FESTIVAL_TEMPLATE: PackingTemplate = {
  id: 'music-festival',
  name: 'Festiwal Muzyczny',
  description: 'Lista na wyjazd na festiwal (open-air)',
  icon: '🎵',
  categories: ['Dokumenty i Finanse', 'Ubrania', 'Obuwie', 'Higiena i Kosmetyki', 'Apteczka', 'Elektronika', 'Inne'],
  transport: ['Samochód', 'Pociąg'],
  accommodation: ['Kemping', 'Hotel'],
  season: ['Lato'],
  items: [
    ...BASE_ESSENTIALS,
    { name: 'Płaszcz przeciwdeszczowy', qty: '1', category: 'Ubrania' },
    { name: 'Buty odporne na błoto', qty: '1 para', category: 'Obuwie' },
    { name: 'Powerbank', qty: '1', category: 'Elektronika' },
    { name: 'Folia / mata do siedzenia', qty: '1', category: 'Inne' },
  ],
  checklist: [
    ...BASE_CHECKLIST,
    { task: 'Sprawdź regulamin festiwalu', done: false },
  ],
  translations: {
    en: {
      name: 'Music Festival',
      description: 'Packing list for an outdoor music festival',
      categories: {
        'Dokumenty i Finanse': 'Documents & Money',
        'Ubrania': 'Clothing',
        'Obuwie': 'Footwear',
        'Higiena i Kosmetyki': 'Toiletries',
        'Apteczka': 'First Aid',
        'Elektronika': 'Electronics',
        'Inne': 'Other'
      }
    }
  }
};

const REMOTE_WORK_TEMPLATE: PackingTemplate = {
  id: 'remote-work',
  name: 'Praca Zdalna Podróż',
  description: 'Lista dla digital nomad / pracy zdalnej',
  icon: '🧑‍💻',
  categories: ['Dokumenty i Finanse', 'Ubrania', 'Elektronika', 'Higiena i Kosmetyki', 'Inne'],
  transport: ['Samolot'],
  accommodation: ['Apartament', 'Hotel'],
  season: ['Wiosna', 'Lato', 'Jesień', 'Zima'],
  items: [
    ...BASE_ESSENTIALS,
    { name: 'Laptop', qty: '1', category: 'Elektronika' },
    { name: 'Słuchawki z mikrofonem', qty: '1', category: 'Elektronika' },
    { name: 'Adapter / listwa zasilająca', qty: '1', category: 'Elektronika' },
    { name: 'Ekran przenośny (opcjonalnie)', qty: '1', category: 'Elektronika', optional: true },
  ],
  checklist: [
    ...BASE_CHECKLIST,
    { task: 'Sprawdź prędkość internetu noclegu', done: false },
  ],
  translations: {
    en: {
      name: 'Remote Work Travel',
      description: 'Digital nomad / remote work essentials',
      categories: {
        'Dokumenty i Finanse': 'Documents & Money',
        'Ubrania': 'Clothing',
        'Elektronika': 'Electronics',
        'Higiena i Kosmetyki': 'Toiletries',
        'Inne': 'Other'
      }
    }
  }
};

const TROPICAL_ADVENTURE_TEMPLATE: PackingTemplate = {
  id: 'tropical-adventure',
  name: 'Przygoda Tropikalna',
  description: 'Lista na wyjazd w tropiki z aktywnościami',
  icon: '🌴',
  categories: ['Dokumenty i Finanse', 'Ubrania', 'Obuwie', 'Higiena i Kosmetyki', 'Apteczka', 'Elektronika', 'Plaża', 'Inne'],
  transport: ['Samolot'],
  accommodation: ['Hotel', 'Apartament'],
  season: ['Lato'],
  items: [
    ...BASE_ESSENTIALS,
    { name: 'Lekka koszula z długim rękawem', qty: '2', category: 'Ubrania' },
    { name: 'Buty do wody', qty: '1 para', category: 'Obuwie' },
    { name: 'Repelent na owady', qty: '1', category: 'Apteczka' },
    { name: 'Krem z wysokim filtrem', qty: '1', category: 'Higiena i Kosmetyki' },
    { name: 'Kapelusz przeciwsłoneczny', qty: '1', category: 'Ubrania' },
    { name: 'Pokrowiec wodoodporny na telefon', qty: '1', category: 'Elektronika' },
  ],
  checklist: [
    ...BASE_CHECKLIST,
    { task: 'Sprawdź wymagane szczepienia', done: false },
  ],
  translations: {
    en: {
      name: 'Tropical Adventure',
      description: 'Trip to the tropics with mixed activities',
      categories: {
        'Dokumenty i Finanse': 'Documents & Money',
        'Ubrania': 'Clothing',
        'Obuwie': 'Footwear',
        'Higiena i Kosmetyki': 'Toiletries',
        'Apteczka': 'First Aid',
        'Elektronika': 'Electronics',
        'Plaża': 'Beach',
        'Inne': 'Other'
      }
    }
  }
};

const WINTER_CITY_TEMPLATE: PackingTemplate = {
  id: 'winter-city-break',
  name: 'Zimowy City Break',
  description: 'Krótki wyjazd do miasta zimą',
  icon: '❄️',
  categories: ['Dokumenty i Finanse', 'Ubrania', 'Obuwie', 'Higiena i Kosmetyki', 'Elektronika', 'Inne'],
  transport: ['Samolot', 'Pociąg'],
  accommodation: ['Hotel', 'Apartament'],
  season: ['Zima'],
  items: [
    ...BASE_ESSENTIALS,
    { name: 'Ciepła kurtka', qty: '1', category: 'Ubrania' },
    { name: 'Czapka zimowa', qty: '1', category: 'Ubrania' },
    { name: 'Rękawiczki', qty: '1 para', category: 'Ubrania' },
    { name: 'Termos', qty: '1', category: 'Inne', optional: true },
  ],
  checklist: [
    ...BASE_CHECKLIST,
    { task: 'Sprawdź prognozę temperatury', done: false },
  ],
  translations: {
    en: {
      name: 'Winter City Break',
      description: 'Short urban trip in winter',
      categories: {
        'Dokumenty i Finanse': 'Documents & Money',
        'Ubrania': 'Clothing',
        'Obuwie': 'Footwear',
        'Higiena i Kosmetyki': 'Toiletries',
        'Elektronika': 'Electronics',
        'Inne': 'Other'
      }
    }
  }
};

export const PACKING_TEMPLATES: PackingTemplate[] = [
  COMPREHENSIVE_FAMILY_TEMPLATE,
  BEACH_VACATION_TEMPLATE,
  SKI_VACATION_TEMPLATE,
  MOUNTAIN_HIKING_TEMPLATE,
  ALL_INCLUSIVE_TEMPLATE,
  CITY_BREAK_TEMPLATE,
  BACKPACKING_TEMPLATE,
  CAMPING_TEMPLATE,
  ROAD_TRIP_TEMPLATE,
  BUSINESS_TRIP_TEMPLATE,
  FESTIVAL_TEMPLATE,
  REMOTE_WORK_TEMPLATE,
  TROPICAL_ADVENTURE_TEMPLATE,
  WINTER_CITY_TEMPLATE,
];

export function getTemplatesByFilters(transport?: string, accommodation?: string, season?: string): PackingTemplate[] {
  return PACKING_TEMPLATES.filter(template => {
    const matchesTransport = !transport || template.transport.includes(transport);
    const matchesAccommodation = !accommodation || template.accommodation.includes(accommodation);
    const matchesSeason = !season || template.season.includes(season);
    
    return matchesTransport && matchesAccommodation && matchesSeason;
  });
}

/**
 * Helper to get localized template data without mutating originals.
 * Falls back to Polish if translation missing.
 */
export function localizeTemplate(template: PackingTemplate, lang: 'pl' | 'en'): PackingTemplate {
  if (lang === 'pl' || !template.translations?.en) return template;
  const t = template.translations.en;
  return {
    ...template,
    name: t.name || template.name,
    description: t.description || template.description,
    // Keep categories/items internal values to avoid breaking grouping – only UI layer should map names if desired
  };
}