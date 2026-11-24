const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

// Route imports
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');
const studentRoutes = require('./routes/studentRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const roomRoutes = require('./routes/roomRoutes');
const examinationRoutes = require('./routes/examinationRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const invigilatorRoutes = require('./routes/invigilatorRoutes');
const seatingRoutes = require('./routes/seatingRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/examinations', examinationRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/invigilators', invigilatorRoutes);
app.use('/api/seating', seatingRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to ExamFlow API - Smart Examination Scheduling and Invigilation Management System',
    healthCheck: '/api/health',
    endpoints: {
      auth: '/api/auth',
      groups: '/api/groups',
      students: '/api/students',
      faculty: '/api/faculty',
      subjects: '/api/subjects',
      rooms: '/api/rooms',
      examinations: '/api/examinations'
    }
  });
});

// Error handling middlewares
app.use(notFound);
app.use(errorHandler);

module.exports = app;
