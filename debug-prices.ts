import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance();

async function test() {
    const symbols = ['PETR4.SA', 'ITUB4.SA', 'VALE3.SA', 'AAPL'];

    for (const symbol of symbols) {
        console.log(`--- Testing ${symbol} ---`);
        try {
            const result = await yf.quoteSummary(symbol, {
                modules: ['financialData', 'defaultKeyStatistics']
            });
            console.log(`Target Mean: ${result?.financialData?.targetMeanPrice}`);
            console.log(`Potential Keys: ${Object.keys(result?.financialData || {})}`);
        } catch (e: any) {
            console.error(`Error for ${symbol}: ${e.message}`);
        }
    }
}

test();
