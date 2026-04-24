# Contributing

## Adding a New Label Format

1. Add an entry to `LABEL_SPECS` in `LabelSpecs.gs`:

```javascript
"XXXX": {
  name: "Avery XXXX",
  widthPt: <label_width_inches × 72>,
  heightPt: <label_height_inches × 72>,
  columnGapPt: <gap_between_columns_inches × 72>,
  columnsPerRow: <number>,
  rowsPerPage: <number>,
  labelsPerPage: <columnsPerRow × rowsPerPage>,
  marginTopPt: <top_margin_inches × 72>,
  marginBottomPt: <bottom_margin_inches × 72>,
  marginLeftPt: <left_margin_inches × 72>,
  marginRightPt: <right_margin_inches × 72>,
  paddingLeftPt: 6,
  paddingRightPt: 6,
  paddingTopPt: 2,
  paddingBottomPt: 2,
  fontSizeMax: 11,
  fontSizeMin: 9,
  fontSizeBuffer: 0.75,
  hardCharacterLimit: 48
}
```

2. Verify the page layout math before committing:

```
Horizontal: marginLeftPt + (columnsPerRow × widthPt) + ((columnsPerRow - 1) × columnGapPt) + marginRightPt = 612pt (8.5")
Vertical:   marginTopPt + (rowsPerPage × heightPt) + marginBottomPt = 792pt (11")
```

3. Add a menu item in `onOpen()` in `LabelMaker.gs`:

```javascript
menu.addItem('Avery XXXX — description (W" × H", N/sheet)', 'createLabels_XXXX');
```

4. Add a one-line wrapper function in `LabelMaker.gs`:

```javascript
function createLabels_XXXX() { createLabels('XXXX'); }
```

---

## Architecture Notes

### Single table, natural pagination

All labels are placed in one borderless table. Each row has `setAllowBreakAcrossPages(false)`.
When `rowsPerPage × heightPt` equals the available page height exactly, rows paginate naturally
to each new label sheet with no explicit page breaks needed.

Avoid splitting labels across multiple tables with `appendPageBreak()` between them — when a
table ends exactly at the bottom of a page, the page break produces a blank page in the output.

### Spacer columns for column gaps

Each label cell is followed by a zero-border spacer cell set to `spec.columnGapPt` wide, except
after the last column. This is what maintains the physical gap between label columns.
`columnGapPt` must always be defined in `LabelSpecs.gs` — `setWidth(undefined)` silently fails
and causes incorrect column widths.

### Paragraph spacing inside cells

`appendTableCell("line1\nline2")` splits `\n` into separate `Paragraph` objects. Each has default
spacing that accumulates and makes rows taller than `spec.heightPt`, fitting fewer rows per page
than the label sheet expects. `setCellParagraphSpacing()` zeroes out `SPACING_BEFORE`,
`SPACING_AFTER`, and `LINE_SPACING` on every paragraph in a cell.

Note: `cell.getParagraphs()` does not exist on `TableCell` — only on `Body`. Use
`cell.getChild(i).asParagraph()` instead.

### The mandatory leading paragraph

Every new Google Doc body contains a mandatory `Paragraph` that cannot be removed via Apps Script.
If the label table starts on page 1, this paragraph consumes ~13pt and causes only `rowsPerPage - 1`
rows to fit on page 1.

The solution used here is to place a summary page first. The mandatory paragraph lives on the
summary page, so every label page starts cleanly at `spec.marginTopPt` with no offset.

### appendPageBreak() requires a paragraph as the last element

`body.appendPageBreak()` inserts into the last paragraph in the body. If the last element is a
table (which happens after `appendColumnarTable()`), it throws `"An unknown error has occurred"`.
Always call `body.appendParagraph('')` before `body.appendPageBreak()`.

---

## Linting

```bash
npm install
npm run lint
```

ESLint is configured in `.eslintrc.json` with Apps Script globals pre-declared. The same check
runs automatically on every pull request via GitHub Actions.

---

## Debugging Checklist

**Labels not aligning with the sheet:**
- Is print scale exactly 100%? ("Fit to page" breaks all measurements)
- Is paper set to Letter (8.5 × 11")?
- Is `columnGapPt` defined in `LabelSpecs.gs`?
- Do the horizontal and vertical page math checks pass for the format?

**Fewer rows than expected on a page:**
- Check that `rowsPerPage × heightPt + marginTopPt + marginBottomPt = 792pt`
- Check that `setCellParagraphSpacing()` is being called on every cell and spacer

**Blank pages in output:**
- Are multiple tables being used with `appendPageBreak()` between them? Use a single table instead.

**Text wrapping inside a label:**
- Is any line over `hardCharacterLimit` characters? → forced to `fontSizeMin`
- Lower `fontSizeBuffer` in `LabelSpecs.gs` for a more conservative fit (e.g. 0.70 instead of 0.75)

**"An unknown error has occurred" from Apps Script:**
- Is `appendPageBreak()` being called after a table? Add `body.appendParagraph('')` first.
- Is `appendTable()` being called with zero rows? Guard with an empty-items check first.
