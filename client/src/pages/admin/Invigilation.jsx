import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Modal } from '../../components/common/Modal';
import {
  UserCheck,
  Zap,
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  Briefcase
} from 'lucide-react';

export const Invigilation = () => {
  const [examinations, setExaminations] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [workload, setWorkload] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Assign Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [assignFacultyId, setAssignFacultyId] = useState('');
  const [assignRole, setAssignRole] = useState('assistant_invigilator');
  const [assignNotes, setAssignNotes] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [autoAssignLoading, setAutoAssignLoading] = useState(false);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await api.get('/examinations');
        const exams = res.data.data || [];
        setExaminations(exams);
        if (exams.length > 0) {
          setSelectedExamId(exams[0]._id);
        }
      } catch (err) {
        setAlert({ type: 'danger', message: 'Failed to load examinations' });
      }
    };
    fetchExams();
  }, []);

  const fetchData = async () => {
    if (!selectedExamId) return;
    setLoading(true);
    try {
      const [schedRes, workRes, assignRes] = await Promise.all([
        api.get(`/schedules?examination=${selectedExamId}`),
        api.get(`/invigilators/workload?examination=${selectedExamId}`),
        api.get(`/invigilators/assignments?examination=${selectedExamId}`)
      ]);
      setSchedules(schedRes.data.data || []);
      setWorkload(workRes.data.data || []);
      setAssignments(assignRes.data.data || []);
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to fetch invigilation data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedExamId]);

  const handleOpenAssign = (sched) => {
    setSelectedSchedule(sched);
    setAssignFacultyId(workload[0]?._id || '');
    setAssignRole('assistant_invigilator');
    setAssignNotes('');
    setIsModalOpen(true);
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!selectedSchedule || !assignFacultyId) return;
    setSubmitLoading(true);
    try {
      await api.post('/invigilators/assign', {
        examinationId: selectedExamId,
        scheduleId: selectedSchedule._id,
        facultyId: assignFacultyId,
        roomId: selectedSchedule.room?._id || selectedSchedule.room,
        role: assignRole,
        notes: assignNotes
      });
      setAlert({ type: 'success', message: 'Faculty invigilator assigned successfully!' });
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Assignment failed due to clash or quota limit.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    if (!window.confirm('Automatically balance and assign invigilator duties across all unassigned examination slots?')) return;
    setAutoAssignLoading(true);
    try {
      const res = await api.post(`/invigilators/auto-assign/${selectedExamId}`);
      setAlert({ type: 'success', message: res.data.message });
      fetchData();
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Auto-assignment failed' });
    } finally {
      setAutoAssignLoading(false);
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Remove this invigilation assignment?')) return;
    try {
      await api.delete(`/invigilators/${id}`);
      setAlert({ type: 'success', message: 'Invigilator assignment removed.' });
      fetchData();
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to delete assignment.' });
    }
  };

  // Stats
  const totalSlots = schedules.length;
  const assignedSlots = schedules.filter(s => s.invigilator).length;
  const unassignedSlots = totalSlots - assignedSlots;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary-navy)' }}>
            Invigilator Allocation & Workload
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Assign faculty to examination rooms, prevent schedule clashes, and track invigilation duty balance.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select
            className="form-select"
            style={{ width: 280, fontWeight: 600 }}
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
          >
            {examinations.map(e => (
              <option key={e._id} value={e._id}>{e.title}</option>
            ))}
          </select>
          <button
            onClick={handleAutoAssign}
            disabled={autoAssignLoading || unassignedSlots === 0}
            className="btn btn-navy"
          >
            <Zap size={16} /> {autoAssignLoading ? 'Balancing...' : 'Auto-Distribute Duties'}
          </button>
        </div>
      </div>

      {/* Alert */}
      {alert && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: alert.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: alert.type === 'success' ? '#166534' : '#991b1b',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {alert.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{alert.message}</span>
          </div>
          <button onClick={() => setAlert(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>×</button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Exam Slots</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--primary-navy)', marginTop: 4 }}>{totalSlots}</div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Invigilators Assigned</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--success)', marginTop: 4 }}>{assignedSlots}</div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Awaiting Invigilator</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: unassignedSlots > 0 ? 'var(--warning)' : 'var(--text-muted)', marginTop: 4 }}>
            {unassignedSlots}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Active Faculty Pool</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent-blue)', marginTop: 4 }}>{workload.length}</div>
        </div>
      </div>

      {/* Main Content Layout: Left = Exam Slots, Right = Faculty Workload */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
        {/* Left: Schedule Slots & Assigned Invigilators */}
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--primary-navy)', marginBottom: 12 }}>
            Examination Duty Roster
          </h3>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Subject & Hall</th>
                  <th>Assigned Invigilator</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: 24 }}>Loading duties...</td></tr>
                ) : schedules.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: 24 }}>No scheduled slots found.</td></tr>
                ) : (
                  schedules.map((s) => (
                    <tr key={s._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{new Date(s.date).toLocaleDateString()}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{s.startTime} - {s.endTime}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{s.subject?.code}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Room {s.room?.roomNumber}</div>
                      </td>
                      <td>
                        {s.invigilator ? (
                          <div>
                            <div style={{ fontWeight: 600 }}>{s.invigilator.name}</div>
                            <span className="badge badge-success" style={{ fontSize: 11 }}>Confirmed</span>
                          </div>
                        ) : (
                          <span className="badge badge-warning" style={{ fontSize: 11 }}>Not Assigned</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {s.invigilator ? (
                          <button
                            onClick={() => handleOpenAssign(s)}
                            className="btn btn-secondary btn-sm"
                            title="Reassign Invigilator"
                          >
                            Change
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenAssign(s)}
                            className="btn btn-primary btn-sm"
                          >
                            <UserCheck size={13} /> Assign
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Faculty Workload Balancer */}
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--primary-navy)', marginBottom: 12 }}>
            Faculty Workload Balance
          </h3>

          <div className="card" style={{ padding: 18 }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Weekly duty limits prevent faculty burnout and balance supervision hours evenly.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {workload.map((f) => {
                const percent = Math.min(100, Math.round((f.assignedCount / f.maxLimit) * 100));
                const barColor = percent >= 100 ? 'var(--danger)' : percent >= 75 ? 'var(--warning)' : 'var(--accent-blue)';

                return (
                  <div key={f._id} style={{ padding: 10, background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div>
                        <strong style={{ fontSize: 14 }}>{f.name}</strong>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{f.designation} ({f.department})</div>
                      </div>
                      <span className={`badge ${percent >= 100 ? 'badge-danger' : 'badge-info'}`}>
                        {f.assignedCount} / {f.maxLimit} Duties
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ height: 6, width: '100%', backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden', marginTop: 6 }}>
                      <div style={{ width: `${percent}%`, height: '100%', backgroundColor: barColor, transition: 'width 0.3s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Assign Faculty Invigilator"
        maxWidth={500}
      >
        <form onSubmit={handleSaveAssignment}>
          <div style={{ marginBottom: 16, padding: 12, background: '#f1f5f9', borderRadius: 8, fontSize: 13 }}>
            <div><strong>Exam:</strong> {selectedSchedule?.subject?.code} - {selectedSchedule?.subject?.name}</div>
            <div><strong>Date & Time:</strong> {new Date(selectedSchedule?.date || Date.now()).toLocaleDateString()} ({selectedSchedule?.startTime} - {selectedSchedule?.endTime})</div>
            <div><strong>Room:</strong> Room {selectedSchedule?.room?.roomNumber}</div>
          </div>

          <div className="form-group">
            <label className="form-label">Select Faculty Member *</label>
            <select
              className="form-select"
              value={assignFacultyId}
              onChange={(e) => setAssignFacultyId(e.target.value)}
              required
            >
              {workload.map(f => (
                <option key={f._id} value={f._id}>
                  {f.name} ({f.department}) - {f.assignedCount}/{f.maxLimit} Duties
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Duty Role</label>
            <select
              className="form-select"
              value={assignRole}
              onChange={(e) => setAssignRole(e.target.value)}
            >
              <option value="assistant_invigilator">Assistant Invigilator (Room Supervisor)</option>
              <option value="chief_invigilator">Chief Invigilator (Floor Lead)</option>
              <option value="reliever">Reliever / Standby</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Special Instructions</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Collect answer booklets 15 mins prior"
              value={assignNotes}
              onChange={(e) => setAssignNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
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
              disabled={submitLoading}
            >
              {submitLoading ? 'Verifying & Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
