/**
 * ============================================================
 * Avery Label Generator — LabelSpecs.gs
 * ============================================================
 *
 * Physical dimensions and font settings for each supported Avery format.
 * All measurements are in points (1 inch = 72pt).
 *
 * To add a new format:
 *   1. Add an entry here with verified page layout math.
 *   2. Add a menu item in onOpen() in LabelMaker.gs.
 *   3. Add a one-line wrapper function (createLabels_XXXX) in LabelMaker.gs.
 *
 * Fields:
 *   widthPt / heightPt      — label cell dimensions
 *   columnGapPt             — horizontal space between label columns
 *   columnsPerRow           — number of label columns per row
 *   rowsPerPage             — number of label rows per page
 *   labelsPerPage           — columnsPerRow × rowsPerPage
 *   marginTopPt / Bottom    — page top/bottom margins
 *   marginLeftPt / Right    — page left/right margins
 *   paddingLeftPt / Right   — cell padding inside each label
 *   paddingTopPt / Bottom   — cell padding inside each label
 *   fontSizeMax / Min       — font size range tried when fitting text
 *   fontSizeBuffer          — fraction of usable width text must fit within (e.g. 0.75 = 25% safety margin)
 *   hardCharacterLimit      — lines longer than this always use fontSizeMin
 * ============================================================
 */

const LABEL_SPECS = {
  // Avery 5160 & 5260: identical dimensions — 2.625" × 1", 3×10 per sheet
  // Math: 13.5 + (3 × 189) + (2 × 9) + 13.5 = 612pt = 8.5" ✓
  "5160": {
    name: "Avery 5160",
    widthPt: 189,        // 2.625"
    heightPt: 72,        // 1"
    columnGapPt: 9,      // 0.125"
    columnsPerRow: 3,
    rowsPerPage: 10,
    labelsPerPage: 30,
    marginTopPt: 36,
    marginBottomPt: 36,
    marginLeftPt: 13.5,
    marginRightPt: 13.5,
    paddingLeftPt: 6,
    paddingRightPt: 6,
    paddingTopPt: 2,
    paddingBottomPt: 2,
    fontSizeMax: 11,
    fontSizeMin: 9,
    fontSizeBuffer: 0.75,
    hardCharacterLimit: 48
  },
  "5260": {
    name: "Avery 5260",
    widthPt: 189,        // 2.625"
    heightPt: 72,        // 1"
    columnGapPt: 9,      // 0.125"
    columnsPerRow: 3,
    rowsPerPage: 10,
    labelsPerPage: 30,
    marginTopPt: 36,
    marginBottomPt: 36,
    marginLeftPt: 13.5,
    marginRightPt: 13.5,
    paddingLeftPt: 6,
    paddingRightPt: 6,
    paddingTopPt: 2,
    paddingBottomPt: 2,
    fontSizeMax: 11,
    fontSizeMin: 9,
    fontSizeBuffer: 0.75,
    hardCharacterLimit: 48
  },
  // Avery 5163: shipping labels — 4" × 2", 2×5 per sheet
  // Math: 12.24 + (2 × 288) + 11.52 + 12.24 = 612pt = 8.5" ✓
  "5163": {
    name: "Avery 5163",
    widthPt: 288,        // 4"
    heightPt: 144,       // 2"
    columnGapPt: 11.52,  // 0.16"
    columnsPerRow: 2,
    rowsPerPage: 5,
    labelsPerPage: 10,
    marginTopPt: 36,
    marginBottomPt: 36,
    marginLeftPt: 12.24,
    marginRightPt: 12.24,
    paddingLeftPt: 8,
    paddingRightPt: 8,
    paddingTopPt: 4,
    paddingBottomPt: 4,
    fontSizeMax: 14,
    fontSizeMin: 10,
    fontSizeBuffer: 0.75,
    hardCharacterLimit: 60
  },
  // Avery 5164: large shipping labels — 4" × 3.333", 2×3 per sheet
  // Math: 11.232 + (2 × 288) + 13.536 + 11.232 = 612pt = 8.5" ✓
  "5164": {
    name: "Avery 5164",
    widthPt: 288,        // 4"
    heightPt: 240,       // 3.333"
    columnGapPt: 13.536, // 0.188"
    columnsPerRow: 2,
    rowsPerPage: 3,
    labelsPerPage: 6,
    marginTopPt: 36,
    marginBottomPt: 36,
    marginLeftPt: 11.232,
    marginRightPt: 11.232,
    paddingLeftPt: 8,
    paddingRightPt: 8,
    paddingTopPt: 6,
    paddingBottomPt: 6,
    fontSizeMax: 16,
    fontSizeMin: 10,
    fontSizeBuffer: 0.75,
    hardCharacterLimit: 60
  },
  // Avery 5167: return address labels — 1.75" × 0.5", 4×20 per sheet
  // Math: 21.6 + (4 × 126) + (3 × 21.6) + 21.6 = 612pt = 8.5" ✓
  "5167": {
    name: "Avery 5167",
    widthPt: 126,        // 1.75"
    heightPt: 36,        // 0.5"
    columnGapPt: 21.6,   // 0.3"
    columnsPerRow: 4,
    rowsPerPage: 20,
    labelsPerPage: 80,
    marginTopPt: 36,
    marginBottomPt: 36,
    marginLeftPt: 21.6,
    marginRightPt: 21.6,
    paddingLeftPt: 3,
    paddingRightPt: 3,
    paddingTopPt: 1,
    paddingBottomPt: 1,
    fontSizeMax: 9,
    fontSizeMin: 7,
    fontSizeBuffer: 0.75,
    hardCharacterLimit: 30
  },
  // Avery 5161: address labels — 4" × 1", 2×10 per sheet
  // Math: 12.6 + (2 × 288) + 10.8 + 12.6 = 612pt = 8.5" ✓  |  36 + (10 × 72) + 36 = 792pt = 11" ✓
  "5161": {
    name: "Avery 5161",
    widthPt: 288,        // 4"
    heightPt: 72,        // 1"
    columnGapPt: 10.8,   // 0.15"
    columnsPerRow: 2,
    rowsPerPage: 10,
    labelsPerPage: 20,
    marginTopPt: 36,
    marginBottomPt: 36,
    marginLeftPt: 12.6,
    marginRightPt: 12.6,
    paddingLeftPt: 6,
    paddingRightPt: 6,
    paddingTopPt: 2,
    paddingBottomPt: 2,
    fontSizeMax: 11,
    fontSizeMin: 9,
    fontSizeBuffer: 0.75,
    hardCharacterLimit: 60
  },
  // Avery 5162: address labels — 4" × 1.333", 2×7 per sheet
  // Math: 10.98 + (2 × 288) + 14.04 + 10.98 = 612pt = 8.5" ✓  |  60.12 + (7 × 96) + 60.12 = 792pt = 11" ✓
  "5162": {
    name: "Avery 5162",
    widthPt: 288,        // 4"
    heightPt: 96,        // 1.333"
    columnGapPt: 14.04,  // 0.195"
    columnsPerRow: 2,
    rowsPerPage: 7,
    labelsPerPage: 14,
    marginTopPt: 60.12,
    marginBottomPt: 60.12,
    marginLeftPt: 10.98,
    marginRightPt: 10.98,
    paddingLeftPt: 6,
    paddingRightPt: 6,
    paddingTopPt: 3,
    paddingBottomPt: 3,
    fontSizeMax: 12,
    fontSizeMin: 9,
    fontSizeBuffer: 0.75,
    hardCharacterLimit: 60
  },
  // Avery 5195: organization labels — 1.75" × 0.667", 4×15 per sheet
  // Math: 22.14 + (4 × 126) + (3 × 21.24) + 22.14 = 612pt = 8.5" ✓  |  35.82 + (15 × 48) + 35.82 = 791.64pt ≈ 11" ✓
  "5195": {
    name: "Avery 5195",
    widthPt: 126,        // 1.75"
    heightPt: 48,        // 0.667"
    columnGapPt: 21.24,  // 0.295"
    columnsPerRow: 4,
    rowsPerPage: 15,
    labelsPerPage: 60,
    marginTopPt: 35.82,
    marginBottomPt: 35.82,
    marginLeftPt: 22.14,
    marginRightPt: 22.14,
    paddingLeftPt: 3,
    paddingRightPt: 3,
    paddingTopPt: 1,
    paddingBottomPt: 1,
    fontSizeMax: 9,
    fontSizeMin: 7,
    fontSizeBuffer: 0.75,
    hardCharacterLimit: 30
  }
};