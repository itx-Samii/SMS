import { NextResponse } from 'next/server';
import { readData, writeData, generateId } from '@/lib/fileHandler';

// GET all marks (filtered by teacher or student or class)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherIdStr = searchParams.get('teacherId');
    const studentIdStr = searchParams.get('studentId');
    const classIdStr = searchParams.get('classId');

    let marks = await readData<any>('marks.txt');
    const users = await readData<any>('users.txt');
    const classes = await readData<any>('classes.txt');

    if (teacherIdStr) {
      marks = marks.filter(m => m.teacherId === parseInt(teacherIdStr, 10));
    }
    if (studentIdStr) {
      marks = marks.filter(m => m.studentId === parseInt(studentIdStr, 10));
    }
    if (classIdStr) {
      marks = marks.filter(m => m.classId === parseInt(classIdStr, 10));
    }

    const enrichedMarks = marks.map(m => {
       const student = users.find(u => u.id === m.studentId);
       const teacher = users.find(u => u.id === m.teacherId);
       const classObj = classes.find(c => c.id === m.classId);
       return { 
         ...m, 
         studentName: student?.name || 'Unknown', 
         rollNumber: student?.rollNumber || 'N/A',
         teacherName: teacher?.name || 'Unknown',
         className: classObj?.name || 'Unknown' 
       };
    });

    return NextResponse.json(enrichedMarks);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get marks' }, { status: 500 });
  }
}

// POST Add Marks
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, classId, section, teacherId, subject, assessmentType, obtained, total, date, remarks } = body;

    if (!studentId || !classId || !teacherId || !subject || !assessmentType || obtained === undefined || total === undefined || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Strict Class Teacher Validation
    const classes = await readData<any>('classes.txt');
    const targetClass = classes.find((c: any) => c.id === parseInt(classId, 10));
    
    if (!targetClass || targetClass.teacherId !== parseInt(teacherId, 10)) {
      return NextResponse.json({ error: 'Unauthorized: You are not the assigned Class Teacher for this class.' }, { status: 403 });
    }

    const percentage = (parseFloat(obtained) / parseFloat(total)) * 100;
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';

    const marks = await readData<any>('marks.txt');
    const newId = await generateId('marks.txt');

    const newMark = {
      id: newId,
      studentId: parseInt(studentId, 10),
      classId: parseInt(classId, 10),
      section,
      teacherId: parseInt(teacherId, 10),
      subject,
      assessmentType,
      obtained: parseFloat(obtained),
      total: parseFloat(total),
      percentage,
      grade,
      date,
      remarks: remarks || ''
    };

    marks.push(newMark);
    await writeData('marks.txt', marks);

    return NextResponse.json(newMark, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add marks' }, { status: 500 });
  }
}

// PUT Edit Marks
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, obtained, total, date, remarks, assessmentType, subject } = body;

    if (!id || obtained === undefined || total === undefined) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const marks = await readData<any>('marks.txt');
    const index = marks.findIndex(m => m.id === parseInt(id, 10));

    if (index === -1) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const percentage = (parseFloat(obtained) / parseFloat(total)) * 100;
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';

    marks[index] = {
      ...marks[index],
      obtained: parseFloat(obtained),
      total: parseFloat(total),
      date: date || marks[index].date,
      remarks: remarks !== undefined ? remarks : marks[index].remarks,
      assessmentType: assessmentType || marks[index].assessmentType,
      subject: subject || marks[index].subject,
      percentage,
      grade
    };

    await writeData('marks.txt', marks);
    return NextResponse.json(marks[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update marks' }, { status: 500 });
  }
}

// DELETE Marks
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    let marks = await readData<any>('marks.txt');
    marks = marks.filter(m => m.id !== parseInt(id, 10));
    
    await writeData('marks.txt', marks);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete marks' }, { status: 500 });
  }
}
