import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  School,
  Briefcase
} from 'lucide-react';

export const FacultyDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const fetchFacultyData = async () => {
      try {
        const res = await api.get('/dashboard/faculty');
        setData(res.data.data);
      } catch (err) {
        setAlert(err.response?.data?.message || 'Failed to load faculty portal data');
      } finally {
        setLoading(false);
      }
    };
    fetchFacultyData();
  }, []);

  const faculty = data?.faculty || {};
  const assignments = data?.assignments || [];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Hero Welcome */}
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
          <div style={{ display: 'inline-block', padding: '3px 10px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', borderRadius: 20, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
            Faculty Invigilation Portal
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px 0' }}>
            Welcome, {faculty.name || user?.name || 'Professor'}
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
            {faculty.designation} • Department of {faculty.department} (ID: {faculty.facultyId})
          </p>
        </div>

        {/* Workload Indicator Badge */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 11, color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 600 }}>Assigned Duties</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#38bdf8', marginTop: 2 }}>
            {faculty.assignedCount || 0} / {faculty.maxLimit || 5}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>Weekly Limit</div>
        </div>
      </div>

      {alert && (
        <div style={{ padding: 14, background: '#fee2e2', color: '#991b1b', borderRadius: 8, marginBottom: 20, fontSize: 13 }}>
          {alert}
        </div>
      )}

      {/* Invigilation Schedule Section */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Briefcase size={20} color="var(--accent-blue)" /> Your Assigned Examination Duties
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              Official schedule of examination halls and supervision time slots
            </p>
          </div>
          <span className="badge badge-info" style={{ fontSize: 12 }}>
            {assignments.length} Duty Slots
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
            Loading invigilation duties...
          </div>
        ) : assignments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)' }}>
            <CheckCircle2 size={36} color="var(--success)" style={{ margin: '0 auto 12px auto' }} />
            <h4 style={{ fontSize: 16, fontWeight: 600, color: 'var(--primary-navy)' }}>No Invigilation Duties Assigned Yet</h4>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 450, margin: '6px auto 0 auto' }}>
              You do not have any pending examination supervision slots for the current session. The examination controller will allocate duties as schedules are finalized.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Exam Date</th>
                  <th>Duty Hours</th>
                  <th>Subject & Code</th>
                  <th>Assigned Hall</th>
                  <th>Role</th>
                  <th>Reporting Time</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {item.schedule ? new Date(item.schedule.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-primary)', fontWeight: 600 }}>
                        <Clock size={13} color="var(--accent-blue)" />
                        {item.schedule?.startTime} – {item.schedule?.endTime}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>
                        {item.schedule?.subject?.code}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {item.schedule?.subject?.name}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        Room {item.room?.roomNumber}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {item.room?.building} (Floor {item.room?.floor})
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                        {item.role?.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {item.reportingTime || '30 mins before'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
