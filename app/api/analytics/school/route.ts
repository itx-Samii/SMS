import { NextRequest, NextResponse } from 'next/server';
import { readData } from '@/lib/fileHandler';

export async function GET(req: NextRequest) {
  try {
    const marks = await readData<any>('marks.txt');
    const classes = await readData<any>('classes.txt');
    const users = await readData<any>('users.txt');

    if (marks.length === 0) {
      return NextResponse.json({
        summary: {
          totalStudents: 0,
          overallPassRate: 0,
          schoolAveragePercentage: 0
        },
        subjectAverages: [],
        classPerformance: []
      });
    }

    // Overall School Metrics
    const totalPossiblePoints = marks.reduce((sum: number, m: any) => sum + m.total, 0);
    const totalObtainedPoints = marks.reduce((sum: number, m: any) => sum + m.obtained, 0);
    const studentsByPercentage: Record<number, { obtained: number, total: number }> = {};
    marks.forEach((m: any) => {
      if (!studentsByPercentage[m.studentId]) {
        studentsByPercentage[m.studentId] = { obtained: 0, total: 0 };
      }
      studentsByPercentage[m.studentId].obtained += m.obtained;
      studentsByPercentage[m.studentId].total += m.total;
    });

    const studentsPerf = Object.values(studentsByPercentage);
    const passCount = studentsPerf.filter(s => (s.obtained / s.total) >= 0.5).length;
    const overallPassRate = studentsPerf.length > 0 ? (passCount / studentsPerf.length) * 100 : 0;
    const schoolAveragePercentage = totalPossiblePoints > 0 ? (totalObtainedPoints / totalPossiblePoints) * 100 : 0;

    // Subject Performance
    const subjectMap: Record<string, { obtained: number, total: number }> = {};
    marks.forEach((m: any) => {
      if (!subjectMap[m.subject]) {
        subjectMap[m.subject] = { obtained: 0, total: 0 };
      }
      subjectMap[m.subject].obtained += m.obtained;
      subjectMap[m.subject].total += m.total;
    });

    const subjectAverages = Object.entries(subjectMap).map(([subject, stats]) => ({
      subject,
      average: Math.round((stats.obtained / stats.total) * 100)
    }));

    // Class Performance
    const classMap: Record<number, { name: string, obtained: number, total: number }> = {};
    marks.forEach((m: any) => {
      if (!classMap[m.classId]) {
        const cls = classes.find((c: any) => c.id === m.classId);
        classMap[m.classId] = { name: cls?.name || `Class #${m.classId}`, obtained: 0, total: 0 };
      }
      classMap[m.classId].obtained += m.obtained;
      classMap[m.classId].total += m.total;
    });

    const classPerformance = Object.values(classMap).map(c => ({
      name: c.name,
      average: Math.round((c.obtained / c.total) * 100)
    }));

    return NextResponse.json({
      summary: {
        totalStudents: studentsPerf.length,
        overallPassRate: Math.round(overallPassRate),
        schoolAveragePercentage: Math.round(schoolAveragePercentage)
      },
      subjectAverages,
      classPerformance
    });

  } catch (error) {
    console.error('School Analytics API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
