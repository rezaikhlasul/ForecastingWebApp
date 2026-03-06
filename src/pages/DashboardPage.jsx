import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, LayoutDashboard, LineChart, Brain, Table2, ArrowLeft, FileSpreadsheet, Upload } from 'lucide-react';
import useDataStore from '../stores/useDataStore';
import StatsCards from '../components/dashboard/StatsCards';
import ChartContainer from '../components/dashboard/ChartContainer';
import DataTable from '../components/dashboard/DataTable';
import RecommendationCards from '../components/ai/RecommendationCards';
import ChatPanel from '../components/ai/ChatPanel';
import './Pages.css';

const TABS = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
    { id: 'explore', label: 'Explore', icon: <LineChart size={16} /> },
    { id: 'insights', label: 'AI Insights', icon: <Brain size={16} /> },
    { id: 'data', label: 'Data Table', icon: <Table2 size={16} /> },
];

export default function DashboardPage() {
    const navigate = useNavigate();
    const {
        rawData, columns, fileName, fileSize,
        activeTab, setActiveTab, isChatOpen,
        clearData,
    } = useDataStore();

    // Redirect if no data
    useEffect(() => {
        if (rawData.length === 0) {
            navigate('/');
        }
    }, [rawData, navigate]);

    if (rawData.length === 0) return null;

    const handleNewFile = () => {
        clearData();
        navigate('/');
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className={`dashboard-layout ${isChatOpen ? 'chat-open' : ''}`}>
            {/* Sidebar */}
            <aside className="dashboard-sidebar">
                <div className="sidebar-header">
                    <div className="logo-small" onClick={() => navigate('/')}>
                        <div className="logo-icon-sm">
                            <BarChart3 size={16} />
                        </div>
                        <span>DataLens<span className="logo-accent">AI</span></span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="file-info">
                        <FileSpreadsheet size={14} />
                        <div className="file-details">
                            <span className="file-name" title={fileName}>{fileName}</span>
                            <span className="file-meta">
                                {rawData.length.toLocaleString()} rows • {columns.length} cols
                            </span>
                        </div>
                    </div>
                    <button className="new-file-btn" onClick={handleNewFile}>
                        <Upload size={14} />
                        New File
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                <div className="dashboard-topbar">
                    <div className="topbar-left">
                        <h1 className="dashboard-title">
                            {TABS.find(t => t.id === activeTab)?.icon}
                            {TABS.find(t => t.id === activeTab)?.label}
                        </h1>
                        <span className="topbar-breadcrumb">{fileName}</span>
                    </div>
                </div>

                <div className="dashboard-content">
                    {(activeTab === 'overview' || activeTab === 'explore') && (
                        <>
                            <StatsCards />
                            <ChartContainer />
                        </>
                    )}

                    {activeTab === 'insights' && (
                        <RecommendationCards />
                    )}

                    {activeTab === 'data' && (
                        <DataTable />
                    )}
                </div>
            </main>

            {/* Chat Panel */}
            <aside className={`dashboard-chat ${isChatOpen ? 'open' : ''}`}>
                <ChatPanel />
            </aside>
        </div>
    );
}
