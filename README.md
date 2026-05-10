# Avery Label Generator

[![Lint](https://github.com/lifeofbrian/label-maker-apps-script/actions/workflows/lint.yml/badge.svg)](https://github.com/lifeofbrian/label-maker-apps-script/actions/workflows/lint.yml)

A Google Apps Script that converts address data from a Google Sheet into a professionally formatted Google Doc ready for printing on Avery labels.

---

## Why This Exists

Printing address labels for mass mailings is tedious and error-prone. Mail merge tools are often clunky or expensive. This script automates the entire process:

- **Import data from Google Sheets** → Your contact list stays organized and editable
- **Auto-format for 5 Avery label sizes** → No manual layout adjustments needed
- **Smart font sizing** → Text automatically shrinks to fit each label without wrapping
- **Print-ready output** → Generate a Google Doc that lines up perfectly with label sheets
- **No third-party access** → Unlike marketplace add-ons, this script never requires broad Google Drive permissions

Perfect for: holiday cards, newsletters, fundraising campaigns, or any bulk mailing.

---

## Features

✓ **8 Avery label formats** supported (5160, 5260, 5161, 5162, 5163, 5164, 5167, 5195)
✓ **Automatic font sizing** to prevent text wrapping per label size
✓ **Character-width estimation** for accurate text fitting
✓ **TOP vertical alignment** for consistent label appearance
✓ **Multi-line support** with CHAR(10) line breaks
✓ **Generates new Google Doc** (never overwrites existing files)
✓ **Summary page** with recipient counts by state and city, plus data warnings

---

## How to Use

### 1. Prepare Your Data

In your Google Sheet, add a header row (row 1) with a column named **Address**. Starting at row 2, put your label text in that column:

```
Row 1:  Name | Address | City | State | ZIP
Row 2:  Smith Family | 123 Main St | Springfield | IL | 62701
Row 3:  Jane Doe | 456 Elm Ave Apt 7 | Shelbyville | IL | 62565
```

**Important:** Each cell in the Address column should contain the complete label text with line breaks using `CHAR(10)`. Example formula:

```
=B2&CHAR(10)&C2&CHAR(10)&D2&CHAR(10)&E2
```

### 2. Install the Script

1. Open your Google Sheet
2. Click **Extensions → Apps Script**
3. Create three script files and paste the contents of each:
   - `Config.gs` — column/row settings and label type selection
   - `LabelSpecs.gs` — Avery label dimensions (widths, gaps, font range)
   - `LabelMaker.gs` — main script logic
4. Save the project (give it a name like "Avery Label Maker")

### 3. Run the Script

1. Reload the Google Sheet — an **Avery Labels** menu will appear in the menu bar
2. Click **Avery Labels** and choose your label format, e.g. **Avery 5160**
   - Or choose **All formats in one document** to generate all 5 formats in a single doc (useful for comparing alignment across label sizes)
3. **Authorize** the script when prompted
4. When complete, a dialog will appear with a link to the generated Google Doc

### 4. Print Your Labels

1. Open the generated Google Doc
2. Go to **File → Print**
3. Set:
   - **Scale:** 100% (NO "fit to page")
   - **Paper size:** Letter (8.5 × 11 in)
   - **Margins:** None or minimal
4. **Print starting from page 2** — page 1 is the summary page, not labels
5. Load your Avery label sheet and print

---

## Summary Page

The first page of every generated document is a summary, not labels. This is intentional: Google Docs always inserts a mandatory paragraph at the start of the document body that cannot be removed via Apps Script. If the label table started on page 1, that paragraph would consume ~13pt of space and cause only 9 rows (27 labels) to fit instead of 10 (30 labels). Placing the summary page first absorbs that paragraph, so every label page starts cleanly and consistently prints 30 labels.

The summary includes:

- Generated date/time, source sheet name, label type
- Total label count and number of label pages
- Recipients by state (3-column layout)
- Recipients by city and state (3-column layout)
- Warnings for labels with only one line (possible missing address)
- Warnings for labels with no ZIP code detected

**Always print starting from page 2.**

---

## How It Works

### Font Size Optimization

The script uses character-width estimation to determine the largest font size that fits each label without wrapping:

```
1. Split label text into lines (by \n)
2. For each font size from 11pt down to 9pt:
   - Estimate width of each line in points
   - Check if all lines fit within 75% of usable label width (25% safety margin)
   - Return the first size where all lines fit
3. Apply selected font size to label
```

The 25% safety margin accounts for the gap between the width estimator's heuristic values and actual Arial rendering.

### Page Layout

Labels are placed in a single borderless table starting on page 2 (after the summary page). Each row contains 3 label cells separated by 9pt (0.125") spacer cells:

```
| 13.5pt margin | 189pt label | 9pt gap | 189pt label | 9pt gap | 189pt label | 13.5pt margin |
= 612pt = 8.5"
```

Rows are set to `setAllowBreakAcrossPages(false)` so they always move as a unit to the next page. Since 10 rows × 72pt = 720pt fits within the content area, rows paginate naturally to each new Avery sheet without explicit page breaks.

Label pages use a top margin matching the Avery spec (e.g. 36pt = 0.5" for 5160) and a bottom margin of 0. The Avery sheet's bottom dead zone is blank physical space on the paper — it does not need to be a Google Docs page margin. Setting it to 0 ensures the implicit empty paragraph that Google Docs appends after every table has room to exist without pushing onto a new page.

The summary page on page 1 absorbs the mandatory Google Docs leading paragraph (which cannot be removed via Apps Script), so all label pages start with a clean top margin and consistent label alignment.

### Width Estimation Formula

Text width is estimated using character-specific multipliers:

| Character | Width | Example |
|-----------|-------|---------|
| Space | 0.33 | `" "` |
| Very narrow | 0.28 | `i`, `l`, `.` |
| Narrow | 0.40 | `f`, `j`, `(`, `)` |
| Wide | 0.90 | `M`, `W`, `@` |
| Numbers | 0.56 | `0–9` |
| Uppercase | 0.68 | `A–Z` |
| Lowercase | 0.56 | `a–z` (default) |

---

## Technical Specifications

### Supported Label Formats

| Format | Description | Size | Layout | Per sheet |
|--------|-------------|------|--------|-----------|
| **5160** | Address labels | 2.625" × 1" | 3 × 10 | 30 |
| **5260** | Address labels (clear) | 2.625" × 1" | 3 × 10 | 30 |
| **5163** | Shipping labels | 4" × 2" | 2 × 5 | 10 |
| **5164** | Large shipping labels | 4" × 3.33" | 2 × 3 | 6 |
| **5167** | Return address labels | 1.75" × 0.5" | 4 × 20 | 80 |
| **5161** | Address labels | 4" × 1" | 2 × 10 | 20 |
| **5162** | Address labels | 4" × 1.33" | 2 × 7 | 14 |
| **5195** | Organization labels | 1.75" × 0.67" | 4 × 15 | 60 |

All formats use Letter paper (8.5" × 11"). Font size range and padding are tuned per format in `LabelSpecs.gs`.

### Per-Label Settings (all formats)
- **Font family:** Arial
- **Vertical alignment:** TOP

---

## Troubleshooting

### Text is wrapping within labels
**Cause:** Width estimation underestimated text length
**Fix:** The 25% safety margin helps, but very long lines may still wrap. Try shortening address lines or lowering `fontSizeBuffer` in `LabelSpecs.gs` (lower = more conservative).

### Font sizes are inconsistent across labels
**Cause:** Character width estimation is approximate — different label lengths land on different sizes
**Fix:** Expected behavior. For perfect consistency you'd need the actual rendering engine, which isn't accessible in Apps Script.

### Document won't align with label sheet
**Cause:** Print scale or margins are incorrect
**Fix:** Ensure print scale is **100%** (not "Fit to page"), paper size is **Letter**, and you are printing **starting from page 2**.

### Script fails to authorize
**Cause:** Google Apps Script requires permissions to access Sheets and Docs
**Fix:** Click "Review Permissions" and authorize when prompted.

---

## Configuration

Edit `Config.gs` to change defaults:

| Constant | Default | Purpose |
|----------|---------|---------|
| `LABEL_START_ROW` | `2` | First row with label data (skips header) |

The label column is auto-detected from the header row — the script finds the first column whose header contains "Address" (case-insensitive). No configuration needed as long as your sheet has an Address column header.

To add support for other Avery label sizes, add a new entry to `LABEL_SPECS` in `LabelSpecs.gs`, then add a menu item and a one-line wrapper function in `LabelMaker.gs`.

---

## Development

### Linting

ESLint is configured to catch errors in the `.gs` files. To run locally:

```bash
npm install
npm run lint
```

The lint check runs automatically on every pull request and push to `main` or `develop` via GitHub Actions. The config lives in [.eslintrc.json](.eslintrc.json) and includes Apps Script globals (`SpreadsheetApp`, `DocumentApp`, `Logger`, etc.) so they don't appear as undefined variable errors.

---

## Important Note

**Avery 5160 and 5260 are identical products** — same dimensions, same layout. The difference is paper finish (5160 is matte white, 5260 is clear).

---

## Resources

- [Avery 5160 Template](https://www.avery.com/templates/5160)
- [Avery 5260 Template](https://www.avery.com/templates/5260)
- [Avery 5161 Template](https://www.avery.com/templates/5161)
- [Avery 5162 Template](https://www.avery.com/templates/5162)
- [Avery 5163 Template](https://www.avery.com/templates/5163)
- [Avery 5164 Template](https://www.avery.com/templates/5164)
- [Avery 5167 Template](https://www.avery.com/templates/5167)
- [Avery 5195 Template](https://www.avery.com/templates/5195)

---

## License

MIT © Brian Mansell
