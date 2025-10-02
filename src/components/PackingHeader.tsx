import React from 'react';

interface PackingHeaderProps {
    theme: string;
    toggleTheme: () => void;
    actionSlot?: React.ReactNode;
}

const PackingHeader: React.FC<PackingHeaderProps> = ({ theme, toggleTheme, actionSlot }) => {
    return (
        <header className="bg-white shadow-md dark:bg-slate-800 dark:shadow-slate-700/50 no-print">
            <div className="container mx-auto px-4 py-5 md:px-8 flex justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                     <div className="bg-indigo-500 p-3 rounded-xl text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-9-5.747h18" />
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 15" />
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 4.5l-7.5 15" />
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V5m0 14v-1m-7-7h-1m16 0h-1" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">Asystent Pakowania</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">Twoja inteligentna lista wyjazdowa</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 ml-auto">
                  {actionSlot}
                  <button
                      onClick={toggleTheme}
                      className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800"
                      aria-label="Toggle dark mode"
                  >
                      {theme === 'light' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                          </svg>
                      ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                      )}
                  </button>
                </div>
            </div>
        </header>
    );
};

export default PackingHeader;