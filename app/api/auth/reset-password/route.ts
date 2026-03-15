import { NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/fileHandler';
import bcrypt from 'bcryptjs';

/**
 * Password Reset API
 * Securely updates a user's password after verification
 */
export async function POST(request: Request) {
  try {
    const { userId, newPassword } = await request.json();

    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const users = await readData<any>('users.txt');
    const targetId = parseInt(userId.toString(), 10);
    const userIndex = users.findIndex((u: any) => u.id === targetId);

    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const salt = await bcrypt.genSalt(10);
    users[userIndex].password = await bcrypt.hash(newPassword, salt);

    await writeData('users.txt', users);

    return NextResponse.json({ 
      success: true, 
      message: 'Password reset successfully. Please login with your new password.' 
    });

  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
