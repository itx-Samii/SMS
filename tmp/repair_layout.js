const fs = require('fs');
const path = 'e:/Third Semester/School Managment System/web-app/app/components/DashboardLayout.tsx';
let content = fs.readFileSync(path, 'utf8');

// The corrupted line looks like: onMarkRead={markMessageRead} userRole={currentUser?.role || " \}
// We want to restore it to:
//                   onMarkRead={markMessageRead}
//                   userRole={currentUser?.role || ""}

const searchPattern = /.*onMarkRead=\{markMessageRead\}.*/;
const replacement = '                  onMarkRead={markMessageRead}\n                  userRole={currentUser?.role || ""}';

if (searchPattern.test(content)) {
    content = content.replace(searchPattern, replacement);
    fs.writeFileSync(path, content);
    console.log('File repaired successfully');
} else {
    console.log('Pattern not found');
}
