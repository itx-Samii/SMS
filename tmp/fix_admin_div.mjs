import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const filePath = 'e:/Third Semester/School Managment System/web-app/app/admin/dashboard/page.tsx';

let content = readFileSync(filePath, 'utf8');

// The Marks block is buggy.
// 944:                     </tbody>
// 945:               </table>
// 946:             )}
// 947: 
// It needs a </div> before 946.

const marksBroken = '                    </tbody>\n               </table>\n             )}';
const marksFixed = '                    </tbody>\n               </table>\n             </div>\n           )}';

// Also check for double <> just in case, though the previous script should have handled it.
// Wait, the previous view_file showed:
// 900:            {activeTab === "marks" && (
// 901:              <div className="table-container animate-fade-in">
// 902:                <div className="table-header"><span>Marks Management List</span></div>
// 903:                <table>
// 904:                     <thead>

// Actually, looking at the previous view_file output:
// 944:                     </tbody>
// 945:               </table>
// 946:             )}

// Let's do a more robust replacement.
const lines = content.replace(/\r\n/g, '\n').split('\n');

// Find the line that starts the marks block
const marksStartIdx = lines.findIndex(l => l.includes('{activeTab === "marks" && ('));
if (marksStartIdx !== -1) {
  // Find the next </table> after marksStartIdx
  let tableEndIdx = -1;
  for (let i = marksStartIdx; i < lines.length; i++) {
    if (lines[i].includes('</table>')) {
      tableEndIdx = i;
      break;
    }
  }
  
  if (tableEndIdx !== -1) {
    // Check if the next line is )}
    if (lines[tableEndIdx + 1].includes(')}')) {
      console.log('Found the marks closing block. Inserting missing div closing tag.');
      lines.splice(tableEndIdx + 1, 0, '             </div>');
      content = lines.join('\n');
      writeFileSync(filePath, content, 'utf8');
      console.log('Successfully fixed the marks section closing tag.');
    } else {
      console.log('The line after </table> is not )}. It is:', lines[tableEndIdx + 1]);
    }
  } else {
    console.log('Could not find the end of the marks table.');
  }
} else {
  console.log('Could not find the start of the marks block.');
}
