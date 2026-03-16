// src/config/fonts.js
// ─────────────────────────────────────────────
// Project Space — Central Font & Typography Config
// Font: Open Sans (loaded via Google Fonts in layout)
// ─────────────────────────────────────────────

var FONT_FAMILY = "'Open Sans', sans-serif"

// Font weights
var FONT_WEIGHT = {
  regular: 400,
  medium:  600,
  bold:    700,
  black:   800,
}

// Font sizes
var FONT_SIZE = {
  // Headings
  h1: "32px",    // Page titles
  h2: "24px",    // Section titles
  h3: "20px",    // Card headings / sub-section titles
  h4: "16px",    // Sub-headings / labels

  // Body / Content
  body:  "14px", // Default body text
  small: "12px", // Captions, hints, badges
  tiny:  "11px", // Labels, tags, chip text

  // Special
  display: "40px", // Hero / landing display text
  btn:     "13px", // Button text
  input:   "14px", // Input field text
}

// Letter spacing
var LETTER_SPACING = {
  tight:  "0px",
  normal: "0.5px",
  wide:   "1.5px",
  wider:  "2px",
  widest: "3px",
}

// Line heights
var LINE_HEIGHT = {
  tight:  1.2,
  normal: 1.5,
  loose:  1.8,
}

// ─── Pre-built style objects ───────────────────
// Use these directly in inline styles: style={TYPOGRAPHY.h1}

var TYPOGRAPHY = {
  // Headings
  h1: {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE.h1,
    fontWeight: FONT_WEIGHT.black,
    letterSpacing: LETTER_SPACING.wider,
    lineHeight: LINE_HEIGHT.tight,
  },
  h2: {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE.h2,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: LETTER_SPACING.wide,
    lineHeight: LINE_HEIGHT.tight,
  },
  h3: {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE.h3,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: LETTER_SPACING.normal,
    lineHeight: LINE_HEIGHT.normal,
  },
  h4: {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE.h4,
    fontWeight: FONT_WEIGHT.medium,
    letterSpacing: LETTER_SPACING.wide,
    lineHeight: LINE_HEIGHT.normal,
  },

  // Body
  body: {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.regular,
    letterSpacing: LETTER_SPACING.tight,
    lineHeight: LINE_HEIGHT.normal,
  },
  bodyMedium: {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE.body,
    fontWeight: FONT_WEIGHT.medium,
    letterSpacing: LETTER_SPACING.tight,
    lineHeight: LINE_HEIGHT.normal,
  },

  // Small / captions
  small: {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE.small,
    fontWeight: FONT_WEIGHT.regular,
    letterSpacing: LETTER_SPACING.normal,
    lineHeight: LINE_HEIGHT.normal,
  },
  label: {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE.tiny,
    fontWeight: FONT_WEIGHT.medium,
    letterSpacing: LETTER_SPACING.wider,
    lineHeight: LINE_HEIGHT.tight,
    textTransform: "uppercase",
  },

  // UI elements
  btn: {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE.btn,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: LETTER_SPACING.wider,
    textTransform: "uppercase",
  },
  input: {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE.input,
    fontWeight: FONT_WEIGHT.regular,
  },

  // Display
  display: {
    fontFamily: FONT_FAMILY,
    fontSize: FONT_SIZE.display,
    fontWeight: FONT_WEIGHT.black,
    letterSpacing: LETTER_SPACING.widest,
    lineHeight: LINE_HEIGHT.tight,
  },
}

module.exports = { FONT_FAMILY, FONT_WEIGHT, FONT_SIZE, LETTER_SPACING, LINE_HEIGHT, TYPOGRAPHY }