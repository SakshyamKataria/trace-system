import React, { useState, useEffect } from 'react';

const REFRESH_INTERVAL = 30000; // 30 seconds

/* ─── inline style objects ─── */
const styles = {
  page: {
    minHeight: '100vh',
    background: '#0f1117',
    color: '#e6edf3',
    fontFamily: "'Inter', sans-serif",
    padding: '40px 24px',
    boxSizing: 'border-box',
  },
  header: {
    textAlign: 'center',
    marginBottom: 36,
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    margin: 0,
    background: 'linear-gradient(135deg, #58a6ff, #3fb950)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: 14,
    color: '#8b949e',
    marginTop: 6,
  },
  tableWrap: {
    overflowX: 'auto',
    maxWidth: 1200,
    margin: '0 auto',
    borderRadius: 12,
    border: '1px solid #30363d',
    background: '#161b22',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 13,
  },
  th: {
    textAlign: 'left',
    padding: '14px 16px',
    borderBottom: '1px solid #30363d',
    color: '#8b949e',
    fontWeight: 600,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    background: '#0d1117',
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid #21262d',
    color: '#c9d1d9',
    whiteSpace: 'nowrap',
  },
  statusSuccess: {
    color: '#3fb950',
    fontWeight: 600,
  },
  statusFailure: {
    color: '#f85149',
    fontWeight: 600,
  },
  message: {
    textAlign: 'center',
    padding: 48,
    color: '#8b949e',
    fontSize: 15,
  },
  badge: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 9999,
    fontSize: 12,
    fontWeight: 600,
  },
  badgeSuccess: {
    background: 'rgba(63,185,80,0.15)',
    color: '#3fb950',
  },
  badgeFailure: {
    background: 'rgba(248,81,73,0.15)',
    color: '#f85149',
  },
  refreshNote: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 12,
    color: '#484f58',
  },
};

function StatusBadge({ status }) {
  const isSuccess = status === 'success';
  return (
    <span
      style={{
        ...styles.badge,
        ...(isSuccess ? styles.badgeSuccess : styles.badgeFailure),
      }}
    >
      {status}
    </span>
  );
}

export default function App() {
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBuilds = async () => {
    try {
      const res = await fetch('/api/v1/builds?limit=20');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBuilds(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuilds();
    const interval = setInterval(fetchBuilds, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>TRACE — Build History</h1>
        <p style={styles.subtitle}>CI / CD log ingestion dashboard</p>
      </header>

      <div style={styles.tableWrap}>
        {loading ? (
          <div style={styles.message}>Loading...</div>
        ) : error ? (
          <div style={{ ...styles.message, color: '#f85149' }}>
            Error: {error}
          </div>
        ) : builds.length === 0 ? (
          <div style={styles.message}>No builds found</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Build ID</th>
                <th style={styles.th}>Project</th>
                <th style={styles.th}>Branch</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Timestamp</th>
                <th style={styles.th}>Log Path</th>
              </tr>
            </thead>
            <tbody>
              {builds.map((b) => (
                <tr
                  key={b.build_id}
                  style={{ transition: 'background 0.15s' }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = '#1c2128')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = 'transparent')
                  }
                >
                  <td style={styles.td}>{b.build_id}</td>
                  <td style={styles.td}>{b.project}</td>
                  <td style={styles.td}>{b.branch}</td>
                  <td style={styles.td}>
                    <StatusBadge status={b.status} />
                  </td>
                  <td style={styles.td}>
                    {new Date(b.timestamp).toLocaleString()}
                  </td>
                  <td style={{ ...styles.td, fontSize: 12, color: '#8b949e' }}>
                    {b.log_path}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p style={styles.refreshNote}>Auto-refreshes every 30 seconds</p>
    </div>
  );
}
