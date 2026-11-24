import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { FileText, Search, RefreshCw, Filter, Calendar, Shield } from 'lucide-react';

export const AuditHistory = () => {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [filterAction, setFilterAction] = useState('');

  const fetchAudits = async () => {
    setLoading(true);
    try {
      let query = `?search=${search}`;
      if (filterModule) query += `&module=${filterModule}`;
      if (filterAction) query += `&action=${filterAction}`;
      const res = await api.get(`/dashboard/audits${query}`);
      setAudits(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch audits', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
  }, [filterModule, filterAction]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAudits();
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'CREATE':
        return <span className="badge badge-success">CREATED</span>;
      case 'UPDATE':
        return <span className="badge badge-info">UPDATED</span>;
      case 'DELETE':
        return <span className="badge badge-danger">DELETED</span>;
      case 'PUBLISH':
        return <span className="badge badge-success" style={{ background: '#dcfce7', color: '#15803d' }}>PUBLISHED</span>;
      case 'SCHEDULE_CONFLICT':
        return <span className="badge badge-danger">CONFLICT RECORDED</span>;
      case 'SEATING_ALLOCATION':
        return <span className="badge badge-info">SEATING GENERATED</span>;
      default:
        return <span className="badge badge-secondary">{action}</span>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary-navy)' }}>
            System Audit History & Change Log
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Chronological log of administrative timetable changes, room reallocations, and invigilator duties.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 38 }}
              placeholder="Search by User Name or Target Resource..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ width: 180 }}>
            <select
              className="form-select"
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
            >
              <option value="">All Modules</option>
              <option value="SCHEDULE">Schedules</option>
              <option value="ROOM">Rooms</option>
              <option value="INVIGILATION">Invigilation</option>
              <option value="SEATING">Seating</option>
              <option value="STUDENT">Students</option>
              <option value="FACULTY">Faculty</option>
              <option value="EXAMINATION">Examinations</option>
              <option value="AUTH">Authentication</option>
            </select>
          </div>

          <div style={{ width: 160 }}>
            <select
              className="form-select"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="PUBLISH">Publish</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary">
            <Search size={16} /> Filter
          </button>
          <button type="button" onClick={() => { setSearch(''); setFilterModule(''); setFilterAction(''); fetchAudits(); }} className="btn btn-secondary">
            <RefreshCw size={16} /> Reset
          </button>
        </form>
      </div>

      {/* Data Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action & Module</th>
              <th>Target Resource</th>
              <th>Performed By</th>
              <th>Client IP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
                  Loading audit logs...
                </td>
              </tr>
            ) : audits.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
                  No audit logs found matching criteria.
                </td>
              </tr>
            ) : (
              audits.map((a) => (
                <tr key={a._id}>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {new Date(a.createdAt).toLocaleString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </td>
                  <td>
                    {getActionBadge(a.action)}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6, fontWeight: 600 }}>
                      [{a.module}]
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>
                    {a.targetTitle || 'System Resource'}
                  </td>
                  <td>
                    <div>{a.performerName || 'System'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {a.performedBy?.email || ''}
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {a.ipAddress || '127.0.0.1'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
