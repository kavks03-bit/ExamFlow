import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import {
  exportTimetablePDF,
  exportSeatingPDF,
  exportFacultyDutiesPDF
} from '../../utils/pdfGenerator';
import { FileText, Download, Calendar, MapPin, Briefcase, CheckCircle2, AlertCircle } from 'lucide-react';

export const Reports = () => {
  const [examinations, setExaminations] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadMsg, setDownloadMsg] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examsRes, roomsRes] = await Promise.all([
          api.get('/examinations'),
          api.get('/rooms')
        ]);
        const exams = examsRes.data.data || [];
        setExaminations(exams);
        setRooms(roomsRes.data.data || []);
        if (exams.length > 0) setSelectedExamId(exams[0]._id);
        if (roomsRes.data.data?.length > 0) setSelectedRoomId(roomsRes.data.data[0]._id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedExamId) return;
    const fetchSchedulesAndDuties = async () => {
      try {
        const [schedRes, assignRes] = await Promise.all([
          api.get(`/schedules?examination=${selectedExamId}`),
          api.get(`/invigilators/assignments?examination=${selectedExamId}`)
        ]);
        setSchedules(schedRes.data.data || []);
        setAssignments(assignRes.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSchedulesAndDuties();
  }, [selectedExamId]);

  const selectedExam = examinations.find(e => e._id === selectedExamId);

  // 1. Export Timetable PDF
  const handleExportTimetable = () => {
    if (schedules.length === 0) {
      alert('No schedules available for this examination.');
      return;
    }
    exportTimetablePDF(selectedExam?.title, schedules);
    setDownloadMsg('Examination timetable PDF generated and downloaded!');
  };

  // 2. Export Seating PDF
  const handleExportSeating = async () => {
    try {
      const room = rooms.find(r => r._id === selectedRoomId);
      const res = await api.get(`/seating?room=${selectedRoomId}`);
      const allocations = res.data.data || [];
      if (allocations.length === 0) {
        alert(`No student seating records found for Room ${room?.roomNumber}.`);
        return;
      }
      exportSeatingPDF(room?.roomNumber, selectedExam?.title, allocations);
      setDownloadMsg(`Seating sheet for Room ${room?.roomNumber} exported!`);
    } catch (err) {
      alert('Failed to export seating PDF.');
    }
  };

  // 3. Export Faculty Duties PDF
  const handleExportDuties = () => {
    if (assignments.length === 0) {
      alert('No faculty invigilation assignments found for this examination.');
      return;
    }
    exportFacultyDutiesPDF(assignments);
    setDownloadMsg('Faculty duty roster PDF generated and downloaded!');
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary-navy)' }}>
          University Examination Reports & PDF Export Center
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          Generate formal, print-ready PDF documents for notice boards, examination halls, and faculty duty rosters.
        </p>
      </div>

      {downloadMsg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: 20,
          backgroundColor: '#dcfce7',
          color: '#166534',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 14,
          fontWeight: 500
        }}>
          <CheckCircle2 size={18} /> {downloadMsg}
        </div>
      )}

      {/* Select Examination Session */}
      <div className="card" style={{ marginBottom: 24, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Select Examination Series:
          </label>
          <select
            className="form-select"
            style={{ maxWidth: 360, fontWeight: 600 }}
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
          >
            {examinations.map(e => (
              <option key={e._id} value={e._id}>
                {e.title} ({e.status.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3 Major Report Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {/* Report 1: Official Timetable PDF */}
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)', marginBottom: 14 }}>
              <Calendar size={22} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>
              Master Examination Timetable
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Official university examination timetable with dates, time windows, course codes, enrolled student groups, and hall allocations.
            </p>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
              Available Slots: <strong>{schedules.length} Scheduled Exams</strong>
            </div>
          </div>

          <button
            onClick={handleExportTimetable}
            disabled={schedules.length === 0}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 20 }}
          >
            <Download size={15} /> Download Timetable PDF
          </button>
        </div>

        {/* Report 2: Seating & Attendance Sheet PDF */}
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)', marginBottom: 14 }}>
              <MapPin size={22} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>
              Room Seating & Attendance Sheet
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Room-by-room desk placard allocation list with student roll numbers, bench numbers, and invigilator signature columns.
            </p>

            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Select Room:</label>
              <select
                className="form-select"
                style={{ fontSize: 13, padding: '6px 10px', marginTop: 4 }}
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
              >
                {rooms.map(r => (
                  <option key={r._id} value={r._id}>Room {r.roomNumber} ({r.building})</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleExportSeating}
            className="btn btn-navy"
            style={{ width: '100%', marginTop: 20 }}
          >
            <Download size={15} /> Download Room Seating PDF
          </button>
        </div>

        {/* Report 3: Faculty Duty Roster PDF */}
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea', marginBottom: 14 }}>
              <Briefcase size={22} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>
              Faculty Invigilation Duty Roster
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Faculty supervision roster detailing dates, hall locations, reporting times, and supervisory responsibilities (Chief/Assistant).
            </p>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
              Duty Assignments: <strong>{assignments.length} Allocated</strong>
            </div>
          </div>

          <button
            onClick={handleExportDuties}
            disabled={assignments.length === 0}
            className="btn btn-secondary"
            style={{ width: '100%', marginTop: 20 }}
          >
            <Download size={15} /> Download Duty Roster PDF
          </button>
        </div>
      </div>
    </div>
  );
};
