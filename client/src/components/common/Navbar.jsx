import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon, Shield, GraduationCap, School } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="badge badge-danger"><Shield size={12} style={{ marginRight: 4 }} /> Admin</span>;
      case 'faculty':
        return <span className="badge badge-info"><School size={12} style={{ marginRight: 4 }} /> Faculty</span>;
      case 'student':
        return <span className="badge badge-success"><GraduationCap size={12} style={{ marginRight: 4 }} /> Student</span>;
      default:
        return null;
    }
  };

  return (
    <header style={{
      height: 'var(--header-height)',
      backgroundColor: '#ffffff',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--primary-navy)' }}>
          Academic Examination System
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {user ? (
          <>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user.name}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
                {getRoleBadge(user.role)}
              </div>
            </div>
            <button
              onClick={logout}
              className="btn btn-secondary btn-sm"
              title="Sign Out"
            >
              <LogOut size={16} /> Logout
            </button>
          </>
        ) : (
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            System Ready
          </div>
        )}
      </div>
    </header>
  );
};
