import { Database, Hash, AlertTriangle, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import useDataStore from '../../stores/useDataStore';
import { formatNumber, formatPercentage } from '../../utils/dataHelpers';
import './Dashboard.css';

export default function StatsCards() {
    const { rawData, columns, dataTypes, statistics, missingValues } = useDataStore();

    const totalRows = rawData.length;
    const totalCols = columns.length;
    const numericCols = columns.filter(c => dataTypes[c] === 'numeric').length;

    // Total missing values
    const totalMissing = Object.values(missingValues).reduce((sum, v) => sum + v.count, 0);
    const totalCells = totalRows * totalCols;
    const missingPct = totalCells > 0 ? (totalMissing / totalCells) * 100 : 0;

    // Find the column with highest mean for "key metric" display
    const numericStats = Object.entries(statistics).filter(([, s]) => s !== null);
    const keyMetric = numericStats.length > 0 ? numericStats[0] : null;

    const cards = [
        {
            icon: <Database size={22} />,
            label: 'Total Rows',
            value: formatNumber(totalRows, 0),
            detail: `${totalCols} columns`,
            color: 'var(--accent-primary)',
            bgColor: 'rgba(108, 99, 255, 0.12)',
        },
        {
            icon: <Hash size={22} />,
            label: 'Numeric Columns',
            value: numericCols,
            detail: `of ${totalCols} total`,
            color: 'var(--accent-secondary)',
            bgColor: 'rgba(0, 212, 170, 0.12)',
        },
        {
            icon: <AlertTriangle size={22} />,
            label: 'Missing Values',
            value: formatNumber(totalMissing, 0),
            detail: formatPercentage(missingPct) + ' of cells',
            color: missingPct > 10 ? 'var(--accent-danger)' : 'var(--accent-warning)',
            bgColor: missingPct > 10 ? 'rgba(255, 107, 107, 0.12)' : 'rgba(255, 184, 77, 0.12)',
        },
        {
            icon: <BarChart3 size={22} />,
            label: keyMetric ? `Avg ${keyMetric[0]}` : 'Data Types',
            value: keyMetric ? formatNumber(keyMetric[1].mean) : `${Object.keys(dataTypes).length}`,
            detail: keyMetric
                ? `Range: ${formatNumber(keyMetric[1].min)} — ${formatNumber(keyMetric[1].max)}`
                : 'columns detected',
            color: 'var(--accent-info)',
            bgColor: 'rgba(77, 166, 255, 0.12)',
        },
    ];

    return (
        <div className="stats-cards-grid">
            {cards.map((card, idx) => (
                <div key={idx} className="stat-card glass" style={{ animationDelay: `${idx * 0.1}s` }}>
                    <div className="stat-card-header">
                        <div className="stat-icon" style={{ background: card.bgColor, color: card.color }}>
                            {card.icon}
                        </div>
                        <span className="stat-label">{card.label}</span>
                    </div>
                    <div className="stat-value">{card.value}</div>
                    <div className="stat-detail">{card.detail}</div>
                </div>
            ))}

            {/* Column Statistics */}
            {numericStats.length > 0 && (
                <div className="stat-card stat-card-wide glass" style={{ animationDelay: '0.4s' }}>
                    <div className="stat-card-header">
                        <div className="stat-icon" style={{ background: 'rgba(108, 99, 255, 0.12)', color: 'var(--accent-primary)' }}>
                            <TrendingUp size={22} />
                        </div>
                        <span className="stat-label">Column Statistics</span>
                    </div>
                    <div className="column-stats-grid">
                        {numericStats.slice(0, 6).map(([col, stats]) => (
                            <div key={col} className="column-stat-item">
                                <span className="column-stat-name">{col}</span>
                                <div className="column-stat-values">
                                    <span>μ {formatNumber(stats.mean)}</span>
                                    <span>σ {formatNumber(stats.stdDev)}</span>
                                    <span className="column-stat-range">
                                        {stats.max > stats.mean ? (
                                            <TrendingUp size={12} className="trend-up" />
                                        ) : (
                                            <TrendingDown size={12} className="trend-down" />
                                        )}
                                        {formatNumber(stats.min)} — {formatNumber(stats.max)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
