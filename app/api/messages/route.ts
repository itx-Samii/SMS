import { NextResponse } from 'next/server';
import { readData, writeData, generateId } from '@/lib/fileHandler';

/**
 * Messages API
 * Handles fetching and creating notifications/messages
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const userId = searchParams.get('userId');

    let messages = await readData<any>('messages.txt');

    // Filter messages based on recipient if parameters are provided
    if (role || userId) {
      messages = messages.filter((m: any) => {
        const roleMatch = !role || m.recipientRole === role.toUpperCase();
        const userMatch = !userId || m.recipientId === parseInt(userId, 10) || m.recipientId === 'ALL';
        return roleMatch && userMatch;
      });
    }

    // Sort by date descending
    messages.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Fetch messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      senderId, 
      senderName, 
      senderRole, 
      recipientId, 
      recipientRole, 
      title, 
      content,
      type // 'notification' or 'message'
    } = body;

    if (!senderName || !recipientRole || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const messages = await readData<any>('messages.txt');
    
    const newMessage = {
      id: await generateId('messages.txt'),
      senderId,
      senderName,
      senderRole: senderRole?.toUpperCase(),
      recipientId: recipientId === 'ALL' ? 'ALL' : parseInt(recipientId, 10),
      recipientRole: recipientRole?.toUpperCase(),
      title: title || 'New Notification',
      content,
      type: type || 'notification',
      isRead: false,
      createdAt: new Date().toISOString()
    };

    messages.push(newMessage);
    await writeData('messages.txt', messages);

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error('Create message error:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { messageId } = await request.json();
    
    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    const messages = await readData<any>('messages.txt');
    const index = messages.findIndex((m: any) => m.id === parseInt(messageId, 10));

    if (index === -1) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    messages[index].isRead = true;
    await writeData('messages.txt', messages);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update message error:', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}
