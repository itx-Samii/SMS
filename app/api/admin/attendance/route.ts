import { NextResponse } from 'next/server';
import { readData, readPipeData } from '@/lib/fileHandler';

const ATTENDANCE_HEADERS = ['id', 'studentId', 'classId', 'section', 'teacherId', 'date', 'status'];

// GET all attendance records
export async function GET() {
  try {
    const attendances = await readPipeData<any>('attendance.txt', ATTENDANCE_HEADERS);
    const users = await readData<any>('users.txt');
    const classes = await readData<any>('classes.txt');

    // Attach student and class info
    const enrichedAttendances = attendances.map(a => {
      const student = users.find(u => u.id === a.studentId);
      let stdClass = undefined;
      if (student?.classId) {
        stdClass = classes.find(c => c.id === student.classId);
      }
      return {
        ...a,
        student: student ? {
           id: student.id,
           name: student.name,
           class: stdClass ? { id: stdClass.id, name: stdClass.name } : undefined
        } : null
      };
    });

    return NextResponse.json(enrichedAttendances);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch attendance records' }, { status: 500 });
  }
}
