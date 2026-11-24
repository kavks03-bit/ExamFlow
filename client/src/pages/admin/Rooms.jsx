import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Modal } from '../../components/common/Modal';
import { Plus, Search, Edit2, Trash2, CheckCircle, AlertCircle, RefreshCw, MapPin } from 'lucide-react';

export const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    roomNumber: '',
    building: 'Academic Block A',
    floor: 1,
    benchCount: 40,
    totalCapacity: 80,
    examCapacity: 40,
    hasProjector: false,
    isAvailable: true,
    notes: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      let query = `?search=${search}`;
      if (filterBuilding) query += `&building=${filterBuilding}`;
      const res = await api.get(`/rooms${query}`);
      setRooms(res.data.data || []);
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to fetch rooms' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [filterBuilding]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRooms();
  };

  const handleOpenAdd = () => {
    setEditingRoom(null);
    setFormData({
      roomNumber: '',
      building: 'Academic Block A',
      floor: 1,
      benchCount: 40,
      totalCapacity: 80,
      examCapacity: 40,
      hasProjector: false,
      isAvailable: true,
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      roomNumber: room.roomNumber,
      building: room.building,
      floor: room.floor,
      benchCount: room.benchCount,
      totalCapacity: room.totalCapacity,
      examCapacity: room.examCapacity,
      hasProjector: room.hasProjector,
      isAvailable: room.isAvailable,
      notes: room.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id, roomNumber) => {
    if (!window.confirm(`Are you sure you want to delete room "${roomNumber}"?`)) return;
    try {
      await api.delete(`/rooms/${id}`);
      setAlert({ type: 'success', message: 'Room deleted successfully.' });
      fetchRooms();
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to delete room.' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      if (editingRoom) {
        await api.put(`/rooms/${editingRoom._id}`, formData);
        setAlert({ type: 'success', message: 'Room updated successfully!' });
      } else {
        await api.post('/rooms', formData);
        setAlert({ type: 'success', message: 'New examination room added successfully!' });
      }
      setIsModalOpen(false);
      fetchRooms();
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Error saving room details.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary-navy)' }}>
            Examination Room Management
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Configure lecture halls, auditoriums, bench layouts, and maximum exam seating capacity.
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={16} /> Add Exam Room
        </button>
      </div>

      {/* Alert Notifications */}
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
            {alert.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{alert.message}</span>
          </div>
          <button onClick={() => setAlert(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>×</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 38 }}
              placeholder="Search by Room Number or Building..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ width: 220 }}>
            <select
              className="form-select"
              value={filterBuilding}
              onChange={(e) => setFilterBuilding(e.target.value)}
            >
              <option value="">All Buildings</option>
              <option value="Academic Block A">Academic Block A</option>
              <option value="Academic Block B">Academic Block B</option>
              <option value="Central Auditorium Block">Auditorium Block</option>
              <option value="Science Block">Science Block</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary">
            <Search size={16} /> Filter
          </button>
          <button type="button" onClick={() => { setSearch(''); setFilterBuilding(''); fetchRooms(); }} className="btn btn-secondary">
            <RefreshCw size={16} /> Reset
          </button>
        </form>
      </div>

      {/* Data Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Room Code</th>
              <th>Building</th>
              <th>Floor</th>
              <th>Benches</th>
              <th>Lecture Capacity</th>
              <th>Exam Seating Capacity</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
                  Loading examination rooms...
                </td>
              </tr>
            ) : rooms.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
                  No rooms found.
                </td>
              </tr>
            ) : (
              rooms.map((room) => (
                <tr key={room._id}>
                  <td style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{room.roomNumber}</td>
                  <td>{room.building}</td>
                  <td>Floor {room.floor}</td>
                  <td>{room.benchCount} Benches</td>
                  <td>{room.totalCapacity} Seats</td>
                  <td>
                    <span className="badge badge-info" style={{ fontWeight: 600 }}>
                      {room.examCapacity} Candidates
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${room.isAvailable ? 'badge-success' : 'badge-danger'}`}>
                      {room.isAvailable ? 'Available' : 'Maintenance'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => handleOpenEdit(room)}
                      className="btn btn-secondary btn-sm"
                      style={{ marginRight: 6 }}
                      title="Edit Room"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(room._id, room.roomNumber)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--danger)' }}
                      title="Delete Room"
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

      {/* Add / Edit Room Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? `Edit Room: ${editingRoom.roomNumber}` : 'Add New Examination Room'}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Room Number / Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. LH-103"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Building / Block *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Academic Block A"
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Floor</label>
              <input
                type="number"
                min="0"
                max="10"
                className="form-input"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: Number(e.target.value) })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Bench Count *</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={formData.benchCount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setFormData({
                    ...formData,
                    benchCount: val,
                    examCapacity: val // default 1 student per bench
                  });
                }}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Exam Capacity *</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={formData.examCapacity}
                onChange={(e) => setFormData({ ...formData, examCapacity: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Total Normal Capacity</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={formData.totalCapacity}
                onChange={(e) => setFormData({ ...formData, totalCapacity: Number(e.target.value) })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Availability</label>
              <select
                className="form-select"
                value={formData.isAvailable ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.value === 'true' })}
              >
                <option value="true">Available for Exams</option>
                <option value="false">Unavailable / Maintenance</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Facilities / Notes</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="e.g. CCTV enabled, Air conditioned..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
              {submitLoading ? 'Saving...' : editingRoom ? 'Update Room' : 'Create Room'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
