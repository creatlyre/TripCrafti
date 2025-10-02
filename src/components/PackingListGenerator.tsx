import React, { useState, useEffect } from 'react';

import type { GenerateDetails, Trip, GeneratedItinerary } from '@/types';

// Utility functions
function getSeasonFromDate(dateString: string): string {
  const date = new Date(dateString);
  const month = date.getMonth() + 1; // getMonth() returns 0-11, we need 1-12

  if (month >= 3 && month <= 5) return 'Wiosna';
  if (month >= 6 && month <= 8) return 'Lato';
  if (month >= 9 && month <= 11) return 'Jesień';
  return 'Zima';
}

function calculateDays(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays.toString();
}

function extractCityFromDestination(destination: string): string {
  // Simple heuristics to extract city from destination
  // Remove common trip descriptors and take the first part
  const cleaned = destination
    .replace(/\b(wakacje|urlop|wyjazd|podróż|trip|vacation|holiday)\b/gi, '')
    .replace(/\b(w|in|to|na)\b/gi, '')
    .trim();

  // Take the first significant word (likely the city/place)
  const parts = cleaned.split(/[,\s]+/);
  return parts.find((part) => part.length > 2) || destination;
}

function getRegionFromDestination(destination: string): string {
  const dest = destination.toLowerCase();

  // European cities and countries
  if (/\b(paryż|lyon|nicea|francja|france|paris|lyon|nice)\b/.test(dest)) return 'Europa Zachodnia';
  if (/\b(berlin|monachium|hamburg|niemcy|germany|munich|hamburg)\b/.test(dest)) return 'Europa Zachodnia';
  if (/\b(londyn|edynburg|wielka brytania|uk|london|edinburgh|britain)\b/.test(dest)) return 'Europa Zachodnia';
  if (/\b(rzym|mediolan|wenecja|włochy|italy|rome|milan|venice)\b/.test(dest)) return 'Europa Południowa';
  if (/\b(barcelona|madryt|sewilla|hiszpania|spain|madrid|seville)\b/.test(dest)) return 'Europa Południowa';
  if (/\b(lizbona|porto|portugalia|portugal|lisbon)\b/.test(dest)) return 'Europa Południowa';
  if (/\b(ateny|saloniki|grecja|greece|athens|thessaloniki)\b/.test(dest)) return 'Europa Południowa';
  if (/\b(praga|brno|czechy|czech|prague)\b/.test(dest)) return 'Europa Środkowa';
  if (/\b(wiedeń|salzburg|austria|vienna)\b/.test(dest)) return 'Europa Środkowa';
  if (/\b(budapeszt|węgry|hungary|budapest)\b/.test(dest)) return 'Europa Środkowa';
  if (/\b(warszawa|kraków|gdańsk|wrocław|polska|poland|warsaw|krakow|gdansk|wroclaw)\b/.test(dest))
    return 'Europa Środkowa';
  if (
    /\b(sztokholm|oslo|helsinki|kopenhaga|skandynawia|szwecja|norwegia|finlandia|dania|sweden|norway|finland|denmark|stockholm|helsinki|copenhagen)\b/.test(
      dest
    )
  )
    return 'Europa Północna';

  // Asian destinations
  if (/\b(tokio|osaka|kioto|japonia|japan|tokyo|kyoto)\b/.test(dest)) return 'Azja Wschodnia';
  if (/\b(pekin|szanghaj|chiny|china|beijing|shanghai)\b/.test(dest)) return 'Azja Wschodnia';
  if (/\b(seul|korea|seoul)\b/.test(dest)) return 'Azja Wschodnia';
  if (/\b(bangkok|phuket|tajlandia|thailand)\b/.test(dest)) return 'Azja Południowo-Wschodnia';
  if (/\b(singapur|singapore)\b/.test(dest)) return 'Azja Południowo-Wschodnia';
  if (/\b(kuala lumpur|malezja|malaysia)\b/.test(dest)) return 'Azja Południowo-Wschodnia';
  if (/\b(delhi|mumbai|indie|india|mumbai|goa)\b/.test(dest)) return 'Azja Południowa';

  // American destinations
  if (/\b(nowy jork|los angeles|san francisco|chicago|usa|america|new york|francisco)\b/.test(dest))
    return 'Ameryka Północna';
  if (/\b(toronto|vancouver|montreal|kanada|canada)\b/.test(dest)) return 'Ameryka Północna';
  if (/\b(rio de janeiro|sao paulo|brazylia|brazil)\b/.test(dest)) return 'Ameryka Południowa';
  if (/\b(buenos aires|argentyna|argentina)\b/.test(dest)) return 'Ameryka Południowa';

  // African destinations
  if (/\b(kapsztad|johannesburg|afryka południowa|south africa|cape town)\b/.test(dest)) return 'Afryka';
  if (/\b(marrakesz|casablanca|maroko|morocco|marrakech)\b/.test(dest)) return 'Afryka Północna';

  // Default fallback
  return 'Europa';
}

function extractActivitiesFromItinerary(trip: Trip & { itineraries: GeneratedItinerary[] }): string {
  // Extract activities from the latest completed itinerary
  const completedItinerary = trip.itineraries
    .filter((itin) => itin.status === 'COMPLETED')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  if (!completedItinerary) return '';

  try {
    const activities = new Set<string>();
    completedItinerary.generated_plan_json.itinerary.forEach((day) => {
      day.activities.forEach((activity) => {
        // Extract keywords from activity names and descriptions
        const text = `${activity.activity_name} ${activity.description}`.toLowerCase();

        // Common activity categories
        if (/\b(trekking|hiking|mountain|górski|szczyt|szlak)\b/.test(text)) activities.add('trekking');
        if (/\b(beach|plaża|swimming|pływanie|snorkeling)\b/.test(text)) activities.add('plażowanie');
        if (/\b(museum|muzeum|gallery|galeria|art|sztuka)\b/.test(text)) activities.add('zwiedzanie muzeów');
        if (/\b(restaurant|dining|food|restauracja|jedzenie|kulinarne)\b/.test(text)) activities.add('degustacje');
        if (/\b(shopping|zakupy|market|targ)\b/.test(text)) activities.add('zakupy');
        if (/\b(photo|zdjęcia|fotografia|scenic|widokowy)\b/.test(text)) activities.add('fotografia');
        if (/\b(nightlife|życie nocne|bar|pub|club)\b/.test(text)) activities.add('życie nocne');
        if (/\b(spa|relax|wellness|masaż|massage)\b/.test(text)) activities.add('spa i relaks');
        if (/\b(cycling|bike|rower|jazda na rowerze)\b/.test(text)) activities.add('jazda na rowerze');
        if (/\b(boat|łódź|cruise|rejs|sailing)\b/.test(text)) activities.add('aktywności wodne');
      });
    });

    return Array.from(activities).join(', ');
  } catch (error) {
    console.warn('Error extracting activities from itinerary:', error);
    return '';
  }
}

// Define the InputField component outside of ListGenerator to prevent re-mounting on every render.
interface InputFieldProps {
  name: keyof GenerateDetails;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  as?: 'textarea' | 'select';
  options?: string[];
}

const InputField: React.FC<InputFieldProps> = ({
  name,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  as = 'input',
  options,
}) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-slate-600 dark:text-slate-300">
      {label}
    </label>
    {as === 'textarea' ? (
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400"
        rows={2}
      />
    ) : as === 'select' ? (
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
      >
        {options?.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    ) : (
      <input
        type={name === 'days' || name === 'adults' ? 'number' : 'text'}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400"
        required={required}
        min={name === 'days' || name === 'adults' ? '1' : undefined}
      />
    )}
  </div>
);

interface ListGeneratorProps {
  onGenerate: (details: GenerateDetails) => void;
  isLoading: boolean;
  trip?: Trip & { itineraries: GeneratedItinerary[] };
}

const PackingListGenerator: React.FC<ListGeneratorProps> = ({ onGenerate, isLoading, trip }) => {
  const [details, setDetails] = useState<GenerateDetails>({
    destination: '',
    days: '',
    adults: '2',
    childrenAges: '',
    season: 'Lato',
    transport: 'Samochód',
    accommodation: 'Hotel',
    activities: '',
    special: '',
    region: 'Europa',
    travelStyle: 'Standardowy',
  });

  // Pre-populate form with trip data when available
  useEffect(() => {
    if (trip) {
      const tripDays = calculateDays(trip.start_date, trip.end_date);
      const tripSeason = getSeasonFromDate(trip.start_date);
      const tripCity = extractCityFromDestination(trip.destination);
      const tripRegion = getRegionFromDestination(trip.destination);
      const suggestedActivities = extractActivitiesFromItinerary(trip);

      setDetails((prev) => ({
        ...prev,
        destination: tripCity,
        days: tripDays,
        season: tripSeason,
        region: tripRegion,
        activities: suggestedActivities || prev.activities, // Only update if activities found
        // Keep user's previous selections for other fields, but update core trip data
      }));
    }
  }, [trip]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(details);
  };

  return (
    <>
      <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">
        {trip
          ? 'Dane z podróży zostały automatycznie uzupełnione. Możesz je dostosować.'
          : 'Opisz swój wyjazd, a AI stworzy dla Ciebie spersonalizowaną listę.'}
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          name="destination"
          label={trip ? 'Miasto/Cel (z podróży)' : 'Cel podróży'}
          placeholder="np. Kraków, Paryż"
          required
          value={details.destination}
          onChange={handleChange}
        />
        <div className="grid grid-cols-2 gap-4">
          <InputField
            name="days"
            label={trip ? 'Liczba dni (wyliczona)' : 'Liczba dni'}
            placeholder="np. 7"
            required
            value={details.days}
            onChange={handleChange}
          />
          <InputField
            name="adults"
            label="Dorośli"
            placeholder="np. 2"
            required
            value={details.adults}
            onChange={handleChange}
          />
        </div>
        <InputField
          name="childrenAges"
          label="Wiek dzieci (oddzielone przecinkami)"
          placeholder="np. 2, 5"
          value={details.childrenAges}
          onChange={handleChange}
        />
        {/* Only show region field if no trip data (manual entry) */}
        {!trip && (
          <InputField
            name="region"
            label="Region"
            placeholder="np. Europa, Azja Płd.-Wsch."
            value={details.region || ''}
            onChange={handleChange}
          />
        )}
        <InputField
          name="travelStyle"
          label="Styl podróży"
          as="select"
          options={[
            'Standardowy',
            'Budżetowy (plecak)',
            'Rodzinny (komfort)',
            'Luksusowy',
            'Biznesowy',
            'Przygoda (outdoor)',
          ]}
          value={details.travelStyle || 'Standardowy'}
          onChange={handleChange}
        />
        <div className="grid grid-cols-2 gap-4">
          <InputField
            name="season"
            label={trip ? 'Pora roku (z dat podróży)' : 'Pora roku'}
            as="select"
            options={['Wiosna', 'Lato', 'Jesień', 'Zima']}
            value={details.season}
            onChange={handleChange}
          />
          <InputField
            name="transport"
            label="Transport"
            as="select"
            options={['Samochód', 'Samolot', 'Pociąg', 'Autobus']}
            value={details.transport}
            onChange={handleChange}
          />
        </div>
        <InputField
          name="accommodation"
          label="Nocleg"
          as="select"
          options={['Hotel', 'Apartament', 'Domek', 'Kemping', 'U znajomych']}
          value={details.accommodation}
          onChange={handleChange}
        />
        <InputField
          name="activities"
          label={
            trip && extractActivitiesFromItinerary(trip)
              ? 'Planowane aktywności (z itinerarium)'
              : 'Planowane aktywności'
          }
          as="textarea"
          placeholder="np. trekking, plażowanie, praca zdalna"
          value={details.activities}
          onChange={handleChange}
        />
        <InputField
          name="special"
          label="Uwagi specjalne"
          as="textarea"
          placeholder="np. ograniczenia bagażu, alergie"
          value={details.special}
          onChange={handleChange}
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Generowanie...
            </>
          ) : (
            'Generuj listę'
          )}
        </button>
      </form>
    </>
  );
};

export default PackingListGenerator;
