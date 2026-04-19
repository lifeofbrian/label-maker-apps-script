/**
 * ============================================================
 * Avery 5160/5260 Label Generator (Google Sheets → Google Docs)
 * ============================================================
 *
 * WHAT THIS DOES:
 * Creates a Google Doc formatted for Avery 5160/5260 labels (3 columns x 10 rows per page)
 * using address data from a Google Sheet. It automatically adjusts font size
 * to prevent text from wrapping within each label.
 *
 * NOTE: Avery 5160 and 5260 have identical dimensions (1" x 2.625", 30 per sheet).
 * This script works for both products.
 *
 * HOW TO USE:
 * 1. In your Google Sheet:
 *    - Put your fully formatted label text in column B (starting at B2)
 *    - Each cell should already include line breaks using CHAR(10), e.g.:
 *
 *      Name
 *      Street Address
 *      City, ST ZIP
 *
 * 2. Open Extensions → Apps Script
 * 3. Paste this script and save
 * 4. Run `createLabels`
 * 5. Open the generated Google Doc (check Logs if needed)
 * 6. Print with:
 *    - Scale: 100% (NO "fit to page")
 *    - Paper: Letter (8.5 x 11)
 *
 * NOTES:
 * - Font size will shrink automatically if a line is too long
 * - Uses Arial for consistent width estimation
 * - Designed for Avery 5160 & 5260 (2.625" x 1" labels, 30 per sheet)
 *
 * REFERENCES:
 * - Avery 5160: https://www.avery.com/templates/5160
 * - Avery 5260: https://www.avery.com/templates/5260
 *
 * ============================================================
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Avery Labels')
    .addItem('Create Labels', 'createLabels')
    .addToUi();
}

function onInstall(e) {
  onOpen(e);
}

function createLabels() {
  const selectedLabelType = LABEL_TYPE;
  const spec = LABEL_SPECS[selectedLabelType];
  if (!spec) {
    throw new Error(`Unknown label type: ${selectedLabelType}. Available types: ${Object.keys(LABEL_SPECS).join(', ')}`);
  }

  // Get active sheet and pull label text from configured column (see config.gs)
  const sheet = SpreadsheetApp.getActiveSheet();
  const sheetName = sheet.getName();
  const lastRow = sheet.getLastRow();
  const range = `${LABEL_COLUMN}${LABEL_START_ROW}:${LABEL_COLUMN}${lastRow}`;
  
  Logger.log(`📋 Starting label generation from sheet: "${sheetName}"`);
  Logger.log(`📍 Reading data from range: ${range}`);
  
  const data = sheet
    .getRange(range)
    .getValues()
    .flat()
    .filter(String) // remove empty rows
    .map(text => normalizeLabelText(text))
    .filter(text => text.length > 0); // remove rows that were only whitespace or blank lines

  Logger.log(`✓ Found ${data.length} labels to process`);

  // Format current date/time for document name
  const now = new Date();
  const dateTimeStr = now.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  
  const docName = `Avery Labels - ${sheetName} - ${selectedLabelType} - ${dateTimeStr}`;
  
  Logger.log(`📄 Creating document: "${docName}"`);

  // Create a new Google Doc
  const doc = DocumentApp.create(docName);
  const body = doc.getBody();

  // Set page margins (points: 72 = 1 inch)
  body.setMarginTop(36);       // 0.5"
  body.setMarginBottom(36);    // 0.5"
  body.setMarginLeft(13.5);    // 0.1875"
  body.setMarginRight(13.5);   // 0.1875"
  
  Logger.log(`⚙️  Setting page margins and label dimensions`);

  // Actual usable text width after padding
  const USABLE_WIDTH_PT = spec.widthPt - spec.paddingLeftPt - spec.paddingRightPt;

  // Create table (we will add rows of labels each)
  const table = body.appendTable();
  if (typeof table.setBorderWidth === 'function') {
    table.setBorderWidth(0);
  }
  if (typeof table.setBorderColor === 'function') {
    table.setBorderColor('#ffffff');
  }
  if (typeof table.setBorderStyle === 'function') {
    table.setBorderStyle(DocumentApp.BorderStyle.NONE);
  }

  // Loop through labels in groups (configured columns per row)
  let processedCount = 0;
  for (let i = 0; i < data.length; i += spec.columnsPerRow) {
    const row = table.appendTableRow();

    for (let c = 0; c < spec.columnsPerRow; c++) {
      const text = data[i + c] || ""; // handle last row if not multiple of 3

      // Create cell and apply layout settings
      const cell = row.appendTableCell(text);
      cell.setWidth(spec.widthPt);
      cell.setVerticalAlignment(DocumentApp.VerticalAlignment.TOP);

      // Remove visible table borders for printable labels if supported
      if (typeof cell.setBorderWidth === 'function') {
        cell.setBorderWidth(0);
      }
      if (typeof cell.setBorderColor === 'function') {
        cell.setBorderColor('#ffffff');
      }

      // Tight padding helps prevent unnecessary wrapping
      cell.setPaddingTop(spec.paddingTopPt);
      cell.setPaddingBottom(spec.paddingBottomPt);
      cell.setPaddingLeft(spec.paddingLeftPt);
      cell.setPaddingRight(spec.paddingRightPt);

      if (text) {
        // Pick the largest font size that avoids wrapping
        const fontSize = pickFontSizeToAvoidWrap(text, USABLE_WIDTH_PT, spec);

        const edit = cell.editAsText();
        edit.setFontFamily("Arial");  // consistent font for width estimation
        edit.setFontSize(fontSize);
        
        processedCount++;
      }
    }
  }

  Logger.log(`✓ Processed ${processedCount} labels into table format`);
  Logger.log(`📊 Document contains ${Math.ceil(processedCount / 30)} page(s)`);

  // Log the generated document URL
  const docUrl = doc.getUrl();
  Logger.log(`✅ SUCCESS! Document created: ${docUrl}`);
  return docUrl;
}


/**
 * Determines the largest font size that allows all lines
 * to fit within the available width (avoiding wrapping).
 */
function pickFontSizeToAvoidWrap(text, maxWidthPt, spec) {
  // Split text into lines based on explicit line breaks
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  // If any line exceeds the hard character limit, force the minimum size.
  if (spec.hardCharacterLimit && lines.some(line => line.length > spec.hardCharacterLimit)) {
    return spec.fontSizeMin;
  }

  // Find the longest line
  const longestLine = lines.reduce((max, line) => 
    line.length > max.length ? line : max, '');

  // Try font sizes from largest to smallest
  for (let fontSize = spec.fontSizeMax; fontSize >= spec.fontSizeMin; fontSize--) {
    // Check if every line fits within allowed width (safety buffer for consistency)
    const allFit = lines.every(line =>
      estimateLineWidthPt(line, fontSize) <= maxWidthPt * spec.fontSizeBuffer
    );

    if (allFit) return fontSize;
  }

  // Fallback to consistent minimum
  return spec.fontSizeMin;
}


/**
 * Roughly estimates how wide a line of text will be in points.
 * This is NOT exact, but good enough to prevent most wrapping.
 */
function estimateLineWidthPt(line, fontSize) {
  let units = 0;

  for (const ch of line) {
    if (ch === ' ') {
      units += 0.33; // spaces are narrow
    } else if ('ilI.,:;|!\'`'.includes(ch)) {
      units += 0.28; // very narrow characters
    } else if ('fjrtJ()[]{}'.includes(ch)) {
      units += 0.4;  // narrow-medium characters
    } else if ('MW@#%&QGOM'.includes(ch)) {
      units += 0.9;  // wide characters
    } else if ('0123456789'.includes(ch)) {
      units += 0.56; // numbers
    } else if ('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.includes(ch)) {
      units += 0.68; // uppercase letters
    } else {
      units += 0.56; // default for lowercase letters
    }
  }

  // Convert unit count into points using font size
  return units * fontSize;
}