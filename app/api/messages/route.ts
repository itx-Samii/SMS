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
      // Format: MessageID|SenderID|SenderName|SenderRole|ReceiverID|ReceiverRole|Audience|Title|MessageBody|DateTime|Priority|Status
      const parts = line.split('|');
      
      // Handle legacy 9-field format or new 12-field format
      if (parts.length === 9) {
        const [id, senderName, senderRole, audience, title, messageText, dateTime, priority, status] = parts;
        return {
          id: parseInt(id, 10),
          senderId: "1", // Default to admin for legacy
          senderName,
          senderRole,
          receiverId: "0",
          receiverRole: audience === 'ALL' ? 'Everyone' : audience,
          audience: audience === 'ALL' ? 'Everyone' : audience,
          title,
          messageText,
          dateTime,
          priority: priority || 'Normal',
          status
        };
      }

      const [id, senderId, senderName, senderRole, receiverId, receiverRole, audience, title, messageText, dateTime, priority, status] = parts;
      return {
        id: parseInt(id, 10),
        senderId,
        senderName,
        senderRole,
        receiverId,
        receiverRole,
        audience,
        title,
        messageText,
        dateTime,
        priority: priority || 'Normal',
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
      `${m.id}|${m.senderId}|${m.senderName}|${m.senderRole}|${m.receiverId}|${m.receiverRole}|${m.audience}|${m.title}|${m.messageText}|${m.dateTime}|${m.priority}|${m.status}`
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
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');
    
    let messages = readMessages();

    // Strict role-based filtering
    if (role && userId) {
      const upperRole = role.toUpperCase();
      messages = messages.filter(m => {
        // 1. Message sent to "Everyone"
        if (m.audience === 'Everyone') return true;
        
        // 2. Message sent to specific role
        if (m.audience === 'Admins' && upperRole === 'ADMIN') return true;
        if (m.audience === 'Teachers' && upperRole === 'TEACHER') return true;
        if (m.audience === 'Students' && upperRole === 'STUDENT') return true;
        if (m.audience === 'Parents' && upperRole === 'PARENT') return true;
        
        // 3. Message sent specifically to this user
        if (m.audience === 'SpecificUser' && m.receiverId === userId.toString()) return true;
        
        // 4. Message SENT BY this user (so they can see their own sent messages in inbox/outbox history)
        if (m.senderId === userId.toString()) return true;

        return false;
      });
    } else if (role === 'ADMIN') {
        // Fallback for admin if only role is provided
        // (Admin typically sees all or at least all admin targeted + everyone)
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
    const { senderId, senderName, senderRole, receiverId, receiverRole, audience, title, messageText, priority } = body;

    if (!senderName || !senderRole || !audience || !title || !messageText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const messages = readMessages();
    const newId = messages.length > 0 ? Math.max(...messages.map(m => m.id)) + 1 : 1;
    
    const now = new Date();
    // Format Date: YYYY-MM-DD HH:MM
    const dateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Clean up text replacing newlines with spaces for pipe delimiting, or literal \n
    const safeMessageText = messageText.replace(/\n/g, '\\n').replace(/\|/g, '');
    const safeTitle = title.replace(/\|/g, '');

    const newMessage = {
      id: newId,
      senderId: senderId || "1",
      senderName,
      senderRole,
      receiverId: receiverId || "0",
      receiverRole: receiverRole || audience,
      audience,
      title: safeTitle,
      messageText: safeMessageText,
      dateTime,
      priority: priority || 'Normal',
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
