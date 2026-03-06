import { create } from 'zustand';

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
