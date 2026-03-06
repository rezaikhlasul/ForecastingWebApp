/**
 * Data Helper Utilities
 */

export function formatNumber(num, decimals = 2) {
    if (num === null || num === undefined || isNaN(num)) return '—';
    if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return Number(num).toFixed(decimals);
}

export function formatPercentage(num, decimals = 1) {
    if (num === null || num === undefined || isNaN(num)) return '—';
    return Number(num).toFixed(decimals) + '%';
}

export function truncateText(text, maxLength = 30) {
    if (!text) return '';
    const str = String(text);
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}

export function getColumnSample(data, column, count = 5) {
    return data.slice(0, count).map(row => row[column]);
}

export function isDateColumn(values) {
    const datePatterns = [
        /^\d{4}-\d{2}-\d{2}$/,
        /^\d{2}\/\d{2}\/\d{4}$/,
        /^\d{2}-\d{2}-\d{4}$/,
        /^\d{4}\/\d{2}\/\d{2}$/,
        /^\d{4}-\d{2}-\d{2}T/,
        /^\d{2}\.\d{2}\.\d{4}$/,
        /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i,
    ];

    const sampleValues = values.filter(v => v !== null && v !== undefined && v !== '').slice(0, 20);
    if (sampleValues.length === 0) return false;

    const matchCount = sampleValues.filter(val => {
        const str = String(val).trim();
        return datePatterns.some(pattern => pattern.test(str)) || !isNaN(Date.parse(str));
    }).length;

    return matchCount / sampleValues.length >= 0.7;
}

export function parseDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
}

export function detectDataType(values) {
    const cleanValues = values.filter(v => v !== null && v !== undefined && v !== '');
    if (cleanValues.length === 0) return 'text';

    // Check for datetime
    if (isDateColumn(cleanValues)) return 'datetime';

    // Check for numeric
    const numericCount = cleanValues.filter(v => {
        const num = Number(v);
        return !isNaN(num) && v !== '' && v !== true && v !== false;
    }).length;

    if (numericCount / cleanValues.length >= 0.8) return 'numeric';

    // Check unique ratio for categorical vs text
    const uniqueValues = new Set(cleanValues.map(v => String(v).toLowerCase()));
    const uniqueRatio = uniqueValues.size / cleanValues.length;

    if (uniqueRatio <= 0.5 || uniqueValues.size <= 20) return 'categorical';

    return 'text';
}

export function detectAllDataTypes(data, columns) {
    const dataTypes = {};
    columns.forEach(col => {
        const values = data.map(row => row[col]);
        dataTypes[col] = detectDataType(values);
    });
    return dataTypes;
}

export function getUniqueValues(data, column) {
    const values = data.map(row => row[column]).filter(v => v !== null && v !== undefined && v !== '');
    return [...new Set(values)];
}

export function countMissingValues(data, column) {
    return data.filter(row => row[column] === null || row[column] === undefined || row[column] === '').length;
}

export const CHART_COLORS = [
    '#6C63FF', '#00D4AA', '#FFB84D', '#FF6B6B', '#4DA6FF',
    '#A78BFA', '#34D399', '#FBBF24', '#F87171', '#60A5FA',
    '#C084FC', '#2DD4BF', '#FB923C', '#F472B6', '#38BDF8',
];

export function getChartColor(index) {
    return CHART_COLORS[index % CHART_COLORS.length];
}

export function convertToNumber(value) {
    if (value === null || value === undefined || value === '') return null;

    // Convert to string and clean it up (remove currency symbols, commas, trailing/leading whitespace)
    let cleaned = String(value).trim();

    // If it clearly looks like a number with formatting
    // Remove $, €, Rp, spaces, and commas
    cleaned = cleaned.replace(/[Rp$€,\s]/gi, '');

    const num = Number(cleaned);
    return isNaN(num) ? null : num;
}

export function cleanDataCell(value) {
    if (value === null || value === undefined) return null;

    let str = String(value).trim();
    if (str === '' || str.toLowerCase() === 'nan' || str.toLowerCase() === 'n/a' || str.toLowerCase() === 'null') {
        return null;
    }

    // Try to see if it's a formatted number that we can clean
    // If we strip currency/commas and it becomes a valid number, we store it as that string format (or number)
    // Actually, we'll keep it as a string but stripped of formatting, so PapaParse/detectDataType can see it's numeric
    const cleanNumStr = str.replace(/[Rp$€,\s]/gi, '');
    if (cleanNumStr !== '' && !isNaN(Number(cleanNumStr))) {
        // Only return the cleaned number string if the original string contained numbers and formatting
        // We don't want to accidentally convert ' ' to 0
        if (/[0-9]/.test(str)) {
            return Number(cleanNumStr);
        }
    }

    return str;
}

export function normalizeData(data) {
    return data.map(row => {
        const normalizedRow = {};
        for (const [key, value] of Object.entries(row)) {
            normalizedRow[key] = cleanDataCell(value);
        }
        return normalizedRow;
    });
}
