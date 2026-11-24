import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Modal } from '../../components/common/Modal';
import { Plus, Search, Edit2, Trash2, CheckCircle, AlertCircle, RefreshCw, BookOpen } from 'lucide-react';

export const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterSemester, setFilterSemester] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    department: 'Computer Science',
    semester: 5,
    credits: 4,
    type: 'theory',
    description: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      let query = `?search=${search}`;
      if (filterDept) query += `&department=${filterDept}`;
      if (filterSemester) query += `&semester=${filterSemester}`;
      const res = await api.get(`/subjects${query}`);
      setSubjects(res.data.data || []);
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to fetch subjects' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [filterDept, filterSemester]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSubjects();
  };

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setFormData({
      code: '',
      name: '',
      department: 'Computer Science',
      semester: 5,
      credits: 4,
      type: 'theory',
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({
      code: subject.code,
      name: subject.name,
      department: subject.department,
      semester: subject.semester,
      credits: subject.credits,
      type: subject.type,
      description: subject.description || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id, code, name) => {
    if (!window.confirm(`Are you sure you want to delete subject "${code} - ${name}"?`)) return;
    try {
      await api.delete(`/subjects/${id}`);
      setAlert({ type: 'success', message: 'Subject deleted successfully.' });
      fetchSubjects();
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to delete subject.' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      if (editingSubject) {
        await api.put(`/subjects/${editingSubject._id}`, formData);
        setAlert({ type: 'success', message: 'Subject updated successfully!' });
      } else {
        await api.post('/subjects', formData);
        setAlert({ type: 'success', message: 'New subject created successfully!' });
      }
      setIsModalOpen(false);
      fetchSubjects();
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Error saving subject details.' });
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
            Subject Management
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Course curriculum, department mapping, exam credits, and subject classifications.
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={16} /> Add Subject
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
              placeholder="Search by Course Code or Subject Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ width: 200 }}>
            <select
              className="form-select"
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
            >
              <option value="">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electronics & Communication">Electronics & Comm.</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Applied Sciences">Applied Sciences</option>
            </select>
          </div>

          <div style={{ width: 140 }}>
            <select
              className="form-select"
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <option key={s} value={s}>Sem {s}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-secondary">
            <Search size={16} /> Filter
          </button>
          <button type="button" onClick={() => { setSearch(''); setFilterDept(''); setFilterSemester(''); fetchSubjects(); }} className="btn btn-secondary">
            <RefreshCw size={16} /> Reset
          </button>
        </form>
      </div>

      {/* Data Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Subject Name</th>
              <th>Department</th>
              <th>Semester</th>
              <th>Credits</th>
              <th>Type</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
                  Loading subjects...
                </td>
              </tr>
            ) : subjects.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
                  No subjects found.
                </td>
              </tr>
            ) : (
              subjects.map((sub) => (
                <tr key={sub._id}>
                  <td style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{sub.code}</td>
                  <td style={{ fontWeight: 500 }}>{sub.name}</td>
                  <td>{sub.department}</td>
                  <td>Semester {sub.semester}</td>
                  <td>{sub.credits} Credits</td>
                  <td>
                    <span className={`badge ${sub.type === 'theory' ? 'badge-info' : 'badge-warning'}`} style={{ textTransform: 'capitalize' }}>
                      {sub.type}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => handleOpenEdit(sub)}
                      className="btn btn-secondary btn-sm"
                      style={{ marginRight: 6 }}
                      title="Edit Subject"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(sub._id, sub.code, sub.name)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--danger)' }}
                      title="Delete Subject"
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

      {/* Add / Edit Subject Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? `Edit Subject: ${editingSubject.code}` : 'Add New Subject'}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Course Code *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. CS501"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Subject Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Subject title"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
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
                <option value="Applied Sciences">Applied Sciences</option>
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
              <label className="form-label">Credit Hours *</label>
              <input
                type="number"
                min="1"
                max="8"
                className="form-input"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Paper Type</label>
              <select
                className="form-select"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="theory">Theory Examination</option>
                <option value="practical">Practical / Lab Exam</option>
                <option value="elective">Departmental Elective</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Syllabus / Notes</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Brief course objectives..."
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
              {submitLoading ? 'Saving...' : editingSubject ? 'Update Subject' : 'Create Subject'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
