import { NextResponse } from 'next/server';
import { readData, readPipeData } from '@/lib/fileHandler';

const ATTENDANCE_HEADERS = ['id', 'studentId', 'classId', 'section', 'teacherId', 'date', 'status'];
const FEE_HEADERS = ['id', 'studentId', 'classId', 'sectionId', 'month', 'year', 'originalFee', 'discount', 'finalFee', 'paidFee', 'remainingFee', 'status', 'remarks'];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentIdStr = searchParams.get('studentId');

    if (!studentIdStr) {
      return NextResponse.json({ error: 'Missing studentId parameter' }, { status: 400 });
    }

    const studentId = parseInt(studentIdStr, 10);

    const users = await readData<any>('users.txt');
    const classes = await readData<any>('classes.txt');
    
    const student = users.find(u => u.id === studentId);

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const stdClass = student.classId ? classes.find(c => c.id === student.classId) : undefined;

    const allAttendances = await readPipeData<any>('attendance.txt', ATTENDANCE_HEADERS);
    const attendances = allAttendances.filter(a => a.studentId === studentId);

    const allResults = await readData<any>('results.txt');
    const results = allResults.filter(r => r.studentId === studentId);

    const allFees = await readPipeData<any>('fees.txt', FEE_HEADERS);
    const fees = allFees.filter(f => f.studentId === studentId);

    const allMarks = await readData<any>('marks.txt');
    const marks = allMarks.filter(m => m.studentId === studentId);

    let assignments: any[] = [];
    if (student.classId) {
       const allAssignments = await readData<any>('assignments.txt');
       assignments = allAssignments.filter(a => a.classId === student.classId);
       assignments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return NextResponse.json({
      student: { name: student.name, class: stdClass?.name },
      attendances,
      results,
      marks,
      fees,
      assignments
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch student records' }, { status: 500 });
  }
}
