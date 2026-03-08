import { NextResponse } from 'next/server';
import { readData } from '@/lib/fileHandler';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classIdStr = searchParams.get('classId');

    if (!classIdStr) {
      return NextResponse.json({ error: 'Missing classId' }, { status: 400 });
    }
    
    const classId = parseInt(classIdStr, 10);
    const allAssignments = await readData<any>('assignments.txt');
    const users = await readData<any>('users.txt');

    const assignments = allAssignments
      .filter((a: any) => a.classId === classId)
      .map((a: any) => {
         const teacher = users.find((u: any) => u.id === a.teacherId && u.role === 'TEACHER');
         return {
            ...a,
            teacher: teacher ? { id: teacher.id, name: teacher.name } : null
         };
      });

    // Optionally sort by createdAt desc if it exists
    assignments.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return NextResponse.json(assignments);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}
