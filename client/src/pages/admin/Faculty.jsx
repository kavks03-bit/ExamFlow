import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Modal } from '../../components/common/Modal';
import { Plus, Search, Edit2, Trash2, CheckCircle, AlertCircle, RefreshCw, Briefcase } from 'lucide-react';

export const Faculty = () => {
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [formData, setFormData] = useState({
    facultyId: '',
    name: '',
    email: '',
    department: 'Computer Science',
    designation: 'Assistant Professor',
    phone: '',
    maxInvigilationsPerWeek: 5,
    status: 'active'
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      let query = `?search=${search}`;
      if (filterDept) query += `&department=${filterDept}`;
      const res = await api.get(`/faculty${query}`);
      setFacultyList(res.data.data || []);
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to fetch faculty list' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, [filterDept]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFaculty();
  };

  const handleOpenAdd = () => {
    setEditingFaculty(null);
    setFormData({
      facultyId: '',
      name: '',
      email: '',
      department: 'Computer Science',
      designation: 'Assistant Professor',
      phone: '',
      maxInvigilationsPerWeek: 5,
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (faculty) => {
    setEditingFaculty(faculty);
    setFormData({
      facultyId: faculty.facultyId,
      name: faculty.name,
      email: faculty.email,
      department: faculty.department,
      designation: faculty.designation,
      phone: faculty.phone || '',
      maxInvigilationsPerWeek: faculty.maxInvigilationsPerWeek || 5,
      status: faculty.status
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete faculty member "${name}"?`)) return;
    try {
      await api.delete(`/faculty/${id}`);
      setAlert({ type: 'success', message: 'Faculty member deleted successfully.' });
      fetchFaculty();
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to delete faculty.' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      if (editingFaculty) {
        await api.put(`/faculty/${editingFaculty._id}`, formData);
        setAlert({ type: 'success', message: 'Faculty updated successfully!' });
      } else {
        await api.post('/faculty', formData);
        setAlert({ type: 'success', message: 'New faculty member added successfully!' });
      }
      setIsModalOpen(false);
      fetchFaculty();
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Error saving faculty details.' });
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
            Faculty & Invigilator Management
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Manage professors and academic staff assigned to exam supervision duties.
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={16} /> Add Faculty
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
              placeholder="Search by Faculty ID, Name, or Designation..."
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
          <button type="button" onClick={() => { setSearch(''); setFilterDept(''); fetchFaculty(); }} className="btn btn-secondary">
            <RefreshCw size={16} /> Reset
          </button>
        </form>
      </div>

      {/* Data Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Faculty ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Designation</th>
              <th>Weekly Duty Limit</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
                  Loading faculty records...
                </td>
              </tr>
            ) : facultyList.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
                  No faculty members found.
                </td>
              </tr>
            ) : (
              facultyList.map((f) => (
                <tr key={f._id}>
                  <td style={{ fontWeight: 600 }}>{f.facultyId}</td>
                  <td>{f.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{f.email}</td>
                  <td>{f.department}</td>
                  <td>{f.designation}</td>
                  <td>
                    <span className="badge badge-info">
                      Max {f.maxInvigilationsPerWeek || 5} exams/wk
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${f.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                      {f.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => handleOpenEdit(f)}
                      className="btn btn-secondary btn-sm"
                      style={{ marginRight: 6 }}
                      title="Edit Faculty"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(f._id, f.name)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--danger)' }}
                      title="Delete Faculty"
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

      {/* Add / Edit Faculty Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFaculty ? `Edit Faculty: ${editingFaculty.name}` : 'Add New Faculty Member'}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Faculty ID *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. FAC-105"
                value={formData.facultyId}
                onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Dr. Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Institutional Email *</label>
              <input
                type="email"
                className="form-input"
                placeholder="faculty@examflow.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone</label>
              <input
                type="text"
                className="form-input"
                placeholder="+1 555-0100"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
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
              <label className="form-label">Designation *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Assistant Professor, Professor"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Max Duty Slots Per Week</label>
              <input
                type="number"
                min="1"
                max="15"
                className="form-input"
                value={formData.maxInvigilationsPerWeek}
                onChange={(e) => setFormData({ ...formData, maxInvigilationsPerWeek: Number(e.target.value) })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="on-leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
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
              {submitLoading ? 'Saving...' : editingFaculty ? 'Update Faculty' : 'Create Faculty'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
