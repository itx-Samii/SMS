import { NextResponse } from 'next/server';
import { readData, writeData, generateId } from '@/lib/fileHandler';

// GET all notices
export async function GET() {
  try {
    const notices = await readData<any>('notices.txt');
    // Sort by createdAt descending
    notices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return NextResponse.json(notices);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notices' }, { status: 500 });
  }
}

// POST create a new notice (Admin only)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, targetAudience } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const notices = await readData<any>('notices.txt');
    const newId = await generateId('notices.txt');

    const newNotice = {
      id: newId,
      title,
      content,
      targetAudience: targetAudience || 'ALL', // e.g., ALL, STUDENTS, TEACHERS, PARENTS
      createdAt: new Date().toISOString()
    };

    notices.push(newNotice);
    await writeData('notices.txt', notices);

    return NextResponse.json(newNotice, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create notice' }, { status: 500 });
  }
}

// DELETE a notice (Admin only)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
       return NextResponse.json({ error: 'Missing notice ID' }, { status: 400 });
    }

    const noticeId = parseInt(id, 10);
    const notices = await readData<any>('notices.txt');
    const updatedNotices = notices.filter(n => n.id !== noticeId);

    await writeData('notices.txt', updatedNotices);

    return NextResponse.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete notice' }, { status: 500 });
  }
}
