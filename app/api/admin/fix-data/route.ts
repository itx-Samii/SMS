import { NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/fileHandler';
import bcrypt from 'bcryptjs';

/**
 * DATABASE FIX-UP API (Admin Diagnostics)
 * Use this to ensure all passwords are hashed and the admin account is correctly set.
 */
export async function GET() {
  try {
    const users = await readData<any>('users.txt');
    let fixCount = 0;
    const salt = await bcrypt.genSalt(10);
    const hashed121212 = await bcrypt.hash('121212', salt);

    // 1. Ensure Admin exists and has a known hashed password
    let admin = users.find((u: any) => u.id === 1 || u.role === 'ADMIN');
    if (admin) {
      if (!admin.password.startsWith('$2') || admin.password === '121212') {
        admin.password = hashed121212;
        admin.name = "System Admin"; // Normalize name
        fixCount++;
      }
    } else {
      // Create admin if missing
      users.push({
        id: 1,
        name: "System Admin",
        password: hashed121212,
        role: "ADMIN",
        contactNumber: "03000000000",
        createdAt: new Date().toISOString()
      });
      fixCount++;
    }

    // 2. Hash any other plain text passwords
    for (let user of users) {
      if (user.password && !user.password.startsWith('$2')) {
        user.password = await bcrypt.hash(user.password, salt);
        fixCount++;
      }
    }

    if (fixCount > 0) {
      await writeData('users.txt', users);
      return NextResponse.json({ 
        message: `Database fixed successfully. ${fixCount} entries updated.`,
        details: {
          totalUsers: users.length,
          adminFound: !!admin,
          hashedPasswords: users.filter((u:any) => u.password && u.password.startsWith('$2')).length,
          plainPasswords: users.filter((u:any) => u.password && !u.password.startsWith('$2')).length
        },
        systemStatus: "Ready"
      });
    }

    return NextResponse.json({ 
      message: "Database is already in a healthy state.",
      details: {
        totalUsers: users.length,
        adminFound: !!admin,
        hashedPasswords: users.filter((u:any) => u.password && u.password.startsWith('$2')).length,
        plainPasswords: users.filter((u:any) => u.password && !u.password.startsWith('$2')).length
      },
      systemStatus: "Healthy"
    });

  } catch (error: any) {
    console.error('Fix-data error:', error);
    return NextResponse.json({ error: 'Failed to fix data', detail: error.message }, { status: 500 });
  }
}
