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

export class UserDatabase extends Dexie {
    searches!: Table<SearchHistory>;
    favorites!: Table<FavoriteStock>;

    constructor() {
        super('B3AnalyzerDB');
        this.version(1).stores({
            searches: '++id, symbol, timestamp', // id is auto-incremented
            favorites: 'symbol, name, addedAt'    // symbol is primary key
        });
    }
}

export const db = new UserDatabase();
