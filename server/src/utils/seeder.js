const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const StudentGroup = require('../models/StudentGroup');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Subject = require('../models/Subject');
const Room = require('../models/Room');
const Examination = require('../models/Examination');

const seedData = async () => {
  try {
    const isConnected = await connectDB();
    if (!isConnected) {
      console.log('⚠️ Seeder aborted: MongoDB not connected.');
      process.exit(1);
    }

    console.log('[ExamFlow Seeder] Clearing existing test records...');
    await User.deleteMany({});
    await StudentGroup.deleteMany({});
    await Student.deleteMany({});
    await Faculty.deleteMany({});
    await Subject.deleteMany({});
    await Room.deleteMany({});
    await Examination.deleteMany({});

    console.log('[ExamFlow Seeder] Seeding Users (Admin, Faculty, Student)...');
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@examflow.edu',
      password: 'Admin@123',
      role: 'admin',
      phone: '+1 555-0100'
    });

    const facultyUser = await User.create({
      name: 'Dr. Robert Chen',
      email: 'faculty@examflow.edu',
      password: 'Faculty@123',
      role: 'faculty',
      phone: '+1 555-0101'
    });

    const studentUser = await User.create({
      name: 'Alex Johnson',
      email: 'student@examflow.edu',
      password: 'Student@123',
      role: 'student',
      phone: '+1 555-0102'
    });

    console.log('[ExamFlow Seeder] Seeding Student Groups...');
    const group1 = await StudentGroup.create({
      name: 'B.Tech CSE 2023-27 Sec A',
      department: 'Computer Science',
      semester: 5,
      academicYear: '2026-2027',
      capacity: 60,
      description: 'Computer Science and Engineering - Batch 2023 Section A'
    });

    const group2 = await StudentGroup.create({
      name: 'B.Tech ECE 2023-27 Sec A',
      department: 'Electronics & Communication',
      semester: 5,
      academicYear: '2026-2027',
      capacity: 50,
      description: 'Electronics and Communication Engineering - Batch 2023'
    });

    const group3 = await StudentGroup.create({
      name: 'B.Tech IT 2024-28 Sec B',
      department: 'Information Technology',
      semester: 3,
      academicYear: '2026-2027',
      capacity: 55,
      description: 'Information Technology - 2nd Year Section B'
    });

    console.log('[ExamFlow Seeder] Seeding Faculty Members...');
    await Faculty.create([
      {
        user: facultyUser._id,
        facultyId: 'FAC-101',
        name: 'Dr. Robert Chen',
        email: 'faculty@examflow.edu',
        department: 'Computer Science',
        designation: 'Professor & HOD',
        phone: '+1 555-0101',
        maxInvigilationsPerWeek: 4,
        status: 'active'
      },
      {
        facultyId: 'FAC-102',
        name: 'Prof. Sarah Miller',
        email: 'sarah.miller@examflow.edu',
        department: 'Computer Science',
        designation: 'Associate Professor',
        phone: '+1 555-0103',
        maxInvigilationsPerWeek: 5,
        status: 'active'
      },
      {
        facultyId: 'FAC-103',
        name: 'Dr. Alan Turing',
        email: 'alan.turing@examflow.edu',
        department: 'Information Technology',
        designation: 'Assistant Professor',
        phone: '+1 555-0104',
        maxInvigilationsPerWeek: 6,
        status: 'active'
      },
      {
        facultyId: 'FAC-104',
        name: 'Dr. Emily Watson',
        email: 'emily.watson@examflow.edu',
        department: 'Electronics & Communication',
        designation: 'Associate Professor',
        phone: '+1 555-0105',
        maxInvigilationsPerWeek: 4,
        status: 'active'
      }
    ]);

    console.log('[ExamFlow Seeder] Seeding Subjects...');
    await Subject.create([
      {
        code: 'CS501',
        name: 'Design and Analysis of Algorithms',
        department: 'Computer Science',
        semester: 5,
        credits: 4,
        type: 'theory',
        description: 'Advanced algorithm design paradigms, dynamic programming, and complexity.'
      },
      {
        code: 'CS502',
        name: 'Database Management Systems',
        department: 'Computer Science',
        semester: 5,
        credits: 4,
        type: 'theory',
        description: 'Relational data models, SQL, transactions, concurrency, and normalization.'
      },
      {
        code: 'EC501',
        name: 'Digital Signal Processing',
        department: 'Electronics & Communication',
        semester: 5,
        credits: 4,
        type: 'theory',
        description: 'Discrete-time signals, Z-transform, FFT, and FIR/IIR filter designs.'
      },
      {
        code: 'IT301',
        name: 'Object Oriented Programming with Java',
        department: 'Information Technology',
        semester: 3,
        credits: 3,
        type: 'theory',
        description: 'Core OOP concepts, multithreading, collections, and GUI frameworks.'
      },
      {
        code: 'MA501',
        name: 'Probability and Statistics',
        department: 'Applied Sciences',
        semester: 5,
        credits: 3,
        type: 'theory',
        description: 'Random variables, distributions, hypothesis testing, and regressions.'
      }
    ]);

    console.log('[ExamFlow Seeder] Seeding Examination Rooms...');
    await Room.create([
      {
        roomNumber: 'LH-101',
        building: 'Academic Block A',
        floor: 1,
        benchCount: 40,
        totalCapacity: 80,
        examCapacity: 40,
        hasProjector: true,
        isAvailable: true,
        notes: 'Main lecture hall, air-conditioned, high ceiling.'
      },
      {
        roomNumber: 'LH-102',
        building: 'Academic Block A',
        floor: 1,
        benchCount: 35,
        totalCapacity: 70,
        examCapacity: 35,
        hasProjector: true,
        isAvailable: true,
        notes: 'Standard lecture hall.'
      },
      {
        roomNumber: 'LH-201',
        building: 'Academic Block B',
        floor: 2,
        benchCount: 50,
        totalCapacity: 100,
        examCapacity: 50,
        hasProjector: true,
        isAvailable: true,
        notes: 'Large examination hall with CCTV surveillance.'
      },
      {
        roomNumber: 'AUD-A',
        building: 'Central Auditorium Block',
        floor: 1,
        benchCount: 80,
        totalCapacity: 200,
        examCapacity: 80,
        hasProjector: true,
        isAvailable: true,
        notes: 'Grand auditorium suited for combined batch examinations.'
      }
    ]);

    console.log('[ExamFlow Seeder] Seeding Students...');
    await Student.create([
      {
        user: studentUser._id,
        rollNumber: '23CS101',
        name: 'Alex Johnson',
        email: 'student@examflow.edu',
        department: 'Computer Science',
        semester: 5,
        academicYear: '2026-2027',
        studentGroup: group1._id,
        status: 'active'
      },
      {
        rollNumber: '23CS102',
        name: 'Sophia Patel',
        email: 'sophia.patel@examflow.edu',
        department: 'Computer Science',
        semester: 5,
        academicYear: '2026-2027',
        studentGroup: group1._id,
        status: 'active'
      },
      {
        rollNumber: '23CS103',
        name: 'Marcus Williams',
        email: 'marcus.williams@examflow.edu',
        department: 'Computer Science',
        semester: 5,
        academicYear: '2026-2027',
        studentGroup: group1._id,
        status: 'active'
      },
      {
        rollNumber: '23EC201',
        name: 'Priya Sharma',
        email: 'priya.sharma@examflow.edu',
        department: 'Electronics & Communication',
        semester: 5,
        academicYear: '2026-2027',
        studentGroup: group2._id,
        status: 'active'
      },
      {
        rollNumber: '23EC202',
        name: 'Ethan Hunt',
        email: 'ethan.hunt@examflow.edu',
        department: 'Electronics & Communication',
        semester: 5,
        academicYear: '2026-2027',
        studentGroup: group2._id,
        status: 'active'
      },
      {
        rollNumber: '24IT301',
        name: 'Chloe Davis',
        email: 'chloe.davis@examflow.edu',
        department: 'Information Technology',
        semester: 3,
        academicYear: '2026-2027',
        studentGroup: group3._id,
        status: 'active'
      }
    ]);

    console.log('[ExamFlow Seeder] Seeding Examination...');
    await Examination.create({
      title: 'Odd Semester End-Term Examinations 2026',
      examSeries: 'End-Term',
      session: '2026-2027',
      semester: 'Odd',
      startDate: new Date('2026-12-05T09:00:00Z'),
      endDate: new Date('2026-12-20T17:00:00Z'),
      status: 'scheduled',
      description: 'Regular semester-end university theory examinations.'
    });

    console.log('\n======================================================');
    console.log('✅ ExamFlow Seed Data Inserted Successfully!');
    console.log('======================================================');
    console.log('Credentials Summary:');
    console.log('  Admin   : admin@examflow.edu   | Password: Admin@123');
    console.log('  Faculty : faculty@examflow.edu | Password: Faculty@123');
    console.log('  Student : student@examflow.edu | Password: Student@123');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder Failed:', error.message);
    process.exit(1);
  }
};

seedData();
