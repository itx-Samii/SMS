import { NextResponse } from 'next/server';
import { readData, writeData, generateId } from '@/lib/fileHandler';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, classId, teacherId, dueDate, subject } = body;

    if (!title || !description || !classId || !teacherId || !dueDate || !subject) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Strict Class Teacher Validation
    const classes = await readData<any>('classes.txt');
    const targetClass = classes.find((c: any) => c.id === parseInt(classId, 10));
    
    if (!targetClass || targetClass.teacherId !== parseInt(teacherId, 10)) {
      return NextResponse.json({ error: 'Unauthorized: You are not the assigned Class Teacher for this class.' }, { status: 403 });
    }

    const assignments = await readData<any>('assignments.txt');
    const newId = await generateId('assignments.txt');

    const newAssignment = {
      id: newId,
      title,
      description,
      subject,
      classId: parseInt(classId, 10),
      teacherId: parseInt(teacherId, 10),
      dueDate,
      createdAt: new Date().toISOString()
    };

    assignments.push(newAssignment);
    await writeData('assignments.txt', assignments);

    return NextResponse.json(newAssignment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherIdStr = searchParams.get('teacherId');

    let assignments = await readData<any>('assignments.txt');
    const classes = await readData<any>('classes.txt');

    if (teacherIdStr) {
      const teacherId = parseInt(teacherIdStr, 10);
      assignments = assignments.filter(a => a.teacherId === teacherId);
    }

    assignments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const enrichedAssignments = assignments.map(a => {
       const cls = classes.find(c => c.id === a.classId);
       return { ...a, class: cls };
    });

    return NextResponse.json(enrichedAssignments);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}
