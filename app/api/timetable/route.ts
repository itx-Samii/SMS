import { NextResponse } from 'next/server';
import { readPipeData, writePipeData, generateId } from '@/lib/fileHandler';

const TIMETABLE_HEADERS = ['id', 'classId', 'sectionId', 'day', 'subject', 'teacherId', 'startTime', 'endTime', 'room', 'status'];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const teacherId = searchParams.get('teacherId');
    
    let entries = await readPipeData<any>('timetable.txt', TIMETABLE_HEADERS);
    
    if (classId) {
      entries = entries.filter(e => e.classId === parseInt(classId));
    }
    if (teacherId) {
      entries = entries.filter(e => e.teacherId === parseInt(teacherId));
    }
    
    return NextResponse.json(entries);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch timetable' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { classId, sectionId, day, startTime, endTime, teacherId } = body;
    
    if (!classId || !sectionId || !day || !startTime || !endTime || !teacherId) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const entries = await readPipeData<any>('timetable.txt', TIMETABLE_HEADERS);
    
    // Convert times to comparable numbers (e.g., "08:00" -> 800)
    const newStart = parseInt(startTime.replace(':', ''));
    const newEnd = parseInt(endTime.replace(':', ''));

    // Check for overlap in same class/section/day
    const overlap = entries.find(e => {
      if (e.day !== day) return false;
      if (e.classId !== parseInt(classId) || e.sectionId !== sectionId) return false;
      
      const eStart = parseInt(e.startTime.replace(':', ''));
      const eEnd = parseInt(e.endTime.replace(':', ''));
      
      return (newStart < eEnd && newEnd > eStart);
    });

    if (overlap) {
      return NextResponse.json({ error: 'Time overlap detected for this class/section' }, { status: 400 });
    }

    // Check for teacher overlap
    const teacherOverlap = entries.find(e => {
      if (e.day !== day) return false;
      if (e.teacherId !== parseInt(teacherId)) return false;
      
      const eStart = parseInt(e.startTime.replace(':', ''));
      const eEnd = parseInt(e.endTime.replace(':', ''));
      
      return (newStart < eEnd && newEnd > eStart);
    });

    if (teacherOverlap) {
      return NextResponse.json({ error: 'Teacher is already scheduled during this time' }, { status: 400 });
    }

    const newId = await generateId('timetable.txt', TIMETABLE_HEADERS);
    const newEntry = { ...body, id: newId };
    
    await writePipeData('timetable.txt', [...entries, newEntry], TIMETABLE_HEADERS);
    return NextResponse.json(newEntry);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save timetable' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const entries = await readPipeData<any>('timetable.txt', TIMETABLE_HEADERS);
    const filtered = entries.filter(e => e.id !== parseInt(id));
    
    await writePipeData('timetable.txt', filtered, TIMETABLE_HEADERS);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
    try {
      const body = await request.json();
      const { id } = body;
      if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
  
      const entries = await readPipeData<any>('timetable.txt', TIMETABLE_HEADERS);
      const index = entries.findIndex(e => e.id === parseInt(id));
      if (index === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  
      // Overlap check for update (excluding self)
      const { classId, sectionId, day, startTime, endTime, teacherId } = { ...entries[index], ...body };
      const newStart = parseInt(startTime.replace(':', ''));
      const newEnd = parseInt(endTime.replace(':', ''));
  
      const otherEntries = entries.filter(e => e.id !== parseInt(id));
  
      const overlap = otherEntries.find(e => {
        if (e.day !== day) return false;
        if (e.classId !== parseInt(classId) || e.sectionId !== sectionId) return false;
        const eStart = parseInt(e.startTime.replace(':', ''));
        const eEnd = parseInt(e.endTime.replace(':', ''));
        return (newStart < eEnd && newEnd > eStart);
      });
  
      if (overlap) return NextResponse.json({ error: 'Time overlap detected' }, { status: 400 });

      const teacherOverlap = otherEntries.find(e => {
        if (e.day !== day) return false;
        if (e.teacherId !== parseInt(teacherId)) return false;
        const eStart = parseInt(e.startTime.replace(':', ''));
        const eEnd = parseInt(e.endTime.replace(':', ''));
        return (newStart < eEnd && newEnd > eStart);
      });
  
      if (teacherOverlap) return NextResponse.json({ error: 'Teacher is already scheduled' }, { status: 400 });
  
      entries[index] = { ...entries[index], ...body };
      await writePipeData('timetable.txt', entries, TIMETABLE_HEADERS);
      return NextResponse.json(entries[index]);
    } catch (err) {
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
  }
