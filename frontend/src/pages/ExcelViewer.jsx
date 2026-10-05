import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || '';

export default function ExcelViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sheets, setSheets] = useState([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('foliomax_accessToken');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE}/foliomax/api/files/${id}/parse`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data?.message || 'Failed to load Excel');
        }
        setSheets(data.sheets || []);
        setFileName(data.name || `File ${id}`);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="excel-viewer loading">
        <div className="spinner">Loading spreadsheet...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="excel-viewer error">
        <h2>Error Loading File</h2>
        <p>{error}</p>
        <Link to="/subscription" className="btn-back">← Back to Subscription</Link>
      </div>
    );
  }

  if (!sheets.length) {
    return (
      <div className="excel-viewer empty">
        <h2>No Data Found</h2>
        <p>This spreadsheet appears to be empty.</p>
        <Link to="/subscription" className="btn-back">← Back to Subscription</Link>
      </div>
    );
  }

  const sheet = sheets[activeSheet];
  const maxRows = 100;
  const displayRows = sheet.rows?.slice(0, maxRows) || [];

  return (
    <div className="excel-viewer">
      <header className="excel-header">
        <Link to="/subscription" className="btn-back">← Back</Link>
        <h1 className="excel-title">{fileName}</h1>
        <div className="sheet-tabs" role="tablist">
          {sheets.map((s, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === activeSheet}
              className={`sheet-tab ${i === activeSheet ? 'active' : ''}`}
              onClick={() => setActiveSheet(i)}
            >
              {s.name || `Sheet ${i + 1}`}
            </button>
          ))}
        </div>
      </header>

      <div className="excel-grid-container">
        <table className="excel-table" role="grid">
          <thead>
            <tr>
              <th className="row-header">#</th>
              {displayRows[0]?.map((_, colIdx) => (
                <th key={colIdx} className="col-header">
                  {String.fromCharCode(65 + colIdx)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, rowIdx) => (
              <tr key={rowIdx}>
                <td className="row-header">{rowIdx + 1}</td>
                {row?.map((cell, colIdx) => (
                  <td key={colIdx} className="cell">
                    {cell?.value !== undefined && cell?.value !== null && cell?.value !== ''
                      ? cell.value
                      : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {sheet.rows?.length > maxRows && (
          <div className="row-limit-notice">
            Showing first {maxRows} of {sheet.rows.length} rows.
          </div>
        )}
      </div>

      <style jsx>{`
        .excel-viewer {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        }
        .excel-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .btn-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background: #f1f5f9;
          color: #475569;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }
        .btn-back:hover {
          background: #e2e8f0;
          color: #334155;
        }
        .excel-title {
          font-size: 24px;
          font-weight: 700;
          color: #1d1d1f;
          margin: 0;
          flex: 1;
        }
        .sheet-tabs {
          display: flex;
          gap: 4px;
          background: #f8fafc;
          padding: 4px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .sheet-tab {
          padding: 8px 16px;
          border: none;
          background: transparent;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .sheet-tab:hover {
          color: #1d1d1f;
          background: #fff;
        }
        .sheet-tab.active {
          background: #324e31;
          color: #fff;
        }
        .excel-grid-container {
          overflow: auto;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: #fff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
        }
        .excel-table {
          border-collapse: collapse;
          min-width: max-content;
          font-size: 13px;
        }
        .excel-table th,
        .excel-table td {
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          text-align: left;
          white-space: nowrap;
        }
        .excel-table th {
          background: #f8fafc;
          font-weight: 700;
          color: #334155;
          position: sticky;
        }
        .excel-table th.row-header {
          top: 0;
          left: 0;
          z-index: 2;
          background: #f1f5f9;
        }
        .excel-table th.col-header {
          top: 0;
          z-index: 1;
        }
        .excel-table td.row-header {
          background: #f8fafc;
          font-weight: 600;
          color: #64748b;
          position: sticky;
          left: 0;
          z-index: 1;
        }
        .excel-table td.cell {
          color: #1d1d1f;
        }
        .excel-table tr:nth-child(even) td.cell {
          background: #fafafa;
        }
        .excel-table tr:hover td.cell {
          background: #f0fdf4;
        }
        .row-limit-notice {
          padding: 12px 16px;
          background: #fef3c7;
          color: #92400e;
          font-size: 13px;
          border-top: 1px solid #e2e8f0;
        }
        .excel-viewer.loading,
        .excel-viewer.error,
        .excel-viewer.empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          text-align: center;
          color: #64748b;
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: #324e31;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}