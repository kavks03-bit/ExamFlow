import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Modal } from '../../components/common/Modal';
import { Plus, Search, Edit2, Trash2, CheckCircle, AlertCircle, RefreshCw, Calendar, Clock } from 'lucide-react';

export const Examinations = () => {
  const [examinations, setExaminations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    examSeries: 'End-Term',
    session: '2026-2027',
    semester: 'Odd',
    startDate: '',
    endDate: '',
    status: 'draft',
    description: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const fetchExaminations = async () => {
    setLoading(true);
    try {
      let query = `?search=${search}`;
      if (filterStatus) query += `&status=${filterStatus}`;
      const res = await api.get(`/examinations${query}`);
      setExaminations(res.data.data || []);
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to fetch examinations' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExaminations();
  }, [filterStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchExaminations();
  };

  const handleOpenAdd = () => {
    setEditingExam(null);
    setFormData({
      title: '',
      examSeries: 'End-Term',
      session: '2026-2027',
      semester: 'Odd',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: 'draft',
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exam) => {
    setEditingExam(exam);
    setFormData({
      title: exam.title,
      examSeries: exam.examSeries,
      session: exam.session,
      semester: exam.semester,
      startDate: exam.startDate ? new Date(exam.startDate).toISOString().split('T')[0] : '',
      endDate: exam.endDate ? new Date(exam.endDate).toISOString().split('T')[0] : '',
      status: exam.status,
      description: exam.description || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete examination "${title}"?`)) return;
    try {
      await api.delete(`/examinations/${id}`);
      setAlert({ type: 'success', message: 'Examination deleted successfully.' });
      fetchExaminations();
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Failed to delete examination.' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      if (editingExam) {
        await api.put(`/examinations/${editingExam._id}`, formData);
        setAlert({ type: 'success', message: 'Examination updated successfully!' });
      } else {
        await api.post('/examinations', formData);
        setAlert({ type: 'success', message: 'New examination series created successfully!' });
      }
      setIsModalOpen(false);
      fetchExaminations();
    } catch (err) {
      setAlert({ type: 'danger', message: err.response?.data?.message || 'Error saving examination details.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <span className="badge badge-success">Published</span>;
      case 'scheduled':
        return <span className="badge badge-info">Scheduled</span>;
      case 'completed':
        return <span className="badge badge-secondary">Completed</span>;
      default:
        return <span className="badge badge-warning">Draft</span>;
    }
  };

  return (
    <div>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary-navy)' }}>
            Examination Management
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Schedule semester exam sessions, configure examination windows, and publish university timetables.
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={16} /> Create Examination
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
              placeholder="Search by Examination Title or Academic Session..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ width: 180 }}>
            <select
              className="form-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary">
            <Search size={16} /> Filter
          </button>
          <button type="button" onClick={() => { setSearch(''); setFilterStatus(''); fetchExaminations(); }} className="btn btn-secondary">
            <RefreshCw size={16} /> Reset
          </button>
        </form>
      </div>

      {/* Data Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Examination Series</th>
              <th>Exam Type</th>
              <th>Session</th>
              <th>Term</th>
              <th>Exam Window</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
                  Loading examinations...
                </td>
              </tr>
            ) : examinations.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
                  No examinations found.
                </td>
              </tr>
            ) : (
              examinations.map((exam) => (
                <tr key={exam._id}>
                  <td style={{ fontWeight: 600 }}>{exam.title}</td>
                  <td>{exam.examSeries}</td>
                  <td>{exam.session}</td>
                  <td>{exam.semester} Semester</td>
                  <td>
                    <div style={{ fontSize: 13 }}>
                      {new Date(exam.startDate).toLocaleDateString()} – {new Date(exam.endDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td>{getStatusBadge(exam.status)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => handleOpenEdit(exam)}
                      className="btn btn-secondary btn-sm"
                      style={{ marginRight: 6 }}
                      title="Edit Examination"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(exam._id, exam.title)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--danger)' }}
                      title="Delete Examination"
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

      {/* Add / Edit Examination Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExam ? `Edit Examination: ${editingExam.title}` : 'Create Examination Series'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Examination Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Odd Semester End-Term Examinations Nov-Dec 2026"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Series *</label>
              <select
                className="form-select"
                value={formData.examSeries}
                onChange={(e) => setFormData({ ...formData, examSeries: e.target.value })}
              >
                <option value="End-Term">End-Term</option>
                <option value="Mid-Term">Mid-Term</option>
                <option value="Supplementary">Supplementary</option>
                <option value="Unit-Test">Unit-Test</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Academic Session *</label>
              <input
                type="text"
                className="form-input"
                placeholder="2026-2027"
                value={formData.session}
                onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Semester Term</label>
              <select
                className="form-select"
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              >
                <option value="Odd">Odd Semester</option>
                <option value="Even">Even Semester</option>
                <option value="All">All Semesters</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input
                type="date"
                className="form-input"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input
                type="date"
                className="form-input"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="draft">Draft (Planning)</option>
              <option value="scheduled">Scheduled (Timetable Prepared)</option>
              <option value="published">Published (Visible to Faculty & Students)</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Instructions / Notes</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="e.g. Students must report 15 minutes before scheduled start time..."
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
              {submitLoading ? 'Saving...' : editingExam ? 'Update Examination' : 'Create Examination'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
