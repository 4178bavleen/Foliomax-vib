// src/controller/fileController.js
'use strict';

const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ExcelJS = require('exceljs');

const redis = require('../lib/redisClient');
const { produce } = require('../lib/kafkaProducer');
const { extractFileId, isGoogleSheets, getFileMetadata, downloadFileAsExcel, fetchAllSheetsData, fetchSheetAsCSV, getAuthClient } = require('../lib/googleDrive');
const { google } = require('googleapis');

const EXCEL_TOPIC = process.env.EXCEL_UPLOADED_TOPIC || 'excel.uploaded';
const REDIS_TTL_SECONDS = Number(process.env.EXCEL_REDIS_TTL_SECONDS || 24 * 3600);

/**
 * Helper: make public URL for a stored file
 */
function toPublicUrl(req, storagePath) {
  const base = `${req.protocol}://${req.get('host')}`;
  return `${base}/${storagePath.replace(/^\/+/, '')}`;
}

/**
 * GET /api/files/:id/parse
 * - Fast path: try redis
 * - Fallback: try disk parsed JSON
 * - For Google Drive/Sheets: fetch fresh data from Sheets API
 * - Last resort: parse synchronously, then write caches in background
 */
exports.parse = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ ok: false, message: 'Invalid id' });

    const rec = await prisma.excelfile.findUnique({
      where: { id },
      select: { 
        id: true, 
        storagePath: true, 
        isDeleted: true,
        driveUrl: true,
        driveFileId: true,
        driveMimeType: true,
      },
    });
    if (!rec || rec.isDeleted) {
      return res.status(404).json({ ok: false, message: 'Not found' });
    }

    // Handle Google Drive/Sheets files - always fetch fresh data
    if (rec.driveUrl && rec.driveFileId && rec.driveMimeType) {
      const isSheet = isGoogleSheets(rec.driveMimeType);
      
      if (isSheet) {
        // For Google Sheets, fetch fresh data from Sheets API (no caching for real-time updates)
        try {
          const sheets = await fetchAllSheetsData(rec.driveFileId);
          return res.json({
            ok: true,
            sheets,
            version: Date.now().toString(),
            source: 'google-sheets-live',
          });
        } catch (sheetsErr) {
          console.error('Google Sheets fetch failed:', sheetsErr);
          return res.status(500).json({ ok: false, message: 'Failed to fetch Google Sheets data' });
        }
      } else {
        // For other Drive files (Excel), download and parse
        try {
          const excelBuffer = await downloadFileAsExcel(rec.driveFileId, rec.driveMimeType);
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(excelBuffer);

          const sheets = [];
          workbook.eachSheet((ws) => {
            const colWidths = (ws.columns || []).map((c) => (c && c.width ? c.width : null));
            const merges = [];
            for (const key of Object.keys(ws._merges || {})) {
              try {
                const m = ws._merges[key];
                merges.push({ range: m.model || key });
              } catch (e) { /* ignore */ }
            }
            const rows = [];
            ws.eachRow({ includeEmpty: true }, (row, rowNumber) => {
              const cells = [];
              const maxCol = Math.max(ws.actualColumnCount || 0, row.cellCount || 0);
              for (let col = 1; col <= Math.max(1, maxCol); col++) {
                const cell = row.getCell(col);
                const raw = cell.value;
                let value = '';
                if (raw === null || raw === undefined) value = '';
                else if (typeof raw === 'object' && raw.hasOwnProperty('text')) value = raw.text;
                else if (typeof raw === 'object' && raw.richText) value = raw.richText.map((rt) => rt.text).join('');
                else value = String(raw);

                let bg = null, color = null, bold = false, italic = false, align = null, numFmt = null;
                try {
                  if (cell.fill && cell.fill.fgColor && cell.fill.fgColor.argb) {
                    const argb = String(cell.fill.fgColor.argb);
                    bg = argb.length === 8 ? `#${argb.slice(-6)}` : `#${argb}`;
                  } else if (cell.fill && cell.fill.bgColor && cell.fill.bgColor.argb) {
                    const argb = String(cell.fill.bgColor.argb);
                    bg = argb.length === 8 ? `#${argb.slice(-6)}` : `#${argb}`;
                  }
                  if (cell.font && cell.font.color && cell.font.color.argb) {
                    const a = String(cell.font.color.argb);
                    color = a.length === 8 ? `#${a.slice(-6)}` : `#${a}`;
                  }
                  if (cell.font && cell.font.bold) bold = true;
                  if (cell.font && cell.font.italic) italic = true;
                  if (cell.alignment) align = cell.alignment.horizontal || null;
                  if (cell.numFmt) numFmt = cell.numFmt;
                } catch (e) { /* ignore */ }

                const isMerged = !!cell.isMerged || !!(cell.master && cell.master.address && cell.master.address !== cell.address);
                cells.push({ r: rowNumber, c: col, value, bg, color, bold, italic, align, numFmt, isMerged, formula: cell.formula || null, rawType: cell.type || null });
              }
              rows.push(cells);
            });
            sheets.push({ name: ws.name, cols: colWidths, merges, rows });
          });

          return res.json({ ok: true, sheets, version: Date.now().toString(), source: 'google-drive-excel' });
        } catch (driveErr) {
          console.error('Google Drive Excel download/parse failed:', driveErr);
          return res.status(500).json({ ok: false, message: 'Failed to fetch Google Drive Excel file' });
        }
      }
    }

    // Traditional local file handling
    if (!rec.storagePath) {
      return res.status(404).json({ ok: false, message: 'File not found' });
    }

    // Resolve absolute path inside public/
    const abs = path.join(process.cwd(), 'public', rec.storagePath.replace(/^\/+/, ''));
    const redisKey = `excel:parsed:${id}`;
    const parsedPath = abs + '.parsed.json';

    // 1) Try Redis cache
    try {
      const cached = await redis.get(redisKey);
      if (cached) {
        const parsedObj = JSON.parse(cached);
        return res.json({
          ok: true,
          cached: true,
          sheets: parsedObj.sheets,
          version: parsedObj.version || null,
        });
      }
    } catch (e) {
      console.warn('redis read failed (continuing):', e && e.message);
    }

    // 2) Try disk cache
    try {
      const txt = await fs.readFile(parsedPath, 'utf8');
      const parsedObj = JSON.parse(txt);
      redis.set(redisKey, JSON.stringify(parsedObj), 'EX', REDIS_TTL_SECONDS).catch(() => {});
      return res.json({
        ok: true,
        cached: false,
        sheets: parsedObj.sheets,
        version: parsedObj.version || null,
      });
    } catch (e) {
      // disk miss -> fallthrough to synchronous parse
    }

    // 3) Synchronous parse (original behavior) -- may be slow first time
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(abs);

    const sheets = [];

    workbook.eachSheet((ws) => {
      // column widths if present
      const colWidths = (ws.columns || []).map((c) => (c && c.width ? c.width : null));

      // collect merged ranges (convert to simple objects)
      const merges = [];
      for (const key of Object.keys(ws._merges || {})) {
        try {
          const m = ws._merges[key];
          merges.push({ range: m.model || key });
        } catch (e) {
          /* ignore */
        }
      }

      const rows = [];
      ws.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        const cells = [];
        const maxCol = Math.max(ws.actualColumnCount || 0, row.cellCount || 0);

        for (let col = 1; col <= Math.max(1, maxCol); col++) {
          const cell = row.getCell(col);

          // Normalize value (fast)
          const raw = cell.value;
          let value = '';
          if (raw === null || raw === undefined) {
            value = '';
          } else if (typeof raw === 'object' && raw.hasOwnProperty('text')) {
            value = raw.text;
          } else if (typeof raw === 'object' && raw.richText) {
            value = raw.richText.map((rt) => rt.text).join('');
          } else if (typeof raw === 'object' && raw.formula) {
            const result = raw.result ?? (cell.text !== undefined ? cell.text : '');
            value = result === null || result === undefined ? '' : String(result);
          } else {
            value = String(raw);
          }

          // parse style (optional, kept from original)
          let bg = null,
            color = null,
            bold = false,
            italic = false,
            align = null,
            numFmt = null;
          try {
            if (cell.fill && cell.fill.fgColor && cell.fill.fgColor.argb) {
              const argb = String(cell.fill.fgColor.argb);
              bg = argb.length === 8 ? `#${argb.slice(-6)}` : `#${argb}`;
            } else if (cell.fill && cell.fill.bgColor && cell.fill.bgColor.argb) {
              const argb = String(cell.fill.bgColor.argb);
              bg = argb.length === 8 ? `#${argb.slice(-6)}` : `#${argb}`;
            }

            if (cell.font && cell.font.color && cell.font.color.argb) {
              const a = String(cell.font.color.argb);
              color = a.length === 8 ? `#${a.slice(-6)}` : `#${a}`;
            }
            if (cell.font && cell.font.bold) bold = true;
            if (cell.font && cell.font.italic) italic = true;
            if (cell.alignment) align = cell.alignment.horizontal || null;
            if (cell.numFmt) numFmt = cell.numFmt;
          } catch (e) {
            // ignore style parse errors
          }

          const isMerged =
            !!cell.isMerged ||
            !!(cell.master && cell.master.address && cell.master.address !== cell.address);

          cells.push({
            r: rowNumber,
            c: col,
            value,
            bg,
            color,
            bold,
            italic,
            align,
            numFmt,
            isMerged,
            formula: cell.formula || null,
            rawType: cell.type || null,
          });
        }
        rows.push(cells);
      });

      sheets.push({
        name: ws.name,
        cols: colWidths,
        merges,
        rows,
      });
    });

    // background: write disk cache + redis (do not block response long)
    const parsedObj = {
      fileId: id,
      version: Date.now().toString(),
      parsedAt: new Date().toISOString(),
      sheets,
    };
    (async () => {
      try {
        const tmp = parsedPath + `.tmp-${process.pid}`;
        await fs.writeFile(tmp, JSON.stringify(parsedObj), 'utf8');
        await fs.rename(tmp, parsedPath);
      } catch (e) {
        console.warn('disk cache write failed', e && e.message);
      }
      try {
        await redis.set(redisKey, JSON.stringify(parsedObj), 'EX', REDIS_TTL_SECONDS);
      } catch (e) {
        console.warn('redis set failed', e && e.message);
      }
    })();

    return res.json({ ok: true, sheets });
  } catch (err) {
    console.error('parse file error:', err);
    return res.status(500).json({ ok: false, message: 'Parse failed', detail: err.message });
  }
};

/**
 * POST /api/files/upload-excel
 * multipart/form-data -> field "file" (+ optional "pageName", "driveUrl")
 * - Create DB record and produce Kafka event for background parsing
 * - If driveUrl provided, fetch metadata from Google Drive
 */
exports.uploadExcel = async (req, res) => {
  try {
    const driveUrl = req.body?.driveUrl?.trim();
    const pageName = req.body?.pageName || null;
    const isPremium = req.body?.isPremium === "true";

    let fileData = {};
    let storagePath = null;

    if (driveUrl) {
      // Handle Google Drive/Sheets URL
      const fileId = extractFileId(driveUrl);
      if (!fileId) {
        return res.status(400).json({ ok: false, message: 'Invalid Google Drive URL' });
      }

      try {
        const metadata = await getFileMetadata(fileId);
        if (!metadata) {
          return res.status(400).json({ ok: false, message: 'Unable to access Google Drive file. Ensure the file is shared with the service account.' });
        }

        const mimeType = metadata.mimeType;
        const isSheet = isGoogleSheets(mimeType);

        fileData = {
          name: req.body?.name?.trim() || metadata.name || 'Google Drive File',
          originalFilename: metadata.name,
          mimeType,
          sizeBytes: metadata.size ? parseInt(metadata.size, 10) : null,
          storagePath: null, // No local storage for Drive files
          isActive: true,
          pageName,
          isPremium,
          driveUrl,
          driveFileId: fileId,
          driveMimeType: mimeType,
        };
      } catch (driveErr) {
        console.error('Google Drive metadata fetch failed:', driveErr);
        return res.status(400).json({ ok: false, message: 'Failed to access Google Drive file. Check permissions.' });
      }
    } else {
      // Traditional file upload
      if (!req.file) {
        return res.status(400).json({
          ok: false,
          message: "No file field named 'file' was sent",
        });
      }

      const { originalname, mimetype, size, filename } = req.file;
      storagePath = `uploads/${filename}`;

      fileData = {
        name: originalname,
        originalFilename: originalname,
        mimeType: mimetype,
        sizeBytes: size,
        storagePath,
        isActive: true,
        pageName,
        isPremium,
        driveUrl: null,
        driveFileId: null,
        driveMimeType: null,
      };
    }

    const fileRec = await prisma.excelfile.create({
      data: { ...fileData, updatedAt: new Date() },
      select: {
        id: true,
        name: true,
        sizeBytes: true,
        storagePath: true,
        createdAt: true,
        pageName: true,
        isPremium: true,
        driveUrl: true,
        driveFileId: true,
        driveMimeType: true,
      },
    });

    // For Drive files, we don't need Kafka parsing worker since we parse on-demand
    // But we still produce event for consistency
    if (!driveUrl) {
      const payload = {
        fileId: fileRec.id,
        storagePath: fileRec.storagePath,
        version: Date.now().toString(),
        uploadedAt: new Date().toISOString(),
        pageName: fileRec.pageName || null,
      };

      produce(EXCEL_TOPIC, fileRec.id, payload)
        .then(() => console.log("Produced excel.uploaded", fileRec.id))
        .catch((e) =>
          console.warn(
            "Kafka produce failed (upload) — continuing",
            e && e.message
          )
        );
    }

    const publicUrl = storagePath ? toPublicUrl(req, storagePath) : null;

    return res.status(201).json({
      ok: true,
      file: {
        id: fileRec.id,
        name: fileRec.name,
        url: publicUrl,
        size: fileRec.sizeBytes,
        uploadedAt: fileRec.createdAt,
        pageName: fileRec.pageName || null,
        isPremium: fileRec.isPremium,
        driveUrl: fileRec.driveUrl,
        driveFileId: fileRec.driveFileId,
        driveMimeType: fileRec.driveMimeType,
      },
    });
  } catch (err) {
    console.error("uploadExcel error:", err);
    return res.status(500).json({
      ok: false,
      message: err.message || "Upload failed",
    });
  }
};

/**
 * GET /api/files
 * Optional query: ?pageName=dashboard
 */
exports.list = async (req, res) => {
  try {
    const { pageName } = req.query;

    const where = { isDeleted: false };
    if (pageName) {
      where.pageName = String(pageName);
    }

    const rows = await prisma.excelfile.findMany({
      where,
      orderBy: { id: 'desc' },
      select: {
        id: true,
        name: true,
        sizeBytes: true,
        storagePath: true,
        createdAt: true,
        pageName: true,
        isPremium: true,
        driveUrl: true,
      },
    });

    const data = rows.map((r) => {
      const isDrive = !r.storagePath && !!r.driveUrl;
      return {
        id: r.id,
        name: r.name,
        url: r.storagePath
          ? toPublicUrl(req, r.storagePath)
          : r.driveUrl || '',
        isDrive,
        editable: !!r.storagePath,
        size: r.sizeBytes ?? undefined,
        uploadedAt: r.createdAt?.toISOString?.() ?? null,
        pageName: r.pageName || null,
        isPremium: r.isPremium || false,
      };
    });

    // keep same shape as before (plain array)
    return res.json(data);
  } catch (err) {
    console.error('list files error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to list files' });
  }
};

/**
 * DELETE /api/files/:id
 * - delete disk file
 * - soft delete DB record
 * - invalidate caches
 */
exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ ok: false, message: 'Invalid id' });
    }

    const file = await prisma.excelfile.findUnique({
      where: { id },
      select: { id: true, storagePath: true, isDeleted: true },
    });

    if (!file || file.isDeleted) {
      return res.status(404).json({ ok: false, message: 'Not found' });
    }

    // Try removing disk file; ignore if already gone
    if (file.storagePath) {
      const abs = path.join(
        process.cwd(),
        'public',
        file.storagePath.replace(/^uploads[\\/]/, 'uploads/'),
      );
      try {
        await fs.unlink(abs);
      } catch (_) {}
      try {
        await fs.unlink(abs + '.parsed.json');
      } catch (_) {}
    }

    // Remove per-sheet csv/meta cache written by the parser worker
    try {
      await fs.rm(path.join(process.cwd(), 'public', 'uploads', 'parsed', String(id)), {
        recursive: true,
        force: true,
      });
    } catch (_) {}

    // invalidate redis
    try {
      await redis.del(`excel:parsed:${id}`);
    } catch (_) {}

    await prisma.excelfile.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('remove file error:', err);
    return res.status(500).json({ ok: false, message: 'Delete failed' });
  }
};

/**
 * PATCH /api/files/:id/overwrite
 * - replace file bytes
 * - update DB size
 * - invalidate cache and produce reparse event
 */
exports.overwrite = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ ok: false, message: 'Invalid id' });
    }
    if (!req.file) {
      return res
        .status(400)
        .json({ ok: false, message: "No file field named 'file' was sent" });
    }

    const rec = await prisma.excelfile.findUnique({
      where: { id },
      select: { id: true, storagePath: true, isDeleted: true },
    });
    if (!rec || rec.isDeleted) {
      return res.status(404).json({ ok: false, message: 'Not found' });
    }
    if (!rec.storagePath) {
      return res.status(400).json({
        ok: false,
        message:
          'Google Drive files cannot be overwritten. Edit the source file in Google Drive instead.',
      });
    }

    const abs = path.join(
      process.cwd(),
      'public',
      rec.storagePath.replace(/^uploads[\\/]/, 'uploads/'),
    );

    // replace file atomically: write temp then rename
    const uploadedBuf = await fs.readFile(req.file.path);
    const tmpPath = `${abs}.tmp-${process.pid}`;
    await fs.writeFile(tmpPath, uploadedBuf);
    await fs.rename(tmpPath, abs);
    // cleanup temp upload
    try {
      await fs.unlink(req.file.path);
    } catch (_) {}

    // Update size in DB
    const stat = await fs.stat(abs);
    await prisma.excelfile.update({
      where: { id },
      data: { sizeBytes: stat.size, isActive: true },
    });

    // Invalidate caches (disk + redis)
    try {
      await fs.unlink(abs + '.parsed.json');
    } catch (_) {}
    try {
      await redis.del(`excel:parsed:${id}`);
    } catch (_) {}

    // Produce reparse event for worker to parse new file in background
    const payload = {
      fileId: id,
      storagePath: rec.storagePath,
      version: Date.now().toString(),
      uploadedAt: new Date().toISOString(),
    };
    produce(EXCEL_TOPIC, id, payload).catch(() => {});

    return res.json({ ok: true });
  } catch (err) {
    console.error('overwrite file error:', err);
    return res.status(500).json({ ok: false, message: 'Overwrite failed' });
  }
};

const MAX_EDIT_ROWS = 20000;
const MAX_EDIT_COLS = 500;
const MAX_EDIT_CELLS = 2000000;

const NUMERIC_RE = /^-?(\d+|\d*\.\d+)([eE][+-]?\d+)?$/;

/**
 * Resolve the string coming from the editor into the value type that the cell
 * already holds, so numeric columns and formulas survive a round-trip.
 */
function coerceCellValue(rawValue, existingCell) {
  if (rawValue === null || rawValue === undefined) return null;
  const asString = String(rawValue);

  const existing = existingCell ? existingCell.value : null;
  const existingIsFormula =
    existing && typeof existing === 'object' && existing.formula;

  if (existingIsFormula) {
    const currentResult = existingCell.result;
    if (String(currentResult ?? '') === asString.trim()) {
      return undefined;
    }
    return asString === '' ? null : asString;
  }

  if (asString === '') return null;

  const existingIsNumber = typeof existing === 'number';
  if (existingIsNumber && NUMERIC_RE.test(asString.trim())) {
    return Number(asString.trim());
  }

  return asString;
}

/**
 * PATCH /api/files/:id/sheets/:sheetIndex
 * body: { rows: string[][] }
 *
 * Writes cell VALUES only, for a single sheet, using ExcelJS. Every other
 * sheet and every style/format/merge in the workbook is left untouched.
 */
exports.updateSheet = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const sheetIndex = Number(req.params.sheetIndex);

    if (Number.isNaN(id)) {
      return res.status(400).json({ ok: false, message: 'Invalid id' });
    }
    if (!Number.isInteger(sheetIndex) || sheetIndex < 0) {
      return res
        .status(400)
        .json({ ok: false, message: 'Invalid sheet index' });
    }

    const rows = req.body?.rows;
    if (!Array.isArray(rows)) {
      return res
        .status(400)
        .json({ ok: false, message: "Body must include a 'rows' array" });
    }
    if (rows.length > MAX_EDIT_ROWS) {
      return res.status(400).json({
        ok: false,
        message: `Too many rows (max ${MAX_EDIT_ROWS})`,
      });
    }

    const width = rows.reduce(
      (m, r) => Math.max(m, Array.isArray(r) ? r.length : 0),
      0,
    );
    if (width > MAX_EDIT_COLS) {
      return res.status(400).json({
        ok: false,
        message: `Too many columns (max ${MAX_EDIT_COLS})`,
      });
    }
    if (rows.length * Math.max(width, 1) > MAX_EDIT_CELLS) {
      return res.status(400).json({
        ok: false,
        message: 'Sheet is too large to save through the editor',
      });
    }

    const rec = await prisma.excelfile.findUnique({
      where: { id },
      select: { id: true, storagePath: true, isDeleted: true },
    });
    if (!rec || rec.isDeleted) {
      return res.status(404).json({ ok: false, message: 'Not found' });
    }
    if (!rec.storagePath) {
      return res.status(400).json({
        ok: false,
        message:
          'Google Drive files cannot be edited here. Edit the source file in Google Drive instead.',
      });
    }

    const abs = path.join(
      process.cwd(),
      'public',
      rec.storagePath.replace(/^uploads[\\/]/, 'uploads/'),
    );

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(abs);

    const ws = wb.worksheets[sheetIndex];
    if (!ws) {
      return res
        .status(404)
        .json({ ok: false, message: `Sheet ${sheetIndex} not found` });
    }

    const prevRowCount = ws.rowCount;
    const prevColCount = ws.columnCount;
    const nextRowCount = Math.max(rows.length, prevRowCount);
    const nextColCount = Math.max(width, prevColCount);

    let written = 0;
    let skippedErrors = 0;

    for (let r = 0; r < nextRowCount; r++) {
      const incoming = Array.isArray(rows[r]) ? rows[r] : null;
      if (!incoming && r >= rows.length) continue;

      const row = ws.getRow(r + 1);
      for (let c = 0; c < nextColCount; c++) {
        const cell = row.getCell(c + 1);
        const raw = incoming && c < incoming.length ? incoming[c] : '';
        const next = coerceCellValue(raw, cell);
        if (next === undefined) continue;
        if (cell.value !== null && cell.value !== undefined && cell.value === next) {
          continue;
        }
        try {
          cell.value = next;
          written++;
        } catch (e) {
          skippedErrors++;
        }
      }
    }

    const tmpPath = `${abs}.tmp-${process.pid}`;
    await wb.xlsx.writeFile(tmpPath);
    await fs.rename(tmpPath, abs);

    const stat = await fs.stat(abs);
    await prisma.excelfile.update({
      where: { id },
      data: { sizeBytes: stat.size, isActive: true },
    });

    try {
      await fs.unlink(abs + '.parsed.json');
    } catch (_) {}
    try {
      await redis.del(`excel:parsed:${id}`);
    } catch (_) {}
    try {
      await fs.rm(
        path.join(process.cwd(), 'public', 'uploads', 'parsed', String(id)),
        { recursive: true, force: true },
      );
    } catch (_) {}

    produce(
      EXCEL_TOPIC,
      id,
      {
        fileId: id,
        storagePath: rec.storagePath,
        version: Date.now().toString(),
        uploadedAt: new Date().toISOString(),
      },
    ).catch(() => {});

    return res.json({
      ok: true,
      sheetIndex,
      sheetName: ws.name,
      writtenCells: written,
      skippedErrors,
    });
  } catch (err) {
    console.error('updateSheet error:', err);
    return res
      .status(500)
      .json({ ok: false, message: err.message || 'Save failed' });
  }
};

function parseCsvLine(line) {
  const out = [];
  if (line == null) return out;
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        // escaped quote -> lookahead
        if (i + 1 < line.length && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        out.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
  }
  out.push(cur);
  return out;
}

/**
 * GET /api/files/:id/sheets/:sheetIndex/meta
 * Returns small JSON meta for a sheet (meta file written by the worker).
 * Response shape: { ok: true, meta: { name, cols, merges, styles } }
 * For Google Drive/Sheets: fetches fresh metadata from Sheets API
 */
exports.getSheetMeta = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const sheetIndex = Number(req.params.sheetIndex || 0);
    if (Number.isNaN(id) || Number.isNaN(sheetIndex))
      return res.status(400).json({ ok: false, message: 'Invalid id or sheetIndex' });

    const rec = await prisma.excelfile.findUnique({
      where: { id },
      select: { 
        id: true, 
        storagePath: true, 
        isDeleted: true,
        driveUrl: true,
        driveFileId: true,
        driveMimeType: true,
      },
    });
    if (!rec || rec.isDeleted)
      return res.status(404).json({ ok: false, message: 'Not found' });

    // Handle Google Drive/Sheets files
    if (rec.driveUrl && rec.driveFileId && rec.driveMimeType) {
      const isSheet = isGoogleSheets(rec.driveMimeType);
      
      if (isSheet) {
        // For Google Sheets, fetch fresh metadata from Sheets API
        try {
          const auth = getAuthClient();
          if (!auth) throw new Error('Google Sheets auth not configured');
          
          const sheets = google.sheets({ version: 'v4', auth });
          const metadata = await sheets.spreadsheets.get({
            spreadsheetId: rec.driveFileId,
            fields: 'sheets.properties(sheetId,title,index,gridProperties(rowCount,columnCount))',
          });

          const sheet = metadata.data.sheets?.[sheetIndex];
          if (!sheet) throw new Error(`Sheet index ${sheetIndex} not found`);

          const meta = {
            name: sheet.properties.title || `Sheet ${sheetIndex + 1}`,
            cols: Array(sheet.properties.gridProperties?.columnCount || 0).fill(null),
            merges: [],
            styles: {},
          };
          return res.json({ ok: true, meta, source: 'google-sheets-live' });
        } catch (metaErr) {
          console.error('Google Sheets meta fetch failed:', metaErr);
          return res.status(500).json({ ok: false, message: 'Failed to fetch Google Sheets metadata' });
        }
      } else {
        // For Excel files on Drive, download and get metadata
        try {
          const excelBuffer = await downloadFileAsExcel(rec.driveFileId, rec.driveMimeType);
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(excelBuffer);

          const targetSheet = workbook.worksheets[sheetIndex] || workbook.worksheets[0];
          if (!targetSheet)
            return res.status(404).json({ ok: false, message: 'Sheet not found' });

          const colWidths = (targetSheet.columns || []).map((c) => (c && c.width ? c.width : null));
          const merges = [];
          for (const key of Object.keys(targetSheet._merges || {})) {
            try {
              const m = targetSheet._merges[key];
              merges.push({ range: m.model || key });
            } catch (e) { /* ignore */ }
          }

          const meta = {
            name: targetSheet.name || `Sheet ${sheetIndex + 1}`,
            cols: colWidths,
            merges,
            styles: {},
          };
          return res.json({ ok: true, meta, source: 'google-drive-excel' });
        } catch (driveErr) {
          console.error('Google Drive Excel meta fetch failed:', driveErr);
          return res.status(500).json({ ok: false, message: 'Failed to fetch Google Drive Excel metadata' });
        }
      }
    }

    // Traditional local file handling
    if (!rec.storagePath)
      return res.status(404).json({ ok: false, message: 'Not found' });

    const parsedDir = path.join(
      process.cwd(),
      'public',
      'uploads',
      'parsed',
      String(id),
    );
    const metaPath = path.join(parsedDir, `sheet-${sheetIndex}.meta.json`);
    const parsedJsonPath = path.join(
      process.cwd(),
      'public',
      rec.storagePath.replace(/^\/+/, '') + '.parsed.json',
    );

    // Try explicit meta file first
    try {
      const txt = await fs.readFile(metaPath, 'utf8');
      const meta = JSON.parse(txt);
      return res.json({ ok: true, meta });
    } catch (e) {
      // continue to fallback
    }

    // Fallback: read parsed.json and construct sparse meta
    try {
      const txt = await fs.readFile(parsedJsonPath, 'utf8');
      const parsedObj = JSON.parse(txt);
      if (parsedObj && Array.isArray(parsedObj.sheets) && parsedObj.sheets[sheetIndex]) {
        const s = parsedObj.sheets[sheetIndex];
        const meta = {
          name: s.name || `Sheet ${sheetIndex + 1}`,
          cols: s.cols || [],
          merges: s.merges || [],
          styles: {}, // sparse map "r,c" => {bg,color,bold,italic}
        };
        try {
          for (const row of s.rows || []) {
            for (const cell of row || []) {
              if (!cell) continue;
              const key = `${cell.r},${cell.c}`;
              const small = {};
              if (cell.bg) small.bg = cell.bg;
              if (cell.color) small.color = cell.color;
              if (cell.bold) small.bold = true;
              if (cell.italic) small.italic = true;
              if (Object.keys(small).length) meta.styles[key] = small;
            }
          }
        } catch (ex) {
          /* ignore style extraction errors */
        }
        return res.json({ ok: true, meta });
      }
    } catch (e) {
      // ignore
    }

    return res.status(404).json({ ok: false, message: 'Meta not found' });
  } catch (err) {
    console.error('getSheetMeta error', err && (err.stack || err.message || err));
    return res.status(500).json({ ok: false, message: 'Failed', detail: err.message });
  }
};

/**
 * GET /api/files/:id/sheets/:sheetIndex/csv?start=0&limit=200
 * Returns rows (value-only) of the CSV chunk created by the worker.
 * Response: { ok: true, rows: [ [cell,...], ... ] }
 *
 * Try streaming sheet-<n>.csv from disk for low memory usage. If that file isn't available,
 * fallback to parsed.json and slice the rows there. As a last resort, do a synchronous workbook parse.
 * For Google Drive/Sheets: fetches CSV export from Drive API
 */
exports.getSheetCsvRange = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const sheetIndex = Number(req.params.sheetIndex || 0);
    if (Number.isNaN(id) || Number.isNaN(sheetIndex))
      return res.status(400).json({ ok: false, message: 'Invalid id or sheetIndex' });

    const start = Math.max(0, Number(req.query.start || 0));
    const limit = Math.max(1, Math.min(10000, Number(req.query.limit || 200)));

    const rec = await prisma.excelfile.findUnique({
      where: { id },
      select: { 
        id: true, 
        storagePath: true, 
        isDeleted: true,
        driveUrl: true,
        driveFileId: true,
        driveMimeType: true,
      },
    });
    if (!rec || rec.isDeleted)
      return res.status(404).json({ ok: false, message: 'Not found' });

    // Handle Google Drive/Sheets files
    if (rec.driveUrl && rec.driveFileId && rec.driveMimeType) {
      const isSheet = isGoogleSheets(rec.driveMimeType);
      
      if (isSheet) {
        // For Google Sheets, fetch CSV export from Drive API
        try {
          const csvData = await fetchSheetAsCSV(rec.driveFileId, sheetIndex);
          const lines = csvData.trim().split('\n');
          const rows = lines.slice(start, start + limit).map(line => parseCsvLine(line));
          return res.json({ ok: true, rows, source: 'google-sheets-csv' });
        } catch (csvErr) {
          console.error('Google Sheets CSV fetch failed:', csvErr);
          return res.status(500).json({ ok: false, message: 'Failed to fetch Google Sheets CSV' });
        }
      } else {
        // For Excel files on Drive, download and parse
        try {
          const excelBuffer = await downloadFileAsExcel(rec.driveFileId, rec.driveMimeType);
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(excelBuffer);

          const targetSheet = workbook.worksheets[sheetIndex] || workbook.worksheets[0];
          if (!targetSheet)
            return res.status(404).json({ ok: false, message: 'Sheet not found' });

          const allRows = [];
          targetSheet.eachRow({ includeEmpty: true }, (row) => {
            const maxCol = Math.max(
              targetSheet.actualColumnCount || 0,
              row.cellCount || 0,
            );
            const arr = [];
            for (let col = 1; col <= Math.max(1, maxCol); col++) {
              const cell = row.getCell(col);
              const raw = cell.value;
              let v = '';
              if (raw == null) v = '';
              else if (typeof raw === 'object') {
                if (raw.richText) v = raw.richText.map((rt) => rt.text).join('') || '';
                else if (raw.text) v = raw.text || '';
                else if (raw.result != null) v = String(raw.result);
                else v = '';
              } else v = String(raw);
              arr.push(v);
            }
            allRows.push(arr);
          });

          const rows = allRows.slice(start, start + limit);
          return res.json({ ok: true, rows, source: 'google-drive-excel-csv' });
        } catch (driveErr) {
          console.error('Google Drive Excel CSV fetch failed:', driveErr);
          return res.status(500).json({ ok: false, message: 'Failed to fetch Google Drive Excel CSV' });
        }
      }
    }

    // Traditional local file handling
    if (!rec.storagePath)
      return res.status(404).json({ ok: false, message: 'Not found' });

    const parsedDir = path.join(
      process.cwd(),
      'public',
      'uploads',
      'parsed',
      String(id),
    );
    const csvPath = path.join(parsedDir, `sheet-${sheetIndex}.csv`);
    const parsedJsonPath = path.join(
      process.cwd(),
      'public',
      rec.storagePath.replace(/^\/+/, '') + '.parsed.json',
    );

    // Try streaming CSV file if present
    try {
      await fs.access(csvPath); // check exists
      const stream = fsSync.createReadStream(csvPath, { encoding: 'utf8' });
      const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

      const rows = [];
      let idx = 0;
      for await (const line of rl) {
        if (idx >= start && rows.length < limit) {
          rows.push(parseCsvLine(line));
        }
        idx++;
        if (rows.length >= limit) break;
      }
      // readline will close stream automatically
      return res.json({ ok: true, rows });
    } catch (e) {
      // CSV not found or access error -> fallback
    }

    // Fallback to parsed.json on disk (value-only rows)
    try {
      const txt = await fs.readFile(parsedJsonPath, 'utf8');
      const parsedObj = JSON.parse(txt);
      if (parsedObj && Array.isArray(parsedObj.sheets) && parsedObj.sheets[sheetIndex]) {
        const s = parsedObj.sheets[sheetIndex];
        const allRows = (s.rows || []).map((row) => {
          if (!Array.isArray(row)) return [];
          return row.map((cell) =>
            cell && cell.value != null ? String(cell.value) : '',
          );
        });
        const rows = allRows.slice(start, start + limit);
        return res.json({ ok: true, rows });
      }
    } catch (e) {
      // ignore
    }

    // Last resort: synchronous parse from the original Excel file (expensive)
    try {
      const abs = path.join(
        process.cwd(),
        'public',
        rec.storagePath.replace(/^\/+/, ''),
      );
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(abs);

      const targetSheet =
        workbook.worksheets[sheetIndex] || workbook.worksheets[0];
      if (!targetSheet)
        return res.status(404).json({ ok: false, message: 'Sheet not found' });

      const allRows = [];
      targetSheet.eachRow({ includeEmpty: true }, (row) => {
        const maxCol = Math.max(
          targetSheet.actualColumnCount || 0,
          row.cellCount || 0,
        );
        const arr = [];
        for (let col = 1; col <= Math.max(1, maxCol); col++) {
          const cell = row.getCell(col);
          const raw = cell.value;
          let v = '';
          if (raw == null) v = '';
          else if (typeof raw === 'object') {
            if (raw.richText) v = raw.richText.map((rt) => rt.text).join('') || '';
            else if (raw.text) v = raw.text || '';
            else if (raw.result != null) v = String(raw.result);
            else v = '';
          } else v = String(raw);
          arr.push(v);
        }
        allRows.push(arr);
      });

      const rows = allRows.slice(start, start + limit);
      return res.json({ ok: true, rows });
    } catch (err) {
      // fall through to not found
    }

    return res
      .status(404)
      .json({ ok: false, message: 'CSV / parsed data not available' });
  } catch (err) {
    console.error(
      'getSheetCsvRange error',
      err && (err.stack || err.message || err),
    );
    return res.status(500).json({ ok: false, message: 'Failed', detail: err.message });
  }
};

/**
 * GET /api/files/count
 * Optional query: ?pageName=dashboard
 */
exports.getCount = async (req, res) => {
  try {
    const { pageName } = req.query;

    const where = { isDeleted: false };
    if (pageName) {
      where.pageName = String(pageName);
    }

    const total = await prisma.excelfile.count({ where });

    return res.json({ ok: true, total });
  } catch (err) {
    console.error('getCount files error:', err);
    return res
      .status(500)
      .json({ ok: false, message: 'Failed to get count' });
  }
};

/**
 * GET /api/files/:id/protected
 * Returns file URL if user has access (checks isPremium + subscription)
 * For Google Drive/Sheets: returns the Drive view URL
 */
exports.getProtectedFile = async (req, res) => {
  try {
    const userId = req.user.id;
    const fileId = Number(req.params.id);

    if (Number.isNaN(fileId)) {
      return res.status(400).json({ ok: false, message: 'Invalid id' });
    }

    const file = await prisma.excelfile.findUnique({
      where: { id: fileId },
      select: {
        id: true,
        name: true,
        storagePath: true,
        isPremium: true,
        isDeleted: true,
        isActive: true,
        driveUrl: true,
        driveFileId: true,
        driveMimeType: true,
      },
    });

    if (!file || file.isDeleted || !file.isActive) {
      return res.status(404).json({ ok: false, message: 'File not found' });
    }

    // If file is premium, check for active subscription
    if (file.isPremium) {
      const subscription = await prisma.usersubscription.findFirst({
        where: {
          userId,
          status: 'ACTIVE',
          endDate: { gte: new Date() },
        },
      });

      if (!subscription) {
        return res.status(403).json({
          ok: false,
          message: 'Subscription required',
        });
      }
    }

    // For Google Drive/Sheets files, return the Drive URL
    if (file.driveUrl && file.driveFileId) {
      // Return the original shareable link for viewing
      // For Sheets, this will open in Google Sheets viewer
      // For Excel files on Drive, this opens in Drive viewer
      return res.json({ ok: true, url: file.driveUrl, source: 'google-drive' });
    }

    // Traditional local file
    if (!file.storagePath) {
      return res.status(404).json({ ok: false, message: 'File not found' });
    }

    const base = `${req.protocol}://${req.get('host')}`;
    const url = `${base}/${file.storagePath.replace(/^\/+/, '')}`;

    return res.json({ ok: true, url, source: 'local' });
  } catch (err) {
    console.error('getProtectedFile error:', err);
    return res.status(500).json({ ok: false, message: 'Failed to get file' });
  }
};
