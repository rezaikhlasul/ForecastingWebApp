import React, { useState, useEffect } from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: 'red', color: 'white' }}>
          <h2>ExploreContainer Crashed</h2>
          <pre>{this.state.error && this.state.error.toString()}</pre>
          <pre>{this.state.error && this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { BrainCircuit, Play, AlertCircle, Loader, Wand2 } from 'lucide-react';
import useDataStore from '../../stores/useDataStore';
import { generateForecast, fetchAnalysisSuggestions } from '../../services/apiService';
import './Dashboard.css';

export default function ExploreContainer() {
    const { rawData, columns, dataTypes, forecastResult, setForecastResult, isForecasting, setIsForecasting } = useDataStore();
    
    // Local state
    const [targetColumn, setTargetColumn] = useState('');
    const [dateColumn, setDateColumn] = useState('');
    const [featureColumns, setFeatureColumns] = useState([]);
    const [modelType, setModelType] = useState('LinearRegression');
    const [forecastPeriods, setForecastPeriods] = useState(5);
    
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [error, setError] = useState(null);

    // Filter columns
    const numericColumns = columns.filter(col => dataTypes[col] === 'numeric');
    const dateColumns = columns.filter(col => dataTypes[col] === 'datetime' || dataTypes[col] === 'string'); // Sometimes dates are strings

    useEffect(() => {
        const getSuggestions = async () => {
            if (rawData.length === 0 || numericColumns.length === 0) return;
            
            setIsSuggesting(true);
            try {
                // Send a sample to keep it fast
                const sampleSize = Math.min(rawData.length, 500);
                const sampleData = rawData.slice(0, sampleSize);
                
                const result = await fetchAnalysisSuggestions(sampleData);
                if (result?.suggestion) {
                    setTargetColumn(result.suggestion.target_column || '');
                    setFeatureColumns(result.suggestion.feature_columns || []);
                    setModelType(result.suggestion.model_type || 'LinearRegression');
                    if (result.suggestion.date_column) {
                        setDateColumn(result.suggestion.date_column);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch suggestions:", err);
            } finally {
                setIsSuggesting(false);
            }
        };

        if (!targetColumn) {
            getSuggestions();
        }
    }, [rawData, numericColumns.length]);

    const handleFeatureSelect = (e) => {
        const options = [...e.target.selectedOptions];
        const values = options.map(opt => opt.value);
        setFeatureColumns(values);
    };

    const handleRunForecast = async () => {
        if (!targetColumn) {
            setError('Please select a target column to forecast.');
            return;
        }

        setError(null);
        setIsForecasting(true);
        setForecastResult(null);

        try {
            // We just send the relevant columns to save bandwidth
            const payloadData = rawData.map(row => {
                const item = {};
                if (row[targetColumn] !== undefined) {
                    item[targetColumn] = Number(row[targetColumn]);
                }
                featureColumns.forEach(feat => {
                    if (row[feat] !== undefined) {
                        item[feat] = Number(row[feat]);
                    }
                });
                // Send date/time columns if available
                if (dateColumn && row[dateColumn] !== undefined) {
                    item[dateColumn] = row[dateColumn];
                } else {
                    const dateCols = columns.filter(col => dataTypes[col] === 'datetime');
                    if (dateCols.length > 0) {
                        item[dateCols[0]] = row[dateCols[0]];
                    }
                }
                return item;
            });

            const result = await generateForecast(payloadData, targetColumn, featureColumns, dateColumn, modelType, forecastPeriods);
            
            // Format result for Recharts
            const formattedPredictions = result.predictions.map(pred => ({
                name: pred.period,
                Predict: Number(pred.predicted_value.toFixed(2)),
                LowerBound: pred.lower_bound ? Number(pred.lower_bound.toFixed(2)) : undefined,
                UpperBound: pred.upper_bound ? Number(pred.upper_bound.toFixed(2)) : undefined
            }));

            const actualValues = payloadData.slice(modelType === 'Prophet' ? -30 : -15).map((row, idx, arr) => {
                let xName = `Act-${arr.length - idx}`;
                if (modelType === 'Prophet' && dateColumn && row[dateColumn] !== undefined) {
                    xName = String(row[dateColumn]).substring(0, 10);
                }
                return {
                    name: xName,
                    Actual: row[targetColumn],
                    Predict: null,
                    LowerBound: null,
                    UpperBound: null
                };
            });

            if (actualValues.length > 0) {
                actualValues[actualValues.length - 1].Predict = actualValues[actualValues.length - 1].Actual;
            }

            setForecastResult({
                modelUsed: result.model_used,
                metrics: result.metrics,
                chartData: [...actualValues, ...formattedPredictions]
            });
            
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to generate forecast.');
        } finally {
            setIsForecasting(false);
        }
    };

    return (
      <ErrorBoundary>
        <div className="explore-container">
            <div className="explore-sidebar glass">
                <h3><BrainCircuit size={18} /> Data Analysis</h3>
                <p className="explore-desc">Select parameters to run ML models on your data.</p>
                
                <div className="explore-form">
                    {isSuggesting && (
                        <div className="suggestion-loader">
                            <Wand2 size={14} className="spin" /> <span>Auto-detecting parameters...</span>
                        </div>
                    )}
                    <div className="form-group">
                        <label>Target Column</label>
                        <select 
                            value={targetColumn} 
                            onChange={(e) => setTargetColumn(e.target.value)}
                            className="explore-select"
                            disabled={isSuggesting}
                        >
                            <option value="">-- Select Target --</option>
                            {numericColumns.map(col => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                        {numericColumns.length === 0 && (
                            <small className="error-text">No numeric columns found in data.</small>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Feature Columns (Optional)</label>
                        <select 
                            multiple
                            value={featureColumns} 
                            onChange={handleFeatureSelect}
                            className="explore-select"
                            disabled={isSuggesting}
                            style={{ height: '80px' }}
                        >
                            {numericColumns.filter(c => c !== targetColumn).map(col => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                        <small style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Hold Cmd/Ctrl to select multiple</small>
                    </div>

                    <div className="form-group">
                        <label>ML Model</label>
                        <select 
                            value={modelType} 
                            onChange={(e) => setModelType(e.target.value)}
                            className="explore-select"
                            disabled={isSuggesting}
                        >
                            <option value="LinearRegression">Linear Regression</option>
                            <option value="RandomForestClassifier">Random Forest Classifier</option>
                            <option value="Prophet">Prophet (Time Series)</option>
                        </select>
                    </div>

                    {modelType === 'Prophet' && (
                        <div className="form-group">
                            <label>Date Column</label>
                            <select 
                                value={dateColumn} 
                                onChange={(e) => setDateColumn(e.target.value)}
                                className="explore-select"
                                disabled={isSuggesting}
                            >
                                <option value="">-- Select Date Column --</option>
                                {dateColumns.map(col => (
                                    <option key={col} value={col}>{col}</option>
                                ))}
                            </select>
                            {dateColumns.length === 0 && (
                                <small className="error-text">No date columns parsed in dataset.</small>
                            )}
                        </div>
                    )}

                    <div className="form-group">
                        <label>Forecast Periods</label>
                        <input 
                            type="number" 
                            min="1" 
                            max="50" 
                            value={forecastPeriods} 
                            onChange={(e) => setForecastPeriods(Number(e.target.value))}
                            className="explore-input"
                        />
                    </div>

                    {error && (
                        <div className="form-error">
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}

                    <button 
                        className="btn-primary run-btn" 
                        onClick={handleRunForecast}
                        disabled={isForecasting || isSuggesting || numericColumns.length === 0}
                    >
                        {isForecasting ? <><Loader size={16} className="spin" /> Processing...</> : <><Play size={16} /> Run Analysis</>}
                    </button>
                </div>
            </div>

            <div className="explore-main glass">
                <div className="chart-card-header" style={{ marginBottom: '0' }}>
                    <div>
                        <h3 className="chart-title">Analysis Results</h3>
                        {forecastResult && (
                            <div className="chart-subtitle" style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                                <span><strong>Model:</strong> {forecastResult.modelUsed}</span>
                                {forecastResult.metrics?.r2_score !== undefined && (
                                    <>
                                        <span><strong>R² Score:</strong> {forecastResult.metrics.r2_score}</span>
                                        <span><strong>RMSE:</strong> {forecastResult.metrics.rmse}</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="chart-body" style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isForecasting && (
                        <div className="loading-state">
                            <Loader size={30} className="spin" />
                            <p>Running ML model inference...</p>
                        </div>
                    )}
                    
                    {!isForecasting && !forecastResult && (
                        <div className="empty-state">
                            Configure parameters and run analysis to see results here.
                        </div>
                    )}

                    {!isForecasting && forecastResult && (
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={forecastResult.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A45" />
                                <XAxis dataKey="name" tick={{ fill: '#A0A0B8', fontSize: 11 }} />
                                <YAxis tick={{ fill: '#A0A0B8', fontSize: 11 }} />
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: '#1A1A2E', borderColor: '#2A2A45', borderRadius: '8px' }}
                                    itemStyle={{ color: '#E0E0E0' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="Actual" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="Predict" stroke="#82ca9d" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                {forecastResult.modelUsed === 'Prophet' && (
                                    <>
                                        <Line type="monotone" dataKey="UpperBound" stroke="#6C63FF" strokeWidth={1} strokeDasharray="3 3" dot={false} strokeOpacity={0.4} />
                                        <Line type="monotone" dataKey="LowerBound" stroke="#6C63FF" strokeWidth={1} strokeDasharray="3 3" dot={false} strokeOpacity={0.4} />
                                    </>
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
      </ErrorBoundary>
    );
}
