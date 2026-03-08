import { NextResponse } from 'next/server';
import { readPipeData, writePipeData, readData } from '@/lib/fileHandler';

const ATTENDANCE_HEADERS = ['id', 'studentId', 'classId', 'section', 'teacherId', 'date', 'status'];

// POST Bulk Attendance
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { records, teacherId } = body; 

    if (!records || !Array.isArray(records) || !teacherId) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    const currentAttendance = await readPipeData<any>('attendance.txt', ATTENDANCE_HEADERS);
    let nextId = currentAttendance.length > 0 ? Math.max(...currentAttendance.map((a: any) => a.id)) + 1 : 1;

    const finalRecords = [...currentAttendance];
    
    for (const rec of records) {
      const existingIdx = finalRecords.findIndex((a: any) => a.studentId === parseInt(rec.studentId) && a.date === rec.date);
      const newRec = {
        id: existingIdx !== -1 ? finalRecords[existingIdx].id : nextId++,
        studentId: parseInt(rec.studentId),
        classId: parseInt(rec.classId),
        section: rec.section,
        teacherId: parseInt(teacherId),
        date: rec.date,
        status: rec.status.toUpperCase()
      };
      
      if (existingIdx !== -1) {
        finalRecords[existingIdx] = newRec;
      } else {
        finalRecords.push(newRec);
      }
    }

    await writePipeData('attendance.txt', finalRecords, ATTENDANCE_HEADERS);
    return NextResponse.json({ success: true, count: records.length }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to mark attendance' }, { status: 500 });
  }
}

// GET Attendance with filtering support
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classIdStr = searchParams.get('classId');
    const teacherIdStr = searchParams.get('teacherId');
    const date = searchParams.get('date');

    const [attendance, users, classes] = await Promise.all([
      readPipeData<any>('attendance.txt', ATTENDANCE_HEADERS),
      readData<any>('users.txt'),
      readData<any>('classes.txt')
    ]);

    let filtered = attendance;
    if (classIdStr) filtered = filtered.filter((a: any) => a.classId === parseInt(classIdStr));
    if (teacherIdStr) filtered = filtered.filter((a: any) => a.teacherId === parseInt(teacherIdStr));
    if (date) filtered = filtered.filter((a: any) => a.date === date);

    const enriched = filtered.map((a: any) => {
      const student = users.find((u: any) => u.id === a.studentId);
      const classObj = classes.find((c: any) => c.id === a.classId);
      return {
        ...a,
        studentName: student?.name || 'Unknown',
        rollNumber: student?.rollNumber || 'N/A',
        fatherName: student?.fatherName || 'Unknown',
        className: classObj?.name || `Class ${a.classId}`
      };
    });

    enriched.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return NextResponse.json(enriched);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get attendance' }, { status: 500 });
  }
}

// DELETE Attendance
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const attendance = await readPipeData<any>('attendance.txt', ATTENDANCE_HEADERS);
    const updated = attendance.filter((a: any) => a.id !== parseInt(id));
    await writePipeData('attendance.txt', updated, ATTENDANCE_HEADERS);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete attendance' }, { status: 500 });
  }
}
