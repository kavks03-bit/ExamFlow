import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
  Users,
  Briefcase,
  BookOpen,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await api.get('/dashboard/admin');
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const stats = data?.stats || {};
  const roomUtil = data?.roomUtilization || [];
  const deptDist = data?.deptDistribution || [];
  const recentAudits = data?.recentAudits || [];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
        Loading Admin Analytics & Metrics...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Welcome Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 32px',
        color: '#ffffff',
        marginBottom: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
            University Examination Central Command
          </h1>
          <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>
            Real-time examination timetable analytics, hall capacity utilization, and conflict monitoring.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/schedules" className="btn btn-primary" style={{ padding: '9px 18px' }}>
            <Calendar size={16} /> Timetable Scheduler
          </Link>
          <Link to="/reports" className="btn btn-secondary" style={{ padding: '9px 18px' }}>
            <FileText size={16} /> Download Reports
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Students</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--primary-navy)', marginTop: 4 }}>
                {stats.totalStudents || 0}
              </div>
            </div>
            <div style={{ padding: 8, background: '#eff6ff', borderRadius: 8, color: 'var(--accent-blue)' }}>
              <Users size={20} />
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            Enrolled across {stats.totalGroups || 0} Batches
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Faculty Pool</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--primary-navy)', marginTop: 4 }}>
                {stats.totalFaculty || 0}
              </div>
            </div>
            <div style={{ padding: 8, background: '#f0fdf4', borderRadius: 8, color: 'var(--success)' }}>
              <Briefcase size={20} />
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            Academic invigilators
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Exam Halls & Rooms</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--primary-navy)', marginTop: 4 }}>
                {stats.totalRooms || 0}
              </div>
            </div>
            <div style={{ padding: 8, background: '#fefce8', borderRadius: 8, color: 'var(--warning)' }}>
              <MapPin size={20} />
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            Available lecture theatres
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Course Subjects</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--primary-navy)', marginTop: 4 }}>
                {stats.totalSubjects || 0}
              </div>
            </div>
            <div style={{ padding: 8, background: '#faf5ff', borderRadius: 8, color: '#9333ea' }}>
              <BookOpen size={20} />
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            Theory & lab papers
          </div>
        </div>
      </div>

      {/* Second Row: Exam Progress and Conflicts Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Scheduled Exam Slots</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--primary-navy)', marginTop: 4 }}>
            {stats.totalScheduledSlots || 0}
          </div>
          <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={14} /> {stats.validSlots || 0} Valid Conflict-Free Slots
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Unresolved Conflicts</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: stats.unresolvedConflicts > 0 ? 'var(--danger)' : 'var(--success)', marginTop: 4 }}>
            {stats.unresolvedConflicts || 0}
          </div>
          <div style={{ fontSize: 12, color: stats.unresolvedConflicts > 0 ? 'var(--danger)' : 'var(--text-muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            {stats.unresolvedConflicts > 0 ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
            {stats.unresolvedConflicts > 0 ? 'Publication strictly blocked' : '0 Conflicts Detected'}
          </div>
        </div>

        <div className="card" style={{ padding: '18px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Published Examinations</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--success)', marginTop: 4 }}>
            {stats.publishedExams || 0}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
            Out of {stats.totalExams || 0} Exam Sessions
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts (Recharts) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, marginBottom: 28 }}>
        {/* Room Capacity & Booking Chart */}
        <div className="card" style={{ padding: 20 }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <div>
              <h3 className="card-title" style={{ fontSize: 16 }}>Room Exam Capacity vs Booked Slots</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                Seating capacity compared with examination slot assignments
              </p>
            </div>
          </div>

          <div style={{ height: 260, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roomUtil} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="roomNumber" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="examCapacity" name="Exam Seating Capacity" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="bookedSlots" name="Scheduled Exam Slots" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Cohort Distribution */}
        <div className="card" style={{ padding: 20 }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <div>
              <h3 className="card-title" style={{ fontSize: 16 }}>Academic Distribution</h3>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                Students & Subjects per department
              </p>
            </div>
          </div>

          <div style={{ height: 260, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptDist} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="department" tick={{ fontSize: 10 }} width={90} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="students" name="Students" fill="#0f172a" radius={[0, 4, 4, 0]} />
                <Bar dataKey="subjects" name="Subjects" fill="#38bdf8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Audit Activities */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Recent System Audit History</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              Chronological log of administrative timetable changes and room allocations
            </p>
          </div>
          <Link to="/audit" className="btn btn-secondary btn-sm">
            View All Audit Logs <ArrowRight size={14} />
          </Link>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Target Resource</th>
                <th>Performed By</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {recentAudits.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)' }}>
                    No system audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                recentAudits.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <span className={`badge ${a.action === 'CREATE' ? 'badge-success' : a.action === 'DELETE' ? 'badge-danger' : a.action === 'SCHEDULE_CONFLICT' ? 'badge-danger' : 'badge-info'}`}>
                        {a.action} ({a.module})
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{a.targetTitle || 'System Resource'}</td>
                    <td>{a.performerName || 'System'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                      {new Date(a.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
