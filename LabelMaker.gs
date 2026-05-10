/**
 * ============================================================
 * Avery Label Generator — LabelMaker.gs
 * ============================================================
 *
 * Generates a Google Doc formatted for Avery label sheets using
 * address data from a Google Sheet. Supports 8 label formats
 * (5160, 5260, 5161, 5162, 5163, 5164, 5167, 5195).
 *
 * HOW TO USE:
 * 1. Put label text in the configured column (default: column B, starting at B2).
 *    Each cell should contain the full label with line breaks via CHAR(10), e.g.:
 *      =A2&CHAR(10)&B2&CHAR(10)&C2
 *
 * 2. Open Extensions → Apps Script, add Config.gs, LabelSpecs.gs, LabelMaker.gs.
 *
 * 3. Reload the sheet — use the Avery Labels menu to run.
 *
 * 4. Print the generated Google Doc:
 *    - Scale: 100% (NO "fit to page")
 *    - Paper: Letter (8.5 x 11)
 *    - Start from page 2 (page 1 is the summary)
 *
 * FILES:
 *   Config.gs     — column/row settings
 *   LabelSpecs.gs — dimensions and font settings per Avery format
 *   LabelMaker.gs — this file; all document generation logic
 * ============================================================
 */

function onOpen() {
  const menu = SpreadsheetApp.getUi().createMenu('Avery Labels');
  menu.addItem('Avery 5160 — address (2.625" × 1", 30/sheet)',         'createLabels_5160');
  menu.addItem('Avery 5260 — address (2.625" × 1", 30/sheet)',         'createLabels_5260');
  menu.addItem('Avery 5161 — address (4" × 1", 20/sheet)',             'createLabels_5161');
  menu.addItem('Avery 5162 — address (4" × 1.33", 14/sheet)',          'createLabels_5162');
  menu.addItem('Avery 5163 — shipping (4" × 2", 10/sheet)',            'createLabels_5163');
  menu.addItem('Avery 5164 — shipping (4" × 3.33", 6/sheet)',          'createLabels_5164');
  menu.addItem('Avery 5167 — return address (1.75" × 0.5", 80/sheet)', 'createLabels_5167');
  menu.addItem('Avery 5195 — organization (1.75" × 0.67", 60/sheet)',  'createLabels_5195');
  menu.addSeparator();
  menu.addItem('All formats in one document',                           'createLabelsAllFormats');
  menu.addToUi();
}

function onInstall(e) {
  onOpen(e);
}

// One wrapper per format — Apps Script menu items require named top-level functions.
function createLabels_5160() { createLabels('5160'); }
function createLabels_5260() { createLabels('5260'); }
function createLabels_5161() { createLabels('5161'); }
function createLabels_5162() { createLabels('5162'); }
function createLabels_5163() { createLabels('5163'); }
function createLabels_5164() { createLabels('5164'); }
function createLabels_5167() { createLabels('5167'); }
function createLabels_5195() { createLabels('5195'); }

// =============================================================
// Single-format entry point
// =============================================================

function createLabels(selectedLabelType) {
  const spec = LABEL_SPECS[selectedLabelType];
  if (!spec) {
    throw new Error(`Unknown label type: ${selectedLabelType}. Available: ${Object.keys(LABEL_SPECS).join(', ')}`);
  }

  const sheet = SpreadsheetApp.getActiveSheet();
  const sheetName = sheet.getName();
  const data = readLabelData(sheet);
  const dateTimeStr = formatDateTime(new Date());

  Logger.log(`📋 Starting label generation from sheet: "${sheetName}"`);
  Logger.log(`✓ Found ${data.length} labels to process`);

  const docName = `Avery Labels - ${sheetName} - ${selectedLabelType} - ${dateTimeStr}`;
  Logger.log(`📄 Creating document: "${docName}"`);

  const doc = DocumentApp.create(docName);
  const body = doc.getBody();

  // Page 1: summary. Normal margins so the summary reads cleanly.
  // The mandatory Google Docs leading paragraph lives here, keeping it
  // off the label pages entirely.
  body.setMarginTop(72);
  body.setMarginBottom(72);
  body.setMarginLeft(72);
  body.setMarginRight(72);

  buildSummaryPage(body, data, sheetName, selectedLabelType, spec, dateTimeStr);

  // Page 2+: labels. Switch to Avery margins before appending the table.
  // The page break from buildSummaryPage() ensures label rows start at the
  // correct top margin with no leading paragraph offset.
  body.setMarginTop(spec.marginTopPt);
  body.setMarginBottom(spec.marginBottomPt);
  body.setMarginLeft(spec.marginLeftPt);
  body.setMarginRight(spec.marginRightPt);

  appendLabelRows(body, data, spec);

  Logger.log(`📊 Document contains ~${Math.ceil(data.length / spec.labelsPerPage)} label page(s)`);

  doc.saveAndClose();
  const docUrl = doc.getUrl();
  Logger.log(`✅ SUCCESS! Document created: ${docUrl}`);

  showDocumentLink(docUrl, 'Labels created!');
  return docUrl;
}

// =============================================================
// All-formats entry point
// =============================================================

function createLabelsAllFormats() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const sheetName = sheet.getName();
  const data = readLabelData(sheet);
  const dateTimeStr = formatDateTime(new Date());

  Logger.log(`📋 All-formats run: ${data.length} labels from "${sheetName}"`);

  const docName = `Avery Labels - ${sheetName} - All Formats - ${dateTimeStr}`;
  const doc = DocumentApp.create(docName);
  const body = doc.getBody();

  const formatKeys = Object.keys(LABEL_SPECS);
  for (let f = 0; f < formatKeys.length; f++) {
    const spec = LABEL_SPECS[formatKeys[f]];
    const labelPages = Math.ceil(data.length / spec.labelsPerPage);

    Logger.log(`⚙️  Writing ${spec.name} (~${labelPages} page(s))`);

    // Header page — normal margins so text reads cleanly.
    body.setMarginTop(72);
    body.setMarginBottom(72);
    body.setMarginLeft(72);
    body.setMarginRight(72);

    buildFormatHeaderPage(body, spec, data.length, labelPages, dateTimeStr, sheetName, f === 0);

    // Label pages — switch to this format's Avery margins.
    body.setMarginTop(spec.marginTopPt);
    body.setMarginBottom(spec.marginBottomPt);
    body.setMarginLeft(spec.marginLeftPt);
    body.setMarginRight(spec.marginRightPt);

    appendLabelRows(body, data, spec);

    // Page break between formats (not after the last one).
    if (f < formatKeys.length - 1) {
      body.appendParagraph('');
      body.appendPageBreak();
    }
  }

  doc.saveAndClose();
  const docUrl = doc.getUrl();
  Logger.log(`✅ All-formats document created: ${docUrl}`);

  showDocumentLink(docUrl, 'Labels created!');
}

// =============================================================
// Document building
// =============================================================

/**
 * Appends a full set of label rows to body for the given data and spec.
 * Used by both single-format and all-formats flows.
 *
 * Labels are laid out in a single borderless table. Spacer cells between
 * label cells provide the column gap. Row height matches spec.heightPt so
 * Google Docs' natural pagination aligns rows to each new label sheet
 * without explicit page breaks (which caused blank pages when a table ended
 * exactly at the bottom of a page).
 */
function appendLabelRows(body, data, spec) {
  const usableWidthPt = spec.widthPt - spec.paddingLeftPt - spec.paddingRightPt;
  const table = createLabelTable(body);

  for (let i = 0; i < data.length; i += spec.columnsPerRow) {
    const row = table.appendTableRow();
    if (typeof row.setMinimumHeight === 'function') row.setMinimumHeight(spec.heightPt);
    if (typeof row.setAllowBreakAcrossPages === 'function') row.setAllowBreakAcrossPages(false);

    for (let c = 0; c < spec.columnsPerRow; c++) {
      const text = data[i + c] || '';

      const cell = row.appendTableCell(text);
      cell.setWidth(spec.widthPt);
      cell.setVerticalAlignment(DocumentApp.VerticalAlignment.TOP);
      if (typeof cell.setBorderWidth === 'function') cell.setBorderWidth(0);
      if (typeof cell.setBorderColor === 'function') cell.setBorderColor('#ffffff');
      cell.setPaddingTop(spec.paddingTopPt);
      cell.setPaddingBottom(spec.paddingBottomPt);
      cell.setPaddingLeft(spec.paddingLeftPt);
      cell.setPaddingRight(spec.paddingRightPt);
      // appendTableCell splits \n into paragraphs. Without zeroing their
      // spacing, accumulated paragraph spacing pushes rows past spec.heightPt,
      // causing fewer rows per page than the label sheet expects.
      setCellParagraphSpacing(cell);

      if (c < spec.columnsPerRow - 1) {
        const spacer = row.appendTableCell('');
        spacer.setWidth(spec.columnGapPt);
        if (typeof spacer.setBorderWidth === 'function') spacer.setBorderWidth(0);
        if (typeof spacer.setBorderColor === 'function') spacer.setBorderColor('#ffffff');
        setCellParagraphSpacing(spacer);
      }

      if (text) {
        const fontSize = pickFontSizeToAvoidWrap(text, usableWidthPt, spec);
        const edit = cell.editAsText();
        edit.setFontFamily('Arial');
        edit.setFontSize(fontSize);
      }
    }
  }
}

function buildSummaryPage(body, data, sheetName, labelType, spec, dateTimeStr) {
  const labelPages = Math.ceil(data.length / spec.labelsPerPage);

  // Reuse the mandatory leading paragraph Google Docs inserts into every new doc.
  const title = body.getParagraphs()[0];
  title.editAsText().setText('Avery Label Print Summary');
  title.setHeading(DocumentApp.ParagraphHeading.HEADING1);

  const addPara = (text, bold) => {
    const p = body.appendParagraph(text);
    p.setHeading(DocumentApp.ParagraphHeading.NORMAL);
    if (bold) p.editAsText().setBold(true);
    return p;
  };

  addPara('Before you print — avoid wasting a label sheet:', true);
  addPara('  1. Print starting from page 2. This page is not a label page.');
  addPara('  2. Set print scale to exactly 100%. Do NOT use "Fit to page".');
  addPara('  3. Set paper size to Letter (8.5 × 11 in).');
  addPara('  4. Do a test print on plain paper first. Hold it up to a label sheet against a window to check alignment before printing on labels.');
  addPara('  5. Review any warnings at the bottom of this page before printing.');

  addPara('');
  addPara(`Generated: ${dateTimeStr}`);
  addPara(`Source sheet: ${sheetName}`);
  addPara(`Label type: Avery ${labelType}`);
  addPara(`Total labels: ${data.length}`);
  addPara(`Label pages: ${labelPages} (print starting from page 2)`);

  // Recipients by state
  const byState = {};
  data.forEach(text => {
    const lastLine = text.split('\n').filter(Boolean).pop() || '';
    const m = lastLine.match(/,\s*([A-Z]{2})\s+[\d-]+$/);
    if (m) byState[m[1]] = (byState[m[1]] || 0) + 1;
  });
  addPara('');
  addPara('Recipients by state:', true);
  appendColumnarTable(body, Object.keys(byState).sort().map(k => `${k}: ${byState[k]}`), 3);

  // Recipients by city, state
  const byCity = {};
  data.forEach(text => {
    const lastLine = text.split('\n').filter(Boolean).pop() || '';
    const m = lastLine.match(/^(.+),\s*([A-Z]{2})\s+[\d-]+$/);
    if (m) {
      const key = `${m[1].trim()}, ${m[2]}`;
      byCity[key] = (byCity[key] || 0) + 1;
    }
  });
  addPara('');
  addPara('Recipients by city:', true);
  appendColumnarTable(body, Object.keys(byCity).sort().map(k => `${k}: ${byCity[k]}`), 3);

  // Warning: single-line labels (likely missing address lines)
  const singles = data.map((text, i) => ({ i, text })).filter(({ text }) => text.split('\n').length === 1);
  if (singles.length > 0) {
    addPara('');
    addPara(`⚠️  Labels with only one line — possible missing address (${singles.length}):`, true);
    singles.forEach(({ i, text }) => addPara(`  Label ${i + 1}: "${text}"`));
  }

  // Warning: missing ZIP code
  const noZip = data.map((text, i) => ({ i, text })).filter(({ text }) => {
    const lastLine = text.split('\n').filter(Boolean).pop() || '';
    return !/\d{5}/.test(lastLine);
  });
  if (noZip.length > 0) {
    addPara('');
    addPara(`⚠️  Labels with missing or invalid ZIP code (${noZip.length}):`, true);
    noZip.forEach(({ i, text }) => {
      const lastLine = text.split('\n').filter(Boolean).pop() || '';
      addPara(`  Label ${i + 1}: "${lastLine}"`);
    });
  }

  // appendPageBreak() requires a paragraph as the last body element —
  // it throws if called after a table.
  body.appendParagraph('');
  body.appendPageBreak();
}

function buildFormatHeaderPage(body, spec, totalLabels, labelPages, dateTimeStr, sheetName, isFirst) {
  // For the first format, reuse the mandatory leading paragraph rather than
  // appending a new one (avoids a blank line at the top of the document).
  let title;
  if (isFirst) {
    title = body.getParagraphs()[0];
    title.editAsText().setText(spec.name);
  } else {
    title = body.appendParagraph(spec.name);
  }
  title.setHeading(DocumentApp.ParagraphHeading.HEADING1);

  const addPara = (text, bold) => {
    const p = body.appendParagraph(text);
    p.setHeading(DocumentApp.ParagraphHeading.NORMAL);
    if (bold) p.editAsText().setBold(true);
    return p;
  };

  addPara(`${spec.widthPt / 72}" × ${(spec.heightPt / 72).toFixed(3)}" — ${spec.columnsPerRow} columns × ${spec.rowsPerPage} rows — ${spec.labelsPerPage} labels/sheet`);
  addPara('');
  addPara(`Source sheet: ${sheetName}`);
  addPara(`Generated: ${dateTimeStr}`);
  addPara(`Total labels: ${totalLabels}`);
  addPara(`Label pages: ${labelPages}`);
  addPara('');
  addPara('Print instructions:', true);
  addPara('  • Scale: 100% — do NOT use "Fit to page"');
  addPara('  • Paper: Letter (8.5 × 11 in)');
  addPara('  • Labels start on the next page');

  body.appendParagraph('');
  body.appendPageBreak();
}

// =============================================================
// Table helpers
// =============================================================

function createLabelTable(body) {
  const table = body.appendTable();
  if (typeof table.setBorderWidth === 'function') table.setBorderWidth(0);
  if (typeof table.setBorderColor === 'function') table.setBorderColor('#ffffff');
  if (typeof table.setBorderStyle === 'function') table.setBorderStyle(DocumentApp.BorderStyle.NONE);
  return table;
}

function appendColumnarTable(body, items, numCols) {
  if (items.length === 0) {
    body.appendParagraph('  (none)').setHeading(DocumentApp.ParagraphHeading.NORMAL);
    return;
  }
  const table = body.appendTable();
  if (typeof table.setBorderWidth === 'function') table.setBorderWidth(0);
  const rowCount = Math.ceil(items.length / numCols);
  for (let r = 0; r < rowCount; r++) {
    const row = table.appendTableRow();
    for (let c = 0; c < numCols; c++) {
      const text = items[r + c * rowCount] || '';
      const cell = row.appendTableCell(text);
      if (typeof cell.setBorderWidth === 'function') cell.setBorderWidth(0);
      cell.setPaddingTop(1);
      cell.setPaddingBottom(1);
      cell.setPaddingLeft(4);
      cell.setPaddingRight(4);
      setCellParagraphSpacing(cell);
      if (text) cell.editAsText().setFontSize(10);
    }
  }
}

function setCellParagraphSpacing(cell) {
  for (let i = 0; i < cell.getNumChildren(); i++) {
    const child = cell.getChild(i);
    if (child.getType() === DocumentApp.ElementType.PARAGRAPH) {
      child.asParagraph().setAttributes({
        [DocumentApp.Attribute.SPACING_BEFORE]: 0,
        [DocumentApp.Attribute.SPACING_AFTER]: 0,
        [DocumentApp.Attribute.LINE_SPACING]: 1.0
      });
    }
  }
}

// =============================================================
// Font sizing
// =============================================================

/**
 * Returns the largest font size at which every line of text fits within
 * maxWidthPt * spec.fontSizeBuffer points. Falls back to spec.fontSizeMin
 * if nothing fits or the hard character limit is exceeded.
 */
function pickFontSizeToAvoidWrap(text, maxWidthPt, spec) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  if (spec.hardCharacterLimit && lines.some(l => l.length > spec.hardCharacterLimit)) {
    return spec.fontSizeMin;
  }

  for (let fontSize = spec.fontSizeMax; fontSize >= spec.fontSizeMin; fontSize--) {
    if (lines.every(l => estimateLineWidthPt(l, fontSize) <= maxWidthPt * spec.fontSizeBuffer)) {
      return fontSize;
    }
  }

  return spec.fontSizeMin;
}

/**
 * Estimates line width in points using per-character width multipliers for Arial.
 * Not exact, but accurate enough when combined with spec.fontSizeBuffer.
 */
function estimateLineWidthPt(line, fontSize) {
  let units = 0;
  for (const ch of line) {
    if      (ch === ' ')                        units += 0.33;
    else if ('ilI.,:;|!\'`'.includes(ch))       units += 0.28;
    else if ('fjrtJ()[]{}'.includes(ch))        units += 0.40;
    else if ('MW@#%&QGOM'.includes(ch))         units += 0.90;
    else if ('0123456789'.includes(ch))         units += 0.56;
    else if ('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.includes(ch)) units += 0.68;
    else                                        units += 0.56;
  }
  return units * fontSize;
}

// =============================================================
// Data helpers
// =============================================================

/**
 * Finds the first column header containing "Address" (case-insensitive).
 * Returns the column letter (e.g., "B") or throws if not found.
 */
function findAddressColumn(sheet) {
  const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  for (let c = 0; c < headerRow.length; c++) {
    if (headerRow[c] && headerRow[c].toString().toLowerCase().includes('address')) {
      return columnLetterFromIndex(c);
    }
  }
  throw new Error('No column header containing "Address" found in row 1. Please add a header row with an "Address" column.');
}

function columnLetterFromIndex(index) {
  let letter = '';
  while (index >= 0) {
    letter = String.fromCharCode((index % 26) + 65) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
}

function readLabelData(sheet) {
  const addressColumn = findAddressColumn(sheet);
  const lastRow = sheet.getLastRow();
  const range = `${addressColumn}${LABEL_START_ROW}:${addressColumn}${lastRow}`;
  Logger.log(`📍 Reading data from range: ${range}`);
  return sheet
    .getRange(range)
    .getValues()
    .flat()
    .filter(String)
    .map(normalizeLabelText)
    .filter(text => text.length > 0);
}

function normalizeLabelText(text) {
  return text.toString().split('\n').map(l => l.trim()).filter(Boolean).join('\n');
}

function formatDateTime(date) {
  return date.toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });
}

// =============================================================
// UI helpers
// =============================================================

function showDocumentLink(docUrl, title) {
  const html = HtmlService.createHtmlOutput(
    `<p style="font-family:Arial;font-size:14px">
       Your label document is ready.<br><br>
       <a href="${docUrl}" target="_blank" style="font-size:16px">Open document</a>
     </p>
     <p style="font-family:Arial;font-size:11px;color:#666">
       (If the link doesn't open, copy the URL from the execution log.)
     </p>`
  ).setWidth(350).setHeight(120);
  SpreadsheetApp.getUi().showModalDialog(html, title);
}
