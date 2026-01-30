// src/routes/+page.server.ts
import * as cheerio from 'cheerio';
import type { LayoutServerLoad } from './$types';

// Evitar rechazo por certificados del BCV
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export const load: LayoutServerLoad = async () => {
    try {
        const response = await fetch('https://www.bcv.org.ve/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const html = await response.text();
        const $ = cheerio.load(html);

        const dolarRate = $('#dolar strong').text().trim();
        const cleanRate = dolarRate.replace('Bs.', '').trim().replace(',', '.');
        const parseValue = parseFloat(cleanRate);

        if (isNaN(parseValue)) throw new Error('No se pudo parsear el número');

        const finalFormatValue = parseFloat(parseValue.toFixed(2));

        const tasa = {
            moneda: 'USD',
            tasa: finalFormatValue,
            fecha: new Date().toLocaleDateString('es-VE')
        };

        return tasa;

    } catch (error) {
        console.error("❌ Error scrapeando BCV:", error);
        return { moneda: 'USD', tasa: 0, error: 'Fallo al obtener tasa BCV' };
    }
};