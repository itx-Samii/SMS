import { NextRequest, NextResponse } from 'next/server';
import { readData } from '@/lib/fileHandler';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = parseInt(searchParams.get('classId') || '0');
    const section = searchParams.get('section');

    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }

    const marks = await readData<any>('marks.txt');
    const users = await readData<any>('users.txt');
    const students = users.filter((u: any) => u.role === 'STUDENT' && u.classId === classId && (!section || u.section === section));

    const classMarks = marks.filter((m: any) => 
      m.classId === classId && (!section || m.section === section)
    );

    if (classMarks.length === 0) {
      return NextResponse.json({
        summary: {
          classAverage: 0,
          passRate: 0,
          topStudents: [],
          strugglingStudents: []
        },
        subjectAverages: []
      });
    }

    // Student-wise aggregation for summary
    const studentStats: Record<number, any> = {};
    classMarks.forEach((m: any) => {
      if (!studentStats[m.studentId]) {
        studentStats[m.studentId] = { id: m.studentId, obtained: 0, total: 0 };
      }
      studentStats[m.studentId].obtained += m.obtained;
      studentStats[m.studentId].total += m.total;
    });

    const studentsPerformance = Object.values(studentStats).map((s: any) => {
      const student = students.find((u: any) => u.id === s.id);
      return {
        id: s.id,
        name: student?.name || `Student #${s.id}`,
        percentage: s.total > 0 ? Math.round((s.obtained / s.total) * 100) : 0
      };
    }).sort((a, b) => b.percentage - a.percentage);

    // Subject-wise aggregation
    const subjectsMap: Record<string, any> = {};
    classMarks.forEach((m: any) => {
      if (!subjectsMap[m.subject]) {
        subjectsMap[m.subject] = { subject: m.subject, obtained: 0, total: 0, count: 0 };
      }
      subjectsMap[m.subject].obtained += m.obtained;
      subjectsMap[m.subject].total += m.total;
      subjectsMap[m.subject].count++;
    });

    const subjectAverages = Object.values(subjectsMap).map((s: any) => ({
      subject: s.subject,
      average: s.total > 0 ? Math.round((s.obtained / s.total) * 100) : 0
    }));

    const classAverage = subjectAverages.reduce((acc, s) => acc + s.average, 0) / subjectAverages.length;
    const passRate = (studentsPerformance.filter(s => s.percentage >= 50).length / studentsPerformance.length) * 100;

    return NextResponse.json({
      summary: {
        classAverage: Math.round(classAverage),
        passRate: Math.round(passRate),
        topStudents: studentsPerformance.slice(0, 3),
        strugglingStudents: studentsPerformance.filter(s => s.percentage < 50).slice(0, 3)
      },
      subjectAverages,
      studentsPerformance
    });

  } catch (error) {
    console.error('Class Analytics API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
