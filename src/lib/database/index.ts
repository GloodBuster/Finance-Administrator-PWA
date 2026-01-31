import Dexie, { type Table } from 'dexie';
import type { VesBatch, Expense, Income, Category, MonthlyBudget, CategoryTransfer } from './types';

export class ExpensesAppDB extends Dexie {
    batches!: Table<VesBatch, string>;
    expenses!: Table<Expense, string>;
    incomes!: Table<Income, string>;
    categories!: Table<Category, string>;
    monthlyBudgets!: Table<MonthlyBudget, string>;
    transfers!: Table<CategoryTransfer, string>;

    constructor() {
        super('ExpensesAppDB');
        this.version(1).stores({

            batches: 'id, createdAt, currentVes',

            expenses: 'id, date, categoryId',

            incomes: 'id, date',

            categories: 'id, isSavings, name, isArchived',

            monthlyBudgets: 'id, [year+month], categoryId',

            transfers: 'id, date'
        });
    }
}

export const db = new ExpensesAppDB();