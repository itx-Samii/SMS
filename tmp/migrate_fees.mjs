import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const dataDir = join(process.cwd(), 'web-app', 'data');
const feesPath = join(dataDir, 'fees.txt');

if (!existsSync(feesPath)) {
    console.log('fees.txt does not exist, skipping migration.');
    process.exit(0);
}

const content = readFileSync(feesPath, 'utf8');
const lines = content.split('\n').filter(line => line.trim());

// Old format: ID|StudentID|ClassID|SectionID|Month-Year|TotalFee|PaidFee|RemainingFee|Status
// New format: ID|StudentID|ClassID|SectionID|Month|Year|TotalFee|PaidFee|RemainingFee|Status

const migratedLines = lines.map(line => {
    const parts = line.split('|');
    if (parts.length === 9) {
        // This is the old format (id, studentId, classId, sectionId, month-year, total, paid, remaining, status)
        const monthYear = parts[4]; // e.g. "March-2026"
        let [month, year] = monthYear.split('-');
        if (!year) {
            // Default to current year if something went wrong
            month = monthYear;
            year = "2026";
        }
        
        const newParts = [
            parts[0], // ID
            parts[1], // StudentID
            parts[2], // ClassID
            parts[3], // SectionID
            month,    // Month
            year,     // Year
            parts[5], // Total
            parts[6], // Paid
            parts[7], // Remaining
            parts[8]  // Status
        ];
        return newParts.join('|');
    }
    return line; // Already migrated or unknown format
});

writeFileSync(feesPath, migratedLines.join('\n'), 'utf8');
console.log(`Migrated ${migratedLines.length} fee records to the new schema.`);
