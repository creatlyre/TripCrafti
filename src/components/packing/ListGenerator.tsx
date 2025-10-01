import React, { useState } from 'react';
import type { GenerateDetails } from '@/types';

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

const InputField: React.FC<InputFieldProps> = ({ name, label, value, onChange, placeholder, required = false, as = 'input', options }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-600 dark:text-slate-300">{label}</label>
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
                {options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        ) : (
            <input
                type={(name === 'days' || name === 'adults') ? 'number' : 'text'}
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400"
                required={required}
                min={(name === 'days' || name === 'adults') ? "1" : undefined}
            />
        )}
    </div>
);


interface ListGeneratorProps {
    onGenerate: (details: GenerateDetails) => void;
    isLoading: boolean;
}

const ListGenerator: React.FC<ListGeneratorProps> = ({ onGenerate, isLoading }) => {
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setDetails(prev => ({...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onGenerate(details);
    };

    return (
        <>
            <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">Opisz swój wyjazd, a AI stworzy dla Ciebie spersonalizowaną listę.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <InputField name="destination" label="Cel podróży" placeholder="np. wakacje w górach" required value={details.destination} onChange={handleChange} />
                <div className="grid grid-cols-2 gap-4">
                    <InputField name="days" label="Liczba dni" placeholder="np. 7" required value={details.days} onChange={handleChange} />
                    <InputField name="adults" label="Dorośli" placeholder="np. 2" required value={details.adults} onChange={handleChange} />
                </div>
                <InputField name="childrenAges" label="Wiek dzieci (oddzielone przecinkami)" placeholder="np. 2, 5" value={details.childrenAges} onChange={handleChange} />
                 <div className="grid grid-cols-2 gap-4">
                    <InputField name="region" label="Region" placeholder="np. Europa, Azja Płd.-Wsch." value={details.region} onChange={handleChange} />
                    <InputField
                        name="travelStyle"
                        label="Styl podróży"
                        as="select"
                        options={['Standardowy', 'Budżetowy (plecak)', 'Rodzinny (komfort)', 'Luksusowy', 'Biznesowy', 'Przygoda (outdoor)']}
                        value={details.travelStyle}
                        onChange={handleChange}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <InputField name="season" label="Pora roku" as="select" options={['Wiosna', 'Lato', 'Jesień', 'Zima']} value={details.season} onChange={handleChange} />
                    <InputField name="transport" label="Transport" as="select" options={['Samochód', 'Samolot', 'Pociąg', 'Autobus']} value={details.transport} onChange={handleChange} />
                </div>
                 <InputField name="accommodation" label="Nocleg" as="select" options={['Hotel', 'Apartament', 'Domek', 'Kemping', 'U znajomych']} value={details.accommodation} onChange={handleChange} />
                <InputField name="activities" label="Planowane aktywności" as="textarea" placeholder="np. trekking, plażowanie, praca zdalna" value={details.activities} onChange={handleChange} />
                <InputField name="special" label="Uwagi specjalne" as="textarea" placeholder="np. ograniczenia bagażu, alergie" value={details.special} onChange={handleChange} />

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generowanie...
                        </>
                    ) : 'Generuj listę'}
                </button>
            </form>
        </>
    );
};

export default ListGenerator;