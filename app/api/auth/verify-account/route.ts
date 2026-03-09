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
      const dbId = u.id.toString();
      const dbName = (u.name || "").toString().trim().toLowerCase();
      const dbRoll = (u.rollNumber || "").toString().trim().toLowerCase();

      if (roleUpper === 'STUDENT') {
        identifierMatch = dbRoll === reqIdentifier || dbId === reqIdentifier;
      } else {
        identifierMatch = dbId === reqIdentifier || dbName === reqIdentifier;
      }

      // Debug logging to help identify mismatches on live server
      console.log(`Checking User [${u.id}]: RoleMatch: ${roleMatch}, IdentifierMatch: ${identifierMatch}, ContactMatch: ${contactMatch}`);
      if (roleMatch && identifierMatch && !contactMatch) {
         console.log(`Mismatch details -> ReqContact: "${reqContact}", DBContact: "${dbContact}"`);
      }

      return roleMatch && identifierMatch && contactMatch;
    });

    if (!user) {
      console.log(`Verification failed for: Role: ${roleUpper}, Identifier: ${identifier}, Contact: ${contactNumber}`);
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
