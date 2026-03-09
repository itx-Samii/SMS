import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Helper to get file path
const getFilePath = () => path.join(process.cwd(), 'data', 'messages.txt');

// Helper to read and parse pipe-separated messages
const readMessages = () => {
  try {
    const filePath = getFilePath();
    if (!fs.existsSync(filePath)) return [];
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    
    return lines.map(line => {
      // Format: MessageID|SenderID|SenderName|SenderRole|ReceiverRole|MessageText|DateTime|Status
      const [id, senderId, senderName, senderRole, receiverRole, messageText, dateTime, status] = line.split('|');
      return {
        id: parseInt(id, 10),
        senderId: parseInt(senderId, 10),
        senderName,
        senderRole,
        receiverRole,
        messageText,
        dateTime,
        status
      };
    });
  } catch (error) {
    console.error('Error reading messages:', error);
    return [];
  }
};

// Helper to write messages to pipe-separated format
const writeMessages = (messages: any[]) => {
  try {
    const lines = messages.map(m => 
      `${m.id}|${m.senderId}|${m.senderName}|${m.senderRole}|${m.receiverRole}|${m.messageText}|${m.dateTime}|${m.status}`
    );
    fs.writeFileSync(getFilePath(), lines.join('\n') + '\n', 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing messages:', error);
    return false;
  }
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const receiverRole = searchParams.get('receiverRole');
    
    let messages = readMessages();

    // Filter by receiver role (ALL or specific role)
    if (receiverRole) {
      messages = messages.filter(m => 
        m.receiverRole === 'ALL' || m.receiverRole === receiverRole.toUpperCase()
      );
    }

    // Sort by date descending
    messages.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { senderId, senderName, senderRole, receiverRole, messageText } = body;

    if (!senderId || !senderName || !senderRole || !receiverRole || !messageText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const messages = readMessages();
    const newId = messages.length > 0 ? Math.max(...messages.map(m => m.id)) + 1 : 1;
    
    const now = new Date();
    // Format Date: YYYY-MM-DD HH:MM
    const dateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newMessage = {
      id: newId,
      senderId,
      senderName,
      senderRole,
      receiverRole,
      messageText,
      dateTime,
      status: 'Unread'
    };

    messages.push(newMessage);
    if (!writeMessages(messages)) throw new Error('Failed to write');

    return NextResponse.json(newMessage);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json();
    
    if (!id || !status) {
      return NextResponse.json({ error: 'Message ID and status are required' }, { status: 400 });
    }

    const messages = readMessages();
    const index = messages.findIndex(m => m.id === parseInt(id, 10));

    if (index === -1) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    messages[index].status = status; // e.g., 'Read'
    if (!writeMessages(messages)) throw new Error('Failed to write');

    return NextResponse.json({ success: true, message: messages[index] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    const messages = readMessages();
    const filteredMessages = messages.filter(m => m.id !== parseInt(id, 10));

    if (messages.length === filteredMessages.length) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (!writeMessages(filteredMessages)) throw new Error('Failed to write');

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
