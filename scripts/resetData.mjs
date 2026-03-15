import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

const filesToReset = [
  'assignment_submissions.txt',
  'assignments.txt',
  'attendance.txt',
  'classes.txt',
  'documents.txt',
  'fees.txt',
  'marks.txt',
  'messages.txt',
  'notices.txt',
  'notifications.txt',
  'results.txt',
  'subjects.txt',
  'timetable.txt'
];

async function resetData() {
  console.log('Starting global data reset...');

  // 1. Reset all utility data files to empty array
  for (const file of filesToReset) {
    const filePath = path.join(DATA_DIR, file);
    try {
      await fs.writeFile(filePath, '[]', 'utf8');
      console.log(`Reset ${file}`);
    } catch (err) {
      console.error(`Failed to reset ${file}:`, err);
    }
  }

  // 2. Special reset for users.txt (Keep Admin Only)
  const usersPath = path.join(DATA_DIR, 'users.txt');
  const hashed121212 = "$2b$10$.dGxXrA50I2M7Lm0RhX22uSpy4/EMv3h4dxn2BiyBodgrOxTUgGca";
  const defaultAdmin = [{
    id: 1,
    name: "System Admin",
    password: hashed121212,
    role: "ADMIN",
    contactNumber: "03000000000",
    createdAt: new Date().toISOString()
  }];

  try {
    await fs.writeFile(usersPath, JSON.stringify(defaultAdmin, null, 2), 'utf8');
    console.log('Reset users.txt (Admin preserved)');
  } catch (err) {
    console.error('Failed to reset users.txt:', err);
  }

  console.log('Data reset complete. System is now in a clean state.');
}

resetData();
