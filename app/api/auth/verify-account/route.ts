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

    // Find user by role and identifier (ID, Roll Number, or Name)
    const user = users.find((u: any) => {
      const roleMatch = u.role === roleUpper;
      
      // Trim and normalize inputs
      const reqIdentifier = identifier.toString().trim().toLowerCase();
      const reqContact = contactNumber.toString().trim();
      
      const dbContact = (u.contactNumber || "").toString().trim();
      const contactMatch = dbContact === reqContact;
      
      let identifierMatch = false;
      if (roleUpper === 'STUDENT') {
        // Students: check Roll Number or ID
        const dbRoll = (u.rollNumber || "").toString().trim().toLowerCase();
        const dbId = u.id.toString();
        identifierMatch = dbRoll === reqIdentifier || dbId === reqIdentifier;
      } else {
        // Others: check ID or Name
        const dbId = u.id.toString();
        const dbName = (u.name || "").toString().trim().toLowerCase();
        identifierMatch = dbId === reqIdentifier || dbName === reqIdentifier;
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
