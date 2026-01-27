import konstaConfig from 'konsta/config';

/** @type {import('tailwindcss').Config} */
export default konstaConfig({
    content: [
        './src/**/*.{html,js,svelte,ts}',
        './node_modules/konsta/svelte/**/*.{js,svelte}'
    ],
    darkMode: 'class',
    theme: {
        extend: {
            // 👇 AGREGA ESTO: Definimos la familia tipográfica
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            }
        }
    },
    plugins: []
});