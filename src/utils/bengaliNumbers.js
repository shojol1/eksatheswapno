/**
 * Utility function to convert any string or number containing English digits (0-9)
 * into Bengali numerals (০-৯).
 */
export function toBengaliDigits(input) {
  if (input === null || input === undefined) return '';
  const str = String(input);
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return str.replace(/[0-9]/g, (digit) => bengaliDigits[parseInt(digit, 10)]);
}
