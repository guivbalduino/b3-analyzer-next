import Dexie, { Table } from 'dexie';

export interface SearchHistory {
    id?: number;
    symbol: string;
    timestamp: Date;
}

export interface FavoriteStock {
    symbol: string;
    name: string;
    addedAt: Date;
}

export interface PortfolioStock {
    symbol: string;
    name: string;
    quantity: number;
    sector?: string;
    industry?: string;
    type?: string;
    addedAt: Date;
}

export class UserDatabase extends Dexie {
    searches!: Table<SearchHistory>;
    favorites!: Table<FavoriteStock>;
    portfolio!: Table<PortfolioStock>;

    constructor() {
        super('B3AnalyzerDB');
        this.version(3).stores({
            searches: '++id, symbol, timestamp',
            favorites: 'symbol, name, addedAt',
            portfolio: 'symbol, name, quantity, sector, type, addedAt'
        });
    }
}

export const db = new UserDatabase();
