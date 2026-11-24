import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Modal } from '../../components/common/Modal';
import {
  Grid,
  Zap,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Users,
  MapPin,
  Calendar,
  Clock,
  Printer,
  Search,
  RefreshCw
} from 'lucide-react';

export const Seating = () => {
  const [examinations, setExaminations] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [rooms, setRooms] = useState([]);

  // Seating plan data
  const [allocations, setAllocations] = useState([]);
  const [allocationSummary, setAllocationSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRoom, setFilterRoom] = useState('');

  // Generation Modal
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);
  const [generateLoading, setGenerateLoading] = useState(false);

  // View state
  const [viewType, setViewType] = useState('table'); // 'table' or 'grid'

  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [examsRes, roomsRes] = await Promise.all([
          api.get('/examinations'),
          api.get('/rooms')
        ]);
        const exams = examsRes.data.data || [];
        setExaminations(exams);
        setRooms(roomsRes.data.data || []);
        if (exams.length > 0) setSelectedExamId(exams[0]._id);
      } catch (err) {
        setAlert({ type: 'danger', message: 'Failed to load initial data' });
      }
    };
    fetchInit();
  }, []);

  // Fetch Schedules for Exam
  useEffect(() => {
    if (!selectedExamId) return;
    const fetchScheds = async () => {
      try {
        const res = await api.get(`/schedules?examination=${selectedExamId}`);
        const data = res.data.data || [];
        setSchedules(data);
        if (data.length > 0) {
          setSelectedScheduleId(data[0]._id);
        } else {
          setSelectedScheduleId('');
          setAllocations([]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchScheds();
  }, [selectedExamId]);

  // Fetch Seating Allocations for Selected Schedule
  const fetchSeating = async () => {
    if (!selectedScheduleId) {
      setAllocations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let query = `?schedule=${selectedScheduleId}`;
      if (filterRoom) query += `&room=${filterRoom}`;
      const res = await api.get(`/seating${query}`);
      setAllocations(res.data.data || []);
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to fetch seating plan' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeating();
  }, [selectedScheduleId, filterRoom]);

  const currentSchedule = schedules.find(s => s._id === selectedScheduleId);

  // Trigger Generation Modal
  const handleOpenGenerate = () => {
    // Default to the room assigned to schedule
    if (currentSchedule?.room?._id) {
      setSelectedRoomIds([currentSchedule.room._id]);
    } else {
      setSelectedRoomIds([]);
    }
    setIsGenerateModalOpen(true);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerateLoading(true);
    try {
      const res = await api.post('/seating/generate', {
        scheduleId: selectedScheduleId,
        specifiedRoomIds: selectedRoomIds.length > 0 ? selectedRoomIds : undefined
      });
      setAlert({ type: 'success', message: res.data.message });
      setAllocationSummary(res.data.data);
      setIsGenerateModalOpen(false);
      fetchSeating();
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Seating generation failed.' });
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleClearSeating = async () => {
    if (!window.confirm('Clear all generated seating allocations for this examination?')) return;
    try {
      await api.delete(`/seating/clear/${selectedScheduleId}`);
      setAlert({ type: 'success', message: 'Seating plan cleared.' });
      setAllocationSummary(null);
      fetchSeating();
    } catch (err) {
      setAlert({ type: 'danger', message: 'Failed to clear seating plan.' });
    }
  };

  const toggleRoomSelection = (roomId) => {
    if (selectedRoomIds.includes(roomId)) {
      setSelectedRoomIds(selectedRoomIds.filter(id => id !== roomId));
    } else {
      setSelectedRoomIds([...selectedRoomIds, roomId]);
    }
  };

  const filteredAllocations = allocations.filter(a => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      a.student?.rollNumber?.toLowerCase().includes(s) ||
      a.student?.name?.toLowerCase().includes(s) ||
      a.seatNumber?.toLowerCase().includes(s) ||
      a.room?.roomNumber?.toLowerCase().includes(s)
    );
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary-navy)' }}>
            Automatic Seating Allocation & Hall Management
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Distribute students across examination halls without exceeding capacity, and generate individual desk numbers.
          </p>
        </div>

        {/* Schedule Selector */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            style={{ width: 220 }}
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
          >
            {examinations.map(e => (
              <option key={e._id} value={e._id}>{e.title}</option>
            ))}
          </select>

          <select
            className="form-select"
            style={{ width: 280, fontWeight: 600 }}
            value={selectedScheduleId}
            onChange={(e) => setSelectedScheduleId(e.target.value)}
          >
            {schedules.length === 0 ? (
              <option value="">No examinations scheduled</option>
            ) : (
              schedules.map(s => (
                <option key={s._id} value={s._id}>
                  {s.subject?.code} - {s.studentGroup?.name} ({new Date(s.date).toLocaleDateString()})
                </option>
              ))
            )}
          </select>

          <button
            onClick={handleOpenGenerate}
            disabled={!selectedScheduleId}
            className="btn btn-primary"
          >
            <Zap size={16} /> Auto-Generate Seating
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

      {/* Schedule Info Ribbon */}
      {currentSchedule && (
        <div className="card" style={{ marginBottom: 20, padding: 18, backgroundColor: '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Subject</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-blue)' }}>{currentSchedule.subject?.code} - {currentSchedule.subject?.name}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Student Group</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{currentSchedule.studentGroup?.name}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Date & Window</div>
                <div style={{ fontSize: 14 }}>{new Date(currentSchedule.date).toLocaleDateString()} | {currentSchedule.startTime} - {currentSchedule.endTime}</div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Seated Students</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--success)' }}>{allocations.length} Candidates</div>
              </div>
            </div>

            {allocations.length > 0 && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setViewType(viewType === 'table' ? 'grid' : 'table')} className="btn btn-secondary btn-sm">
                  {viewType === 'table' ? 'View Desk Map' : 'View Data Table'}
                </button>
                <button onClick={handleClearSeating} className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)' }}>
                  <Trash2 size={14} /> Clear Plan
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card" style={{ marginBottom: 20, padding: 14 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 38 }}
              placeholder="Search by Student Roll No, Name, Seat Number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ width: 200 }}>
            <select
              className="form-select"
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
            >
              <option value="">All Allocated Rooms</option>
              {rooms.map(r => (
                <option key={r._id} value={r._id}>Room {r.roomNumber}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Seating Content */}
      {viewType === 'table' ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Seat Number</th>
                <th>Bench No</th>
                <th>Roll Number</th>
                <th>Student Name</th>
                <th>Exam Room</th>
                <th>Building / Floor</th>
                <th>Attendance</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 32 }}>Loading seating arrangements...</td></tr>
              ) : filteredAllocations.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: 32 }}>
                    No seating generated yet for this exam schedule. Click <strong>"Auto-Generate Seating"</strong> to allocate seats.
                  </td>
                </tr>
              ) : (
                filteredAllocations.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <span className="badge badge-info" style={{ fontWeight: 700, fontSize: 13, letterSpacing: '0.04em' }}>
                        {a.seatNumber}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>Bench #{a.benchNumber}</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary-navy)' }}>{a.student?.rollNumber}</td>
                    <td>{a.student?.name}</td>
                    <td style={{ fontWeight: 600 }}>Room {a.room?.roomNumber}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{a.room?.building} (Fl. {a.room?.floor})</td>
                    <td>
                      <span className="badge badge-success">Allocated</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Visual Desk Map */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14 }}>
          {filteredAllocations.map((a) => (
            <div
              key={a._id}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                boxShadow: 'var(--shadow-sm)',
                textAlign: 'center'
              }}
            >
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--accent-blue)',
                backgroundColor: '#eff6ff',
                borderRadius: 4,
                padding: '4px 8px',
                marginBottom: 8
              }}>
                {a.seatNumber}
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--primary-navy)' }}>
                {a.student?.rollNumber}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {a.student?.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                Bench {a.benchNumber} • Room {a.room?.roomNumber}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Auto-Generate Seating Distribution Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="⚡ Generate Seating Distribution"
        maxWidth={580}
      >
        <form onSubmit={handleGenerate}>
          <div style={{ marginBottom: 16, padding: 14, backgroundColor: '#f1f5f9', borderRadius: 8, fontSize: 13 }}>
            <div><strong>Subject:</strong> {currentSchedule?.subject?.code} - {currentSchedule?.subject?.name}</div>
            <div><strong>Group:</strong> {currentSchedule?.studentGroup?.name}</div>
            <div><strong>Primary Scheduled Room:</strong> Room {currentSchedule?.room?.roomNumber} (Cap: {currentSchedule?.room?.examCapacity} seats)</div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>
              Select Room(s) to Allocate Across:
            </label>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
              If student count exceeds Room 1, the algorithm automatically overflows into subsequent selected rooms up to their exact capacity limits.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, maxHeight: 200, overflowY: 'auto' }}>
              {rooms.map(r => {
                const isSelected = selectedRoomIds.includes(r._id);
                return (
                  <div
                    key={r._id}
                    onClick={() => toggleRoomSelection(r._id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 6,
                      border: isSelected ? '2px solid var(--accent-blue)' : '1px solid var(--border-color)',
                      backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Room {r.roomNumber}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{r.building}</div>
                    </div>
                    <span className="badge badge-info" style={{ fontSize: 11 }}>
                      {r.examCapacity} seats
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button
              type="button"
              onClick={() => setIsGenerateModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={generateLoading}
            >
              {generateLoading ? 'Allocating Desks...' : 'Generate Seating Plan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
