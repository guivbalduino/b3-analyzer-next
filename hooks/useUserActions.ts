import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useCallback } from "react";

export function useUserActions() {
    const favorites = useLiveQuery(() => db.favorites.toArray());
    const recentSearches = useLiveQuery(() =>
        db.searches.orderBy("timestamp").reverse().limit(10).toArray()
    );

    const addToHistory = useCallback(async (symbol: string) => {
        try {
            // Remove previous entry for this symbol if exists to avoid duplicates in view
            const existing = await db.searches.where("symbol").equals(symbol).first();
            if (existing && existing.id) {
                await db.searches.delete(existing.id);
            }

            await db.searches.add({
                symbol: symbol,
                timestamp: new Date()
            });
        } catch (error) {
            console.error("Error adding to history:", error);
        }
    }, []);

    const toggleFavorite = useCallback(async (symbol: string, name: string) => {
        try {
            const exists = await db.favorites.get(symbol);
            if (exists) {
                await db.favorites.delete(symbol);
            } else {
                await db.favorites.add({
                    symbol,
                    name,
                    addedAt: new Date()
                });
            }
        } catch (error) {
            console.error("Error toggling favorite:", error);
        }
    }, []);

    const bulkAddFavorites = useCallback(async (stocks: { symbol: string, name: string }[]) => {
        try {
            const now = new Date();
            const favoriteStocks = stocks.map(s => ({
                symbol: s.symbol.toUpperCase().trim(),
                name: s.name,
                addedAt: now
            }));

            await db.favorites.bulkPut(favoriteStocks);
        } catch (error) {
            console.error("Error bulk adding favorites:", error);
        }
    }, []);

    const isFavorite = useCallback((symbol: string) => {
        return favorites?.some(f => f.symbol === symbol) ?? false;
    }, [favorites]);

    return {
        favorites: favorites || [],
        recentSearches: recentSearches || [],
        addToHistory,
        toggleFavorite,
        bulkAddFavorites,
        isFavorite
    };
}
