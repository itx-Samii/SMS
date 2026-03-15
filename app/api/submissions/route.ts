import { NextResponse } from 'next/server';
import { readData, writeData, generateId as getNextId } from '@/lib/fileHandler';
import path from 'path';

const FILE_PATH = path.join(process.cwd(), 'data', 'assignment_submissions.txt');

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');
    const studentId = searchParams.get('studentId');

    const data = await readData<any>('assignment_submissions.txt');
    let filtered = data;

    if (assignmentId) filtered = filtered.filter((s: any) => s.AssignmentID === assignmentId);
    if (studentId) filtered = filtered.filter((s: any) => s.StudentID === studentId);

    return NextResponse.json(filtered);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await readData<any>('assignment_submissions.txt');
    
    // If student re-submits, we can overwrite the existing submission record
    const existingIndex = data.findIndex((s: any) => s.AssignmentID === body.assignmentId && s.StudentID === body.studentId);

    if (existingIndex !== -1) {
      const current: any = data[existingIndex];
      data[existingIndex] = {
        ...current,
        SubmissionText: body.submissionText || '',
        Attachment: body.attachment || '',
        SubmittedDate: new Date().toISOString(),
        Status: 'Submitted'
      };
      await writeData('assignment_submissions.txt', data);
      return NextResponse.json({ message: 'Submission updated successfully', submission: data[existingIndex] }, { status: 200 });
    }

    data.sort((a: any, b: any) => parseInt(a.SubmissionID || '0') - parseInt(b.SubmissionID || '0'));

    const newSubmission = {
      SubmissionID: await getNextId('assignment_submissions.txt'),
      AssignmentID: body.assignmentId,
      StudentID: body.studentId,
      SubmissionText: body.submissionText || '',
      Attachment: body.attachment || '',
      SubmittedDate: new Date().toISOString(),
      Status: 'Submitted'
    };

    data.push(newSubmission);
    await writeData('assignment_submissions.txt', data);
    
    return NextResponse.json({ message: 'Assignment submitted successfully', submission: newSubmission }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit assignment' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    // Allows teachers to modify submission status (e.g., Graded, Rejected)
    const body = await request.json();
    const data = await readData<any>('assignment_submissions.txt');
    const index = data.findIndex((s: any) => s.SubmissionID === body.id);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const current: any = data[index];
    data[index] = {
      ...current,
      Status: body.status !== undefined ? body.status : current.Status
    };

    await writeData('assignment_submissions.txt', data);
    return NextResponse.json({ message: 'Submission status updated', submission: data[index] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
  }
}
