import { NextResponse } from 'next/server';
import { readData, writeData, generateId } from '@/lib/fileHandler';

// GET subjects for a class
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classIdStr = searchParams.get('classId');

    if (!classIdStr) {
      return NextResponse.json({ error: 'Missing classId' }, { status: 400 });
    }

    const classId = parseInt(classIdStr, 10);
    const subjects = await readData<any>('subjects.txt');
    const classSubjects = subjects.filter((s: any) => s.classId === classId);

    return NextResponse.json(classSubjects);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 });
  }
}

// POST Add/Update subjects for a class
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { classId, name } = body;

    if (!classId || !name) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const subjects = await readData<any>('subjects.txt');
    
    // Check if subject already exists for this class
    const exists = subjects.find((s: any) => s.classId === parseInt(classId, 10) && s.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      return NextResponse.json({ error: 'Subject already exists for this class' }, { status: 400 });
    }

    const newId = await generateId('subjects.txt');
    const newSubject = {
      id: newId,
      classId: parseInt(classId, 10),
      name
    };

    subjects.push(newSubject);
    await writeData('subjects.txt', subjects);

    return NextResponse.json(newSubject, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add subject' }, { status: 500 });
  }
}

// DELETE a subject
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    let subjects = await readData<any>('subjects.txt');
    subjects = subjects.filter((s: any) => s.id !== parseInt(id, 10));
    
    await writeData('subjects.txt', subjects);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 });
  }
}
