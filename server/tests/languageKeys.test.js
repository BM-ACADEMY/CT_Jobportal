const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// Text-based check of the client dictionary (server tests cannot import client code).
const SRC = path.join(__dirname, '..', '..', 'client', 'src');
const FILE = path.join(SRC, 'i18n', 'translations.js');

// Pull the `key: 'value'` pairs out of one exported object, without executing the file.
const entriesOf = (text, name) => {
  const start = text.indexOf(`export const ${name} = {`);
  assert.ok(start >= 0, `export const ${name} not found`);
  const end = text.indexOf('\n};', start);
  const body = text.slice(start, end);
  const out = {};
  const re = /^\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"):\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"),?\s*$/gm;
  let m;
  while ((m = re.exec(body))) {
    const key = m[1] !== undefined ? m[1] : m[2];
    const val = m[3] !== undefined ? m[3] : m[4];
    assert.ok(!(key in out), `duplicate key in ${name}: ${key}`);
    out[key] = val.replace(/\\'/g, "'").replace(/\\"/g, '"');
  }
  return out;
};

const text = fs.readFileSync(FILE, 'utf8');
const en = entriesOf(text, 'en');
const ta = entriesOf(text, 'ta');

test('dictionary has entries and a native-reader QC note', () => {
  assert.ok(Object.keys(en).length > 50);
  assert.ok(Object.keys(ta).length > 50);
  assert.match(text.split('\n').slice(0, 5).join('\n'), /native Tamil reader/i);
});

test('every Tamil key exists in English', () => {
  const missing = Object.keys(ta).filter((k) => !(k in en));
  assert.deepStrictEqual(missing, []);
});

test('no English or Tamil value is empty', () => {
  for (const [k, v] of Object.entries(en)) assert.ok(v.trim().length > 0, `empty en value: ${k}`);
  for (const [k, v] of Object.entries(ta)) assert.ok(v.trim().length > 0, `empty ta value: ${k}`);
});

test('Tamil values actually contain Tamil script', () => {
  const bad = Object.entries(ta).filter(([, v]) => !/[஀-௿]/.test(v)).map(([k]) => k);
  assert.deepStrictEqual(bad, []);
});

test('prices, GST and numbers are not translated', () => {
  const bad = Object.entries(en).filter(([k, v]) => /[₹$]|\d|GST/i.test(v) && !/^home\.steps\.title$/.test(k)).map(([k]) => k);
  assert.deepStrictEqual(bad, []);
});

test('no legal-page strings in the dictionary', () => {
  const bad = Object.keys(en).filter((k) => /privacy|terms|refund/i.test(k));
  assert.deepStrictEqual(bad, []);
});

// Every t('key', 'English') and <T k="key">English</T> in the UI must match the English dictionary,
// so English output stays identical and a typo cannot silently drop a translation.
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
  const p = path.join(dir, d.name);
  if (d.isDirectory()) return walk(p);
  return /\.jsx?$/.test(d.name) ? [p] : [];
});

test('UI fallbacks match the English dictionary', () => {
  const problems = [];
  for (const file of walk(SRC)) {
    if (file === FILE) continue;
    const src = fs.readFileSync(file, 'utf8');
    const rel = path.relative(SRC, file);
    for (const m of src.matchAll(/\bt\(\s*'([^']+)'\s*,\s*'((?:[^'\\]|\\.)*)'\s*\)/g)) {
      const fallback = m[2].replace(/\\'/g, "'");
      if (!(m[1] in en)) problems.push(`${rel}: unknown key ${m[1]}`);
      else if (fallback && en[m[1]] !== fallback) problems.push(`${rel}: ${m[1]} fallback differs from en`);
    }
    for (const m of src.matchAll(/<T k="([^"]+)">([^<{]*)<\/T>/g)) {
      const fallback = m[2].replace(/&amp;/g, '&').trim();
      if (!(m[1] in en)) problems.push(`${rel}: unknown key ${m[1]}`);
      else if (en[m[1]] !== fallback) problems.push(`${rel}: ${m[1]} text differs from en`);
    }
    // Dynamic keys: <T k={'lbl.' + x}> are covered by the dictionary lists above.
  }
  assert.deepStrictEqual(problems, []);
});
