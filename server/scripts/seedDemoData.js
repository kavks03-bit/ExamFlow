// Seed script for ExamFlow demo data
// Run with: node server/scripts/seedDemoData.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');

// Import models
const User = require('../src/models/User');
const Student = require('../src/models/Student');
const Faculty = require('../src/models/Faculty');
const Subject = require('../src/models/Subject');
const StudentGroup = require('../src/models/StudentGroup');
const Room = require('../src/models/Room');
const Examination = require('../src/models/Examination');
const Schedule = require('../src/models/Schedule');
const InvigilatorAssignment = require('../src/models/InvigilatorAssignment');
const SeatingAllocation = require('../src/models/SeatingAllocation');

async function seed() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Clear existing demo data
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      Faculty.deleteMany({}),
      Subject.deleteMany({}),
      StudentGroup.deleteMany({}),
      Room.deleteMany({}),
      Examination.deleteMany({}),
      Schedule.deleteMany({}),
      InvigilatorAssignment.deleteMany({}),
      SeatingAllocation.deleteMany({}),
    ]);
    console.log('🧹 Cleared previous data');

    // 1. Create Student Groups first
    const groupA = new StudentGroup({
      name: 'CSE-Sem1-GroupA',
      department: 'Computer Science',
      semester: 1,
      academicYear: '2026-2027',
      capacity: 60,
      description: 'Computer Science Semester 1 - Group A'
    });
    const groupB = new StudentGroup({
      name: 'CSE-Sem1-GroupB',
      department: 'Computer Science',
      semester: 1,
      academicYear: '2026-2027',
      capacity: 60,
      description: 'Computer Science Semester 1 - Group B'
    });
    await Promise.all([groupA.save(), groupB.save()]);
    console.log('👥 Created Student Groups');

    // 2. Create Core Demo Users
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@examflow.edu',
      password: 'Admin@123',
      role: 'admin'
    });
    const facultyUser = new User({
      name: 'Dr. Ramesh Sharma',
      email: 'faculty@examflow.edu',
      password: 'Faculty@123',
      role: 'faculty'
    });
    const studentUser = new User({
      name: 'Student One',
      email: 'student@examflow.edu',
      password: 'Student@123',
      role: 'student'
    });

    await Promise.all([adminUser.save(), facultyUser.save(), studentUser.save()]);
    console.log('👤 Created demo users (Admin, Faculty, Student)');

    // 3. Create Faculty document
    const faculty = new Faculty({
      user: facultyUser._id,
      facultyId: 'FAC-001',
      name: facultyUser.name,
      email: facultyUser.email,
      department: 'Computer Science',
      designation: 'Associate Professor',
    });
    await faculty.save();
    console.log('👨‍🏫 Created faculty profile');

    // 4. Create Core Student document
    const coreStudent = new Student({
      user: studentUser._id,
      name: studentUser.name,
      email: studentUser.email,
      rollNumber: '2026CSE001',
      department: 'Computer Science',
      semester: 1,
      academicYear: '2026-2027',
      studentGroup: groupA._id,
    });
    await coreStudent.save();

    // 5. Create 20 Random Students with unique accounts
    const firstNames = ['Aarav', 'Vihaan', 'Vivaan', 'Aditya', 'Sai', 'Arjun', 'Krishna', 'Laksh', 'Rohan', 'Ayush', 'Harsh', 'Kunal', 'Manish', 'Nikhil', 'Om', 'Parth', 'Rahul', 'Siddharth', 'Tarun', 'Vikas'];
    const lastNames = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Reddy', 'Mehta', 'Desai', 'Jain', 'Kulkarni', 'Das', 'Verma', 'Nair', 'Agarwal', 'Chopra', 'Joshi', 'Mishra', 'Bhatia', 'Rathore', 'Ghosh'];

    for (let i = 0; i < 20; i++) {
      const fn = firstNames[i];
      const ln = lastNames[i];
      const name = `${fn} ${ln}`;
      const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i + 2}@example.com`;
      const rollNumber = `2026CSE${String(i + 2).padStart(3, '0')}`;
      const group = i % 2 === 0 ? groupA._id : groupB._id;

      const randomUser = new User({
        name,
        email,
        password: 'Student@123',
        role: 'student'
      });
      await randomUser.save();

      const randomStudentDoc = new Student({
        user: randomUser._id,
        name,
        email,
        rollNumber,
        department: 'Computer Science',
        semester: 1,
        academicYear: '2026-2027',
        studentGroup: group,
      });
      await randomStudentDoc.save();
    }
    console.log('🎓 Created 20 additional random student accounts');

    // 6. Subjects
    const subjects = await Subject.insertMany([
      { code: 'CS101', name: 'Introduction to Programming', department: 'Computer Science', semester: 1, credits: 4 },
      { code: 'CS102', name: 'Data Structures', department: 'Computer Science', semester: 1, credits: 4 },
      { code: 'CS103', name: 'Database Management Systems', department: 'Computer Science', semester: 1, credits: 4 },
    ]);
    console.log('📚 Created subjects');

    // 7. Rooms
    const rooms = await Room.insertMany([
      { roomNumber: 'LH-101', building: 'Academic Block A', floor: 1, benchCount: 30, totalCapacity: 60, examCapacity: 30 },
      { roomNumber: 'LH-102', building: 'Academic Block A', floor: 1, benchCount: 25, totalCapacity: 50, examCapacity: 25 },
      { roomNumber: 'LH-201', building: 'Academic Block A', floor: 2, benchCount: 20, totalCapacity: 40, examCapacity: 20 },
    ]);
    console.log('🏢 Created rooms');

    // 8. Examination
    const exam = new Examination({
      title: 'End-Semester Examination Dec 2026',
      examSeries: 'End-Term',
      session: '2026-2027',
      semester: 'Odd',
      startDate: new Date('2026-12-01'),
      endDate: new Date('2026-12-15'),
      status: 'published',
      publishedAt: new Date()
    });
    await exam.save();
    console.log('🗓️ Created examination');

    // 9. Schedules (Published for both Group A and Group B)
    const scheduleA = new Schedule({
      examination: exam._id,
      subject: subjects[0]._id,
      studentGroup: groupA._id,
      room: rooms[0]._id,
      invigilator: faculty._id,
      date: new Date('2026-12-05'),
      startTime: '09:30',
      endTime: '12:30',
      startDateTime: new Date('2026-12-05T09:30:00.000Z'),
      endDateTime: new Date('2026-12-05T12:30:00.000Z'),
      durationMinutes: 180,
      status: 'published'
    });
    const scheduleB = new Schedule({
      examination: exam._id,
      subject: subjects[1]._id,
      studentGroup: groupB._id,
      room: rooms[1]._id,
      invigilator: faculty._id,
      date: new Date('2026-12-06'),
      startTime: '09:30',
      endTime: '12:30',
      startDateTime: new Date('2026-12-06T09:30:00.000Z'),
      endDateTime: new Date('2026-12-06T12:30:00.000Z'),
      durationMinutes: 180,
      status: 'published'
    });
    await Promise.all([scheduleA.save(), scheduleB.save()]);
    console.log('📅 Created published schedules for Group A and Group B');

    // 10. Invigilator Assignment
    const invigilatorAssignment = new InvigilatorAssignment({
      examination: exam._id,
      schedule: scheduleA._id,
      faculty: faculty._id,
      room: rooms[0]._id,
      role: 'chief_invigilator',
      status: 'confirmed'
    });
    await invigilatorAssignment.save();
    console.log('📋 Created invigilator assignment');

    // 11. Seating Allocations
    const allStudents = await Student.find({});
    const seatingRecords = [];
    for (let idx = 0; idx < allStudents.length; idx++) {
      const st = allStudents[idx];
      const targetSched = st.studentGroup.toString() === groupA._id.toString() ? scheduleA : scheduleB;
      const targetRoom = st.studentGroup.toString() === groupA._id.toString() ? rooms[0] : rooms[1];
      seatingRecords.push({
        examination: exam._id,
        schedule: targetSched._id,
        student: st._id,
        studentGroup: st.studentGroup,
        room: targetRoom._id,
        seatNumber: `${targetRoom.roomNumber}-S${String(idx + 1).padStart(3, '0')}`,
        benchNumber: Math.floor(idx / 2) + 1,
        deskPosition: idx % 2 === 0 ? 'Left' : 'Right',
        attendanceStatus: 'allocated'
      });
    }
    await SeatingAllocation.insertMany(seatingRecords);
    console.log(`💺 Created seating allocations for all ${allStudents.length} students`);

    console.log('\n=============================================');
    console.log('🎉 Demo data seeded successfully!');
    console.log('=============================================');
    console.log('Admin Login   : admin@examflow.edu / Admin@123');
    console.log('Faculty Login : faculty@examflow.edu / Faculty@123');
    console.log('Student Login : student@examflow.edu / Student@123');
    console.log('Example Random Student: aarav.sharma2@example.com / Student@123');
    console.log('=============================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();
