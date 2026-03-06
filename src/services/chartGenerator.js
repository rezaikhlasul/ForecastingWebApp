/**
 * Chart Generator Service
 * Auto-generates chart configurations based on detected data types
 */

import { convertToNumber, getChartColor } from '../utils/dataHelpers';
import { getFrequencyDistribution } from './dataAnalysis';

/**
 * Generate histogram data for a numeric column
 */
function generateHistogramData(data, column, bins = 15) {
    const values = data
        .map(row => convertToNumber(row[column]))
        .filter(v => v !== null);

    if (values.length === 0) return [];

    let min = values[0];
    let max = values[0];
    for (let i = 1; i < values.length; i++) {
        if (values[i] < min) min = values[i];
        if (values[i] > max) max = values[i];
    }

    const binWidth = (max - min) / bins || 1;

    const histogram = Array.from({ length: bins }, (_, i) => ({
        range: `${(min + i * binWidth).toFixed(1)}`,
        min: min + i * binWidth,
        max: min + (i + 1) * binWidth,
        count: 0,
    }));

    values.forEach(v => {
        const binIndex = Math.min(Math.floor((v - min) / binWidth), bins - 1);
        histogram[binIndex].count++;
    });

    return histogram;
}

/**
 * Generate scatter plot data between two numeric columns
 */
function generateScatterData(data, colX, colY, maxPoints = 500) {
    const sampled = data.length > maxPoints
        ? data.filter((_, i) => i % Math.ceil(data.length / maxPoints) === 0)
        : data;

    return sampled
        .map(row => ({
            x: convertToNumber(row[colX]),
            y: convertToNumber(row[colY]),
        }))
        .filter(point => point.x !== null && point.y !== null);
}

/**
 * Generate time series data
 */
function generateTimeSeriesData(data, dateCol, valueCol) {
    return data
        .map(row => {
            const date = new Date(row[dateCol]);
            const value = convertToNumber(row[valueCol]);
            if (isNaN(date.getTime()) || value === null) return null;
            return { date: date.toISOString().split('T')[0], value, timestamp: date.getTime() };
        })
        .filter(v => v !== null)
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, 500);
}

/**
 * Generate all chart configs based on data types
 */
export function generateChartConfigs(data, columns, dataTypes, statistics) {
    const configs = [];
    const numericCols = columns.filter(col => dataTypes[col] === 'numeric');
    const categoricalCols = columns.filter(col => dataTypes[col] === 'categorical');
    const dateCols = columns.filter(col => dataTypes[col] === 'datetime');

    // 1. Histograms for numeric columns (top 4)
    numericCols.slice(0, 4).forEach((col, idx) => {
        configs.push({
            id: `histogram-${col}`,
            type: 'histogram',
            title: `Distribution of ${col}`,
            subtitle: statistics[col]
                ? `Mean: ${statistics[col].mean?.toFixed(2)} | Std: ${statistics[col].stdDev?.toFixed(2)}`
                : '',
            data: generateHistogramData(data, col),
            dataKey: 'count',
            xAxisKey: 'range',
            color: getChartColor(idx),
            column: col,
        });
    });

    // 2. Bar/Pie charts for categorical columns (top 3)
    categoricalCols.slice(0, 3).forEach((col, idx) => {
        const freqData = getFrequencyDistribution(data, col).slice(0, 10);
        const uniqueCount = freqData.length;

        if (uniqueCount <= 6) {
            configs.push({
                id: `pie-${col}`,
                type: 'pie',
                title: `Distribution of ${col}`,
                subtitle: `${uniqueCount} categories`,
                data: freqData.map((item, i) => ({
                    name: item.value,
                    value: item.count,
                    fill: getChartColor(i),
                })),
                column: col,
            });
        } else {
            configs.push({
                id: `bar-${col}`,
                type: 'bar',
                title: `Top Values in ${col}`,
                subtitle: `Showing top ${Math.min(10, uniqueCount)} of ${uniqueCount} categories`,
                data: freqData,
                dataKey: 'count',
                xAxisKey: 'value',
                color: getChartColor(idx + 4),
                column: col,
            });
        }
    });

    // 3. Time series charts (date + numeric)
    if (dateCols.length > 0 && numericCols.length > 0) {
        const dateCol = dateCols[0];
        numericCols.slice(0, 2).forEach((numCol, idx) => {
            const tsData = generateTimeSeriesData(data, dateCol, numCol);
            if (tsData.length > 0) {
                configs.push({
                    id: `timeseries-${dateCol}-${numCol}`,
                    type: 'line',
                    title: `${numCol} over Time`,
                    subtitle: `Based on ${dateCol}`,
                    data: tsData,
                    dataKey: 'value',
                    xAxisKey: 'date',
                    color: getChartColor(idx + 7),
                    columns: [dateCol, numCol],
                });
            }
        });
    }

    // 4. Scatter plots (numeric vs numeric, top 2 pairs)
    if (numericCols.length >= 2) {
        const pairs = [];
        for (let i = 0; i < Math.min(numericCols.length, 4); i++) {
            for (let j = i + 1; j < Math.min(numericCols.length, 4); j++) {
                pairs.push([numericCols[i], numericCols[j]]);
            }
        }

        pairs.slice(0, 2).forEach(([colX, colY], idx) => {
            configs.push({
                id: `scatter-${colX}-${colY}`,
                type: 'scatter',
                title: `${colX} vs ${colY}`,
                subtitle: 'Correlation analysis',
                data: generateScatterData(data, colX, colY),
                xAxisKey: 'x',
                yAxisKey: 'y',
                color: getChartColor(idx + 10),
                columns: [colX, colY],
            });
        });
    }

    // 5. Grouped bar chart (categorical + numeric)
    if (categoricalCols.length > 0 && numericCols.length > 0) {
        const catCol = categoricalCols[0];
        const numCol = numericCols[0];
        const freqData = getFrequencyDistribution(data, catCol).slice(0, 8);
        const categories = freqData.map(f => f.value);

        const groupedData = categories.map(cat => {
            const catRows = data.filter(row => String(row[catCol]) === cat);
            const values = catRows.map(row => convertToNumber(row[numCol])).filter(v => v !== null);
            const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
            return { category: cat, average: Number(avg.toFixed(2)) };
        });

        if (groupedData.length > 0) {
            configs.push({
                id: `grouped-${catCol}-${numCol}`,
                type: 'grouped-bar',
                title: `Average ${numCol} by ${catCol}`,
                subtitle: `Grouped analysis`,
                data: groupedData,
                dataKey: 'average',
                xAxisKey: 'category',
                color: getChartColor(12),
                columns: [catCol, numCol],
            });
        }
    }

    return configs;
}
