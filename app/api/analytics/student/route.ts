import { NextRequest, NextResponse } from 'next/server';
import { readData } from '@/lib/fileHandler';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = parseInt(searchParams.get('studentId') || '0');

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    const marks = await readData<any>('marks.txt');
    const studentMarks = marks.filter((m: any) => m.studentId === studentId);

    if (studentMarks.length === 0) {
      return NextResponse.json({
        summary: {
          overallPercentage: 0,
          totalObtained: 0,
          totalPossible: 0,
          bestSubject: 'N/A',
          worstSubject: 'N/A'
        },
        subjectWise: [],
        trends: []
      });
    }

    // Subject-wise aggregation
    const subjectsMap: Record<string, any> = {};
    studentMarks.forEach((m: any) => {
      if (!subjectsMap[m.subject]) {
        subjectsMap[m.subject] = {
          subject: m.subject,
          quiz: 0,
          assignment: 0,
          exam: 0,
          obtained: 0,
          total: 0
        };
      }
      
      const type = m.assessmentType.toLowerCase();
      if (type.includes('quiz')) subjectsMap[m.subject].quiz += m.obtained;
      else if (type.includes('assignment')) subjectsMap[m.subject].assignment += m.obtained;
      else if (type.includes('exam')) subjectsMap[m.subject].exam += m.obtained;
      
      subjectsMap[m.subject].obtained += m.obtained;
      subjectsMap[m.subject].total += m.total;
    });

    const subjectWise = Object.values(subjectsMap).map((s: any) => ({
      ...s,
      percentage: s.total > 0 ? Math.round((s.obtained / s.total) * 100) : 0,
      grade: calculateGrade(s.obtained / s.total * 100)
    }));

    // Summary metrics
    const totalObtained = subjectWise.reduce((acc, s) => acc + s.obtained, 0);
    const totalPossible = subjectWise.reduce((acc, s) => acc + s.total, 0);
    const overallPercentage = totalPossible > 0 ? Math.round((totalObtained / totalPossible) * 100) : 0;

    let bestSubject = subjectWise[0];
    let worstSubject = subjectWise[0];
    subjectWise.forEach(s => {
      if (s.percentage > bestSubject.percentage) bestSubject = s;
      if (s.percentage < worstSubject.percentage) worstSubject = s;
    });

    // Trends (Group by date or month)
    const trendsMap: Record<string, number> = {};
    studentMarks.forEach((m: any) => {
      const date = new Date(m.date);
      const month = date.toLocaleString('default', { month: 'short' });
      if (!trendsMap[month]) trendsMap[month] = 0;
      trendsMap[month] = (trendsMap[month] + (m.obtained / m.total * 100)) / 2; // Simple moving average for trend
    });

    return NextResponse.json({
      summary: {
        overallPercentage,
        totalObtained,
        totalPossible,
        bestSubject: bestSubject.subject,
        worstSubject: worstSubject.subject,
        totalSubjects: subjectWise.length
      },
      subjectWise,
      trends: Object.entries(trendsMap).map(([month, value]) => ({ month, value: Math.round(value) }))
    });

  } catch (error) {
    console.error('Student Analytics API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function calculateGrade(percentage: number) {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}
