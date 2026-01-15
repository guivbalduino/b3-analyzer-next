import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance();

async function test() {
    const result = await yf.chart('PETR4.SA', {
        period1: '2023-01-01',
        period2: '2024-12-31',
        interval: '1d',
        // events: 'div' // This might be the way
    });
    console.log(JSON.stringify(result, null, 2));
}

test();
