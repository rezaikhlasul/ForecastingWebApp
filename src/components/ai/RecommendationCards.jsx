import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, ThumbsUp, ThumbsDown, RefreshCw, Zap } from 'lucide-react';
import useDataStore from '../../stores/useDataStore';
import { getRecommendations, isGeminiConfigured } from '../../services/geminiService';
import './AI.css';

const categoryIcons = {
    Sales: <TrendingUp size={16} />,
    Operations: <Zap size={16} />,
    Marketing: <Sparkles size={16} />,
    Finance: <TrendingUp size={16} />,
    HR: <Lightbulb size={16} />,
    General: <Lightbulb size={16} />,
};

const impactColors = {
    High: { bg: 'rgba(255, 107, 107, 0.12)', color: 'var(--accent-danger)' },
    Medium: { bg: 'rgba(255, 184, 77, 0.12)', color: 'var(--accent-warning)' },
    Low: { bg: 'rgba(0, 212, 170, 0.12)', color: 'var(--accent-secondary)' },
};

export default function RecommendationCards() {
    const {
        rawData, columns, dataTypes, statistics, missingValues, correlationMatrix,
        recommendations, setRecommendations, isLoadingRecommendations, setLoadingRecommendations,
        fileName,
    } = useDataStore();

    const [feedback, setFeedback] = useState({});
    const [error, setError] = useState(null);

    const fetchRecommendations = async () => {
        if (!isGeminiConfigured()) {
            setError('Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env file.');
            return;
        }

        setLoadingRecommendations(true);
        setError(null);

        try {
            const dataContext = {
                columns,
                dataTypes,
                statistics,
                missingValues,
                correlationMatrix,
                rowCount: rawData.length,
                sampleData: rawData.slice(0, 5),
                fileName,
            };
            const recs = await getRecommendations(dataContext);
            setRecommendations(recs);
        } catch (err) {
            setError(err.message || 'Failed to generate recommendations');
        } finally {
            setLoadingRecommendations(false);
        }
    };

    useEffect(() => {
        if (rawData.length > 0 && recommendations.length === 0) {
            fetchRecommendations();
        }
    }, [rawData]);

    const handleFeedback = (id, type) => {
        setFeedback(prev => ({ ...prev, [id]: type }));
    };

    if (error) {
        return (
            <div className="ai-section">
                <div className="ai-section-header">
                    <div className="ai-section-title">
                        <Sparkles size={20} className="ai-icon" />
                        <h2>AI Recommendations</h2>
                    </div>
                </div>
                <div className="ai-error glass">
                    <AlertTriangle size={24} />
                    <p>{error}</p>
                    <button className="ai-retry-btn" onClick={fetchRecommendations}>
                        <RefreshCw size={14} />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="ai-section">
            <div className="ai-section-header">
                <div className="ai-section-title">
                    <Sparkles size={20} className="ai-icon" />
                    <h2>AI Recommendations</h2>
                    <span className="ai-badge">Powered by Gemini</span>
                </div>
                {recommendations.length > 0 && (
                    <button className="ai-refresh-btn" onClick={fetchRecommendations} disabled={isLoadingRecommendations}>
                        <RefreshCw size={14} className={isLoadingRecommendations ? 'spinning' : ''} />
                        Refresh
                    </button>
                )}
            </div>

            {isLoadingRecommendations ? (
                <div className="ai-loading-grid">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="rec-card-skeleton glass">
                            <div className="skeleton" style={{ width: '60%', height: 16, marginBottom: 12 }} />
                            <div className="skeleton" style={{ width: '100%', height: 14, marginBottom: 8 }} />
                            <div className="skeleton" style={{ width: '80%', height: 14, marginBottom: 16 }} />
                            <div className="skeleton" style={{ width: '40%', height: 24 }} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="recommendations-grid">
                    {recommendations.map((rec, idx) => {
                        const impact = impactColors[rec.impact] || impactColors.Medium;
                        return (
                            <div
                                key={rec.id || idx}
                                className="rec-card glass"
                                style={{ animationDelay: `${idx * 0.1}s` }}
                            >
                                <div className="rec-card-top">
                                    <span className="rec-category">
                                        {categoryIcons[rec.category] || <Lightbulb size={16} />}
                                        {rec.category}
                                    </span>
                                    <span className="rec-impact" style={{ background: impact.bg, color: impact.color }}>
                                        {rec.impact}
                                    </span>
                                </div>

                                <h3 className="rec-title">{rec.title}</h3>

                                <div className="rec-section">
                                    <span className="rec-section-label">💡 Insight</span>
                                    <p className="rec-text">{rec.insight}</p>
                                </div>

                                <div className="rec-section">
                                    <span className="rec-section-label">🎯 Recommendation</span>
                                    <p className="rec-text">{rec.recommendation}</p>
                                </div>

                                <div className="rec-card-bottom">
                                    <div className="rec-confidence">
                                        <div className="confidence-bar">
                                            <div
                                                className="confidence-fill"
                                                style={{ width: `${rec.confidence || 0}%` }}
                                            />
                                        </div>
                                        <span className="confidence-text">{rec.confidence || 0}% confidence</span>
                                    </div>

                                    <div className="rec-feedback">
                                        <button
                                            className={`feedback-btn ${feedback[rec.id] === 'up' ? 'active-up' : ''}`}
                                            onClick={() => handleFeedback(rec.id, 'up')}
                                        >
                                            <ThumbsUp size={14} />
                                        </button>
                                        <button
                                            className={`feedback-btn ${feedback[rec.id] === 'down' ? 'active-down' : ''}`}
                                            onClick={() => handleFeedback(rec.id, 'down')}
                                        >
                                            <ThumbsDown size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
