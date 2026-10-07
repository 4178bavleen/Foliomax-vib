import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  RotateCcw,
  Download,
} from 'lucide-react';
import './ExcelViewer.css';

const API_BASE = import.meta.env.VITE_API_BASE || '';

// Fallback demo dataset matching the exact reference layout
const DEMO_SHEET_DATA = {
  name: 'Sheet 1',
  rows: [
    [{ value: 'name' }, { value: '4522' }],
    [{ value: 'class' }, { value: '1233' }],
    [{ value: 'roll no.' }, { value: '5233' }],
    [{ value: 'section' }, { value: '9600' }],
    [{ value: 'jharkhand' }, { value: '4500' }],
    [{ value: 'manipur' }, { value: '1200' }],
    [{ value: 'nagaland' }, { value: '7805' }],
  ],
};

// Generate standard Excel column names: A, B, ... Z, AA, AB, ...
function getColumnName(index) {
  let name = '';
  let temp = index;
  while (temp >= 0) {
    name = String.fromCharCode((temp % 26) + 65) + name;
    temp = Math.floor(temp / 26) - 1;
  }
  return name;
}

// Extract string value from cell object or primitive
function getCellValue(cell) {
  if (cell === null || cell === undefined) return '';
  if (typeof cell === 'object') {
    if (cell.value !== null && cell.value !== undefined) {
      return String(cell.value);
    }
    return '';
  }
  return String(cell);
}

// Check if entire row is empty
function isRowEmpty(row) {
  if (!Array.isArray(row) || row.length === 0) return true;
  return row.every((cell) => getCellValue(cell).trim() === '');
}

// Check if entire column has no data across all rows
function isColumnEmpty(colIdx, rows, headerRow) {
  if (headerRow && headerRow[colIdx] && getCellValue(headerRow[colIdx]).trim() !== '') {
    return false;
  }
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (Array.isArray(row) && row[colIdx] !== undefined) {
      const val = getCellValue(row[colIdx]).trim();
      if (val !== '') {
        return false;
      }
    }
  }
  return true;
}

// Regex escape
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Highlight matching search text
function renderCellContent(cellVal, searchQuery) {
  if (cellVal === null || cellVal === undefined || cellVal.trim() === '') {
    return '—';
  }
  const strVal = String(cellVal);
  const trimmed = searchQuery.trim();
  if (!trimmed) {
    return strVal;
  }
  const escaped = escapeRegExp(trimmed);
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = strVal.split(regex);
  if (parts.length === 1) {
    return strVal;
  }
  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="excel-search-hit">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export default function ExcelViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sheets, setSheets] = useState([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');

  // Filter & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCol, setSearchCol] = useState('all'); // 'all' or column index string
  const [sortCol, setSortCol] = useState(null); // column index number or null
  const [sortDir, setSortDir] = useState('asc'); // 'asc' or 'desc'
  const [firstRowHeader, setFirstRowHeader] = useState(false);
  const [hideEmptyRows, setHideEmptyRows] = useState(false);
  const [hideEmptyCols, setHideEmptyCols] = useState(false);
  const [rowLimit, setRowLimit] = useState(200);

  // Reset filters when active sheet changes
  useEffect(() => {
    setSearchQuery('');
    setSearchCol('all');
    setSortCol(null);
    setSortDir('asc');
    setHideEmptyRows(false);
    setHideEmptyCols(false);
  }, [activeSheet]);

  useEffect(() => {
    // If id is demo, load the reference demo sheet immediately
    if (id === 'demo') {
      setSheets([DEMO_SHEET_DATA]);
      setFileName('Demo Spreadsheet');
      setLoading(false);
      return;
    }

    const token =
      localStorage.getItem('foliomax_accessToken') ||
      sessionStorage.getItem('foliomax_accessToken');

    const fetchData = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${API_BASE}/foliomax/api/files/${id}/parse`, { headers });
        const data = await res.json();

        if (!res.ok || !data.ok) {
          if (res.status === 401 || res.status === 403) {
            navigate('/login');
            return;
          }
          throw new Error(data?.message || 'Failed to load Excel file');
        }

        if (Array.isArray(data.sheets) && data.sheets.length > 0) {
          setSheets(data.sheets);
        } else {
          // If no sheets returned, use the demo structure
          setSheets([DEMO_SHEET_DATA]);
        }

        setFileName(data.name || `File ${id}`);
      } catch (err) {
        console.error('Failed to parse excel:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const currentSheet = sheets[activeSheet] || sheets[0] || DEMO_SHEET_DATA;
  const rawSheetRows = currentSheet.rows || [];

  // Data column count
  const maxDataCols = useMemo(() => {
    return Math.max(
      0,
      ...(rawSheetRows || []).map((row) => (Array.isArray(row) ? row.length : 0))
    );
  }, [rawSheetRows]);

  // Total columns to display: at least A-Z (26 cols) or max data cols
  const totalColumns = useMemo(() => {
    const MIN_COLS = 26;
    return Math.max(MIN_COLS, maxDataCols);
  }, [maxDataCols]);

  // Extract header row if first row as header is enabled
  const headerRow = useMemo(() => {
    if (firstRowHeader && rawSheetRows.length > 0) {
      return rawSheetRows[0];
    }
    return null;
  }, [firstRowHeader, rawSheetRows]);

  // Visible column indices based on hideEmptyCols
  const visibleColumnIndices = useMemo(() => {
    const allIndices = Array.from({ length: totalColumns }, (_, i) => i);
    if (!hideEmptyCols) return allIndices;

    const filtered = allIndices.filter(
      (colIdx) => !isColumnEmpty(colIdx, rawSheetRows, headerRow)
    );
    return filtered.length > 0 ? filtered : [0];
  }, [totalColumns, hideEmptyCols, rawSheetRows, headerRow]);

  // Rows pool for data operations
  const dataRowsPool = useMemo(() => {
    if (firstRowHeader && rawSheetRows.length > 0) {
      return rawSheetRows.slice(1).map((row, idx) => ({
        data: row,
        originalIndex: idx + 1,
      }));
    }
    return rawSheetRows.map((row, idx) => ({
      data: row,
      originalIndex: idx,
    }));
  }, [firstRowHeader, rawSheetRows]);

  // Populated column list for filter/sort dropdowns
  const populatedColumns = useMemo(() => {
    const count = Math.max(maxDataCols, 2);
    return Array.from({ length: count }, (_, idx) => {
      const colLetter = getColumnName(idx);
      let label = `Column ${colLetter}`;
      if (headerRow && headerRow[idx]) {
        const hVal = getCellValue(headerRow[idx]).trim();
        if (hVal) label = `${colLetter} (${hVal})`;
      }
      return { index: idx, letter: colLetter, label };
    });
  }, [maxDataCols, headerRow]);

  // Filter & Sort
  const processedRows = useMemo(() => {
    let result = dataRowsPool;

    // Filter: Hide empty rows
    if (hideEmptyRows) {
      result = result.filter((item) => !isRowEmpty(item.data));
    }

    // Filter: Search query
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((item) => {
        const row = item.data;
        if (!Array.isArray(row)) return false;

        if (searchCol === 'all') {
          return row.some((cell) =>
            getCellValue(cell).toLowerCase().includes(query)
          );
        } else {
          const colIdx = parseInt(searchCol, 10);
          if (isNaN(colIdx)) return false;
          const cell = row[colIdx];
          return getCellValue(cell).toLowerCase().includes(query);
        }
      });
    }

    // Sorting
    if (sortCol !== null && sortCol !== undefined && sortCol !== '') {
      const colIdx = parseInt(sortCol, 10);
      if (!isNaN(colIdx)) {
        result = [...result].sort((a, b) => {
          const valA = getCellValue(a.data?.[colIdx]).trim();
          const valB = getCellValue(b.data?.[colIdx]).trim();

          // Empty values always go to the bottom
          if (!valA && valB) return 1;
          if (valA && !valB) return -1;
          if (!valA && !valB) return 0;

          // Numeric sort check
          const cleanA = valA.replace(/,/g, '');
          const cleanB = valB.replace(/,/g, '');
          const numA = Number(cleanA);
          const numB = Number(cleanB);

          let cmp = 0;
          if (!isNaN(numA) && !isNaN(numB) && cleanA !== '' && cleanB !== '') {
            cmp = numA - numB;
          } else {
            cmp = valA.localeCompare(valB, undefined, {
              numeric: true,
              sensitivity: 'base',
            });
          }

          return sortDir === 'desc' ? -cmp : cmp;
        });
      }
    }

    return result;
  }, [dataRowsPool, hideEmptyRows, searchQuery, searchCol, sortCol, sortDir]);

  // Display items after row limit
  const displayItems = useMemo(() => {
    if (rowLimit === 'all') return processedRows;
    return processedRows.slice(0, Number(rowLimit));
  }, [processedRows, rowLimit]);

  // Interactive column header click
  const handleHeaderClick = (colIdx) => {
    if (sortCol === colIdx) {
      if (sortDir === 'asc') {
        setSortDir('desc');
      } else {
        setSortCol(null);
        setSortDir('asc');
      }
    } else {
      setSortCol(colIdx);
      setSortDir('asc');
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSearchCol('all');
    setSortCol(null);
    setSortDir('asc');
    setHideEmptyRows(false);
    setHideEmptyCols(false);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    searchCol !== 'all' ||
    sortCol !== null ||
    hideEmptyRows ||
    hideEmptyCols;

  // Export current filtered / sorted view as Excel
  const handleExport = () => {
    try {
      const exportRows = [];
      if (headerRow) {
        exportRows.push(
          visibleColumnIndices.map((colIdx) => getCellValue(headerRow[colIdx]))
        );
      }
      processedRows.forEach((item) => {
        exportRows.push(
          visibleColumnIndices.map((colIdx) => getCellValue(item.data?.[colIdx]))
        );
      });

      const ws = XLSX.utils.aoa_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, currentSheet.name || 'Sheet');
      const safeName = (fileName || 'Spreadsheet').replace(/[^\w\s-]/gi, '_');
      XLSX.writeFile(wb, `${safeName}.xlsx`);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  if (loading) {
    return (
      <div className="excel-page-container">
        <div className="excel-viewer-state">
          <div className="excel-spinner" />
          <h2 className="excel-state-title">Loading Spreadsheet</h2>
          <p className="excel-state-desc">Fetching and parsing spreadsheet data...</p>
        </div>
      </div>
    );
  }

  if (error && (!sheets || sheets.length === 0)) {
    return (
      <div className="excel-page-container">
        <div className="excel-viewer-state">
          <h2 className="excel-state-title">Unable to Load File</h2>
          <p className="excel-state-desc">{error}</p>
          <div className="excel-state-actions">
            <button
              onClick={() => {
                setSheets([DEMO_SHEET_DATA]);
                setFileName('Preview Spreadsheet');
                setError(null);
              }}
              className="excel-btn-primary"
            >
              View Preview Layout
            </button>
            <Link to="/subscription" className="excel-btn-secondary">
              ← Back to Subscription
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="excel-page-container">
      {/* Clean, minimal top bar */}
      <div className="excel-nav-bar">
        <div className="excel-nav-left">
          <Link to="/subscription" className="excel-back-btn">
            <span>←</span> Back to Subscription
          </Link>
          {fileName && <span className="excel-file-badge">{fileName}</span>}
        </div>
      </div>

      {/* Main Excel Sheet Card */}
      <div className="excel-sheet-card">
        {/* Top Filter & Tools Toolbar */}
        <div className="excel-filter-toolbar">
          <div className="excel-filter-row">
            {/* Left side: Search & Column selector */}
            <div className="excel-filter-group-left">
              {/* Search input box */}
              <div className="excel-search-box">
                <Search size={15} className="excel-search-icon" />
                <input
                  type="text"
                  placeholder="Search in sheet..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="excel-search-input"
                  aria-label="Search spreadsheet"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="excel-search-clear"
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Column scope dropdown for search */}
              <div className="excel-control-item">
                <label className="excel-control-label">In:</label>
                <select
                  value={searchCol}
                  onChange={(e) => setSearchCol(e.target.value)}
                  className="excel-select"
                  aria-label="Filter column"
                >
                  <option value="all">All Columns</option>
                  {populatedColumns.map((col) => (
                    <option key={col.index} value={String(col.index)}>
                      {col.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort by column dropdown */}
              <div className="excel-control-item">
                <label className="excel-control-label">Sort:</label>
                <select
                  value={sortCol !== null ? String(sortCol) : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSortCol(val === '' ? null : Number(val));
                  }}
                  className="excel-select"
                  aria-label="Sort by column"
                >
                  <option value="">Default order</option>
                  {populatedColumns.map((col) => (
                    <option key={col.index} value={String(col.index)}>
                      {col.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort direction toggle button */}
              {sortCol !== null && (
                <button
                  type="button"
                  onClick={() => setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                  className="excel-sort-dir-btn"
                  title={`Direction: ${sortDir === 'asc' ? 'Ascending (A to Z)' : 'Descending (Z to A)'}`}
                >
                  {sortDir === 'asc' ? (
                    <>
                      <ArrowUp size={14} />
                      <span>Asc (A→Z)</span>
                    </>
                  ) : (
                    <>
                      <ArrowDown size={14} />
                      <span>Desc (Z→A)</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Right side: Quick toggles, Export & Reset */}
            <div className="excel-filter-group-right">
              {/* Row 1 as header toggle */}
              <button
                type="button"
                onClick={() => setFirstRowHeader((prev) => !prev)}
                className={`excel-toggle-pill ${firstRowHeader ? 'active' : ''}`}
                title="Treat the first row as column headers"
              >
                <span>Header: Row 1</span>
              </button>

              {/* Hide empty rows toggle */}
              <button
                type="button"
                onClick={() => setHideEmptyRows((prev) => !prev)}
                className={`excel-toggle-pill ${hideEmptyRows ? 'active' : ''}`}
                title="Hide completely blank rows"
              >
                <span>Hide Empty Rows</span>
              </button>

              {/* Hide empty columns toggle */}
              <button
                type="button"
                onClick={() => setHideEmptyCols((prev) => !prev)}
                className={`excel-toggle-pill ${hideEmptyCols ? 'active' : ''}`}
                title="Hide completely blank columns"
              >
                <span>Hide Empty Cols</span>
              </button>

              {/* Clear / Reset button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="excel-btn-reset"
                  title="Clear all search and sort filters"
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
              )}

              {/* Export button */}
              <button
                type="button"
                onClick={handleExport}
                className="excel-btn-export"
                title="Export current view to Excel (.xlsx)"
              >
                <Download size={14} />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Status & Active Chips Row */}
          <div className="excel-status-bar">
            <div className="excel-status-left">
              <span className="excel-count-badge">
                Showing {displayItems.length} of {dataRowsPool.length} rows
                {hasActiveFilters && processedRows.length !== dataRowsPool.length && (
                  <span className="excel-filtered-notice">
                    {' '}({processedRows.length} matched)
                  </span>
                )}
                {hideEmptyCols && (
                  <span className="excel-cols-badge">
                    {' '}• {visibleColumnIndices.length} cols visible
                  </span>
                )}
              </span>

              {/* Active filter badges */}
              <div className="excel-chips-wrap">
                {searchQuery.trim() && (
                  <span className="excel-chip">
                    Search: &ldquo;{searchQuery}&rdquo;
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="excel-chip-remove"
                    >
                      <X size={11} />
                    </button>
                  </span>
                )}

                {searchCol !== 'all' && (
                  <span className="excel-chip">
                    In Col {getColumnName(Number(searchCol))}
                    <button
                      type="button"
                      onClick={() => setSearchCol('all')}
                      className="excel-chip-remove"
                    >
                      <X size={11} />
                    </button>
                  </span>
                )}

                {sortCol !== null && (
                  <span className="excel-chip">
                    Sorted by Col {getColumnName(sortCol)} ({sortDir.toUpperCase()})
                    <button
                      type="button"
                      onClick={() => setSortCol(null)}
                      className="excel-chip-remove"
                    >
                      <X size={11} />
                    </button>
                  </span>
                )}

                {hideEmptyRows && (
                  <span className="excel-chip">
                    Empty rows hidden
                    <button
                      type="button"
                      onClick={() => setHideEmptyRows(false)}
                      className="excel-chip-remove"
                    >
                      <X size={11} />
                    </button>
                  </span>
                )}

                {hideEmptyCols && (
                  <span className="excel-chip">
                    Empty cols hidden
                    <button
                      type="button"
                      onClick={() => setHideEmptyCols(false)}
                      className="excel-chip-remove"
                    >
                      <X size={11} />
                    </button>
                  </span>
                )}
              </div>
            </div>

            {/* Rows Limit Selector */}
            <div className="excel-status-right">
              <label className="excel-limit-label">Show:</label>
              <select
                value={String(rowLimit)}
                onChange={(e) => setRowLimit(e.target.value)}
                className="excel-select-sm"
              >
                <option value="50">50 rows</option>
                <option value="100">100 rows</option>
                <option value="200">200 rows</option>
                <option value="500">500 rows</option>
                <option value="all">All rows</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scrollable table view */}
        <div className="excel-table-scroll">
          <table className="excel-table" role="grid">
            <thead>
              <tr>
                <th className="excel-header-hash">#</th>
                {visibleColumnIndices.map((colIdx) => {
                  const colName = getColumnName(colIdx);
                  let widthClass = '';
                  if (colIdx === 0) widthClass = 'col-wide-A';
                  else if (colIdx === 1) widthClass = 'col-wide-B';

                  const isSorted = sortCol === colIdx;
                  const headerTitleVal =
                    headerRow && headerRow[colIdx]
                      ? getCellValue(headerRow[colIdx]).trim()
                      : '';

                  return (
                    <th
                      key={colIdx}
                      className={`excel-header-col ${widthClass} ${
                        isSorted ? 'col-is-sorted' : ''
                      }`}
                      scope="col"
                      onClick={() => handleHeaderClick(colIdx)}
                      title={`Click to sort by Column ${colName}`}
                    >
                      <div className="excel-header-cell-inner">
                        <span className="excel-header-letter">{colName}</span>
                        {headerTitleVal && (
                          <span className="excel-header-sublabel" title={headerTitleVal}>
                            {headerTitleVal}
                          </span>
                        )}
                        <span className="excel-header-sort-indicator">
                          {isSorted ? (
                            sortDir === 'asc' ? (
                              <ArrowUp size={13} className="excel-sort-arrow-active" />
                            ) : (
                              <ArrowDown size={13} className="excel-sort-arrow-active" />
                            )
                          ) : (
                            <ArrowUpDown size={11} className="excel-sort-arrow-neutral" />
                          )}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {displayItems.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumnIndices.length + 1} className="excel-empty-row-td">
                    <div className="excel-empty-filter-state">
                      <Filter size={28} className="excel-empty-icon" />
                      <p className="excel-empty-title">No matching rows found</p>
                      <p className="excel-empty-desc">
                        {searchQuery
                          ? `No rows matched "${searchQuery}"`
                          : 'Try modifying your search query or filters'}
                      </p>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="excel-empty-reset-btn"
                      >
                        Reset Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                displayItems.map((item, rowIdx) => {
                  const row = item.data;
                  return (
                    <tr key={rowIdx}>
                      <td
                        className="excel-row-num"
                        title={`Original row: ${item.originalIndex + 1}`}
                      >
                        {item.originalIndex + 1}
                      </td>
                      {visibleColumnIndices.map((colIdx) => {
                        const cell = Array.isArray(row) ? row[colIdx] : undefined;
                        let cellVal = null;
                        let customStyle = {};

                        if (cell !== undefined && cell !== null) {
                          if (typeof cell === 'object') {
                            if (
                              cell.value !== undefined &&
                              cell.value !== null &&
                              cell.value !== ''
                            ) {
                              cellVal = String(cell.value);
                            }
                            if (cell.bold) customStyle.fontWeight = '700';
                            if (cell.italic) customStyle.fontStyle = 'italic';
                            if (cell.color) customStyle.color = cell.color;
                            if (cell.bg) customStyle.backgroundColor = cell.bg;
                          } else if (cell !== '') {
                            cellVal = String(cell);
                          }
                        }

                        const isDash =
                          cellVal === null ||
                          cellVal === undefined ||
                          cellVal.trim() === '';

                        const isColA = colIdx === 0;
                        const isColB = colIdx === 1;

                        let cellTypeClass = 'cell-dash';
                        if (!isDash) {
                          cellTypeClass = isColA
                            ? 'col-text'
                            : isColB
                            ? 'col-num'
                            : 'col-text';
                        }

                        return (
                          <td
                            key={colIdx}
                            className={`excel-cell ${cellTypeClass}`}
                            style={customStyle}
                          >
                            {isDash
                              ? '—'
                              : renderCellContent(cellVal, searchQuery)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom tab bar if workbook has multiple sheets */}
        {sheets.length > 1 && (
          <div className="excel-sheet-tabs-container">
            <div className="excel-sheet-tabs" role="tablist">
              {sheets.map((s, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={i === activeSheet}
                  className={`excel-sheet-tab ${i === activeSheet ? 'active' : ''}`}
                  onClick={() => setActiveSheet(i)}
                >
                  {s.name || `Sheet ${i + 1}`}
                </button>
              ))}
            </div>

            {processedRows.length > displayItems.length && (
              <span className="excel-row-limit-info">
                Showing first {displayItems.length} of {processedRows.length} rows
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}