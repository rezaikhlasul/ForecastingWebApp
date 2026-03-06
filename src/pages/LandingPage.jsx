import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Upload, Sparkles, MessageSquare, ArrowRight, Zap, Shield, TrendingUp } from 'lucide-react';
import DropZone from '../components/upload/DropZone';
import './Pages.css';

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="landing-page">
            {/* Header */}
            <header className="landing-header">
                <div className="landing-header-inner">
                    <div className="logo">
                        <div className="logo-icon">
                            <BarChart3 size={22} />
                        </div>
                        <span className="logo-text">DataLens<span className="logo-accent">AI</span></span>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="hero-section">
                <div className="hero-glow" />
                <div className="hero-content">
                    <div className="hero-badge">
                        <Sparkles size={14} />
                        Powered by Google Gemini AI
                    </div>
                    <h1 className="hero-title">
                        Transform Your Data Into
                        <span className="gradient-text"> Strategic Insights</span>
                    </h1>
                    <p className="hero-subtitle">
                        Upload CSV → Get Interactive Dashboard → Receive AI Recommendations →
                        Chat with Your Data. All in seconds, no coding required.
                    </p>

                    <DropZone />
                </div>
            </section>

            {/* Features */}
            <section className="features-section">
                <h2 className="section-title">How It Works</h2>
                <div className="features-grid">
                    <div className="feature-card glass">
                        <div className="feature-step">1</div>
                        <div className="feature-icon-wrapper" style={{ background: 'rgba(108, 99, 255, 0.12)' }}>
                            <Upload size={24} style={{ color: 'var(--accent-primary)' }} />
                        </div>
                        <h3>Upload Dataset</h3>
                        <p>Drag & drop your CSV file. Auto-detect columns, data types, and start processing instantly.</p>
                    </div>

                    <div className="feature-arrow">
                        <ArrowRight size={20} />
                    </div>

                    <div className="feature-card glass">
                        <div className="feature-step">2</div>
                        <div className="feature-icon-wrapper" style={{ background: 'rgba(0, 212, 170, 0.12)' }}>
                            <BarChart3 size={24} style={{ color: 'var(--accent-secondary)' }} />
                        </div>
                        <h3>Interactive Dashboard</h3>
                        <p>Auto-generated charts, statistics, and visualizations tailored to your data.</p>
                    </div>

                    <div className="feature-arrow">
                        <ArrowRight size={20} />
                    </div>

                    <div className="feature-card glass">
                        <div className="feature-step">3</div>
                        <div className="feature-icon-wrapper" style={{ background: 'rgba(255, 184, 77, 0.12)' }}>
                            <MessageSquare size={24} style={{ color: 'var(--accent-warning)' }} />
                        </div>
                        <h3>AI Insights & Chat</h3>
                        <p>Get strategic recommendations and chat with AI about your data in natural language.</p>
                    </div>
                </div>
            </section>

            {/* Capabilities */}
            <section className="capabilities-section">
                <div className="capabilities-grid">
                    <div className="capability-item">
                        <Zap size={20} className="capability-icon" />
                        <div>
                            <h4>Lightning Fast</h4>
                            <p>Dashboard ready in under 10 seconds</p>
                        </div>
                    </div>
                    <div className="capability-item">
                        <Shield size={20} className="capability-icon" />
                        <div>
                            <h4>Privacy First</h4>
                            <p>All processing happens in your browser</p>
                        </div>
                    </div>
                    <div className="capability-item">
                        <TrendingUp size={20} className="capability-icon" />
                        <div>
                            <h4>Smart Analysis</h4>
                            <p>Auto-detect patterns, outliers & correlations</p>
                        </div>
                    </div>
                    <div className="capability-item">
                        <Sparkles size={20} className="capability-icon" />
                        <div>
                            <h4>AI Powered</h4>
                            <p>Gemini AI for recommendations & chat</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <p>Built with ❤️ using React + Vite + Gemini AI</p>
            </footer>
        </div>
    );
}
