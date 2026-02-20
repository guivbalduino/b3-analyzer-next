import { useLiveQuery } from "dexie-react-hooks";
import { db, PortfolioStock } from "@/lib/db";
import { useCallback } from "react";

export function usePortfolio() {
    const portfolio = useLiveQuery(() => db.portfolio.toArray());

    const bulkAddToPortfolio = useCallback(async (stocks: { symbol: string, quantity: number, name?: string, sector?: string, type?: string }[]) => {
        try {
            const now = new Date();
            for (const stock of stocks) {
                const existing = await db.portfolio.get(stock.symbol);
                if (existing) {
                    await db.portfolio.update(stock.symbol, {
                        quantity: existing.quantity + stock.quantity,
                        sector: stock.sector || existing.sector,
                        name: stock.name || existing.name,
                        type: stock.type || existing.type
                    });
                } else {
                    await db.portfolio.add({
                        symbol: stock.symbol,
                        name: stock.name || stock.symbol,
                        quantity: stock.quantity,
                        sector: stock.sector,
                        type: stock.type,
                        addedAt: now
                    });
                }
            }
        } catch (error) {
            console.error("Error bulk adding to portfolio:", error);
        }
    }, []);

    const addToPortfolio = useCallback(async (stock: Omit<PortfolioStock, 'addedAt'>) => {
        await bulkAddToPortfolio([stock]);
    }, [bulkAddToPortfolio]);

    const updateQuantity = useCallback(async (symbol: string, quantity: number) => {
        try {
            if (quantity <= 0) {
                await db.portfolio.delete(symbol);
            } else {
                await db.portfolio.update(symbol, { quantity });
            }
        } catch (error) {
            console.error("Error updating quantity:", error);
        }
    }, []);

    const removeFromPortfolio = useCallback(async (symbol: string) => {
        try {
            await db.portfolio.delete(symbol);
        } catch (error) {
            console.error("Error removing from portfolio:", error);
        }
    }, []);

    const clearPortfolio = useCallback(async () => {
        try {
            await db.portfolio.clear();
        } catch (error) {
            console.error("Error clearing portfolio:", error);
        }
    }, []);

    return {
        portfolio: portfolio || [],
        addToPortfolio,
        bulkAddToPortfolio,
        updateQuantity,
        removeFromPortfolio,
        clearPortfolio
    };
}
