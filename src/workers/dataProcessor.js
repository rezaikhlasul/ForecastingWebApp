import Papa from 'papaparse';
import { detectAllDataTypes, cleanDataCell } from '../utils/dataHelpers';
import { runFullAnalysis } from '../services/dataAnalysis';
import { generateChartConfigs } from '../services/chartGenerator';
import { mapDatasetColumns } from '../services/geminiService';

self.addEventListener('message', async (e) => {
    const { file, fileName, fileSize } = e.data;

    // We use a local wrapped Promise to handle async inside complete callback,
    // though PapaParse complete is synchronous, we process async mapDatasetColumns
    self.postMessage({ type: 'progress', message: 'Reading CSV file...' });

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: async (results) => {
            if (results.errors.length > 0 && results.data.length === 0) {
                self.postMessage({ type: 'error', error: 'Failed to parse CSV: ' + results.errors[0].message });
                return;
            }

            let data = results.data;
            let columns = results.meta.fields || [];

            if (columns.length === 0 || data.length === 0) {
                self.postMessage({ type: 'error', error: 'CSV file is empty or has no valid columns' });
                return;
            }

            try {
                self.postMessage({ type: 'progress', message: 'Mapping columns with AI...' });
                const mappedColumns = await mapDatasetColumns(columns);

                self.postMessage({ type: 'progress', message: 'Normalizing data...' });
                const newColumnsSet = new Set();
                const processedData = new Array(data.length);

                // Optimized single pass loop
                for (let i = 0; i < data.length; i++) {
                    const row = data[i];
                    const newRow = {};
                    for (const col of columns) {
                        const newColName = mappedColumns[col] || col;
                        newColumnsSet.add(newColName);
                        newRow[newColName] = cleanDataCell(row[col]);
                    }
                    processedData[i] = newRow;
                }

                columns = Array.from(newColumnsSet);
                data = processedData;

                self.postMessage({ type: 'progress', message: 'Analyzing data types...' });
                const dataTypes = detectAllDataTypes(data, columns);

                self.postMessage({ type: 'progress', message: 'Running statistical analysis...' });
                const analysis = runFullAnalysis(data, columns, dataTypes);

                self.postMessage({ type: 'progress', message: 'Generating charts...' });
                const charts = generateChartConfigs(data, columns, dataTypes, analysis.statistics);

                self.postMessage({
                    type: 'success',
                    payload: {
                        data,
                        columns,
                        dataTypes,
                        analysis,
                        charts,
                        fileName,
                        fileSize
                    }
                });

            } catch (err) {
                self.postMessage({ type: 'error', error: err.message || 'Error processing data' });
            }
        },
        error: (error) => {
            self.postMessage({ type: 'error', error: error.message });
        }
    });
});
