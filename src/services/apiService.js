/**
 * Service to interact with the FastAPI backend 
 */

export async function generateForecast(data, targetColumn, featureColumns = [], dateColumn = null, modelType = 'LinearRegression', forecastPeriods = 5) {
    try {
        const response = await fetch('/api/forecast', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data,
                target_column: targetColumn,
                feature_columns: featureColumns,
                date_column: dateColumn,
                model_type: modelType,
                forecast_periods: forecastPeriods
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to fetch forecast');
        }

        return await response.json();
    } catch (error) {
        console.error('API Service Error:', error);
        throw error;
    }
}

export async function fetchAnalysisSuggestions(data) {
    try {
        const response = await fetch('/api/suggest-analysis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to fetch suggestions');
        }

        return await response.json();
    } catch (error) {
        console.error('API Suggestion Error:', error);
        throw error;
    }
}
