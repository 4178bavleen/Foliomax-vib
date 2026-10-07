import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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

export default function ExcelViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sheets, setSheets] = useState([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');

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
  const rows = currentSheet.rows || [];
  const maxRows = 200;
  const displayRows = rows.slice(0, maxRows);

  // Compute total columns: minimum 26 (A-Z) or maximum columns in the data
  const totalColumns = useMemo(() => {
    const MIN_COLS = 26; // Always show at least columns A through Z
    const maxDataCols = Math.max(
      0,
      ...(displayRows || []).map((row) => (Array.isArray(row) ? row.length : 0))
    );
    return Math.max(MIN_COLS, maxDataCols);
  }, [displayRows]);

  const columnHeaders = useMemo(() => {
    return Array.from({ length: totalColumns }, (_, i) => getColumnName(i));
  }, [totalColumns]);

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
        <div className="excel-table-scroll">
          <table className="excel-table" role="grid">
            <thead>
              <tr>
                <th className="excel-header-hash">#</th>
                {columnHeaders.map((colName, colIdx) => {
                  let widthClass = '';
                  if (colIdx === 0) widthClass = 'col-wide-A';
                  else if (colIdx === 1) widthClass = 'col-wide-B';

                  return (
                    <th
                      key={colName}
                      className={`excel-header-col ${widthClass}`}
                      scope="col"
                    >
                      {colName}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, rowIdx) => {
                return (
                  <tr key={rowIdx}>
                    <td className="excel-row-num">{rowIdx + 1}</td>
                    {columnHeaders.map((_, colIdx) => {
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
                          {isDash ? '—' : cellVal}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
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

            {rows.length > maxRows && (
              <span className="excel-row-limit-info">
                Showing first {maxRows} of {rows.length} rows
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}