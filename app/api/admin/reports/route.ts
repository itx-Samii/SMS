import { NextResponse } from 'next/server';
import { readData } from '@/lib/fileHandler';

export async function GET() {
  try {
    const users = await readData<any>('users.txt');
    const classes = await readData<any>('classes.txt');
    const results = await readData<any>('results.txt');
    const attendance = await readData<any>('attendance.txt');
    const feeRecords = await readData<any>('fees.txt');

    const totalStudents = users.filter(u => u.role === 'STUDENT').length;
    const totalTeachers = users.filter(u => u.role === 'TEACHER').length;
    const totalParents = users.filter(u => u.role === 'PARENT').length;
    
    // Calculate paid vs unpaid fees
    const paidFees = feeRecords.filter(f => f.status === 'PAID').reduce((acc, f) => acc + parseFloat(f.amount), 0) || 0;
    const unpaidFees = feeRecords.filter(f => f.status !== 'PAID').reduce((acc, f) => acc + parseFloat(f.amount), 0) || 0;

    // Calculate today's attendance (simplified for demo)
    const today = new Date().toISOString().split('T')[0];
    const todaysAttendance = attendance.filter(a => a.date === today);
    const presentToday = todaysAttendance.filter(a => a.status === 'P').length;

    return NextResponse.json({
        users: { students: totalStudents, teachers: totalTeachers, parents: totalParents },
        fees: { paid: paidFees, unpaid: unpaidFees },
        attendance: { present: presentToday, total: todaysAttendance.length || totalStudents },
        academics: { classes: classes.length, results: results.length }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch dashboard metrics' }, { status: 500 });
  }
}
