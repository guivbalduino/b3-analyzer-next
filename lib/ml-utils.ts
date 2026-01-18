/**
 * Simple Linear Regression implementation
 */
export function predictLinear(data: number[], nextPeriods: number = 5): number[] {
    const n = data.length;
    if (n < 2) return new Array(nextPeriods).fill(data[0] || 0);

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += data[i];
        sumXY += i * data[i];
        sumXX += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const predictions: number[] = [];
    for (let i = 0; i < nextPeriods; i++) {
        predictions.push(slope * (n + i) + intercept);
    }
    return predictions;
}

/**
 * Polynomial Regression (Degree 2) - y = ax^2 + bx + c
 * Captures trend curvature (exhaustion or acceleration)
 */
export function predictPolynomial(data: number[], nextPeriods: number = 5): number[] {
    const n = data.length;
    if (n < 3) return predictLinear(data, nextPeriods);

    let s0 = n, s1 = 0, s2 = 0, s3 = 0, s4 = 0;
    let sy = 0, sxy = 0, sx2y = 0;

    for (let i = 0; i < n; i++) {
        const x = i;
        const x2 = x * x;
        const y = data[i];
        s1 += x;
        s2 += x2;
        s3 += x2 * x;
        s4 += x2 * x2;
        sy += y;
        sxy += x * y;
        sx2y = sx2y + x2 * y;
    }

    const det = s0 * (s2 * s4 - s3 * s3) - s1 * (s1 * s4 - s2 * s3) + s2 * (s1 * s3 - s2 * s2);
    if (Math.abs(det) < 1e-10) return predictLinear(data, nextPeriods);

    const a = (sy * (s2 * s4 - s3 * s3) - s1 * (sxy * s4 - sx2y * s3) + s2 * (sxy * s3 - sx2y * s2)) / det;
    const b = (s0 * (sxy * s4 - sx2y * s3) - sy * (s1 * s4 - s2 * s3) + s2 * (s1 * sx2y - sxy * s2)) / det;
    const c = (s0 * (s2 * sx2y - sxy * s3) - s1 * (s1 * sx2y - sxy * s2) + sy * (s1 * s3 - s2 * s2)) / det;

    const predictions: number[] = [];
    for (let i = 0; i < nextPeriods; i++) {
        const x = n + i;
        predictions.push(c * x * x + b * x + a);
    }
    return predictions;
}

/**
 * Holt's Linear Trend (Double Exponential Smoothing)
 */
export function predictHolt(data: number[], nextPeriods: number = 5): number[] {
    const n = data.length;
    if (n < 2) return predictLinear(data, nextPeriods);

    const alpha = 0.3;
    const beta = 0.2;

    let level = data[0];
    let trend = data[1] - data[0];

    for (let i = 1; i < n; i++) {
        const lastLevel = level;
        level = alpha * data[i] + (1 - alpha) * (level + trend);
        trend = beta * (level - lastLevel) + (1 - beta) * trend;
    }

    const predictions: number[] = [];
    for (let i = 1; i <= nextPeriods; i++) {
        predictions.push(level + i * trend);
    }
    return predictions;
}

/**
 * Weighted Moving Average (WMA) prediction
 */
export function predictWMA(data: number[], nextPeriods: number = 5): number[] {
    const n = data.length;
    if (n < 2) return new Array(nextPeriods).fill(data[0] || 0);

    const weights = data.map((_, i) => i + 1);
    const sumWeights = (n * (n + 1)) / 2;

    let currentWMA = 0;
    for (let i = 0; i < n; i++) {
        currentWMA += data[i] * (i + 1);
    }
    currentWMA /= sumWeights;

    const prevN = n - 1;
    const prevWeights = (prevN * (prevN + 1)) / 2;
    let prevWMA = 0;
    for (let i = 0; i < prevN; i++) {
        prevWMA += data[i] * (i + 1);
    }
    prevWMA /= prevWeights;

    const slope = currentWMA - prevWMA;

    const predictions: number[] = [];
    for (let i = 1; i <= nextPeriods; i++) {
        predictions.push(data[n - 1] + (slope * i));
    }
    return predictions;
}

/**
 * Monte Carlo Simulation for Confidence Intervals
 */
export function simulateMonteCarlo(data: number[], nextPeriods: number = 5) {
    const n = data.length;
    if (n < 2) return { upper: new Array(nextPeriods).fill(data[0]), lower: new Array(nextPeriods).fill(data[0]) };

    const returns: number[] = [];
    for (let i = 1; i < n; i++) {
        returns.push(Math.log(data[i] / data[i - 1]));
    }

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    const upper: number[] = [];
    const lower: number[] = [];

    for (let i = 1; i <= nextPeriods; i++) {
        const drift = (mean - 0.5 * variance) * i;
        const shock = stdDev * Math.sqrt(i) * 1.645; // 90% confidence interval
        upper.push(data[n - 1] * Math.exp(drift + shock));
        lower.push(data[n - 1] * Math.exp(drift - shock));
    }

    return { upper, lower };
}
