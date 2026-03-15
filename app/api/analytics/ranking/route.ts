import { NextRequest, NextResponse } from 'next/server';
import { readData } from '@/lib/fileHandler';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('classId');
    const section = searchParams.get('section');
    const subject = searchParams.get('subject');
    const examType = searchParams.get('examType');

    const marks = await readData<any>('marks.txt');
    const users = await readData<any>('users.txt');

    // Filter relevant marks
    let filteredMarks = marks;
    if (classId) filteredMarks = filteredMarks.filter((m: any) => m.classId === parseInt(classId));
    if (section) filteredMarks = filteredMarks.filter((m: any) => m.section === section);
    if (subject) filteredMarks = filteredMarks.filter((m: any) => m.subject === subject);
    if (examType) filteredMarks = filteredMarks.filter((m: any) => m.assessmentType === examType);

    if (filteredMarks.length === 0) {
      return NextResponse.json([]);
    }

    // Group marks by student
    const studentAggregation: Record<number, any> = {};
    filteredMarks.forEach((m: any) => {
      if (!studentAggregation[m.studentId]) {
        const student = users.find((u: any) => u.id === m.studentId);
        studentAggregation[m.studentId] = {
          studentId: m.studentId,
          name: student?.name || `Student #${m.studentId}`,
          fatherName: student?.fatherName || 'N/A',
          rollNumber: student?.rollNumber || 'N/A',
          obtained: 0,
          total: 0,
        };
      }
      studentAggregation[m.studentId].obtained += m.obtained;
      studentAggregation[m.studentId].total += m.total;
    });

    // Calculate percentage and sort
    const meritList = Object.values(studentAggregation)
      .map((s: any) => ({
        ...s,
        percentage: s.total > 0 ? Math.round((s.obtained / s.total) * 100) : 0,
        grade: calculateGrade(s.obtained / s.total * 100)
      }))
      .sort((a, b) => b.percentage - a.percentage);

    // Assign positions (handling ties)
    let currentPos = 1;
    const rankedList = meritList.map((s, idx) => {
      if (idx > 0 && s.percentage < meritList[idx - 1].percentage) {
        currentPos = idx + 1;
      }
      return { ...s, position: currentPos };
    });

    return NextResponse.json(rankedList);

  } catch (error) {
    console.error('Ranking API Error:', error);
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
