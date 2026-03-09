import { NextResponse } from 'next/server';
import { readData, writeData, generateId } from '@/lib/fileHandler';

// GET all classes
export async function GET() {
  try {
    const classes = await readData<any>('classes.txt');
    const users = await readData<any>('users.txt');

    // Attach teacher name
    const enrichedClasses = classes.map(c => {
      const teacher = users.find((u: any) => u.id === c.teacherId && u.role === 'TEACHER');
      const studentCount = users.filter((u: any) => u.classId === c.id && u.role === 'STUDENT').length;
      return {
        ...c,
        teacherName: teacher ? teacher.name : "Unassigned",
        studentCount
      };
    });

    return NextResponse.json(enrichedClasses);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
  }
}

// POST create a new class
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, teacherId } = body;

    if (!name) {
      return NextResponse.json({ error: 'Class name is required' }, { status: 400 });
    }

    // Ensure class name doesn't contain negative numbers
    const numericMatch = name.match(/-?\d+/);
    if (numericMatch && parseInt(numericMatch[0]) < 0) {
      return NextResponse.json({ error: 'Class level/number must be positive' }, { status: 400 });
    }

    const classes = await readData<any>('classes.txt');
    const newId = await generateId('classes.txt');

    const newClass = {
      id: newId,
      name,
      teacherId: teacherId ? parseInt(teacherId, 10) : null,
      createdAt: new Date().toISOString()
    };

    classes.push(newClass);
    await writeData('classes.txt', classes);

    // If teacher is assigned, update teacher's assignedClassId
    if (teacherId) {
      const users = await readData<any>('users.txt');
      const tId = parseInt(teacherId, 10);
      const userIndex = users.findIndex((u: any) => u.id === tId && u.role === 'TEACHER');
      if (userIndex !== -1) {
        users[userIndex].assignedClassId = newId;
        await writeData('users.txt', users);
      }
    }

    return NextResponse.json(newClass, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
  }
}

// DELETE a class
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idStr = searchParams.get('id');

    if (!idStr) {
       return NextResponse.json({ error: 'Missing class ID' }, { status: 400 });
    }

    const classId = parseInt(idStr, 10);
    const classes = await readData<any>('classes.txt');
    
    // Check if students exist in this class
    const users = await readData<any>('users.txt');
    const studentsInClass = users.filter((u: any) => u.classId === classId && u.role === 'STUDENT');
    if (studentsInClass.length > 0) {
       return NextResponse.json({ error: 'Cannot delete class with active students' }, { status: 400 });
    }

    const updatedClasses = classes.filter(c => c.id !== classId);
    await writeData('classes.txt', updatedClasses);

    // Remove assignedClassId from teachers
    const tIndex = users.findIndex((u: any) => u.assignedClassId === classId && u.role === 'TEACHER');
    if (tIndex !== -1) {
       users[tIndex].assignedClassId = null;
       await writeData('users.txt', users);
    }

    return NextResponse.json({ message: 'Class deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 });
  }
}
