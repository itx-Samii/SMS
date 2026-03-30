import bcrypt from 'bcryptjs';
import fs from 'fs/promises';

async function testLogin(id, password, role) {
    console.log(`Testing Login: ID=${id}, Pass=${password}, Role=${role}`);
    const users = JSON.parse(await fs.readFile('data/users.txt', 'utf8'));
    const userId = parseInt(id, 10);
    
    const user = users.find(u => 
      (u.id === userId || u.name.trim().toLowerCase() === id.trim().toLowerCase()) && 
      u.role === role.toUpperCase()
    );

    if (!user) {
        console.log('❌ User not found');
        return;
    }

    const match = await bcrypt.compare(password, user.password);
    if (match) {
        console.log('✅ Login Successful for:', user.name);
    } else {
        console.log('❌ Password Mismatch');
    }
}

async function runTests() {
    await testLogin('1', 'admin123', 'ADMIN');      // Should work
    await testLogin('admin', 'admin123', 'ADMIN');  // Might fail if name is "System Admin"
    await testLogin('102', 'sara123', 'STUDENT');   // Should work (Sara)
    await testLogin('201', 'teach1', 'TEACHER');    // Should work (Mr. Hamza)
}

runTests().catch(console.error);
