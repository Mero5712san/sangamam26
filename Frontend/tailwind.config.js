/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './index.html',
        './src/**/*.{js,jsx}',
    ],
    theme: {
        extend: {
            colors: {
                'sangamam': {
                    'maroon': '#6B2C3E',
                    'gold': '#D4A855',
                    'gold-light': '#E8C547',
                    'light-bg': '#F8F6F1',
                    'border': '#E0D5C7',
                },
            },
        },
    },
    plugins: [],
};
