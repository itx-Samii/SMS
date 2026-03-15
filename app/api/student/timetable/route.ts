import { NextResponse } from 'next/server';
import { readPipeData } from '@/lib/fileHandler';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classIdStr = searchParams.get('classId');
    const headers = ['id', 'classId', 'sectionId', 'day', 'subject', 'teacherId', 'startTime', 'endTime', 'room', 'status'];

    const timetables = await readPipeData<any>('timetable.txt', headers);

    if (classIdStr) {
      const classId = parseInt(classIdStr, 10);
      const filtered = timetables.filter(t => t.classId === classId);
      return NextResponse.json(filtered);
    }

    return NextResponse.json(timetables);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch timetable' }, { status: 500 });
  }
}
