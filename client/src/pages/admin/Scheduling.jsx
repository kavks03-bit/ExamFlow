import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Modal } from '../../components/common/Modal';
import {
  Calendar,
  Clock,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
  Send,
  Trash2,
  Edit2,
  Search,
  Filter,
  Layers,
  MapPin,
  UserCheck,
  RefreshCw,
  Info
} from 'lucide-react';

export const Scheduling = () => {
  const [examinations, setExaminations] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [groups, setGroups] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Alert State
  const [alert, setAlert] = useState(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    studentGroup: '',
    room: '',
    invigilator: '',
    date: '',
    startTime: '09:30',
    endTime: '12:30',
    notes: ''
  });

  // Live Conflict Detection in Modal
  const [liveConflictCheck, setLiveConflictCheck] = useState({ loading: false, result: null });
  const [allowConflictOverride, setAllowConflictOverride] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Auto-Suggest Modal
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [suggestData, setSuggestData] = useState({ subject: '', studentGroup: '' });
  const [suggestResult, setSuggestResult] = useState(null);
  const [suggestLoading, setSuggestLoading] = useState(false);

  // Publish State
  const [publishLoading, setPublishLoading] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    const fetchPrerequisites = async () => {
      try {
        const [examsRes, subsRes, grpsRes, rmsRes, facRes] = await Promise.all([
          api.get('/examinations'),
          api.get('/subjects'),
          api.get('/groups'),
          api.get('/rooms'),
          api.get('/faculty')
        ]);

        const exams = examsRes.data.data || [];
        setExaminations(exams);
        setSubjects(subsRes.data.data || []);
        setGroups(grpsRes.data.data || []);
        setRooms(rmsRes.data.data || []);
        setFaculty(facRes.data.data || []);

        if (exams.length > 0) {
          setSelectedExamId(exams[0]._id);
        }
      } catch (err) {
        setAlert({ type: 'danger', message: 'Failed to load scheduling metadata' });
      } finally {
        setLoading(false);
      }
    };

    fetchPrerequisites();
  }, []);

  // Fetch Schedules whenever selected examination changes
  const fetchSchedules = async () => {
    if (!selectedExamId) return;
    setLoading(true);
    try {
      const res = await api.get(`/schedules?examination=${selectedExamId}`);
      setSchedules(res.data.data || []);
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to fetch timetable schedules' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [selectedExamId]);

  // Live Conflict Checking Debounce Effect
  useEffect(() => {
    if (!isModalOpen || !formData.date || !formData.startTime || !formData.endTime || !formData.room || !formData.studentGroup) {
      setLiveConflictCheck({ loading: false, result: null });
      return;
    }

    const timer = setTimeout(async () => {
      setLiveConflictCheck(prev => ({ ...prev, loading: true }));
      try {
        const res = await api.post('/schedules/validate-slot', {
          examinationId: selectedExamId,
          subjectId: formData.subject,
          studentGroupId: formData.studentGroup,
          roomId: formData.room,
          invigilatorId: formData.invigilator || null,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          excludeScheduleId: editingSchedule?._id || null
        });
        setLiveConflictCheck({ loading: false, result: res.data.data });
      } catch (err) {
        setLiveConflictCheck({ loading: false, result: null });
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [formData, isModalOpen, selectedExamId, editingSchedule]);

  const selectedExam = examinations.find(e => e._id === selectedExamId);

  const handleOpenAdd = () => {
    setEditingSchedule(null);
    setAllowConflictOverride(false);
    setLiveConflictCheck({ loading: false, result: null });
    const defaultDate = selectedExam?.startDate ? new Date(selectedExam.startDate).toISOString().split('T')[0] : '';
    setFormData({
      subject: subjects[0]?._id || '',
      studentGroup: groups[0]?._id || '',
      room: rooms[0]?._id || '',
      invigilator: '',
      date: defaultDate,
      startTime: '09:30',
      endTime: '12:30',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingSchedule(item);
    setAllowConflictOverride(false);
    setLiveConflictCheck({ loading: false, result: null });
    setFormData({
      subject: item.subject?._id || item.subject || '',
      studentGroup: item.studentGroup?._id || item.studentGroup || '',
      room: item.room?._id || item.room || '',
      invigilator: item.invigilator?._id || item.invigilator || '',
      date: item.date ? new Date(item.date).toISOString().split('T')[0] : '',
      startTime: item.startTime,
      endTime: item.endTime,
      notes: item.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id, subjectCode) => {
    if (!window.confirm(`Delete scheduled examination for "${subjectCode}"?`)) return;
    try {
      await api.delete(`/schedules/${id}`);
      setAlert({ type: 'success', message: 'Examination schedule deleted.' });
      fetchSchedules();
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Delete failed.' });
    }
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      const payload = {
        examination: selectedExamId,
        ...formData,
        allowConflictSave: allowConflictOverride
      };

      if (editingSchedule) {
        await api.put(`/schedules/${editingSchedule._id}`, payload);
        setAlert({ type: 'success', message: 'Examination schedule updated!' });
      } else {
        await api.post('/schedules', payload);
        setAlert({ type: 'success', message: 'Examination scheduled successfully!' });
      }
      setIsModalOpen(false);
      fetchSchedules();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error saving examination schedule.';
      setAlert({ type: 'danger', message: msg });
    } finally {
      setSaveLoading(false);
    }
  };

  // Publish Timetable Action
  const handlePublishTimetable = async () => {
    if (!window.confirm(`Are you sure you want to verify and publish the timetable for "${selectedExam?.title}"?\n\nThis will validate all schedules and make them officially visible to Students and Faculty.`)) return;

    setPublishLoading(true);
    try {
      const res = await api.post(`/schedules/publish/${selectedExamId}`);
      setAlert({ type: 'success', message: res.data.message });
      // Update local examination status
      setExaminations(prev => prev.map(e => e._id === selectedExamId ? { ...e, status: 'published' } : e));
      fetchSchedules();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to publish timetable.';
      setAlert({ type: 'danger', message: errorMsg });
    } finally {
      setPublishLoading(false);
    }
  };

  // Auto-Suggest Slot Handler
  const handleRunAutoSuggest = async () => {
    if (!suggestData.subject || !suggestData.studentGroup) {
      setAlert({ type: 'danger', message: 'Please select both Subject and Student Group.' });
      return;
    }
    setSuggestLoading(true);
    setSuggestResult(null);
    try {
      const res = await api.post('/schedules/auto-suggest', {
        examinationId: selectedExamId,
        subjectId: suggestData.subject,
        studentGroupId: suggestData.studentGroup
      });
      setSuggestResult(res.data);
    } catch (err) {
      setSuggestResult({ success: false, message: err.response?.data?.message || 'Suggestion failed.' });
    } finally {
      setSuggestLoading(false);
    }
  };

  const handleApplySuggestion = () => {
    if (!suggestResult?.suggestion) return;
    const { date, startTime, endTime, room } = suggestResult.suggestion;
    setFormData({
      subject: suggestData.subject,
      studentGroup: suggestData.studentGroup,
      room: room._id,
      invigilator: '',
      date,
      startTime,
      endTime,
      notes: 'Auto-scheduled by ExamFlow conflict detection engine.'
    });
    setIsSuggestModalOpen(false);
    setIsModalOpen(true);
  };

  // Computed Statistics
  const totalSlots = schedules.length;
  const conflictSlots = schedules.filter(s => s.hasConflicts).length;
  const validSlots = totalSlots - conflictSlots;

  return (
    <div>
      {/* Top Header & Exam Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary-navy)' }}>
            Examination Scheduling & Conflict Engine
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Schedule subject examination slots with automated conflict detection and room capacity verification.
          </p>
        </div>

        {/* Examination Session Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Active Exam Session:
          </label>
          <select
            className="form-select"
            style={{ width: 280, fontWeight: 600 }}
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

      {/* Alert Notification */}
      {alert && (
        <div style={{
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: alert.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: alert.type === 'success' ? '#166534' : '#991b1b',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {alert.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
            <span style={{ fontSize: 14, fontWeight: 500 }}>{alert.message}</span>
          </div>
          <button onClick={() => setAlert(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 16 }}>×</button>
        </div>
      )}

      {/* Analytics KPI Ribbon */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Scheduled Slots</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--primary-navy)', marginTop: 4 }}>
            {totalSlots}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Valid Slots</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--success)', marginTop: 4 }}>
            {validSlots}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Unresolved Conflicts</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: conflictSlots > 0 ? 'var(--danger)' : 'var(--text-muted)', marginTop: 4 }}>
            {conflictSlots}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Timetable Status</div>
          <div style={{ marginTop: 6 }}>
            <span className={`badge ${selectedExam?.status === 'published' ? 'badge-success' : conflictSlots > 0 ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: 13, padding: '4px 10px' }}>
              {selectedExam?.status?.toUpperCase() || 'DRAFT'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={16} /> Schedule Exam Slot
          </button>
          <button
            onClick={() => {
              setSuggestData({ subject: subjects[0]?._id || '', studentGroup: groups[0]?._id || '' });
              setSuggestResult(null);
              setIsSuggestModalOpen(true);
            }}
            className="btn btn-secondary"
          >
            <Zap size={16} color="var(--warning)" /> Auto-Suggest Slot
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 14px',
                border: 'none',
                background: viewMode === 'table' ? 'var(--accent-blue)' : '#ffffff',
                color: viewMode === 'table' ? '#ffffff' : 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600
              }}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '6px 14px',
                border: 'none',
                background: viewMode === 'grid' ? 'var(--accent-blue)' : '#ffffff',
                color: viewMode === 'grid' ? '#ffffff' : 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600
              }}
            >
              Timetable Matrix
            </button>
          </div>

          <button
            onClick={handlePublishTimetable}
            disabled={publishLoading || selectedExam?.status === 'published'}
            className="btn btn-navy"
            title={selectedExam?.status === 'published' ? 'Already published' : 'Verify and publish timetable'}
          >
            <Send size={15} /> {publishLoading ? 'Verifying...' : selectedExam?.status === 'published' ? 'Published' : 'Publish Timetable'}
          </button>
        </div>
      </div>

      {/* Conflict Warning Banner if any conflicts exist */}
      {conflictSlots > 0 && (
        <div style={{
          backgroundColor: '#fff1f2',
          border: '1px solid #fecdd3',
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <XCircle size={22} color="var(--danger)" style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ color: '#991b1b', fontSize: 14 }}>
              Attention: {conflictSlots} schedule slot{conflictSlots > 1 ? 's have' : ' has'} conflicts detected!
            </strong>
            <p style={{ margin: 0, fontSize: 13, color: '#b91c1c' }}>
              Publishing is strictly blocked until all student overlaps, room capacity violations, or faculty double-bookings are resolved.
            </p>
          </div>
        </div>
      )}

      {/* Timetable Presentation (Table View) */}
      {viewMode === 'table' ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date & Time</th>
                <th>Subject</th>
                <th>Student Group</th>
                <th>Exam Room</th>
                <th>Invigilator</th>
                <th>Validation Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
                    Loading timetable schedules...
                  </td>
                </tr>
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
                    No examinations scheduled yet for this session. Click <strong>"+ Schedule Exam Slot"</strong> or <strong>"Auto-Suggest Slot"</strong> to start.
                  </td>
                </tr>
              ) : (
                schedules.map((item) => (
                  <tr key={item._id} style={{ backgroundColor: item.hasConflicts ? '#fff8f8' : 'inherit' }}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>
                        {new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Clock size={12} /> {item.startTime} – {item.endTime} ({item.durationMinutes}m)
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>
                        {item.subject?.code}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                        {item.subject?.name}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>
                        {item.studentGroup?.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {item.studentGroup?.department}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {item.room?.roomNumber}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        Cap: {item.room?.examCapacity} seats ({item.room?.building})
                      </div>
                    </td>
                    <td>
                      {item.invigilator ? (
                        <div>
                          <div style={{ fontWeight: 500 }}>{item.invigilator.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.invigilator.facultyId}</div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td>
                      {item.hasConflicts ? (
                        <div>
                          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                            <AlertTriangle size={12} /> {item.conflicts?.length} Conflict{item.conflicts?.length > 1 ? 's' : ''}
                          </span>
                          <div style={{ fontSize: 11, color: '#991b1b', maxWidth: 220, lineHeight: 1.3 }}>
                            {item.conflicts[0]?.message}
                          </div>
                        </div>
                      ) : (
                        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={12} /> Conflict-Free
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: 6 }}
                        title="Edit Slot"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id, item.subject?.code)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--danger)' }}
                        title="Delete Slot"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Timetable Matrix Grid View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {schedules.map((item) => (
            <div key={item._id} className="card" style={{
              borderLeft: item.hasConflicts ? '4px solid var(--danger)' : '4px solid var(--accent-blue)',
              padding: 18
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span className="badge badge-info" style={{ fontWeight: 600 }}>
                  {item.subject?.code}
                </span>
                {item.hasConflicts ? (
                  <span className="badge badge-danger">Conflict</span>
                ) : (
                  <span className="badge badge-success">Valid</span>
                )}
              </div>

              <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
                {item.subject?.name}
              </h4>

              <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Calendar size={14} /> {new Date(item.date).toLocaleDateString()}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Clock size={14} /> {item.startTime} – {item.endTime}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <MapPin size={14} /> Room {item.room?.roomNumber} (Cap: {item.room?.examCapacity})
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={14} /> {item.studentGroup?.name}
              </div>

              {item.hasConflicts && (
                <div style={{ marginTop: 12, padding: 8, background: '#fee2e2', color: '#991b1b', borderRadius: 6, fontSize: 12 }}>
                  ⚠️ {item.conflicts[0]?.message}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                <button onClick={() => handleOpenEdit(item)} className="btn btn-secondary btn-sm">
                  <Edit2 size={13} /> Edit
                </button>
                <button onClick={() => handleDelete(item._id, item.subject?.code)} className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Add / Edit Modal with Real-Time Conflict Detection Preview */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSchedule ? 'Edit Examination Schedule' : 'Schedule New Examination Slot'}
        maxWidth={620}
      >
        <form onSubmit={handleSaveSchedule}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Subject *</label>
              <select
                className="form-select"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              >
                {subjects.map(s => (
                  <option key={s._id} value={s._id}>{s.code} - {s.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Student Group *</label>
              <select
                className="form-select"
                value={formData.studentGroup}
                onChange={(e) => setFormData({ ...formData, studentGroup: e.target.value })}
                required
              >
                {groups.map(g => (
                  <option key={g._id} value={g._id}>{g.name} (Cap: {g.capacity})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Examination Room *</label>
              <select
                className="form-select"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                required
              >
                {rooms.map(r => (
                  <option key={r._id} value={r._id}>
                    {r.roomNumber} - {r.building} (Exam Cap: {r.examCapacity})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Faculty Invigilator (Optional)</label>
              <select
                className="form-select"
                value={formData.invigilator}
                onChange={(e) => setFormData({ ...formData, invigilator: e.target.value })}
              >
                <option value="">-- Assign Later / None --</option>
                {faculty.map(f => (
                  <option key={f._id} value={f._id}>{f.name} ({f.facultyId})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Exam Date *</label>
              <input
                type="date"
                className="form-input"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Start Time *</label>
              <input
                type="time"
                className="form-input"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Time *</label>
              <input
                type="time"
                className="form-input"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Real-time Conflict Engine Feedback Box */}
          <div style={{ marginTop: 12, marginBottom: 18 }}>
            {liveConflictCheck.loading ? (
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                Checking potential scheduling conflicts...
              </div>
            ) : liveConflictCheck.result ? (
              liveConflictCheck.result.hasConflicts ? (
                <div style={{
                  padding: '14px 16px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecdd3',
                  borderRadius: 'var(--radius-md)',
                  color: '#991b1b'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14 }}>
                    <XCircle size={18} />
                    Conflict Engine Alert: {liveConflictCheck.result.conflicts.length} Violation(s) Found
                  </div>
                  <ul style={{ margin: '8px 0 0 20px', fontSize: 13 }}>
                    {liveConflictCheck.result.conflicts.map((c, idx) => (
                      <li key={idx} style={{ marginBottom: 4 }}>
                        <strong>[{c.type}]</strong> {c.message}
                      </li>
                    ))}
                  </ul>

                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #fecdd3' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#991b1b', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={allowConflictOverride}
                        onChange={(e) => setAllowConflictOverride(e.target.checked)}
                      />
                      Save as draft with unresolved conflict (Note: Timetable cannot be published until fixed)
                    </label>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 'var(--radius-md)',
                  color: '#166534',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 600
                }}>
                  <CheckCircle2 size={18} /> All Clear: No conflicts detected. Room capacity and student intervals are valid.
                </div>
              )
            ) : null}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saveLoading || (liveConflictCheck.result?.hasConflicts && !allowConflictOverride)}
            >
              {saveLoading ? 'Validating & Saving...' : editingSchedule ? 'Update Schedule' : 'Confirm & Schedule Slot'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Auto-Suggest Modal */}
      <Modal
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
        title="⚡ Automatic Timetable Slot Suggestion Engine"
        maxWidth={540}
      >
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
            ExamFlow will scan university room availability, student cohorts, and session windows to find the optimal conflict-free examination slot.
          </p>

          <div className="form-group">
            <label className="form-label">Select Subject</label>
            <select
              className="form-select"
              value={suggestData.subject}
              onChange={(e) => setSuggestData({ ...suggestData, subject: e.target.value })}
            >
              {subjects.map(s => (
                <option key={s._id} value={s._id}>{s.code} - {s.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Select Student Group</label>
            <select
              className="form-select"
              value={suggestData.studentGroup}
              onChange={(e) => setSuggestData({ ...suggestData, studentGroup: e.target.value })}
            >
              {groups.map(g => (
                <option key={g._id} value={g._id}>{g.name} (Cap: {g.capacity})</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRunAutoSuggest}
            disabled={suggestLoading}
            className="btn btn-navy"
            style={{ width: '100%', padding: 10, marginTop: 8 }}
          >
            <Zap size={16} /> {suggestLoading ? 'Searching Conflict-Free Slots...' : 'Find Free Exam Slot'}
          </button>

          {suggestResult && (
            <div style={{ marginTop: 20 }}>
              {suggestResult.success ? (
                <div style={{ padding: 16, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <CheckCircle2 size={18} /> Recommended Valid Slot Found!
                  </div>
                  <div style={{ fontSize: 13, color: '#15803d', lineHeight: 1.6 }}>
                    <div><strong>Date:</strong> {new Date(suggestResult.suggestion.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
                    <div><strong>Slot:</strong> {suggestResult.suggestion.slotLabel}</div>
                    <div><strong>Assigned Hall:</strong> Room {suggestResult.suggestion.room.roomNumber} ({suggestResult.suggestion.room.building})</div>
                    <div><strong>Capacity Check:</strong> {suggestResult.suggestion.room.examCapacity} seats available for {suggestResult.suggestion.neededCapacity} students</div>
                  </div>

                  <button
                    onClick={handleApplySuggestion}
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: 14 }}
                  >
                    Accept & Book This Slot
                  </button>
                </div>
              ) : (
                <div style={{ padding: 14, backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: 'var(--radius-md)', fontSize: 13 }}>
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <XCircle size={16} /> No Available Slots Found
                  </div>
                  <p style={{ margin: '6px 0 0 0' }}>{suggestResult.message}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
