import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import useDataStore from '../../stores/useDataStore';
import DataWorker from '../../workers/dataProcessor?worker';
import './Upload.css';

export default function DropZone() {
    const [isDragging, setIsDragging] = useState(false);
    const [parseStatus, setParseStatus] = useState(null); // null | 'parsing' | 'success' | 'error'
    const [progressMsg, setProgressMsg] = useState('This may take a few seconds');
    const [errorMsg, setErrorMsg] = useState('');
    const workerRef = useRef(null);
    const navigate = useNavigate();

    const { setData, setStatistics, setChartConfigs, setLoading } = useDataStore();

    useEffect(() => {
        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
            }
        };
    }, []);

    const processFile = useCallback((file) => {
        // Validate file
        if (!file.name.toLowerCase().endsWith('.csv')) {
            setParseStatus('error');
            setErrorMsg('Please upload a CSV file (.csv)');
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            setParseStatus('error');
            setErrorMsg('File size must be less than 50MB');
            return;
        }

        setParseStatus('parsing');
        setProgressMsg('Initializing processor...');
        setLoading(true);

        if (workerRef.current) {
            workerRef.current.terminate();
        }

        const worker = new DataWorker();
        workerRef.current = worker;

        worker.onmessage = (e) => {
            const { type, message, payload, error } = e.data;
            if (type === 'progress') {
                setProgressMsg(message);
            } else if (type === 'success') {
                const { data, columns, dataTypes, analysis, charts, fileName, fileSize } = payload;

                // Store data
                setData({
                    rawData: data,
                    columns,
                    dataTypes,
                    fileName,
                    fileSize,
                });

                setStatistics(analysis);
                setChartConfigs(charts);

                setParseStatus('success');
                setLoading(false);

                // Navigate to dashboard after a short delay
                setTimeout(() => {
                    navigate('/dashboard');
                }, 800);
            } else if (type === 'error') {
                setParseStatus('error');
                setErrorMsg(error || 'An unknown error occurred during processing.');
                setLoading(false);
            }
        };

        worker.onerror = (error) => {
            setParseStatus('error');
            setErrorMsg('Worker error: ' + error.message);
            setLoading(false);
        };

        worker.postMessage({ file, fileName: file.name, fileSize: file.size });
    }, [setData, setStatistics, setChartConfigs, setLoading, navigate]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    }, [processFile]);

    const handleFileSelect = useCallback((e) => {
        const file = e.target.files[0];
        if (file) processFile(file);
    }, [processFile]);

    const handleSampleData = useCallback(() => {
        // Generate sample sales data
        const headers = ['Date', 'Product', 'Region', 'Revenue', 'Quantity', 'Profit', 'Customer_Type'];
        const products = ['Laptop', 'Phone', 'Tablet', 'Monitor', 'Keyboard'];
        const regions = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Bali'];
        const customerTypes = ['Enterprise', 'SMB', 'Consumer'];

        let csvContent = headers.join(',') + '\n';
        for (let i = 0; i < 200; i++) {
            const date = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
            const product = products[Math.floor(Math.random() * products.length)];
            const region = regions[Math.floor(Math.random() * regions.length)];
            const qty = Math.floor(Math.random() * 50) + 1;
            const revenue = Math.floor((Math.random() * 5000 + 500) * qty / 10);
            const profit = Math.floor(revenue * (Math.random() * 0.3 + 0.1));
            const customerType = customerTypes[Math.floor(Math.random() * customerTypes.length)];
            csvContent += `${date.toISOString().split('T')[0]},${product},${region},${revenue},${qty},${profit},${customerType}\n`;
        }

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const file = new File([blob], 'sample_sales_data.csv', { type: 'text/csv' });
        processFile(file);
    }, [processFile]);

    return (
        <div className="dropzone-wrapper">
            <div
                className={`dropzone ${isDragging ? 'dropzone-active' : ''} ${parseStatus === 'error' ? 'dropzone-error' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-input').click()}
            >
                <input
                    type="file"
                    id="file-input"
                    accept=".csv"
                    onChange={handleFileSelect}
                    hidden
                />

                {parseStatus === 'parsing' ? (
                    <div className="dropzone-status">
                        <div className="spinner" />
                        <p className="dropzone-title">Analyzing your data...</p>
                        <p className="dropzone-subtitle">{progressMsg}</p>
                    </div>
                ) : parseStatus === 'success' ? (
                    <div className="dropzone-status">
                        <CheckCircle2 size={48} className="icon-success" />
                        <p className="dropzone-title">Data loaded successfully!</p>
                        <p className="dropzone-subtitle">Redirecting to dashboard...</p>
                    </div>
                ) : parseStatus === 'error' ? (
                    <div className="dropzone-status">
                        <AlertCircle size={48} className="icon-error" />
                        <p className="dropzone-title">Upload failed</p>
                        <p className="dropzone-subtitle error-text">{errorMsg}</p>
                        <button className="retry-btn" onClick={(e) => { e.stopPropagation(); setParseStatus(null); setErrorMsg(''); }}>
                            Try Again
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="dropzone-icon-wrapper">
                            {isDragging ? (
                                <FileSpreadsheet size={48} className="icon-dragging" />
                            ) : (
                                <Upload size={48} className="icon-default" />
                            )}
                        </div>
                        <p className="dropzone-title">
                            {isDragging ? 'Drop your CSV file here' : 'Upload your CSV dataset'}
                        </p>
                        <p className="dropzone-subtitle">
                            Drag & drop or click to browse • Max 50MB
                        </p>
                        <div className="dropzone-badge">
                            <FileSpreadsheet size={14} />
                            <span>.CSV</span>
                        </div>
                    </>
                )}
            </div>

            <button className="sample-data-btn" onClick={handleSampleData}>
                <FileSpreadsheet size={16} />
                Try with sample data
            </button>
        </div>
    );
}
