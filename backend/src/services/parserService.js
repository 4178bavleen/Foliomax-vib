const fs = require('fs');
const readline = require('readline');
const path = require('path');

async function streamCsvRange(fileId, sheetIndex, start = 0, limit = 100) {
  const csvPath = path.join(process.cwd(), 'public', 'uploads', 'parsed', String(fileId), `sheet-${sheetIndex}.csv`);
  // return { rows: [ [cell1, cell2], ... ], endOfFile: boolean }
  return new Promise((resolve, reject) => {
    const rs = fs.createReadStream(csvPath, { encoding: 'utf8' });
    const rl = readline.createInterface({ input: rs, crlfDelay: Infinity });

    const rows = [];
    let idx = 0;
    rl.on('line', (line) => {
      if (idx >= start && rows.length < limit) {
        // simple CSV split — if your CSV cells might include commas/newlines wrapped in quotes,
        // use a proper CSV parser (fast-csv or papaparse) on the line.
        const cells = parseCsvLine(line);
        rows.push(cells);
      }
      idx++;
      if (rows.length >= limit) {
        rl.close();
        rs.destroy();
      }
    });
    rl.on('close', () => resolve({ rows, totalSeen: idx }));
    rl.on('error', reject);
  });
}

// Minimal CSV splitter for simple CSVs (non-robust). Replace with a proper parser if necessary.
function parseCsvLine(line) {
  // for robustness prefer a library; simple split by comma otherwise
  // quick naive fallback:
  return line.split(',').map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));
}

module.exports = { streamCsvRange };
