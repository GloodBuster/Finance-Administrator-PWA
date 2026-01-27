import { v4 as uuidv4 } from 'uuid';
import { db } from './index';
import type { Category } from './types';

export async function seedDatabase() {
    await db.categories
        .where('name')
        .equals('Fondo de Libertad')
        .modify({ name: 'Reserva' });
    const count = await db.categories.count();
    if (count > 0) {
        return;
    }

    console.log("🌱 Sembrando base de datos inicial...");

    const initialCategories: Category[] = [
        {
            id: uuidv4(),
            name: "Salidas y Caprichos",
            icon: "glass-cocktail",
            color: "#FF5722", // Deep Orange
            isSavings: false,
            isArchived: false
        },
        {
            id: uuidv4(),
            name: "Suscripciones",
            icon: "netflix",
            color: "#9C27B0", // Purple
            isSavings: false,
            isArchived: false
        },
        {
            id: uuidv4(),
            name: "Compra Grande",
            icon: "sofa",
            color: "#2196F3", // Blue
            isSavings: true,
            isArchived: false
        },
        // --- AQUÍ ESTÁ TU NUEVA CATEGORÍA ---
        {
            id: uuidv4(),
            name: "Reserva",    // <--- Nombre definitivo
            icon: "piggy-bank",
            color: "#10B981",   // Emerald (Verde elegante, no radioactivo)
            isSavings: true,
            isArchived: false
        },
        {
            id: uuidv4(),
            name: "Viaje",
            icon: "airplane",
            color: "#00BCD4", // Cyan
            isSavings: true,
            isArchived: false
        }
    ];

    await db.categories.bulkAdd(initialCategories);
    console.log("✅ Seed completado.");
}