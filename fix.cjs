const fs = require('fs');

// Read the original script.js
const js = fs.readFileSync('C:\\Users\\ratan\\Desktop\\next React\\djratan.js\\script.js', 'utf8');

const startIndex = js.indexOf('var arr = [');
if (startIndex !== -1) {
  let arrayStr = js.substring(startIndex + 'var arr = '.length);
  const lastBracket = arrayStr.lastIndexOf(']');
  arrayStr = arrayStr.substring(0, lastBracket + 1);

  // Evaluate to get the actual array
  let arr = new Function('return ' + arrayStr)();

  // Filter out any quotes that cause invalid unicode issues
  // We can just keep basic english and hindi without any weird control characters
  arr = arr.map(s => {
    if (typeof s !== 'string') return '';
    // Replace all non-printable control characters and line separators safely
    // \u2028 and \u2029 cause Vite build issues inside JSON stringified arrays
    let clean = s.replace(/[\x00-\x1F\x7F-\x9F\u2028\u2029]/g, '');
    return clean.trim();
  }).filter(s => s.length > 0);

  const safeStr = JSON.stringify(arr, null, 2);
  fs.writeFileSync('C:\\Users\\ratan\\Desktop\\Github-Wise\\chhaviram1242\\email-card-view\\src\\lib\\quotes.ts', 'export const quotes: string[] = ' + safeStr + ';\n', 'utf8');
  console.log('Successfully extracted quotes to src/lib/quotes.ts');
} else {
  console.log('Could not find var arr = [');
}
