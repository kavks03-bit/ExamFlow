import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Activity, Server, Database, CheckCircle2, XCircle, ArrowRight, Shield, Layers, Calendar, Grid } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/health');
      setHealth(res.data);
    } catch (err) {
      setError(err.message || 'Failed to connect to backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Welcome Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '36px 32px',
        color: '#ffffff',
        marginBottom: 28,
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(37,99,235,0.3)', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#60a5fa', marginBottom: 12 }}>
          Phase 1: Project Setup & Architecture
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.02em' }}>
          ExamFlow System Architecture
        </h1>
        <p style={{ fontSize: 15, color: '#94a3b8', maxWidth: 750, lineHeight: 1.6 }}>
          Smart Examination Scheduling & Invigilation Management Platform for colleges and universities.
          Phase 1 establishes the unified full-stack architecture connecting React.js with Vite and Express.js with MongoDB Atlas.
        </p>

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <Link to="/login" className="btn btn-primary" style={{ padding: '10px 20px' }}>
            Go to Portal Login <ArrowRight size={16} />
          </Link>
          <button onClick={checkHealth} className="btn btn-secondary" style={{ padding: '10px 20px' }}>
            <Activity size={16} /> Re-check API Health
          </button>
        </div>
      </div>

      {/* API & Backend Connectivity Card */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div className="card-header">
          <div>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Server size={20} color="var(--accent-blue)" /> Backend API Health Status
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Live connection state between Client (Vite:5173) and Server (Express:5000)
            </p>
          </div>
          <div>
            {loading ? (
              <span className="badge badge-warning">Checking Connectivity...</span>
            ) : health?.success ? (
              <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 size={14} /> Backend Connected
              </span>
            ) : (
              <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <XCircle size={14} /> Backend Unreachable
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div style={{ padding: 16, background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>API Status</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: health?.success ? 'var(--success)' : 'var(--danger)', marginTop: 4 }}>
              {loading ? 'Checking...' : health?.success ? 'ONLINE (200 OK)' : 'OFFLINE'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Route: <code>/api/health</code>
            </div>
          </div>

          <div style={{ padding: 16, background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Environment</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
              {health?.environment || 'Development'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Version: {health?.version || '1.0.0'}
            </div>
          </div>

          <div style={{ padding: 16, background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Database Layer</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: health?.database === 'connected' ? 'var(--success)' : 'var(--warning)', marginTop: 4 }}>
              {health?.database === 'connected' ? `Atlas: ${health.databaseName || 'examflow'}` : 'Atlas (Action Required)'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {health?.database === 'connected' ? `Host: ${health.clusterHost || 'ExamFlowCluster'}` : 'Configure server/.env'}
            </div>
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 16, padding: 12, background: '#fee2e2', color: '#991b1b', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
            <strong>Connection Notice:</strong> {error}. Make sure the backend server is running via <code>npm run dev:server</code>.
          </div>
        )}
      </div>

      {/* Project Modules Overview Grid */}
      <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--primary-navy)', marginBottom: 16 }}>
        System Architecture & Planned Modules
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ padding: 8, background: '#eff6ff', borderRadius: 8, color: '#2563eb' }}>
              <Shield size={20} />
            </div>
            <h4 style={{ fontSize: 15, fontWeight: 600 }}>1. Auth & Role Security</h4>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            JWT-based token authentication with bcrypt password hashing for Admin, Faculty, and Student personas.
          </p>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ padding: 8, background: '#f0fdf4', borderRadius: 8, color: '#16a34a' }}>
              <Layers size={20} />
            </div>
            <h4 style={{ fontSize: 15, fontWeight: 600 }}>2. Academic CRUD Entities</h4>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Management of Students, Faculty, Subjects, Student Groups, and Room capacities.
          </p>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ padding: 8, background: '#fefce8', borderRadius: 8, color: '#ca8a04' }}>
              <Calendar size={20} />
            </div>
            <h4 style={{ fontSize: 15, fontWeight: 600 }}>3. Conflict Detection Engine</h4>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Core scheduling validation preventing student overlaps, room capacity breaches, and faculty double-booking.
          </p>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ padding: 8, background: '#faf5ff', borderRadius: 8, color: '#9333ea' }}>
              <Grid size={20} />
            </div>
            <h4 style={{ fontSize: 15, fontWeight: 600 }}>4. Seating & Invigilation</h4>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Automated room allocation, student bench assignment, faculty duty distribution, and PDF timetable export.
          </p>
        </div>
      </div>
    </div>
  );
};
