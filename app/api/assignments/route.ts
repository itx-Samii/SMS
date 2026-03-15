import { NextResponse } from 'next/server';
import { readData, writeData, generateId as getNextId } from '@/lib/fileHandler';
import path from 'path';

const FILE_PATH = path.join(process.cwd(), 'data', 'assignments.txt');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const classId = searchParams.get('classId');
    const sectionId = searchParams.get('sectionId');
    const teacherId = searchParams.get('teacherId');

    const data = await readData<any>('assignments.txt');
    let filtered = data;

    if (id) filtered = filtered.filter((a: any) => a.AssignmentID === id);
    if (classId) filtered = filtered.filter((a: any) => a.ClassID === classId);
    if (sectionId) filtered = filtered.filter((a: any) => a.SectionID === sectionId);
    if (teacherId) filtered = filtered.filter((a: any) => a.TeacherID === teacherId);

    return NextResponse.json(filtered);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await readData<any>('assignments.txt');
    
    // Auto-sort by AssignmentID before getting next to be perfectly safe, although fileHandler.ts does this usually
    data.sort((a: any, b: any) => parseInt(a.AssignmentID || '0') - parseInt(b.AssignmentID || '0'));

    const newAssignment = {
      AssignmentID: await getNextId('assignments.txt'),
      Title: body.title,
      Subject: body.subject,
      ClassID: body.classId,
      SectionID: body.sectionId,
      TeacherID: body.teacherId,
      Description: body.description,
      DueDate: body.dueDate,
      Attachment: body.attachment || '',
      Priority: body.priority || 'Normal',
      Status: body.status || 'Active',
      CreatedDate: new Date().toISOString()
    };

    data.push(newAssignment);
    await writeData('assignments.txt', data);
    
    return NextResponse.json({ message: 'Assignment created successfully', assignment: newAssignment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const data = await readData<any>('assignments.txt');
    const index = data.findIndex((a: any) => a.AssignmentID === body.id);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const current: any = data[index];
    data[index] = {
      ...current,
      Title: body.title !== undefined ? body.title : current.Title,
      Subject: body.subject !== undefined ? body.subject : current.Subject,
      ClassID: body.classId !== undefined ? body.classId : current.ClassID,
      SectionID: body.sectionId !== undefined ? body.sectionId : current.SectionID,
      Description: body.description !== undefined ? body.description : current.Description,
      DueDate: body.dueDate !== undefined ? body.dueDate : current.DueDate,
      Attachment: body.attachment !== undefined ? body.attachment : current.Attachment,
      Priority: body.priority !== undefined ? body.priority : current.Priority,
      Status: body.status !== undefined ? body.status : current.Status
    };

    await writeData('assignments.txt', data);
    return NextResponse.json({ message: 'Assignment updated successfully', assignment: data[index] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const data = await readData<any>('assignments.txt');
    const filtered = data.filter((a: any) => a.AssignmentID !== id);

    if (data.length === filtered.length) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    await writeData('assignments.txt', filtered);
    return NextResponse.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 });
  }
}
