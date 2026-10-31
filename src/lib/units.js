const PX_PER_UNIT = { in: 96, mm: 96 / 25.4, cm: 96 / 2.54, pt: 96 / 72, px: 1 }

// "8.5in" -> 816. Falls back to US Letter width for unparseable input.
export function cssLengthToPx(value, fallback = 816) {
  const match = /^\s*([\d.]+)\s*(in|mm|cm|pt|px)?\s*$/.exec(value ?? '')
  if (!match) return fallback
  return parseFloat(match[1]) * PX_PER_UNIT[match[2] || 'px']
}

/** Margin override: "0" or one CSS length like "0.25in" (also the server's ?margin= rule). */
export const isValidMargin = (s) => typeof s === 'string' && /^(0|\d*\.?\d+(in|mm|cm|pt|px))$/.test(s)
