import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/common/Layout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Pages
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { Students } from './pages/admin/Students';
import { Faculty } from './pages/admin/Faculty';
import { Subjects } from './pages/admin/Subjects';
import { StudentGroups } from './pages/admin/StudentGroups';
import { Rooms } from './pages/admin/Rooms';
import { Examinations } from './pages/admin/Examinations';
import { Scheduling } from './pages/admin/Scheduling';
import { Invigilation } from './pages/admin/Invigilation';
import { Seating } from './pages/admin/Seating';
import { AuditHistory } from './pages/admin/AuditHistory';
import { Reports } from './pages/admin/Reports';

// Role Dashboards
import { FacultyDashboard } from './pages/faculty/FacultyDashboard';
import { StudentDashboard } from './pages/student/StudentDashboard';

// Smart Home Router component
const SmartHomeRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'student') return <StudentDashboard />;
  if (user?.role === 'faculty') return <FacultyDashboard />;
  return <AdminDashboard />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes (Requiring Authentication) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<SmartHomeRedirect />} />

              {/* Admin Routes */}
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="students" element={<Students />} />
              <Route path="faculty" element={<Faculty />} />
              <Route path="subjects" element={<Subjects />} />
              <Route path="groups" element={<StudentGroups />} />
              <Route path="rooms" element={<Rooms />} />
              <Route path="examinations" element={<Examinations />} />
              <Route path="schedules" element={<Scheduling />} />
              <Route path="invigilation" element={<Invigilation />} />
              <Route path="seating" element={<Seating />} />
              <Route path="audit" element={<AuditHistory />} />
              <Route path="reports" element={<Reports />} />

              {/* Faculty Routes */}
              <Route path="faculty-dashboard" element={<FacultyDashboard />} />
              <Route path="faculty/duties" element={<FacultyDashboard />} />
              <Route path="faculty/schedules" element={<FacultyDashboard />} />

              {/* Student Routes */}
              <Route path="student-dashboard" element={<StudentDashboard />} />
              <Route path="student/timetable" element={<StudentDashboard />} />
              <Route path="student/seating" element={<StudentDashboard />} />

              {/* Fallback */}
              <Route path="*" element={<SmartHomeRedirect />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
