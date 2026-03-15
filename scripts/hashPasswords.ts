import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.txt');

async function hashExistingPasswords() {
  console.log('--- Starting Password Migration ---');
  
  if (!fs.existsSync(USERS_FILE)) {
    console.error('users.txt not found!');
    return;
  }

  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    const users = JSON.parse(data || '[]');
    let updateCount = 0;

    for (const user of users) {
      // bcrypt hashes normally start with $2a$ or $2b$
      if (user.password && !user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
        console.log(`Hashing password for user: ${user.name} (ID: ${user.id})`);
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        updateCount++;
      }
    }

    if (updateCount > 0) {
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
      console.log(`Successfully migrated ${updateCount} passwords.`);
    } else {
      console.log('No passwords needed migration.');
    }

  } catch (error) {
    console.error('Error during migration:', error);
  }
  
  console.log('--- Migration Completed ---');
}

hashExistingPasswords();
