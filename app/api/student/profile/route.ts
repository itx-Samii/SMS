import { NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/fileHandler';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, password } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const userId = parseInt(id, 10);
    const users = await readData<any>('users.txt');
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
       return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedUser = { ...users[userIndex], name };

    if (password) {
      updatedUser.password = password;
    }

    users[userIndex] = updatedUser;
    await writeData('users.txt', users);

    return NextResponse.json({ id: updatedUser.id, name: updatedUser.name, role: updatedUser.role, classId: updatedUser.classId });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
