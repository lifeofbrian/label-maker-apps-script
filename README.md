# Avery 5160/5260 Label Generator

A Google Apps Script that converts address data from a Google Sheet into a professionally formatted Google Doc ready for printing on Avery 5160 or 5260 labels.

---

## Why This Exists

Printing address labels for mass mailings is tedious and error-prone. Mail merge tools are often clunky or expensive. This script automates the entire process:

- **Import data from Google Sheets** → Your contact list stays organized and editable
- **Auto-format for Avery 5160/5260** → No manual layout adjustments needed
- **Smart font sizing** → Text automatically shrinks to fit each label without wrapping
- **Print-ready output** → Generate a Google Doc that lines up perfectly with label sheets

Perfect for: holiday cards, newsletters, fundraising campaigns, or any bulk mailing.

---

## Features

✓ **3 columns × 10 rows per page** (30 labels per page)  
✓ **Automatic font sizing** (9-11pt) to prevent text wrapping  
✓ **Character-width estimation** for accurate text fitting  
✓ **TOP vertical alignment** for consistent label appearance  
✓ **Multi-line support** with CHAR(10) line breaks  
✓ **Generates new Google Doc** (never overwrites existing files)  

---

## How to Use

### 1. Prepare Your Data

In your Google Sheet, add label text to **Column B** starting at **B2**:

```
Column B (starting at B2):
Morse Family
17266 153rd St SE
Monroe, WA 98272

Gloria Runte
1805 Village Green Dr Apt 21
Mill Creek, WA 98012

Gary Mansell and Ginger Keel
8709 Vashon Ct NE
Lacey, WA 98516
```

**Important:** Each cell should contain the complete label text with line breaks included using `CHAR(10)`. Example formula:

```
=A2&CHAR(10)&B2&CHAR(10)&C2
```

### 2. Install the Script

1. Open your Google Sheet
2. Click **Extensions → Apps Script**
3. Copy the contents of `Label Maker.gs` into the editor
4. Save the project (give it a name like "Avery Label Maker")

### 3. Run the Script

1. Select the `createLabels` function from the dropdown
2. Click the **Run** (Play) button
3. **Authorize** the script when prompted
4. Check the **Execution log** for your new Google Doc URL

### 4. Print Your Labels

1. Open the generated Google Doc
2. Go to **File → Print Settings**
3. Set:
   - **Scale:** 100% (NO "fit to page")
   - **Paper size:** Letter (8.5 × 11 in)
   - **Margins:** None or minimal
4. Load your Avery 5160 label sheet and print!

---

## How It Works

### Font Size Optimization

The script uses character-width estimation to determine the largest font size that fits each label without wrapping:

```
1. Split label text into lines (by \n)
2. For each font size from 11pt down to 9pt:
   - Estimate width of each line
   - Check if all lines fit in 189 points (2.625")
   - Return the first size that fits (with 15% safety buffer)
3. Apply selected font size to label
```

This ensures:
- **Consistency** across all labels
- **Readability** at a reasonable size
- **No wrapped text** that breaks label formatting

### Width Estimation Formula

Text width is estimated using character-specific multipliers:

| Character | Width | Example |
|-----------|-------|---------|
| Space | 0.33 | `" "` |
| Very narrow | 0.28 | `i`, `l`, `.` |
| Narrow | 0.40 | `f`, `j`, `(`, `)` |
| Wide | 0.90 | `M`, `W`, `@` |
| Numbers | 0.56 | `0-9` |
| Uppercase | 0.68 | `A-Z` |
| Lowercase | 0.56 | `a-z` (default) |

Example: "Hello" in 11pt
- H(0.68) + e(0.56) + l(0.28) + l(0.28) + o(0.56) = 2.36 units
- 2.36 × 11 = **25.96 points**

---

## Technical Specifications

### Avery 5160 & 5260 Specs (Identical)
- **Label size:** 2.625" × 1" (189pt × 72pt)
- **Layout:** 3 columns × 10 rows per page
- **Total per page:** 30 labels
- **Paper size:** Letter (8.5" × 11")

### Margin Settings
- **Top/Bottom:** 0.5" (36pt)
- **Left/Right:** 0.1875" (13.5pt)
- **Per-label padding:** 6pt left/right, 2pt top/bottom

### Font Settings
- **Font family:** Arial (monospaced width calculation)
- **Font size range:** 9-11pt (optimized for label readability)
- **Vertical alignment:** TOP (prevents text from centering)

---

## Troubleshooting

### Document is too large (many pages)
**Cause:** Too many labels being generated  
**Fix:** Verify you're only reading rows with data. The script filters empty rows automatically with `.filter(String)`.

### Text is wrapping within labels
**Cause:** Width estimation underestimated text length  
**Fix:** The 15% safety buffer helps, but very long lines may still wrap. Try shorter addresses or wider label text.

### Font sizes are inconsistent
**Cause:** Character width estimation is approximate, not exact  
**Fix:** This is expected with manual width estimation. For perfect consistency, you'd need Google Docs' exact rendering engine (not available in Apps Script).

### Script fails to authorize
**Cause:** Google Apps Script permissions required  
**Fix:** Click "Review Permissions" and authorize access to Google Sheets and Docs.

### Document won't align with label sheet
**Cause:** Print scale or margins incorrect  
**Fix:** Ensure:
1. Print scale is **100%** (not "Fit to page")
2. Margins are set to **None**
3. Paper size is **Letter (8.5 × 11")**

---

## Testing

Unit tests are included in `Label Maker Test.gs`. Run `testAll()` to validate:

- ✓ Character width calculations
- ✓ Font size selection algorithm
- ✓ Multi-line text handling
- ✓ Edge cases (empty text, very long lines, etc.)

To run tests:
1. Open the Apps Script editor
2. Select `testAll` from the function dropdown
3. Click **Run**
4. Check **Execution log** for results

---

## Code Review Summary

**Strengths:**
- Clear separation of concerns (width estimation, font sizing, Google Docs integration)
- Well-documented with inline comments
- Handles edge cases (empty cells, non-multiple-of-3 labels)
- Consistent formatting with constants at the top

**Areas for Improvement:**
- Width estimation is approximate (±5-10% accuracy vs. actual Arial rendering)
- No error handling if Sheet is empty or malformed
- Font sizes hardcoded (9-11pt range) rather than parameterized
- Could benefit from batch operations for large label counts

**Potential Enhancements:**
- Add user configuration options (font size range, safety buffer %)
- Support for multiple columns/formats in Sheet
- Add logging for debugging failed labels
- Cache width calculations for repeated text

---

## License

Use freely for personal and commercial purposes. No attribution required.

---

## Important Note

**Avery 5160 and 5260 are identical products** with the same dimensions and layout:
- **1" × 2.625"** labels
- **3 columns × 10 rows** per page (30 labels per sheet)

This script works for **both product numbers**. The difference between them is in the paper finish or branding, not the label size or layout.

---

## Resources

- [Avery 5160 Template & Product Info](https://www.avery.com/templates/5160) - Official Avery page
- [Avery 5260 Template & Product Info](https://www.avery.com/templates/5260) - Official Avery page  
- [Avery Label Size Chart](https://www.avery.com/blank/resources/container-sizes) - Reference for other label sizes

---

## Questions?

Check the inline comments in `Label Maker.gs` for implementation details. The script is ~160 lines and relatively straightforward.
