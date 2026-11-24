import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  BookOpen,
  Layers,
  MapPin,
  Calendar,
  Clock,
  UserCheck,
  Grid,
  BarChart2,
  FileText,
  LogOut,
  Sparkles
} from 'lucide-react';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const role = user?.role || 'admin';

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { to: '/students', label: 'Students', icon: <Users size={18} /> },
    { to: '/faculty', label: 'Faculty', icon: <Briefcase size={18} /> },
    { to: '/subjects', label: 'Subjects', icon: <BookOpen size={18} /> },
    { to: '/groups', label: 'Student Groups', icon: <Layers size={18} /> },
    { to: '/rooms', label: 'Exam Rooms', icon: <MapPin size={18} /> },
    { to: '/examinations', label: 'Examinations', icon: <Calendar size={18} /> },
    { to: '/schedules', label: 'Timetable Scheduling', icon: <Clock size={18} /> },
    { to: '/invigilation', label: 'Invigilation', icon: <UserCheck size={18} /> },
    { to: '/seating', label: 'Seating Allocation', icon: <Grid size={18} /> },
    { to: '/reports', label: 'Reports & Analytics', icon: <BarChart2 size={18} /> },
    { to: '/audit', label: 'Audit History', icon: <FileText size={18} /> },
  ];

  const facultyLinks = [
    { to: '/faculty-dashboard', label: 'Faculty Portal', icon: <LayoutDashboard size={18} /> },
    { to: '/faculty/duties', label: 'My Invigilations', icon: <UserCheck size={18} /> },
    { to: '/faculty/schedules', label: 'Exam Timetable', icon: <Calendar size={18} /> },
  ];

  const studentLinks = [
    { to: '/student-dashboard', label: 'Student Portal', icon: <LayoutDashboard size={18} /> },
    { to: '/student/timetable', label: 'My Timetable', icon: <Calendar size={18} /> },
    { to: '/student/seating', label: 'My Seating Plan', icon: <Grid size={18} /> },
  ];

  const links = role === 'admin' ? adminLinks : role === 'faculty' ? facultyLinks : studentLinks;

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      backgroundColor: 'var(--primary-navy)',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      flexShrink: 0
    }}>
      {/* Brand logo */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #2563eb, #38bdf8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff'
        }}>
          <Sparkles size={20} />
        </div>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: '#ffffff' }}>
            ExamFlow
          </h1>
          <p style={{ fontSize: '11px', color: '#94a3b8' }}>Academic Exam Manager</p>
        </div>
      </div>

      {/* Navigation menu */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#64748b',
          marginBottom: '10px',
          paddingLeft: '12px'
        }}>
          Navigation
        </div>
        <ul style={{ listStyle: 'none' }}>
          {links.map((item) => (
            <li key={item.to} style={{ marginBottom: 4 }}>
              <NavLink
                to={item.to}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 6,
                  color: isActive ? '#ffffff' : '#cbd5e1',
                  backgroundColor: isActive ? 'var(--accent-blue)' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '13.5px',
                  textDecoration: 'none',
                  transition: 'background-color 0.15s ease'
                })}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User footer */}
      {user && (
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {user.name}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'capitalize' }}>
              {user.role} Account
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 4
            }}
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      )}
    </aside>
  );
};
