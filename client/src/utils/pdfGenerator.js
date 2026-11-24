import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate Master Examination Timetable PDF
 */
export const exportTimetablePDF = (examTitle, schedules = []) => {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(15, 23, 42); // Navy Blue
  doc.rect(0, 0, 210, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('EXAMFLOW UNIVERSITY - CONTROLLER OF EXAMINATIONS', 105, 12, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text(`Official Examination Timetable: ${examTitle || 'Semester Examinations'}`, 105, 20, { align: 'center' });

  // Metadata line
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleDateString()} | Verified Conflict-Free`, 14, 35);

  // Table Data
  const tableRows = schedules.map(s => [
    new Date(s.date).toLocaleDateString(),
    `${s.startTime} - ${s.endTime}`,
    s.subject?.code || 'N/A',
    s.subject?.name || 'N/A',
    s.studentGroup?.name || 'All',
    s.room ? `Room ${s.room.roomNumber} (${s.room.building})` : 'TBD'
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['Date', 'Time Window', 'Code', 'Subject Title', 'Student Batch', 'Examination Hall']],
    body: tableRows,
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14 }
  });

  // Footer Signature Block
  const finalY = doc.lastAutoTable.finalY + 25;
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Controller of Examinations', 150, finalY);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('University Examination Branch', 150, finalY + 5);

  doc.save(`ExamFlow_Timetable_${Date.now()}.pdf`);
};

/**
 * Generate Seating Arrangement & Attendance Sheet PDF
 */
export const exportSeatingPDF = (roomNumber, subjectInfo, allocations = []) => {
  const doc = new jsPDF();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 26, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('EXAMINATION SEATING PLAN & CANDIDATE ATTENDANCE', 105, 11, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text(`Room: ${roomNumber} | Subject: ${subjectInfo || 'All Subjects'}`, 105, 19, { align: 'center' });

  const tableRows = allocations.map(a => [
    a.seatNumber,
    `Bench ${a.benchNumber}`,
    a.student?.rollNumber || 'N/A',
    a.student?.name || 'N/A',
    a.studentGroup?.name || 'N/A',
    '' // Signature column for physical attendance
  ]);

  autoTable(doc, {
    startY: 34,
    head: [['Seat No', 'Bench', 'Roll No', 'Student Name', 'Cohort Group', 'Candidate Signature']],
    body: tableRows,
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14 }
  });

  doc.save(`ExamFlow_Seating_Room_${roomNumber}_${Date.now()}.pdf`);
};

/**
 * Generate Official Student Hall Ticket / Admit Card PDF
 */
export const exportStudentHallTicketPDF = (student, timetable = []) => {
  const doc = new jsPDF();

  // University Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 30, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('EXAMFLOW UNIVERSITY OF TECHNOLOGY', 105, 12, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(147, 197, 253);
  doc.text('OFFICIAL EXAMINATION HALL TICKET / ADMIT CARD', 105, 21, { align: 'center' });

  // Student Details Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 36, 182, 32, 3, 3, 'FD');

  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`Candidate Name: ${student.name}`, 20, 45);
  doc.text(`Roll Number: ${student.rollNumber}`, 20, 53);
  doc.text(`Department: ${student.department}`, 20, 61);

  doc.text(`Semester: Semester ${student.semester}`, 110, 45);
  doc.text(`Batch / Group: ${student.groupName || 'Regular'}`, 110, 53);
  doc.text(`Academic Session: 2026-2027`, 110, 61);

  // Timetable
  const tableRows = timetable.map(item => [
    new Date(item.date).toLocaleDateString(),
    `${item.startTime} - ${item.endTime}`,
    item.subject?.code || 'N/A',
    item.subject?.name || 'N/A',
    item.room?.roomNumber ? `Room ${item.room.roomNumber}` : 'Main Hall',
    item.seatNumber || 'Allocated at Center'
  ]);

  autoTable(doc, {
    startY: 74,
    head: [['Date', 'Time Slot', 'Code', 'Subject Name', 'Exam Room', 'Assigned Seat']],
    body: tableRows,
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9
    },
    margin: { left: 14, right: 14 }
  });

  // Instructions
  const finalY = doc.lastAutoTable.finalY + 14;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Important Candidate Instructions:', 14, finalY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('1. Candidates must arrive at the examination hall 20 minutes before the scheduled start time.', 14, finalY + 6);
  doc.text('2. Please bring this printed Hall Ticket along with your Institutional Photo ID card.', 14, finalY + 11);
  doc.text('3. Electronic gadgets, smart watches, and unauthorized materials are strictly prohibited.', 14, finalY + 16);

  doc.save(`HallTicket_${student.rollNumber}.pdf`);
};

/**
 * Generate Faculty Invigilation Duty Roster PDF
 */
export const exportFacultyDutiesPDF = (assignments = []) => {
  const doc = new jsPDF();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 26, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('FACULTY INVIGILATION DUTY ROSTER REPORT', 105, 12, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text(`Official Duty Distribution Report`, 105, 19, { align: 'center' });

  const tableRows = assignments.map(a => [
    a.faculty?.name || 'N/A',
    a.faculty?.department || 'N/A',
    a.schedule ? new Date(a.schedule.date).toLocaleDateString() : 'N/A',
    a.schedule ? `${a.schedule.startTime} - ${a.schedule.endTime}` : 'N/A',
    a.room?.roomNumber ? `Room ${a.room.roomNumber}` : 'N/A',
    a.role ? a.role.replace('_', ' ').toUpperCase() : 'INVIGILATOR'
  ]);

  autoTable(doc, {
    startY: 34,
    head: [['Faculty Invigilator', 'Department', 'Exam Date', 'Duty Hours', 'Assigned Room', 'Role']],
    body: tableRows,
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9
    },
    margin: { left: 14, right: 14 }
  });

  doc.save(`Faculty_Duty_Roster_${Date.now()}.pdf`);
};
