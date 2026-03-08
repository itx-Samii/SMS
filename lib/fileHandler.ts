import fs from 'fs/promises';
import path from 'path';

// Base directory for our TXT "database" files
const DATA_DIR = path.join(process.cwd(), 'data');

/**
 * Ensures a file exists, creating it with an empty JSON array if it doesn't.
 */
async function ensureFileExists(filePath: string) {
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, '[]', 'utf8');
  }
}

/**
 * Reads data from a TXT file.
 * Returns an array of records.
 */
export async function readData<T>(fileName: string): Promise<T[]> {
  const filePath = path.join(DATA_DIR, fileName);
  await ensureFileExists(filePath);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const parsedData = JSON.parse(data || '[]');
    
    // Seed default admin if users file is empty
    if (fileName === 'users.txt' && parsedData.length === 0) {
      const defaultAdmin = [{
        id: 1,
        name: "System Admin",
        password: "admin",
        role: "ADMIN",
        createdAt: new Date().toISOString()
      }];
      await fs.writeFile(filePath, JSON.stringify(defaultAdmin, null, 2), 'utf8');
      return defaultAdmin as unknown as T[];
    }
    
    return parsedData;
  } catch (err) {
    console.error(`Error reading ${fileName}:`, err);
    return [];
  }
}

/**
 * Writes data back to a TXT file.
 */
export async function writeData<T>(fileName: string, data: T[]): Promise<void> {
  const filePath = path.join(DATA_DIR, fileName);
  await ensureFileExists(filePath);
  try {
    // Automatically sort by ID if the property exists
    const sortedData = [...data].sort((a: any, b: any) => {
      if (a.id && b.id) return a.id - b.id;
      return 0;
    });
    await fs.writeFile(filePath, JSON.stringify(sortedData, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing to ${fileName}:`, err);
    throw new Error(`Failed to save data to ${fileName}`);
  }
}

/**
 * Generates an auto-incrementing ID for a new record based on the file contents.
 */
export async function generateId(fileName: string): Promise<number> {
  const data = await readData<{ id: number }>(fileName);
  if (data.length === 0) return 1;
  const maxId = Math.max(...data.map(item => item.id || 0));
  return maxId + 1;
}

/**
 * Utility: Drop all records in a file (for development/testing)
 */
export async function clearData(fileName: string): Promise<void> {
  await writeData(fileName, []);
}

/**
 * Reads pipe-separated data from a TXT file.
 */
export async function readPipeData<T>(fileName: string, headers: string[]): Promise<T[]> {
  const filePath = path.join(DATA_DIR, fileName);
  // Ensure file exists with empty string instead of [] for pipe data
  try { await fs.access(filePath); } catch { await fs.writeFile(filePath, '', 'utf8'); }
  
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const lines = data.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const parts = line.split('|');
      const obj: any = {};
      headers.forEach((header, i) => {
        let val: any = parts[i] || "";
        // Convert to number if possible, but keep string if it starts with 0 (like roll numbers sometimes)
        if (!isNaN(val as any) && val !== "" && !val.startsWith('0')) {
          val = parseFloat(val);
        }
        obj[header] = val;
      });
      return obj as T;
    });
  } catch (err) {
    console.error(`Error reading pipe ${fileName}:`, err);
    return [];
  }
}

/**
 * Writes pipe-separated data to a TXT file.
 */
export async function writePipeData<T>(fileName: string, data: T[], headers: string[]): Promise<void> {
  const filePath = path.join(DATA_DIR, fileName);
  try {
    const sortedData = [...data].sort((a: any, b: any) => (a.id && b.id) ? a.id - b.id : 0);
    const lines = sortedData.map(item => {
      return headers.map(header => (item as any)[header] ?? "").join('|');
    });
    await fs.writeFile(filePath, lines.join('\n'), 'utf8');
  } catch (err) {
    console.error(`Error writing pipe ${fileName}:`, err);
    throw new Error(`Failed to save pipe data to ${fileName}`);
  }
}
