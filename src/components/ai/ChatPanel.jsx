import { useState, useRef, useEffect, Component } from 'react';
import { MessageSquare, Send, X, Sparkles, Copy, Check, Trash2, PanelRightClose } from 'lucide-react';
import useDataStore from '../../stores/useDataStore';
import { chatWithData, isGeminiConfigured } from '../../services/geminiService';
import './AI.css';

// Error Boundary to prevent crashes from propagating
class MessageErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    render() {
        if (this.state.hasError) {
            return <div className="markdown-content"><p>⚠️ Gagal merender pesan.</p></div>;
        }
        return this.props.children;
    }
}

// Simple safe markdown renderer (no external dependency)
function SafeMarkdown({ content }) {
    if (!content) return null;
    const text = String(content);

    // Convert markdown to HTML safely
    const html = text
        // Code blocks
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Bold
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*([^*]+)\*/g, '<em>$1</em>')
        // Headers
        .replace(/^### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^## (.+)$/gm, '<h3>$1</h3>')
        .replace(/^# (.+)$/gm, '<h2>$1</h2>')
        // Unordered lists
        .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
        // Ordered lists
        .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
        // Line breaks (double newline = paragraph)
        .replace(/\n\n/g, '</p><p>')
        // Single newlines
        .replace(/\n/g, '<br/>');

    // Wrap list items
    const wrappedHtml = html.replace(/(<li>.*?<\/li>)+/gs, (match) => `<ul>${match}</ul>`);

    return (
        <div
            className="markdown-content"
            dangerouslySetInnerHTML={{ __html: `<p>${wrappedHtml}</p>` }}
        />
    );
}

const SUGGESTED_QUESTIONS = [
    { label: '📊 Summarize', text: 'Berikan ringkasan eksekutif dari dataset ini, termasuk temuan utama dan statistik penting.' },
    { label: '🔍 Anomalies', text: 'Apakah ada anomali atau outlier yang terdeteksi di dataset ini? Jelaskan secara detail.' },
    { label: '🎯 Recommendations', text: 'Berikan 3 rekomendasi strategis berdasarkan analisis data ini untuk pengambilan keputusan bisnis.' },
    { label: '📈 Trends', text: 'Apa tren dan pola utama yang bisa dilihat dari data ini?' },
    { label: '🔗 Correlations', text: 'Kolom mana saja yang memiliki korelasi kuat? Apa implikasinya?' },
];

export default function ChatPanel() {
    const {
        rawData, columns, dataTypes, statistics, missingValues, correlationMatrix,
        chatHistory, addChatMessage, clearChat, isChatOpen, setChatOpen, fileName,
    } = useDataStore();

    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [copiedIdx, setCopiedIdx] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory, isTyping]);

    const sendMessage = async (messageText) => {
        const text = messageText || input.trim();
        if (!text) return;

        setInput('');

        // Snapshot chat history BEFORE adding user message to avoid duplicate messages
        const historySnapshot = [...chatHistory];

        // Add user message to UI
        addChatMessage({ role: 'user', content: text, timestamp: new Date().toISOString() });

        if (!isGeminiConfigured()) {
            addChatMessage({
                role: 'assistant',
                content: '⚠️ Gemini API key belum dikonfigurasi. Silakan tambahkan `VITE_GEMINI_API_KEY` ke file `.env` Anda.',
                timestamp: new Date().toISOString(),
            });
            return;
        }

        setIsTyping(true);

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

            const response = await chatWithData(text, historySnapshot, dataContext);

            addChatMessage({
                role: 'assistant',
                content: String(response || 'Tidak ada respons dari AI.'),
                timestamp: new Date().toISOString(),
            });
        } catch (err) {
            console.error('Chat error:', err);
            addChatMessage({
                role: 'assistant',
                content: `❌ Error: ${err.message || 'Gagal mendapatkan respons dari AI. Silakan coba lagi.'}`,
                timestamp: new Date().toISOString(),
            });
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const copyToClipboard = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2000);
    };

    if (!isChatOpen) {
        return null;
    }

    return (
        <div className="chat-panel">
            <div className="chat-header">
                <div className="chat-header-left">
                    <Sparkles size={18} className="ai-icon" />
                    <span className="chat-header-title">AI Chat</span>
                    <span className="chat-header-badge">Gemini</span>
                </div>
                <div className="chat-header-actions">
                    {chatHistory.length > 0 && (
                        <button className="chat-header-btn" onClick={clearChat} title="Clear chat">
                            <Trash2 size={14} />
                        </button>
                    )}
                    <button className="chat-header-btn" onClick={() => setChatOpen(false)} title="Collapse" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <PanelRightClose size={16} />
                        <span style={{ fontSize: '0.75rem', fontWeight: '500' }}>Collapse</span>
                    </button>
                </div>
            </div>

            <div className="chat-messages">
                {chatHistory.length === 0 && (
                    <div className="chat-welcome">
                        <div className="chat-welcome-icon">
                            <Sparkles size={32} />
                        </div>
                        <h3>Ask anything about your data</h3>
                        <p>I can analyze, summarize, and provide insights about your dataset.</p>

                        <div className="suggested-questions">
                            {SUGGESTED_QUESTIONS.map((q, idx) => (
                                <button
                                    key={idx}
                                    className="suggested-btn"
                                    onClick={() => sendMessage(q.text)}
                                >
                                    {q.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`chat-message ${msg.role}`}>
                        {msg.role === 'assistant' && (
                            <div className="message-avatar ai-avatar">
                                <Sparkles size={14} />
                            </div>
                        )}
                        <div className="message-bubble">
                            {msg.role === 'assistant' ? (
                                <MessageErrorBoundary>
                                    <SafeMarkdown content={msg.content} />
                                </MessageErrorBoundary>
                            ) : (
                                <p>{msg.content}</p>
                            )}
                            {msg.role === 'assistant' && (
                                <button
                                    className="copy-btn"
                                    onClick={() => copyToClipboard(msg.content, idx)}
                                >
                                    {copiedIdx === idx ? <Check size={12} /> : <Copy size={12} />}
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="chat-message assistant">
                        <div className="message-avatar ai-avatar">
                            <Sparkles size={14} />
                        </div>
                        <div className="message-bubble typing-bubble">
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {chatHistory.length > 0 && (
                <div className="chat-suggestions-bar">
                    {SUGGESTED_QUESTIONS.slice(0, 3).map((q, idx) => (
                        <button
                            key={idx}
                            className="suggestion-chip"
                            onClick={() => sendMessage(q.text)}
                        >
                            {q.label}
                        </button>
                    ))}
                </div>
            )}

            <div className="chat-input-area">
                <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Tanya tentang data Anda..."
                    rows={1}
                    disabled={isTyping}
                />
                <button
                    className="chat-send-btn"
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isTyping}
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
    );
}
