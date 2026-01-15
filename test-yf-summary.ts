import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance();

async function test() {
    const symbol = 'PETR4.SA';
    const result = await yf.quoteSummary(symbol, {
        modules: ['summaryDetail', 'defaultKeyStatistics', 'financialData']
    });
    console.log(JSON.stringify(result, null, 2));
}

test();
