import { NextResponse } from 'next/server';
import { readData } from '@/lib/fileHandler';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherIdStr = searchParams.get('teacherId');

    if (!teacherIdStr) {
      return NextResponse.json({ error: 'Missing teacherId' }, { status: 400 });
    }

    const users = await readData<any>('users.txt');
    const teacherId = parseInt(teacherIdStr, 10);
    const teacher = users.find(u => u.id === teacherId);

    if (!teacher || !teacher.assignedClassId) {
      return NextResponse.json([]);
    }

    // Find students in this class
    const students = users.filter(u => u.role === 'STUDENT' && u.classId === teacher.assignedClassId);
    const studentIds = students.map(s => s.id);

    // Find parents of these students
    let parents = users.filter(u => u.role === 'PARENT' && studentIds.includes(u.childId));

    // Attach child info
    parents = parents.map(p => {
       const child = students.find(s => s.id === p.childId);
       return { ...p, child };
    });

    return NextResponse.json(parents);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch parents for teacher' }, { status: 500 });
  }
}
