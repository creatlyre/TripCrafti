/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        brand: {
          cyan: '#4ED8D8',
          orange: '#FF9A52',
          navy: '#0A192F',
          'navy-light': '#1A2540',
          'navy-lighter': '#2A3550',
          'navy-dark': '#050B15',
        },
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
