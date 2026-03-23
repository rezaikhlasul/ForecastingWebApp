import React, { useState, useEffect } from 'react';
import { X, BarChart3, Upload, MessageSquare, Sparkles, ArrowRight } from 'lucide-react';
import './WelcomeModal.css';

const WALKTHROUGH_STORAGE_KEY = 'datalens_last_walkthrough';
const WALKTHROUGH_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours in ms

export default function WelcomeModal() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const lastSeen = localStorage.getItem(WALKTHROUGH_STORAGE_KEY);
        const currentTime = Date.now();

        if (!lastSeen || (currentTime - parseInt(lastSeen, 10) > WALKTHROUGH_INTERVAL)) {
            setIsVisible(true);
            localStorage.setItem(WALKTHROUGH_STORAGE_KEY, currentTime.toString());
        }
    }, []);

    const handleClose = () => {
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content glass">
                <button className="close-btn" onClick={handleClose}>
                    <X size={20} />
                </button>

                <div className="modal-header">
                    <div className="logo-icon-large">
                        <BarChart3 size={32} />
                    </div>
                    <h2 className="modal-title">Welcome to DataLens<span className="logo-accent">AI</span></h2>
                    <p className="modal-subtitle">Your intelligent companion for data exploration and strategic insights.</p>
                </div>

                <div className="walkthrough-steps">
                    <div className="walkthrough-step">
                        <div className="step-icon-wrapper" style={{ background: 'rgba(108, 99, 255, 0.12)' }}>
                            <Upload size={20} style={{ color: 'var(--accent-primary)' }} />
                        </div>
                        <div className="step-text">
                            <h3>Upload Your Data</h3>
                            <p>Drag & drop any CSV file. We'll automatically detect patterns and prepare your data.</p>
                        </div>
                    </div>

                    <div className="walkthrough-step">
                        <div className="step-icon-wrapper" style={{ background: 'rgba(0, 212, 170, 0.12)' }}>
                            <BarChart3 size={20} style={{ color: 'var(--accent-secondary)' }} />
                        </div>
                        <div className="step-text">
                            <h3>Explore Visualizations</h3>
                            <p>Interact with auto-generated charts and deep-dive into your key metrics instantly.</p>
                        </div>
                    </div>

                    <div className="walkthrough-step">
                        <div className="step-icon-wrapper" style={{ background: 'rgba(255, 184, 77, 0.12)' }}>
                            <MessageSquare size={20} style={{ color: 'var(--accent-warning)' }} />
                        </div>
                        <div className="step-text">
                            <h3>AI Chat & Recommendations</h3>
                            <p>Ask questions in natural language and get Gemini-powered strategic advice.</p>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="primary-btn pulse" onClick={handleClose}>
                        Got it, let's explore!
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
