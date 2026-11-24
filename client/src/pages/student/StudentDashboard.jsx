import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { exportStudentHallTicketPDF } from '../../utils/pdfGenerator';
import {
  Calendar,
  Clock,
  MapPin,
  Download,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const res = await api.get('/dashboard/student');
        setData(res.data.data);
      } catch (err) {
        setErrorMessage(err.response?.data?.message || 'Failed to load student examination timetable');
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, []);

  const student = data?.student || {};
  const timetable = data?.timetable || [];

  const handleDownloadHallTicket = () => {
    if (timetable.length === 0) {
      window.alert('No published examinations available to generate a Hall Ticket.');
      return;
    }
    exportStudentHallTicketPDF(student, timetable);
  };

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
          <div style={{ display: 'inline-block', padding: '3px 10px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', borderRadius: 20, fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
            Student Examination Portal
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px 0' }}>
            Welcome, {student.name || user?.name || 'Student'}
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
            Roll No: <strong>{student.rollNumber || 'N/A'}</strong> • {student.department} (Semester {student.semester}) • Batch: {student.groupName || 'Regular'}
          </p>
        </div>

        <button
          onClick={handleDownloadHallTicket}
          disabled={timetable.length === 0}
          className="btn btn-primary"
          style={{ padding: '10px 20px', fontSize: 14 }}
        >
          <Download size={16} /> Download Hall Ticket (PDF)
        </button>
      </div>

      {errorMessage && (
        <div style={{ padding: 14, background: '#fee2e2', color: '#991b1b', borderRadius: 8, marginBottom: 20, fontSize: 13 }}>
          {errorMessage}
        </div>
      )}

      {/* Published Timetable Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={20} color="var(--accent-blue)" /> Official Published Examination Timetable
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              Verified examination dates, timing windows, exam halls, and personal desk assignments
            </p>
          </div>
          <span className="badge badge-success" style={{ fontSize: 12 }}>
            {timetable.length} Examination Papers
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
            Loading your examination schedule...
          </div>
        ) : timetable.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)' }}>
            <Clock size={36} color="var(--warning)" style={{ margin: '0 auto 12px auto' }} />
            <h4 style={{ fontSize: 16, fontWeight: 600, color: 'var(--primary-navy)' }}>No Published Timetable Yet</h4>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 460, margin: '6px auto 0 auto' }}>
              Your examination schedule has not been officially published by the Controller of Examinations yet. Once approved and verified with zero conflicts, it will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Day</th>
                  <th>Time Window</th>
                  <th>Course Code & Title</th>
                  <th>Assigned Examination Hall</th>
                  <th>Your Seat Number</th>
                </tr>
              </thead>
              <tbody>
                {timetable.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>
                        {new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                        <Clock size={13} color="var(--accent-blue)" />
                        {item.startTime} – {item.endTime}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Duration: {item.durationMinutes} mins
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>
                        {item.subject?.code}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                        {item.subject?.name}
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
                      <span className="badge badge-info" style={{ fontWeight: 700, fontSize: 13, letterSpacing: '0.04em' }}>
                        {item.seatNumber}
                      </span>
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
