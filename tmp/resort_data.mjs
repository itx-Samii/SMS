import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

async function resortJsonFile(fileName) {
  const filePath = path.join(DATA_DIR, fileName);
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(content || '[]');
    if (!Array.isArray(data)) return;
    
    const sorted = [...data].sort((a, b) => (a.id || 0) - (b.id || 0));
    await fs.writeFile(filePath, JSON.stringify(sorted, null, 2), 'utf8');
    console.log(`Resorted ${fileName}`);
  } catch (err) {
    console.error(`Failed to resort ${fileName}:`, err.message);
  }
}

async function resortAttendance() {
  const filePath = path.join(DATA_DIR, 'attendance.txt');
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.trim().split('\n').filter(l => l.trim());
    if (lines.length === 0) return;
    
    const records = lines.map(line => {
      const parts = line.split('|');
      return { id: parseInt(parts[0]), line };
    });
    
    records.sort((a, b) => a.id - b.id);
    const sortedContent = records.map(r => r.line).join('\n');
    await fs.writeFile(filePath, sortedContent, 'utf8');
    console.log(`Resorted attendance.txt`);
  } catch (err) {
    console.error(`Failed to resort attendance.txt:`, err.message);
  }
}

async function main() {
  const files = await fs.readdir(DATA_DIR);
  for (const file of files) {
    if (file === 'attendance.txt') {
      await resortAttendance();
    } else if (file.endsWith('.txt') && file !== 'attendance.txt') {
      await resortJsonFile(file);
    }
  }
}

await main();
