import { useMemo } from 'react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    ScatterChart, Scatter, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Download } from 'lucide-react';
import { CHART_COLORS, getChartColor } from '../../utils/dataHelpers';
import useDataStore from '../../stores/useDataStore';
import './Dashboard.css';

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="custom-tooltip glass">
            <p className="tooltip-label">{label}</p>
            {payload.map((entry, idx) => (
                <p key={idx} className="tooltip-value" style={{ color: entry.color || entry.fill }}>
                    {entry.name || entry.dataKey}: <strong>{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}</strong>
                </p>
            ))}
        </div>
    );
}

function renderChart(config) {
    const commonAxisProps = {
        tick: { fill: '#A0A0B8', fontSize: 11 },
        axisLine: { stroke: '#2A2A45' },
        tickLine: { stroke: '#2A2A45' },
    };

    switch (config.type) {
        case 'histogram':
        case 'bar':
        case 'grouped-bar':
            return (
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={config.data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e35" />
                        <XAxis dataKey={config.xAxisKey} {...commonAxisProps} angle={-30} textAnchor="end" height={60} />
                        <YAxis {...commonAxisProps} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey={config.dataKey} fill={config.color} radius={[4, 4, 0, 0]} maxBarSize={40}>
                            {config.type === 'bar' && config.data.map((_, i) => (
                                <Cell key={i} fill={getChartColor(i)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            );

        case 'line':
            return (
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={config.data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <defs>
                            <linearGradient id={`gradient-${config.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={config.color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={config.color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e35" />
                        <XAxis dataKey={config.xAxisKey} {...commonAxisProps} angle={-30} textAnchor="end" height={60} />
                        <YAxis {...commonAxisProps} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey={config.dataKey}
                            stroke={config.color}
                            strokeWidth={2}
                            fill={`url(#gradient-${config.id})`}
                            dot={false}
                            activeDot={{ r: 4, fill: config.color }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            );

        case 'pie':
            return (
                <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                        <Pie
                            data={config.data}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={100}
                            paddingAngle={3}
                            dataKey="value"
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            labelLine={{ stroke: '#A0A0B8' }}
                        >
                            {config.data.map((entry, i) => (
                                <Cell key={i} fill={entry.fill || getChartColor(i)} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            );

        case 'scatter':
            return (
                <ResponsiveContainer width="100%" height={280}>
                    <ScatterChart margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e35" />
                        <XAxis dataKey="x" name={config.columns?.[0] || 'X'} {...commonAxisProps} />
                        <YAxis dataKey="y" name={config.columns?.[1] || 'Y'} {...commonAxisProps} />
                        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter data={config.data} fill={config.color} opacity={0.7} />
                    </ScatterChart>
                </ResponsiveContainer>
            );

        default:
            return <div className="chart-placeholder">Unsupported chart type: {config.type}</div>;
    }
}

function exportChart(chartId) {
    const chartEl = document.querySelector(`[data-chart-id="${chartId}"] .recharts-wrapper`);
    if (!chartEl) return;

    const svgElement = chartEl.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
        canvas.width = img.width * 2;
        canvas.height = img.height * 2;
        ctx.scale(2, 2);
        ctx.fillStyle = '#12121f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        const link = document.createElement('a');
        link.download = `${chartId}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
}

export default function ChartContainer() {
    const { chartConfigs } = useDataStore();

    if (!chartConfigs || chartConfigs.length === 0) {
        return (
            <div className="charts-empty">
                <p>No charts to display. Upload a dataset with analyzable columns.</p>
            </div>
        );
    }

    return (
        <div className="charts-grid">
            {chartConfigs.map((config, idx) => (
                <div
                    key={config.id}
                    className="chart-card glass"
                    data-chart-id={config.id}
                    style={{ animationDelay: `${idx * 0.08}s` }}
                >
                    <div className="chart-card-header">
                        <div>
                            <h3 className="chart-title">{config.title}</h3>
                            {config.subtitle && <p className="chart-subtitle">{config.subtitle}</p>}
                        </div>
                        <button
                            className="chart-export-btn"
                            onClick={() => exportChart(config.id)}
                            title="Export as PNG"
                        >
                            <Download size={14} />
                        </button>
                    </div>
                    <div className="chart-body">
                        {renderChart(config)}
                    </div>
                </div>
            ))}
        </div>
    );
}
