import { NextResponse } from 'next/server';
import { readData } from '@/lib/fileHandler';

/**
 * Account Verification API
 * Validates role, ID (or Roll Number), and Contact Number against users.txt
 */
export async function POST(request: Request) {
  try {
    const { role, identifier, contactNumber } = await request.json();

    if (!role || !identifier || !contactNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const users = await readData<any>('users.txt');
    const roleUpper = role.toUpperCase();

    // Find user by role and either ID (numeric) or Roll Number (for students)
    const user = users.find((u: any) => {
      const roleMatch = u.role === roleUpper;
      const contactMatch = u.contactNumber === contactNumber;
      
      let identifierMatch = false;
      if (roleUpper === 'STUDENT') {
        // Students can be found by Roll Number or ID
        identifierMatch = u.rollNumber === identifier || u.id.toString() === identifier;
      } else {
        // Others by ID
        identifierMatch = u.id.toString() === identifier;
      }

      return roleMatch && identifierMatch && contactMatch;
    });

    if (!user) {
      return NextResponse.json({ error: 'Account not found or contact number incorrect' }, { status: 404 });
    }

    // Return limited info for verification success
    return NextResponse.json({ 
      success: true, 
      userId: user.id,
      name: user.name 
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
