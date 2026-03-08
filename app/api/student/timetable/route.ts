import { NextResponse } from 'next/server';
import { readData } from '@/lib/fileHandler';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classIdStr = searchParams.get('classId');

    const timetables = await readData<any>('timetable.txt');

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
