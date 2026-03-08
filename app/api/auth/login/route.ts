import { NextResponse } from 'next/server';
import { readData } from '@/lib/fileHandler';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, password, role } = body;

    // We'll use ID to login as it was in the desktop app
    if (!id || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const userId = parseInt(id, 10);
    // Remove strict isNaN check to allow name-based login

    const users = await readData<any>('users.txt');
    const user = users.find(u => 
      (u.id === userId || u.name === id) && 
      u.password === password && 
      u.role === role.toUpperCase()
    );

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    let className = undefined;
    if (user.classId) {
      const classes = await readData<any>('classes.txt');
      const stdClass = classes.find(c => c.id === user.classId);
      if (stdClass) className = stdClass.name;
    }

    // Return user info (excluding password)
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        class: className,
        assignedClassId: user.assignedClassId,
        childId: user.childId
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
