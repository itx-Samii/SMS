import { NextResponse } from 'next/server';
import { readPipeData, writePipeData, readData } from '@/lib/fileHandler';

const FEE_HEADERS = ['id', 'studentId', 'classId', 'sectionId', 'month', 'year', 'totalFee', 'paidFee', 'remainingFee', 'status'];

// GET fees with filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const sectionId = searchParams.get('sectionId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const status = searchParams.get('status');
    const studentId = searchParams.get('studentId');
    const studentSearch = searchParams.get('studentSearch')?.toLowerCase();

    const [fees, users, classes] = await Promise.all([
      readPipeData<any>('fees.txt', FEE_HEADERS),
      readData<any>('users.txt'),
      readData<any>('classes.txt')
    ]);

    let filtered = fees;
    if (classId) filtered = filtered.filter((f: any) => f.classId === parseInt(classId));
    if (sectionId) filtered = filtered.filter((f: any) => f.sectionId === sectionId);
    if (month) filtered = filtered.filter((f: any) => f.month === month);
    if (year) filtered = filtered.filter((f: any) => f.year?.toString() === year.toString());
    if (status) filtered = filtered.filter((f: any) => f.status === status);
    if (studentId) filtered = filtered.filter((f: any) => f.studentId === parseInt(studentId));

    let enriched = filtered.map((f: any) => {
      const student = users.find((u: any) => u.id === f.studentId);
      const classObj = classes.find((c: any) => c.id === f.classId);
      return {
        ...f,
        studentName: student?.name || 'Unknown',
        rollNumber: student?.rollNumber || 'N/A',
        fatherName: student?.fatherName || 'Unknown',
        className: classObj?.name || `Class ${f.classId}`
      };
    });

    if (studentSearch) {
      enriched = enriched.filter((f: any) => 
        f.studentName.toLowerCase().includes(studentSearch) || 
        f.rollNumber.toString().toLowerCase().includes(studentSearch) ||
        f.fatherName.toLowerCase().includes(studentSearch)
      );
    }

    return NextResponse.json(enriched);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch fees' }, { status: 500 });
  }
}

// POST create or bulk generate fees
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mode } = body; // mode: 'single' or 'bulk'

    const currentFees = await readPipeData<any>('fees.txt', FEE_HEADERS);
    let nextId = currentFees.length > 0 ? Math.max(...currentFees.map((f: any) => f.id)) + 1 : 1;

    const newRecords = [...currentFees];

    if (mode === 'bulk') {
      const { classId, sectionId, month, year, totalFee } = body;
      const users = await readData<any>('users.txt');
      const students = users.filter((u: any) => 
        u.role === 'STUDENT' && 
        u.classId === parseInt(classId) && 
        u.section === sectionId
      );

      for (const student of students) {
        if (!newRecords.some((f: any) => f.studentId === student.id && f.month === month && f.year?.toString() === year?.toString())) {
          newRecords.push({
            id: nextId++,
            studentId: student.id,
            classId: parseInt(classId),
            sectionId,
            month,
            year: year?.toString(),
            totalFee: parseFloat(totalFee),
            paidFee: 0,
            remainingFee: parseFloat(totalFee),
            status: 'Unpaid'
          });
        }
      }
    } else {
      // Single record
      const { studentId, classId, sectionId, month, year, totalFee, paidFee, status } = body;
      newRecords.push({
        id: nextId++,
        studentId: parseInt(studentId),
        classId: parseInt(classId),
        sectionId,
        month,
        year: year?.toString(),
        totalFee: parseFloat(totalFee),
        paidFee: parseFloat(paidFee || 0),
        remainingFee: parseFloat(totalFee) - parseFloat(paidFee || 0),
        status: status || 'Unpaid'
      });
    }

    await writePipeData('fees.txt', newRecords, FEE_HEADERS);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create fee' }, { status: 500 });
  }
}

// PUT update fee record
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, month, year, paidFee, totalFee, status } = body;

    const fees = await readPipeData<any>('fees.txt', FEE_HEADERS);
    const idx = fees.findIndex((f: any) => f.id === parseInt(id));

    if (idx === -1) return NextResponse.json({ error: 'Record not found' }, { status: 404 });

    const updated = { ...fees[idx] };
    if (month) updated.month = month;
    if (year) updated.year = year.toString();
    if (totalFee !== undefined) updated.totalFee = parseFloat(totalFee);
    if (paidFee !== undefined) updated.paidFee = parseFloat(paidFee);
    
    updated.remainingFee = updated.totalFee - updated.paidFee;
    if (status) updated.status = status;

    fees[idx] = updated;
    await writePipeData('fees.txt', fees, FEE_HEADERS);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update fee' }, { status: 500 });
  }
}

// DELETE fee record
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const fees = await readPipeData<any>('fees.txt', FEE_HEADERS);
    const updated = fees.filter((f: any) => f.id !== parseInt(id));
    await writePipeData('fees.txt', updated, FEE_HEADERS);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete fee' }, { status: 500 });
  }
}
