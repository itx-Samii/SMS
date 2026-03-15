const fs = require('fs');
const path = 'e:/Third Semester/School Managment System/web-app/app/components/DashboardLayout.tsx';
let content = fs.readFileSync(path, 'utf8');

// Remove the corrupted line specifically
content = content.replace(/.*userRole=\{currentUser\?\.role \|\| " \\\}.*\r?\n/g, '');

// Handle potential duplicates or formatting issues
// Ensure userRole is present exactly once
if (!content.includes('userRole={currentUser?.role || ""')) {
    content = content.replace(/onMarkRead=\{markMessageRead\}/, 'onMarkRead={markMessageRead}\n                  userRole={currentUser?.role || ""}');
}

fs.writeFileSync(path, content);
console.log('Cleanup complete');
