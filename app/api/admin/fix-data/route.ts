import { NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/fileHandler';

/**
 * Data Patching Utility
 * Manually ensures the System Admin has the registered contact number 
 * for the Forgot Password system.
 */
export async function GET() {
  try {
    const users = await readData<any>('users.txt');
    const admin = users.find(u => u.id === 1 && u.role === 'ADMIN');
    
    if (!admin) {
      return NextResponse.json({ error: 'System Admin (ID: 1) not found in records' }, { status: 404 });
    }

    // Assign the recovery number
    admin.contactNumber = "03000000000";

    await writeData('users.txt', users);

    return NextResponse.json({ 
      success: true, 
      message: 'System Admin recovery contact (03000000000) has been patched successfully!',
      admin: {
          id: admin.id,
          name: admin.name,
          role: admin.role,
          contactNumber: admin.contactNumber
      }
    });

  } catch (error) {
    console.error('Patch error:', error);
    return NextResponse.json({ error: 'Failed to patch data' }, { status: 500 });
  }
}
