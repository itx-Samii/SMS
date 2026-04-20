import { NextResponse } from 'next/server';
import { readData, readPipeData } from '@/lib/fileHandler';

const FEE_HEADERS = ['id', 'studentId', 'classId', 'sectionId', 'month', 'year', 'originalFee', 'discount', 'finalFee', 'paidFee', 'remainingFee', 'status', 'remarks'];
const ATTENDANCE_HEADERS = ['id', 'studentId', 'classId', 'section', 'teacherId', 'date', 'status'];

export async function GET() {
  try {
    const users = await readData<any>('users.txt');
    const classes = await readData<any>('classes.txt');
    const results = await readData<any>('results.txt');
    const attendance = await readPipeData<any>('attendance.txt', ATTENDANCE_HEADERS);
    const feeRecords = await readPipeData<any>('fees.txt', FEE_HEADERS);

    const totalStudents = users.filter(u => u.role === 'STUDENT').length;
    const totalTeachers = users.filter(u => u.role === 'TEACHER').length;
    const totalParents = users.filter(u => u.role === 'PARENT').length;

    // Calculate paid vs unpaid fees
    const paidFees = feeRecords.filter((f: any) => f.status === 'Paid').reduce((acc: number, f: any) => acc + parseFloat(f.paidFee || "0"), 0) || 0;
    const unpaidFees = feeRecords.filter((f: any) => f.status !== 'Paid').reduce((acc: number, f: any) => acc + parseFloat(f.remainingFee || "0"), 0) || 0;

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
