import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Helper to get file path
const getFilePath = () => path.join(process.cwd(), 'data', 'notifications.txt');

// Helper to read and parse pipe-separated notifications
const readNotifications = () => {
  try {
    const filePath = getFilePath();
    if (!fs.existsSync(filePath)) return [];
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    
    return lines.map(line => {
      // Format: NotificationID|Title|Description|DateTime|Status
      const [id, title, description, dateTime, status] = line.split('|');
      return {
        id: parseInt(id, 10),
        title,
        description,
        dateTime,
        status
      };
    });
  } catch (error) {
    console.error('Error reading notifications:', error);
    return [];
  }
};

// Helper to write notifications to pipe-separated format
const writeNotifications = (notifications: any[]) => {
  try {
    const lines = notifications.map(n => 
      `${n.id}|${n.title}|${n.description}|${n.dateTime}|${n.status}`
    );
    fs.writeFileSync(getFilePath(), lines.join('\n') + '\n', 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing notifications:', error);
    return false;
  }
};

export async function GET() {
  try {
    const notifications = readNotifications();

    // Sort by date descending
    notifications.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

    return NextResponse.json(notifications);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const notifications = readNotifications();
    const newId = notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) + 1 : 1;
    
    const now = new Date();
    // Format Date: YYYY-MM-DD HH:MM
    const dateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newNotification = {
      id: newId,
      title,
      description,
      dateTime,
      status: 'Unread'
    };

    notifications.push(newNotification);
    if (!writeNotifications(notifications)) throw new Error('Failed to write');

    return NextResponse.json(newNotification);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json();
    
    if (!id || !status) {
      return NextResponse.json({ error: 'Notification ID and status are required' }, { status: 400 });
    }

    const notifications = readNotifications();
    const index = notifications.findIndex(n => n.id === parseInt(id, 10));

    if (index === -1) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    notifications[index].status = status; // e.g., 'Read'
    if (!writeNotifications(notifications)) throw new Error('Failed to write');

    return NextResponse.json({ success: true, notification: notifications[index] });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    const notifications = readNotifications();
    const filteredNotifications = notifications.filter(n => n.id !== parseInt(id, 10));

    if (notifications.length === filteredNotifications.length) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (!writeNotifications(filteredNotifications)) throw new Error('Failed to write');

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}
