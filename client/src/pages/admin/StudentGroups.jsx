import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Modal } from '../../components/common/Modal';
import { Plus, Search, Edit2, Trash2, CheckCircle, AlertCircle, RefreshCw, Layers } from 'lucide-react';

export const StudentGroups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    department: 'Computer Science',
    semester: 5,
    academicYear: '2026-2027',
    capacity: 60,
    description: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      let query = `?search=${search}`;
      if (filterDept) query += `&department=${filterDept}`;
      const res = await api.get(`/groups${query}`);
      setGroups(res.data.data || []);
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to fetch student groups' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [filterDept]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchGroups();
  };

  const handleOpenAdd = () => {
    setEditingGroup(null);
    setFormData({
      name: '',
      department: 'Computer Science',
      semester: 5,
      academicYear: '2026-2027',
      capacity: 60,
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      department: group.department,
      semester: group.semester,
      academicYear: group.academicYear,
      capacity: group.capacity,
      description: group.description || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete group "${name}"?`)) return;
    try {
      await api.delete(`/groups/${id}`);
      setAlert({ type: 'success', message: 'Student group deleted successfully.' });
      fetchGroups();
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to delete student group.' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      if (editingGroup) {
        await api.put(`/groups/${editingGroup._id}`, formData);
        setAlert({ type: 'success', message: 'Group updated successfully!' });
      } else {
        await api.post('/groups', formData);
        setAlert({ type: 'success', message: 'New group created successfully!' });
      }
      setIsModalOpen(false);
      fetchGroups();
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Error saving group details.' });
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
            Student Groups & Batches
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Organize student cohorts into sections for synchronized exam timetabling and room allocation.
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={16} /> Add Student Group
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
              placeholder="Search by Group Name or Academic Year..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ width: 220 }}>
            <select
              className="form-select"
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
            >
              <option value="">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electronics & Communication">Electronics & Comm.</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Mechanical Engineering">Mechanical Eng.</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary">
            <Search size={16} /> Filter
          </button>
          <button type="button" onClick={() => { setSearch(''); setFilterDept(''); fetchGroups(); }} className="btn btn-secondary">
            <RefreshCw size={16} /> Reset
          </button>
        </form>
      </div>

      {/* Data Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Group Cohort Name</th>
              <th>Department</th>
              <th>Semester</th>
              <th>Academic Year</th>
              <th>Max Capacity</th>
              <th>Enrolled Students</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
                  Loading student groups...
                </td>
              </tr>
            ) : groups.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
                  No student groups found.
                </td>
              </tr>
            ) : (
              groups.map((group) => (
                <tr key={group._id}>
                  <td style={{ fontWeight: 600 }}>{group.name}</td>
                  <td>{group.department}</td>
                  <td>Semester {group.semester}</td>
                  <td>{group.academicYear}</td>
                  <td>{group.capacity} Seats</td>
                  <td>
                    <span className="badge badge-info">
                      {group.enrolledCount || 0} Students
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => handleOpenEdit(group)}
                      className="btn btn-secondary btn-sm"
                      style={{ marginRight: 6 }}
                      title="Edit Group"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(group._id, group.name)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--danger)' }}
                      title="Delete Group"
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

      {/* Add / Edit Group Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGroup ? `Edit Group: ${editingGroup.name}` : 'Add New Student Group'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Cohort / Group Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. B.Tech CSE 2023-27 Sec A"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select
                className="form-select"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Electronics & Communication">Electronics & Communication</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Semester *</label>
              <select
                className="form-select"
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Academic Year *</label>
              <input
                type="text"
                className="form-input"
                placeholder="2026-2027"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Expected Capacity</label>
              <input
                type="number"
                min="10"
                max="250"
                className="form-input"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes / Description</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="e.g. Batch specialization..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              {submitLoading ? 'Saving...' : editingGroup ? 'Update Group' : 'Create Group'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
