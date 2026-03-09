import { NextResponse } from 'next/server';
import { readData, writeData, generateId } from '@/lib/fileHandler';

// DELETE a user
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }

    const userId = parseInt(id, 10);
    const users = await readData<any>('users.txt');
    const updatedUsers = users.filter(u => u.id !== userId);

    await writeData('users.txt', updatedUsers);

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

// GET all users (Admin only)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role'); // optional filter by role

    let users = await readData<any>('users.txt');
    
    if (role) {
      users = users.filter(u => u.role === role.toUpperCase());
    }

    const classes = await readData<any>('classes.txt');

    // Attach class info and child info for parents
    users = users.map(u => {
      const uClass = u.classId ? classes.find(c => c.id === u.classId) : undefined;
      let childInfo = undefined;
      if (u.role === 'PARENT' && u.childId) {
        const child = users.find(c => c.id === u.childId);
        if (child) {
          childInfo = { name: child.name, rollNumber: child.rollNumber };
        }
      }
      return {
        ...u,
        class: uClass,
        child: childInfo
      };
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST create a new user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      name, password, role, classId, assignedClassId, childId, subject,
      section, rollNumber, fatherName, motherName, gender, dob,
      contactNumber, parentContactNumber, address, admissionDate, feeStatus, category, scholarshipGrade
    } = body;

    const users = await readData<any>('users.txt');
    
    // Server-side validation
    const roleUpper = role.toUpperCase();
    if (roleUpper === 'STUDENT') {
      const contactPattern = /^[0-9]{11}$/;
      if (contactNumber && !contactPattern.test(contactNumber)) {
        return NextResponse.json({ error: 'Student contact number must be 11 digits' }, { status: 400 });
      }
      if (parentContactNumber && !contactPattern.test(parentContactNumber)) {
        return NextResponse.json({ error: 'Parent contact number must be 11 digits' }, { status: 400 });
      }
    }

    if (roleUpper === 'PARENT') {
      if (!childId) return NextResponse.json({ error: 'Child Student ID is required for Parents' }, { status: 400 });
      const child = users.find(u => u.id === parseInt(childId, 10) && u.role === 'STUDENT');
      if (!child) return NextResponse.json({ error: 'Invalid Student ID provided for Parent' }, { status: 400 });
    }

    if (roleUpper === 'TEACHER') {
      if (!assignedClassId) return NextResponse.json({ error: 'Assigned Class ID is required for Teachers' }, { status: 400 });
      const classes = await readData<any>('classes.txt');
      const classExists = classes.find(c => c.id === parseInt(assignedClassId, 10));
      if (!classExists) return NextResponse.json({ error: 'Invalid Class ID provided for Teacher' }, { status: 400 });
    }

    const newId = await generateId('users.txt');

    const newUser: any = {
      id: newId,
      name,
      password,
      role: role.toUpperCase(),
      classId: classId ? parseInt(classId, 10) : null,
      assignedClassId: assignedClassId ? parseInt(assignedClassId, 10) : null,
      childId: childId ? parseInt(childId, 10) : null,
      subject: subject || null,
      category: category || null, // Added category
      createdAt: new Date().toISOString(),
      ...(role.toUpperCase() === 'STUDENT' && {
        section, rollNumber, fatherName, motherName, gender, dob,
        contactNumber, parentContactNumber, address, admissionDate, feeStatus, scholarshipGrade
      })
    };

    users.push(newUser);
    await writeData('users.txt', users);

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

// PUT update an existing user
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      id, name, password, role, classId, assignedClassId, childId, subject,
      section, rollNumber, fatherName, motherName, gender, dob,
      contactNumber, parentContactNumber, address, admissionDate, feeStatus, category, scholarshipGrade 
    } = body;

    let users = await readData<any>('users.txt');
    const userId = parseInt(id, 10);
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Server-side validation
    const roleUpper = role.toUpperCase();
    if (roleUpper === 'STUDENT') {
      const contactPattern = /^[0-9]{11}$/;
      if (contactNumber && !contactPattern.test(contactNumber)) {
        return NextResponse.json({ error: 'Student contact number must be 11 digits' }, { status: 400 });
      }
      if (parentContactNumber && !contactPattern.test(parentContactNumber)) {
        return NextResponse.json({ error: 'Parent contact number must be 11 digits' }, { status: 400 });
      }
    }

    if (roleUpper === 'PARENT') {
      if (!childId) return NextResponse.json({ error: 'Child Student ID is required for Parents' }, { status: 400 });
      const child = users.find(u => u.id === parseInt(childId, 10) && u.role === 'STUDENT');
      if (!child) return NextResponse.json({ error: 'Invalid Student ID provided for Parent' }, { status: 400 });
    }

    if (roleUpper === 'TEACHER') {
      if (!assignedClassId) return NextResponse.json({ error: 'Assigned Class ID is required for Teachers' }, { status: 400 });
      const classes = await readData<any>('classes.txt');
      const classExists = classes.find(c => c.id === parseInt(assignedClassId, 10));
      if (!classExists) return NextResponse.json({ error: 'Invalid Class ID provided for Teacher' }, { status: 400 });
    }

    const updatedUser = {
      ...users[userIndex],
      name,
      role: role.toUpperCase(),
      classId: classId ? parseInt(classId, 10) : null,
      assignedClassId: assignedClassId ? parseInt(assignedClassId, 10) : null,
      childId: childId ? parseInt(childId, 10) : null,
      subject: subject || null,
      category: category || users[userIndex].category || "Normal",
      ...(role.toUpperCase() === 'STUDENT' && {
        section, rollNumber, fatherName, motherName, gender, dob,
        contactNumber, parentContactNumber, address, admissionDate, feeStatus, scholarshipGrade
      })
    };

    if (password) {
      updatedUser.password = password;
    }

    users[userIndex] = updatedUser;
    await writeData('users.txt', users);

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
