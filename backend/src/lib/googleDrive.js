'use strict';

const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/spreadsheets.readonly'];

let authClient = null;

function getAuthClient() {
  if (authClient) return authClient;

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const projectId = process.env.GOOGLE_SERVICE_ACCOUNT_PROJECT_ID;

  if (!clientEmail || !privateKey) {
    console.warn('[googleDrive] Service account credentials not configured');
    return null;
  }

  authClient = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES,
  });

  return authClient;
}

function extractFileId(url) {
  if (!url) return null;

  const patterns = [
    /[?&]id=([a-zA-Z0-9-_]+)/,
    /\/d\/([a-zA-Z0-9-_]+)/,
    /\/file\/d\/([a-zA-Z0-9-_]+)/,
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function isGoogleSheets(mimeType) {
  return mimeType === 'application/vnd.google-apps.spreadsheet';
}

async function getFileMetadata(fileId) {
  const auth = getAuthClient();
  if (!auth) throw new Error('Google Drive auth not configured');

  const drive = google.drive({ version: 'v3', auth });
  const res = await drive.files.get({
    fileId,
    fields: 'id,name,mimeType,modifiedTime,size',
  });
  return res.data;
}

async function downloadFileAsExcel(fileId, mimeType) {
  const auth = getAuthClient();
  if (!auth) throw new Error('Google Drive auth not configured');

  const drive = google.drive({ version: 'v3', auth });

  let exportMimeType = mimeType;
  if (isGoogleSheets(mimeType)) {
    exportMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }

  const res = await drive.files.export(
    { fileId, mimeType: exportMimeType },
    { responseType: 'arraybuffer' }
  );

  return Buffer.from(res.data);
}

async function fetchSheetData(fileId, sheetIndex = 0) {
  const auth = getAuthClient();
  if (!auth) throw new Error('Google Sheets auth not configured');

  const sheets = google.sheets({ version: 'v4', auth });

  const metadata = await sheets.spreadsheets.get({
    spreadsheetId: fileId,
    fields: 'sheets.properties(sheetId,title,index,gridProperties(rowCount,columnCount))',
  });

  const sheet = metadata.data.sheets?.[sheetIndex];
  if (!sheet) throw new Error(`Sheet index ${sheetIndex} not found`);

  const sheetTitle = sheet.properties.title;
  const range = `'${sheetTitle}'`;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: fileId,
    range,
    majorDimension: 'ROWS',
    valueRenderOption: 'FORMATTED_VALUE',
  });

  const rows = res.data.values || [];

  const cols = sheet.properties.gridProperties?.columnCount || 0;
  const colWidths = Array(cols).fill(null);

  return {
    name: sheetTitle,
    cols: colWidths,
    merges: [],
    rows: rows.map((row, rIdx) => {
      const maxCol = Math.max(cols, row.length);
      return Array.from({ length: maxCol }, (_, cIdx) => ({
        r: rIdx + 1,
        c: cIdx + 1,
        value: row[cIdx] ?? '',
        bg: null,
        color: null,
        bold: false,
        italic: false,
        align: null,
        numFmt: null,
        isMerged: false,
        formula: null,
        rawType: 'string',
      }));
    }),
  };
}

async function fetchAllSheetsData(fileId) {
  const auth = getAuthClient();
  if (!auth) throw new Error('Google Sheets auth not configured');

  const sheets = google.sheets({ version: 'v4', auth });

  const metadata = await sheets.spreadsheets.get({
    spreadsheetId: fileId,
    fields: 'sheets.properties(sheetId,title,index,gridProperties(rowCount,columnCount))',
  });

  const allSheets = [];

  for (const sheet of metadata.data.sheets || []) {
    const sheetTitle = sheet.properties.title;
    const range = `'${sheetTitle}'`;

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: fileId,
      range,
      majorDimension: 'ROWS',
      valueRenderOption: 'FORMATTED_VALUE',
    });

    const rows = res.data.values || [];
    const cols = sheet.properties.gridProperties?.columnCount || 0;

    allSheets.push({
      name: sheetTitle,
      cols: Array(cols).fill(null),
      merges: [],
      rows: rows.map((row, rIdx) => {
        const maxCol = Math.max(cols, row.length);
        return Array.from({ length: maxCol }, (_, cIdx) => ({
          r: rIdx + 1,
          c: cIdx + 1,
          value: row[cIdx] ?? '',
          bg: null,
          color: null,
          bold: false,
          italic: false,
          align: null,
          numFmt: null,
          isMerged: false,
          formula: null,
          rawType: 'string',
        }));
      }),
    });
  }

  return allSheets;
}

async function fetchSheetAsCSV(fileId, sheetIndex = 0) {
  const auth = getAuthClient();
  if (!auth) throw new Error('Google Sheets auth not configured');

  const drive = google.drive({ version: 'v3', auth });

  const res = await drive.files.export(
    { fileId, mimeType: 'text/csv' },
    { responseType: 'text' }
  );

  return res.data;
}

module.exports = {
  getAuthClient,
  extractFileId,
  isGoogleSheets,
  getFileMetadata,
  downloadFileAsExcel,
  fetchSheetData,
  fetchAllSheetsData,
  fetchSheetAsCSV,
};