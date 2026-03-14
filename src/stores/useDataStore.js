import { create } from 'zustand';
import { runFullAnalysis } from '../services/dataAnalysis';
import { generateChartConfigs } from '../services/chartGenerator';

const useDataStore = create((set, get) => ({
  // Data state
  rawData: [],
  columns: [],
  dataTypes: {},
  statistics: {},
  correlationMatrix: null,
  missingValues: {},
  fileName: '',
  fileSize: 0,
  isLoading: false,
  error: null,

  // AI state
  recommendations: [],
  isLoadingRecommendations: false,
  chatHistory: [],
  isChatOpen: true,

  // Dashboard state
  activeTab: 'overview',
  chartConfigs: [],

  // Forecasting state
  forecastResult: null,
  isForecasting: false,

  // Actions
  setData: (data) => set({
    rawData: data.rawData,
    columns: data.columns,
    dataTypes: data.dataTypes,
    fileName: data.fileName,
    fileSize: data.fileSize,
    error: null,
  }),

  setStatistics: (stats) => set({
    statistics: stats.statistics,
    correlationMatrix: stats.correlationMatrix,
    missingValues: stats.missingValues,
  }),

  setChartConfigs: (configs) => set({ chartConfigs: configs }),

  setForecastResult: (result) => set({ forecastResult: result }),
  setIsForecasting: (loading) => set({ isForecasting: loading }),

  updateDataType: (column, newType) => set((state) => {
    const newDataTypes = { ...state.dataTypes, [column]: newType };

    // Recalculate stats and charts because the data type changed
    const analysis = runFullAnalysis(state.rawData, state.columns, newDataTypes);
    const charts = generateChartConfigs(state.rawData, state.columns, newDataTypes, analysis.statistics);

    return {
      dataTypes: newDataTypes,
      statistics: analysis.statistics,
      correlationMatrix: analysis.correlationMatrix,
      missingValues: analysis.missingValues,
      chartConfigs: charts,
    };
  }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  setRecommendations: (recs) => set({ recommendations: recs }),

  setLoadingRecommendations: (loading) => set({ isLoadingRecommendations: loading }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  setChatOpen: (open) => set({ isChatOpen: open }),

  addChatMessage: (message) => set((state) => ({
    chatHistory: [...state.chatHistory, message],
  })),

  clearChat: () => set({ chatHistory: [] }),

  clearData: () => set({
    rawData: [],
    columns: [],
    dataTypes: {},
    statistics: {},
    correlationMatrix: null,
    missingValues: {},
    fileName: '',
    fileSize: 0,
    chartConfigs: [],
    recommendations: [],
    chatHistory: [],
    activeTab: 'overview',
    forecastResult: null,
    isForecasting: false,
    error: null,
  }),

  // Derived getters
  getNumericColumns: () => {
    const { columns, dataTypes } = get();
    return columns.filter(col => dataTypes[col] === 'numeric');
  },

  getCategoricalColumns: () => {
    const { columns, dataTypes } = get();
    return columns.filter(col => dataTypes[col] === 'categorical');
  },

  getDateColumns: () => {
    const { columns, dataTypes } = get();
    return columns.filter(col => dataTypes[col] === 'datetime');
  },
}));

export default useDataStore;
