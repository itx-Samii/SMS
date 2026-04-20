import { NextResponse } from 'next/server';
import { readData, writeData, generateId } from '@/lib/fileHandler';

const FILE_NAME = 'salaries.txt';

// GET all salary records
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const teacherId = searchParams.get('teacherId');

    const [salaries, users] = await Promise.all([
      readData<any>(FILE_NAME),
      readData<any>('users.txt')
    ]);

    let filtered = salaries;
    if (month) filtered = filtered.filter(s => s.month === month);
    if (year) filtered = filtered.filter(s => s.year?.toString() === year?.toString());
    if (teacherId) filtered = filtered.filter(s => s.teacherId === parseInt(teacherId));

    // Enrich with teacher information
    const enriched = filtered.map(s => {
      const teacher = users.find(u => u.id === s.teacherId && u.role === 'TEACHER');
      return {
        ...s,
        teacherName: teacher ? teacher.name : 'Unknown Teacher',
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch salaries' }, { status: 500 });
  }
}

// POST create a single salary record
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { teacherId, month, year, baseSalary, bonus, deductions, paidFee, status, remarks } = body;

    const users = await readData<any>('users.txt');
    const teacher = users.find((u: any) => u.id === parseInt(teacherId) && u.role === 'TEACHER');

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const tBase = parseFloat(baseSalary || 0);
    const tBonus = parseFloat(bonus || 0);
    const tDed = parseFloat(deductions || 0);
    const netSalary = tBase + tBonus - tDed;

    const salaries = await readData<any>(FILE_NAME);
    
    // Check for duplicates
    if (salaries.some(s => s.teacherId === teacher.id && s.month === month && s.year?.toString() === year?.toString())) {
      return NextResponse.json({ error: 'Salary record for this teacher in this exact month already exists.' }, { status: 400 });
    }

    const newId = await generateId(FILE_NAME);

    const newRecord = {
      id: newId,
      teacherId: teacher.id,
      month,
      year: year?.toString(),
      baseSalary: tBase,
      bonus: tBonus,
      deductions: tDed,
      netSalary,
      status: status || 'Pending',
      remarks: remarks || '',
      createdAt: new Date().toISOString()
    };

    salaries.push(newRecord);
    await writeData(FILE_NAME, salaries);

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create salary record' }, { status: 500 });
  }
}

// PUT update an existing salary record
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, month, year, baseSalary, bonus, deductions, status, remarks } = body;

    const salaries = await readData<any>(FILE_NAME);
    const idx = salaries.findIndex((s: any) => s.id === parseInt(id));

    if (idx === -1) return NextResponse.json({ error: 'Salary record not found' }, { status: 404 });

    const updated = { ...salaries[idx] };
    if (month) updated.month = month;
    if (year) updated.year = year?.toString();
    
    if (baseSalary !== undefined) updated.baseSalary = parseFloat(baseSalary);
    if (bonus !== undefined) updated.bonus = parseFloat(bonus);
    if (deductions !== undefined) updated.deductions = parseFloat(deductions);
    
    // Automatically recalculate net salary
    updated.netSalary = updated.baseSalary + (updated.bonus || 0) - (updated.deductions || 0);
    
    if (status) updated.status = status;
    if (remarks !== undefined) updated.remarks = remarks;
    updated.updatedAt = new Date().toISOString();

    salaries[idx] = updated;
    await writeData(FILE_NAME, salaries);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update salary' }, { status: 500 });
  }
}

// DELETE a salary record
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const salaries = await readData<any>(FILE_NAME);
    const updated = salaries.filter((s: any) => s.id !== parseInt(id));
    
    await writeData(FILE_NAME, updated);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete salary' }, { status: 500 });
  }
}
