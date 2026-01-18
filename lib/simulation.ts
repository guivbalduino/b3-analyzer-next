
// Logic extracted from TimeMachine.tsx for reuse

export interface BacktestResult {
    initialDate: string;
    initialPrice: number;
    finalValueSimple: number;
    appreciationValue: number;
    dividendsValue: number;
    marketValue: number;
    initialPlusDividends: number;
    finalValueCompound: number;
    extraReturn: number;
}

export function calculateBacktest(data: any[], amount: number, period: string): BacktestResult | null {
    if (!data || data.length === 0) return null;

    const periods = [
        { label: "1 Mês", value: "1M", days: 30 },
        { label: "6 Meses", value: "6M", days: 180 },
        { label: "1 Ano", value: "1Y", days: 365 },
        { label: "5 Anos", value: "5Y", days: 1825 },
    ];

    const targetDays = periods.find(p => p.value === period)?.days || 365;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - targetDays);

    let closestItem: any = null;
    let minDiff = Infinity;

    data.forEach((item: any) => {
        const itemDate = new Date(item.date);
        const diff = Math.abs(itemDate.getTime() - targetDate.getTime());
        if (diff < minDiff) {
            minDiff = diff;
            closestItem = item;
        }
    });

    if (!closestItem) return null;

    const initialPrice = closestItem.close;
    const currentPrice = data[data.length - 1].close; // Assuming data is sorted or last item is current? 
    // Actually, TimeMachine component passed 'currentPrice' as prop. 
    // Let's modify the signature to accept currentPrice if needed, or rely on data. 
    // But data might be historical only. 
    // We should pass currentPrice to be safe as the component did.

    // Waiting, the original component logic:
    // const quantity = amount / initialPrice;
    // const finalValue = quantity * currentPrice;
    // ...
    // BUT the component receives currentPrice. We should add it to args.
    return null; // Placeholder to fix signature in next step
}

// Redefining allowing currentPrice
export function calculateBacktestLogic(
    data: any[],
    currentPrice: number,
    amount: number,
    period: string
): BacktestResult | null {
    if (!data || data.length === 0) return null;

    const periods = [
        { label: "1 Mês", value: "1M", days: 30 },
        { label: "6 Meses", value: "6M", days: 180 },
        { label: "1 Ano", value: "1Y", days: 365 },
        { label: "5 Anos", value: "5Y", days: 1825 },
    ];

    const targetDays = periods.find(p => p.value === period)?.days || 365;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - targetDays);

    let closestItem: any = null;
    let minDiff = Infinity;

    data.forEach((item: any) => {
        const itemDate = new Date(item.date);
        const diff = Math.abs(itemDate.getTime() - targetDate.getTime());
        if (diff < minDiff) {
            minDiff = diff;
            closestItem = item;
        }
    });

    if (!closestItem) return null;

    const initialPrice = closestItem.close;
    const initialShares = amount / initialPrice;
    const targetTime = new Date(closestItem.date).getTime();

    let totalDividendsPerShare = 0;
    let compoundShares = initialShares;

    const chronData = [...data]
        .filter((item: any) => new Date(item.date).getTime() >= targetTime)
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    chronData.forEach((item: any) => {
        if (item.dividend) {
            totalDividendsPerShare += item.dividend;
            const payout = compoundShares * item.dividend;
            const newShares = payout / item.close;
            compoundShares += newShares;
        }
    });

    const marketValue = initialShares * currentPrice;
    const dividendsValue = initialShares * totalDividendsPerShare;
    const finalValueSimple = marketValue + dividendsValue;
    const appreciationValue = marketValue - amount;
    const finalValueCompound = compoundShares * currentPrice;

    return {
        initialDate: new Date(closestItem.date).toLocaleDateString("pt-BR"),
        initialPrice,
        finalValueSimple,
        appreciationValue,
        dividendsValue,
        marketValue,
        initialPlusDividends: amount + dividendsValue,
        finalValueCompound,
        extraReturn: finalValueCompound - finalValueSimple
    };
}

export function calculateCAGR(data: any[]): number | null {
    if (!data || data.length < 2) return null;

    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    const startPrice = first.close;
    const endPrice = last.close;

    const days = (new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24);
    const years = days / 365;

    if (startPrice > 0 && years > 0) {
        return Math.pow(endPrice / startPrice, 1 / years) - 1;
    }
    return null;
}

export function calculateProjectionValue(
    cagr: number,
    startAmount: number,
    monthlyContribution: number,
    months: number
): number {
    const monthlyRate = cagr ? Math.pow(1 + cagr, 1 / 12) - 1 : 0;
    if (!monthlyRate) return startAmount + (monthlyContribution * months);

    const fvLumpSum = startAmount * Math.pow(1 + monthlyRate, months);
    const fvAnnuity = monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    return fvLumpSum + fvAnnuity;
}

export function calculateProjectionTime(
    cagr: number,
    startAmount: number,
    monthlyContribution: number,
    targetAmount: number
): number {
    // Returns months
    const monthlyRate = cagr ? Math.pow(1 + cagr, 1 / 12) - 1 : 0;

    if (!monthlyRate) {
        if (monthlyContribution <= 0) return 0;
        return (targetAmount - startAmount) / monthlyContribution;
    }
    if (targetAmount <= startAmount) return 0;

    const numerator = (targetAmount * monthlyRate) + monthlyContribution;
    const denominator = (startAmount * monthlyRate) + monthlyContribution;

    if (denominator === 0 || numerator / denominator <= 0) return 0;

    return Math.log(numerator / denominator) / Math.log(1 + monthlyRate);
}
