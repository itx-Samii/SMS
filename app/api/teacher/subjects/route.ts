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

import { z } from 'zod';

const subjectSchema = z.object({
  classId: z.coerce.number().int().positive(),
  name: z.string().min(2, 'Subject name must be at least 2 characters').max(50),
});

// POST Add/Update subjects for a class
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = subjectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.error.format() 
      }, { status: 400 });
    }

    const { classId, name } = validation.data;

    const subjects = await readData<any>('subjects.txt');
    
    // Check if subject already exists for this class
    const exists = subjects.find((s: any) => s.classId === classId && s.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      return NextResponse.json({ error: 'Subject already exists for this class' }, { status: 400 });
    }

    const newId = await generateId('subjects.txt');
    const newSubject = {
      id: newId,
      classId: classId,
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
