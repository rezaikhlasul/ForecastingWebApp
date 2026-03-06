/**
 * Data Analysis Service
 * Computes statistics, correlations, and detects outliers from parsed CSV data
 */

import { convertToNumber } from '../utils/dataHelpers';

/**
 * Compute descriptive statistics for a numeric column
 */
export function computeColumnStats(data, column) {
    const values = data
        .map(row => convertToNumber(row[column]))
        .filter(v => v !== null);

    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / n;

    // Median
    const median = n % 2 === 0
        ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
        : sorted[Math.floor(n / 2)];

    // Mode
    const freq = {};
    values.forEach(v => { freq[v] = (freq[v] || 0) + 1; });

    let maxFreq = 0;
    let modeKey = null;
    for (const key in freq) {
        if (freq[key] > maxFreq) {
            maxFreq = freq[key];
            modeKey = key;
        }
    }
    const mode = Number(modeKey);

    // Standard Deviation
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // Quartiles
    const q1 = sorted[Math.floor(n * 0.25)];
    const q3 = sorted[Math.floor(n * 0.75)];
    const iqr = q3 - q1;

    return {
        count: n,
        mean,
        median,
        mode,
        stdDev,
        min: sorted[0],
        max: sorted[n - 1],
        sum,
        q1,
        q3,
        iqr,
        range: sorted[n - 1] - sorted[0],
    };
}

/**
 * Compute statistics for all numeric columns
 */
export function computeStatistics(data, columns, dataTypes) {
    const stats = {};
    columns.forEach(col => {
        if (dataTypes[col] === 'numeric') {
            stats[col] = computeColumnStats(data, col);
        }
    });
    return stats;
}

/**
 * Compute missing values per column
 */
export function computeMissingValues(data, columns) {
    const missing = {};
    columns.forEach(col => {
        const count = data.filter(row =>
            row[col] === null || row[col] === undefined || row[col] === ''
        ).length;
        missing[col] = {
            count,
            percentage: (count / data.length) * 100,
        };
    });
    return missing;
}

/**
 * Pearson correlation between two numeric columns
 */
export function computeCorrelation(data, col1, col2) {
    const pairs = data
        .map(row => [convertToNumber(row[col1]), convertToNumber(row[col2])])
        .filter(([a, b]) => a !== null && b !== null);

    if (pairs.length < 3) return null;

    const n = pairs.length;
    const sumX = pairs.reduce((acc, [x]) => acc + x, 0);
    const sumY = pairs.reduce((acc, [, y]) => acc + y, 0);
    const sumXY = pairs.reduce((acc, [x, y]) => acc + x * y, 0);
    const sumX2 = pairs.reduce((acc, [x]) => acc + x * x, 0);
    const sumY2 = pairs.reduce((acc, [, y]) => acc + y * y, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
        (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
    );

    if (denominator === 0) return 0;
    return numerator / denominator;
}

/**
 * Generate correlation matrix for all numeric columns
 */
export function generateCorrelationMatrix(data, numericColumns) {
    if (numericColumns.length < 2) return null;

    const matrix = {};
    numericColumns.forEach(col1 => {
        matrix[col1] = {};
        numericColumns.forEach(col2 => {
            if (col1 === col2) {
                matrix[col1][col2] = 1;
            } else {
                matrix[col1][col2] = computeCorrelation(data, col1, col2);
            }
        });
    });
    return matrix;
}

/**
 * Detect outliers using IQR method
 */
export function detectOutliers(data, column) {
    const values = data
        .map((row, idx) => ({ value: convertToNumber(row[column]), index: idx }))
        .filter(item => item.value !== null);

    if (values.length < 4) return { outliers: [], bounds: null };

    const sorted = [...values].sort((a, b) => a.value - b.value);
    const n = sorted.length;
    const q1 = sorted[Math.floor(n * 0.25)].value;
    const q3 = sorted[Math.floor(n * 0.75)].value;
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const outliers = values.filter(
        item => item.value < lowerBound || item.value > upperBound
    );

    return {
        outliers: outliers.map(o => ({ row: o.index, value: o.value })),
        bounds: { lower: lowerBound, upper: upperBound, q1, q3, iqr },
        outlierCount: outliers.length,
        outlierPercentage: (outliers.length / values.length) * 100,
    };
}

/**
 * Get frequency distribution for a categorical column
 */
export function getFrequencyDistribution(data, column) {
    const freq = {};
    data.forEach(row => {
        const val = row[column];
        if (val !== null && val !== undefined && val !== '') {
            const key = String(val);
            freq[key] = (freq[key] || 0) + 1;
        }
    });

    return Object.entries(freq)
        .map(([value, count]) => ({
            value,
            count,
            percentage: (count / data.length) * 100,
        }))
        .sort((a, b) => b.count - a.count);
}

/**
 * Run full analysis on the dataset
 */
export function runFullAnalysis(data, columns, dataTypes) {
    const numericColumns = columns.filter(col => dataTypes[col] === 'numeric');

    const statistics = computeStatistics(data, columns, dataTypes);
    const missingValues = computeMissingValues(data, columns);
    const correlationMatrix = generateCorrelationMatrix(data, numericColumns);

    return {
        statistics,
        missingValues,
        correlationMatrix,
    };
}
