import React, { useState } from 'react';
import PhoneInputPkg from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const PhoneInput = PhoneInputPkg.default || PhoneInputPkg;

// react-phone-input-2's country data includes a `format` string per country, but at runtime
// (the country object passed to onChange/onBlur/onMount) it's prefixed with the dial code's own
// dots + a space before the real national format — e.g. India's is "+.. .....-....." (2 dots for
// "91", then 10 for the national number), not just ".....-....." as the raw source data alone
// would suggest. Only the segment after the first space is the national-number format; counting
// its dots gives the digit count to cap input at / validate against. Countries the library has
// no format for fall back to the ITU max of 15 and skip exact-length validation (we can cap
// length but can't assert a single "correct" one without that data).
const expectedLengthFor = (country) => {
  if (!country?.format) return null;
  const spaceIdx = country.format.indexOf(' ');
  const nationalFormat = spaceIdx === -1 ? country.format : country.format.slice(spaceIdx + 1);
  return (nationalFormat.match(/\./g) || []).length;
};
const maxDigitsFor = (country) => expectedLengthFor(country) ?? 15;

// Dial codes for the countries this app sets as `defaultCountry`. Existing records predate this
// component and were saved as bare national digits (e.g. "9600509194", no "+91") since the old
// plain-text inputs never captured a country code — so a value with no leading "+" is treated as
// a legacy number for `defaultCountry` and gets that dial code prepended before display, rather
// than being handed to the library as if it were already a (malformed) international number.
const DEFAULT_DIAL_CODES = { in: '91', us: '1', gb: '44', ae: '971', au: '61', sg: '65' };

// Shared "mobile number" input: country-code dropdown + flag, digit-only entry, a hard cap on
// length matching the selected country (e.g. India stops accepting input after 10 digits), and
// an "Enter a valid phone number" message once the user leaves the field with a number that's
// short of the selected country's expected length.
// `value`/`onChange` carry the full international number as a single string, e.g. "+919600509112".
const PhoneNumberInput = ({
  value,
  onChange,
  defaultCountry = 'in',
  required = false,
  disabled = false,
  inputProps = {},
  className = '',
  size = 'md', // 'md' (h-12, default) | 'sm' (h-9, compact grids/toolbars)
}) => {
  const [country, setCountry] = useState(null);
  const [touched, setTouched] = useState(false);

  const heightPx = size === 'sm' ? '36px' : '48px';
  const buttonWidthPx = size === 'sm' ? '36px' : '45px';

  const handleChange = (fullValue, changedCountry) => {
    if (changedCountry?.dialCode) setCountry(changedCountry);
    const dialCode = changedCountry?.dialCode || '';
    const nationalDigits = fullValue.slice(dialCode.length);
    const truncated = nationalDigits.slice(0, maxDigitsFor(changedCountry));
    onChange('+' + dialCode + truncated, changedCountry);
  };

  const handleBlur = (event, blurCountry) => {
    if (blurCountry?.dialCode) setCountry(blurCountry);
    setTouched(true);
  };

  const handleMount = (mountedValue, mountedCountry) => {
    if (mountedCountry?.dialCode) setCountry(mountedCountry);
  };

  const rawValue = value || '';
  const dialCode = country?.dialCode || DEFAULT_DIAL_CODES[defaultCountry] || '';
  const libraryValue = rawValue.startsWith('+')
    ? rawValue.slice(1)
    : rawValue
      ? (DEFAULT_DIAL_CODES[defaultCountry] || DEFAULT_DIAL_CODES.in) + rawValue
      : '';

  const nationalDigits = rawValue.startsWith('+')
    ? rawValue.slice(1 + dialCode.length)
    : rawValue;
  const expectedLength = expectedLengthFor(country);
  const isInvalid = touched && nationalDigits.length > 0 && expectedLength !== null && nationalDigits.length !== expectedLength;

  return (
    <div>
      <PhoneInput
        country={defaultCountry}
        value={libraryValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onMount={handleMount}
        disabled={disabled}
        // Without this, the library re-guesses the country from the raw digits as you type,
        // which can silently swap away from the one selected in the dropdown (e.g. India's
        // digits partially matching another country's dial code mid-entry). We want the
        // selected country to stay fixed — only its flag dropdown should ever change it.
        disableCountryGuess
        inputProps={{ required, ...inputProps }}
        inputClass={`!w-full !rounded-xl !border !bg-white !text-sm focus:!ring-2 focus:!outline-none !transition-all ${
          isInvalid
            ? '!border-rose-300 focus:!ring-rose-100 focus:!border-rose-400'
            : '!border-slate-200 focus:!ring-emerald-500/20 focus:!border-emerald-500'
        } ${className}`}
        inputStyle={{ height: heightPx, paddingLeft: `${parseInt(buttonWidthPx) + 8}px`, width: '100%' }}
        buttonClass="!bg-white !rounded-l-xl hover:!bg-slate-50"
        buttonStyle={{ height: heightPx, width: buttonWidthPx, borderColor: isInvalid ? '#fda4af' : '#e2e8f0' }}
        dropdownClass="!text-sm"
        containerClass="!w-full"
      />
      {isInvalid && (
        <p className="text-xs text-rose-500 font-semibold mt-1 ml-1">Enter a valid phone number</p>
      )}
    </div>
  );
};

export default PhoneNumberInput;
