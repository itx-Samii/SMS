import { NextResponse } from 'next/server';
import { readData } from '@/lib/fileHandler';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parentIdStr = searchParams.get('parentId');

    if (!parentIdStr) {
      return NextResponse.json({ error: 'Missing parentId parameter' }, { status: 400 });
    }

    const parentId = parseInt(parentIdStr, 10);
    const users = await readData<any>('users.txt');
    
    const parent = users.find((u: any) => u.id === parentId && u.role === 'PARENT');

    if (!parent || !parent.childId) {
      return NextResponse.json([]);
    }

    const child = users.find((u: any) => u.id === parent.childId && u.role === 'STUDENT');

    if (!child || !child.classId) {
       return NextResponse.json([]);
    }

    // Find teachers assigned to the child's class
    const teachers = users.filter((u: any) => u.role === 'TEACHER' && u.assignedClassId === child.classId)
                         .map((u: any) => ({ id: u.id, name: u.name, role: u.role }));

    return NextResponse.json(teachers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch teachers for parent' }, { status: 500 });
  }
}
