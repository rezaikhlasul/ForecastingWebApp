import { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import useDataStore from '../../stores/useDataStore';
import { truncateText } from '../../utils/dataHelpers';
import './Dashboard.css';

const ROWS_PER_PAGE = 50;

export default function DataTable() {
    const { rawData, columns, dataTypes } = useDataStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortCol, setSortCol] = useState(null);
    const [sortDir, setSortDir] = useState('asc');
    const [currentPage, setCurrentPage] = useState(1);

    // Filter data
    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return rawData;
        const term = searchTerm.toLowerCase();
        return rawData.filter(row =>
            columns.some(col => String(row[col] ?? '').toLowerCase().includes(term))
        );
    }, [rawData, columns, searchTerm]);

    // Sort data
    const sortedData = useMemo(() => {
        if (!sortCol) return filteredData;
        return [...filteredData].sort((a, b) => {
            let valA = a[sortCol];
            let valB = b[sortCol];

            if (valA === null || valA === undefined) return 1;
            if (valB === null || valB === undefined) return -1;

            if (dataTypes[sortCol] === 'numeric') {
                valA = Number(valA);
                valB = Number(valB);
            } else {
                valA = String(valA).toLowerCase();
                valB = String(valB).toLowerCase();
            }

            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortCol, sortDir, dataTypes]);

    // Paginate
    const totalPages = Math.ceil(sortedData.length / ROWS_PER_PAGE);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ROWS_PER_PAGE;
        return sortedData.slice(start, start + ROWS_PER_PAGE);
    }, [sortedData, currentPage]);

    const handleSort = (col) => {
        if (sortCol === col) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortCol(col);
            setSortDir('asc');
        }
        setCurrentPage(1);
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'numeric': return 'var(--accent-primary)';
            case 'categorical': return 'var(--accent-secondary)';
            case 'datetime': return 'var(--accent-warning)';
            default: return 'var(--text-tertiary)';
        }
    };

    return (
        <div className="data-table-container glass">
            <div className="data-table-header">
                <div className="data-table-search">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search across all columns..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                </div>
                <div className="data-table-info">
                    <span>{filteredData.length.toLocaleString()} rows</span>
                    <span>•</span>
                    <span>{columns.length} columns</span>
                </div>
            </div>

            <div className="data-table-scroll">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th className="row-num-col">#</th>
                            {columns.map(col => (
                                <th
                                    key={col}
                                    onClick={() => handleSort(col)}
                                    className={sortCol === col ? 'sorted' : ''}
                                >
                                    <div className="th-content">
                                        <div className="th-info">
                                            <span className="th-name">{col}</span>
                                            <span className="th-type" style={{ color: getTypeColor(dataTypes[col]) }}>
                                                {dataTypes[col]}
                                            </span>
                                        </div>
                                        <span className="sort-icon">
                                            {sortCol === col ? (
                                                sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                                            ) : (
                                                <ChevronUp size={14} className="sort-inactive" />
                                            )}
                                        </span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((row, rowIdx) => (
                            <tr key={rowIdx}>
                                <td className="row-num-col">{(currentPage - 1) * ROWS_PER_PAGE + rowIdx + 1}</td>
                                {columns.map(col => (
                                    <td key={col} className={dataTypes[col] === 'numeric' ? 'numeric-cell' : ''}>
                                        {row[col] === null || row[col] === undefined || row[col] === ''
                                            ? <span className="null-value">null</span>
                                            : truncateText(String(row[col]), 40)
                                        }
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="data-table-pagination">
                    <button
                        disabled={currentPage <= 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                    >
                        <ChevronLeft size={16} />
                        Prev
                    </button>
                    <span className="page-info">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                    >
                        Next
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
