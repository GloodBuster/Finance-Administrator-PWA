import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [sveltekit(), tailwindcss() as any, VitePWA({
        registerType: 'autoUpdate',
        manifest: {
            name: 'Gestor Financiero',
            short_name: 'Finanzas',
            description: 'Control de gastos Venezuela',
            theme_color: '#ffffff',
            background_color: '#ffffff',
            display: 'standalone',
            scope: '/',
            start_url: '/',
            icons: [
                {
                    src: 'pwa-192x192.png',
                    sizes: '192x192',
                    type: 'image/png'
                },
                {
                    src: 'pwa-512x512.png',
                    sizes: '512x512',
                    type: 'image/png'
                }
            ]
        },
        workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg}']
        },
        devOptions: {
            enabled: true,
            suppressWarnings: true
        }
    })],
    server: {
        port: 8000
    }
});
