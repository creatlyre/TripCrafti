import type { PackingItem, ChecklistItem } from '@/types';

export interface PackingTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  categories: string[];
  transport: string[];
  accommodation: string[];
  season: string[];
  items: Omit<PackingItem, 'id' | 'packed'>[];
  checklist: Omit<ChecklistItem, 'id'>[];
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
  ]
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
  ]
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
  ]
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
  ]
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
  ]
};

export const PACKING_TEMPLATES: PackingTemplate[] = [
  COMPREHENSIVE_FAMILY_TEMPLATE,
  BEACH_VACATION_TEMPLATE,
  SKI_VACATION_TEMPLATE,
  MOUNTAIN_HIKING_TEMPLATE,
  ALL_INCLUSIVE_TEMPLATE,
];

export function getTemplatesByFilters(transport?: string, accommodation?: string, season?: string): PackingTemplate[] {
  return PACKING_TEMPLATES.filter(template => {
    const matchesTransport = !transport || template.transport.includes(transport);
    const matchesAccommodation = !accommodation || template.accommodation.includes(accommodation);
    const matchesSeason = !season || template.season.includes(season);
    
    return matchesTransport && matchesAccommodation && matchesSeason;
  });
}