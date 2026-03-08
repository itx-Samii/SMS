import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = join(__dirname, '..', 'app', 'admin', 'dashboard', 'page.tsx');

let content = readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
const lines = content.split('\n');

let changes = 0;

// Fix 1: Remove extra <> at lines 903-904 (0-indexed: 902-903)
// Line 903 (idx 902): "                <table>"
// Line 904 (idx 903): "                  <>"
// Line 905 (idx 904): "                   <>"
// => Keep only "<table>" and remove the two <>
if (lines[902] && lines[902].includes('<table>') && 
    lines[903] && lines[903].trim() === '<>' &&
    lines[904] && lines[904].trim() === '<>') {
  console.log('Found double <> at lines 904-905, removing them...');
  lines.splice(903, 2); // remove lines 904 and 905 (0-indexed 903 and 904)
  changes++;
  console.log('Removed double fragments');
} else {
  console.log('Double <> not found at expected location.');
  console.log('Lines 902-906:', lines.slice(901, 907).map((l, i) => `${902+i}: ${JSON.stringify(l)}`).join('\n'));
}

// After splice, find the marks closing fragment and fix it
// Look for lines containing "</>" inside the marks section followed by ")}" and "</table>"
for (let i = 900; i < Math.min(lines.length, 960); i++) {
  if (lines[i] && lines[i].trim() === '</>' && 
      lines[i+1] && lines[i+1].trim() === ')}' &&
      lines[i+2] && lines[i+2].trim() === '</table>') {
    console.log(`Found marks closing structure at lines ${i+1}-${i+3}, fixing...`);
    // Remove the bare </> and )} that are remnants of the old fragment-inside-table pattern
    lines.splice(i, 2); // remove </> and )}
    changes++;
    console.log('Fixed marks closing');
    break;
  }
}

if (changes > 0) {
  writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log(`SUCCESS: Applied ${changes} fix(es).`);
} else {
  console.log('No changes were needed or could be applied.');
}

// Verification dump
const updated = readFileSync(filePath, 'utf8').split('\n');
console.log('\nVerification - lines around marks section:');
for (let i = 899; i < Math.min(updated.length, 955); i++) {
  if (updated[i]) console.log(`${i+1}: ${updated[i]}`);
}
