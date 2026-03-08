import { NextResponse } from 'next/server';
import { readData, writeData, generateId } from '@/lib/fileHandler';

// POST Add Result
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, obtained, total } = body;

    if (!studentId || obtained === undefined || total === undefined) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const percentage = (obtained / total) * 100;
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';

    const results = await readData<any>('results.txt');
    const newId = await generateId('results.txt');

    const newResult = {
      id: newId,
      studentId: parseInt(studentId, 10),
      obtained: parseFloat(obtained),
      total: parseFloat(total),
      percentage,
      grade
    };

    results.push(newResult);
    await writeData('results.txt', results);

    return NextResponse.json(newResult, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add result' }, { status: 500 });
  }
}

// GET Results
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentIdStr = searchParams.get('studentId');

    let results = await readData<any>('results.txt');
    const users = await readData<any>('users.txt');

    if (studentIdStr) {
      const studentId = parseInt(studentIdStr, 10);
      results = results.filter(r => r.studentId === studentId);
    }

    const enrichedResults = results.map(r => {
       const student = users.find(u => u.id === r.studentId);
       return { ...r, student };
    });

    return NextResponse.json(enrichedResults);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get results' }, { status: 500 });
  }
}
