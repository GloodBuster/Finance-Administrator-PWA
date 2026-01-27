export interface VesBatch {
    id: string;
    createdAt: Date;
    exchangeRate: number;
    initialUsd: number;
    initialVes: number;
    currentVes: number;
    isGift: boolean;
}

export interface Expense {
    id: string;
    date: Date;
    description: string;
    categoryId: string;
    amountVes: number;
    realUsdCost: number;
    originalCurrency: 'VES' | 'USD';
}

export interface Income {
    id: string;
    date: Date;
    amountUsd: number;
    description: string;
}

export interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    isSavings: boolean;
    isArchived: boolean;
}

export interface MonthlyBudget {
    id: string;
    categoryId: string;
    year: number;
    month: number;
    amountUsd: number;
}

export interface CategoryTransfer {
    id: string;
    date: Date;
    fromCategoryId: string;
    toCategoryId: string;
    amountUsd: number;
    note: string;
}