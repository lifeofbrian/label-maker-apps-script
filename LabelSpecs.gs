/**
 * ============================================================
 * Avery Label Specifications
 * ============================================================
 *
 * Store label size metadata separately so the generator can
 * support multiple Avery products from the same script.
 */

const LABEL_SPECS = {
  "5160": {
    name: "Avery 5160",
    widthPt: 189,
    heightPt: 72,
    columnsPerRow: 3,
    paddingLeftPt: 6,
    paddingRightPt: 6,
    paddingTopPt: 2,
    paddingBottomPt: 2,
    fontSizeMax: 11,
    fontSizeMin: 9,
    fontSizeBuffer: 0.75, // 25% safety margin
    hardCharacterLimit: 48 // fallback to min size for very long lines
  },
  "5260": {
    name: "Avery 5260",
    widthPt: 189,
    heightPt: 72,
    columnsPerRow: 3,
    paddingLeftPt: 6,
    paddingRightPt: 6,
    paddingTopPt: 2,
    paddingBottomPt: 2,
    fontSizeMax: 11,
    fontSizeMin: 9,
    fontSizeBuffer: 0.75, // 25% safety margin (same specs as 5160)
    hardCharacterLimit: 48 // fallback to min size for very long lines
  }
};