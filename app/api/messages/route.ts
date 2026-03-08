import { NextResponse } from 'next/server';
import { readData, writeData, generateId } from '@/lib/fileHandler';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { senderId, receiverId, content } = body;

    if (!senderId || !receiverId || !content) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const messages = await readData<any>('messages.txt');
    const newId = await generateId('messages.txt');

    const newMessage = {
      id: newId,
      senderId: parseInt(senderId, 10),
      receiverId: parseInt(receiverId, 10),
      content,
      createdAt: new Date().toISOString()
    };

    messages.push(newMessage);
    await writeData('messages.txt', messages);

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const otherUserId = searchParams.get('otherUserId');

    if (!userId || !otherUserId) {
      return NextResponse.json({ error: 'Missing userId or otherUserId parameters' }, { status: 400 });
    }

    const uId = parseInt(userId, 10);
    const oId = parseInt(otherUserId, 10);

    const messages = await readData<any>('messages.txt');

    const filteredMessages = messages.filter(
       m => (m.senderId === uId && m.receiverId === oId) || 
            (m.senderId === oId && m.receiverId === uId)
    );

    // Sort by createdAt ascending
    filteredMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return NextResponse.json(filteredMessages);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
