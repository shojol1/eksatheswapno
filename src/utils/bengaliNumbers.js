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

/**
 * Formats a Firestore timestamp, time in ms, or date string into Date & Time string (e.g. "01 Aug 2026 • 10:45 AM").
 */
export function formatDateTime(item) {
  if (!item) return '';

  let dateObj = null;

  if (item.createdAt?.seconds) {
    dateObj = new Date(item.createdAt.seconds * 1000);
  } else if (item.time && !isNaN(Number(item.time))) {
    dateObj = new Date(Number(item.time));
  } else if (item.timestamp && !isNaN(Number(item.timestamp))) {
    dateObj = new Date(Number(item.timestamp));
  } else if (item.date) {
    const parsed = Date.parse(item.date);
    if (!isNaN(parsed)) dateObj = new Date(parsed);
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    return item.date || item.time || '';
  }

  const day = String(dateObj.getDate()).padStart(2, '0');
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();

  let hours = dateObj.getHours();
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = String(hours).padStart(2, '0');

  const formattedStr = `${day} ${month} ${year} • ${strHours}:${minutes} ${ampm}`;
  return toBengaliDigits(formattedStr);
}
