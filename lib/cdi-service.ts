import { startOfDay, format, subYears, eachDayOfInterval, isWeekend } from 'date-fns';

/**
 * Interface for CDI daily rate from BCB API
 * Series 11: CDI daily rate (percentage)
 */
interface BCBRate {
    data: string; // "dd/mm/yyyy"
    valor: string; // percentage value as string
}

export async function fetchHistoricalCDI(startDate: Date, endDate: Date = new Date()) {
    const startStr = format(startDate, 'dd/MM/yyyy');
    const endStr = format(endDate, 'dd/MM/yyyy');

    // BCB API: Series 11 is the daily CDI rate
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.11/dados?formato=json&dataInicial=${startStr}&dataFinal=${endStr}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch CDI data from BCB');

        const data: BCBRate[] = await response.json();

        return data.map(item => ({
            date: item.data, // dd/mm/yyyy
            rate: parseFloat(item.valor) / 100 // convert percentage to decimal (e.g. 0.0005)
        }));
    } catch (error) {
        console.error('[CDI Service Error]:', error);
        throw error;
    }
}

/**
 * Calculates the compounded CDI for a period
 * Returns absolute yield (e.g. 1.12 for 12% profit)
 */
export function calculateCompoundedCDI(rates: { date: string, rate: number }[]) {
    let factor = 1;
    for (const item of rates) {
        factor *= (1 + item.rate);
    }
    return factor;
}

/**
 * Calculates the simple CDI for a period (sum of rates)
 */
export function calculateSimpleCDI(rates: { date: string, rate: number }[]) {
    return 1 + rates.reduce((acc, curr) => acc + curr.rate, 0);
}

/**
 * Estimates future CDI based on a yearly rate
 * dailyRate = (1 + yearlyRate)^(1/252) - 1
 */
export function estimateFutureCDI(yearlyRate: number, days: number = 252) {
    const dailyRate = Math.pow(1 + yearlyRate, 1 / 252) - 1;
    const results = [];
    let factor = 1;

    for (let i = 1; i <= days; i++) {
        factor *= (1 + dailyRate);
        results.push({
            day: i,
            factor: factor
        });
    }

    return results;
}
