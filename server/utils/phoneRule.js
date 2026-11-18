// One rule for "is this a usable mobile number". Indian numbers: 10 digits starting 6 to 9 (91 or 0 in front is fine).
// Other countries (signup lets people pick a country code): 7 to 15 digits in all.
// clean() returns the number as typed by the person without spaces, or '' when it is not usable.
const clean = (raw) => {
  const s = String(raw ?? '').trim();
  const digits = s.replace(/\D/g, '');
  if (!digits) return '';
  const plus = s.startsWith('+');
  if (!plus && (digits.length === 10 || (digits.length === 12 && digits.startsWith('91')) || (digits.length === 11 && digits.startsWith('0')))) {
    const ten = digits.length === 10 ? digits : digits.slice(-10);
    return /^[6-9]\d{9}$/.test(ten) ? `+91${ten}` : '';
  }
  if (plus && digits.startsWith('91') && digits.length === 12) return /^[6-9]\d{9}$/.test(digits.slice(2)) ? `+${digits}` : '';
  return digits.length >= 7 && digits.length <= 15 && plus ? `+${digits}` : '';
};
const valid = (raw) => clean(raw) !== '';
module.exports = { clean, valid };
