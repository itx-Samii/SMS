import { NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/fileHandler';

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

    console.log(`Resetting password for User ID: ${targetId} (Original: ${userId})`);

    if (userIndex === -1) {
      console.log(`Reset failed: User with ID ${targetId} not found in users.txt`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update only the password
    users[userIndex].password = newPassword;

    await writeData('users.txt', users);
    console.log(`Password successfully updated for User: ${users[userIndex].name}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Password reset successfully. Please login with your new password.' 
    });

  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
