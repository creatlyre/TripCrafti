import React, { useState, ReactNode } from 'react';

interface CollapsibleSectionProps {
    title: string;
    children: ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
                aria-expanded={isOpen}
                aria-controls={`collapsible-content-${title.replace(/\s+/g, '-')}`}
            >
                <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">{title}</h2>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-slate-400 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div
                id={`collapsible-content-${title.replace(/\s+/g, '-')}`}
                className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="px-6 pb-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default CollapsibleSection;