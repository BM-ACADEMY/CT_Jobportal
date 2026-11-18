const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { pathToFileURL } = require('url');

const load = () => import(pathToFileURL(path.join(__dirname, '../../client/src/data/blogBody.js')).href);

test('headings, bullets, numbers, quotes and paragraphs become blocks', async () => {
  const { parseBody } = await load();
  const blocks = parseBody('## Big\n\nFirst line\nsecond line\n\n- one\n- two\n\n1. a\n2. b\n\n> quoted\n\n### Small');
  assert.deepEqual(blocks.map((b) => b.type), ['h2', 'p', 'ul', 'ol', 'quote', 'h3']);
  assert.equal(blocks[1].inline[0].text, 'First line second line');
  assert.equal(blocks[2].items.length, 2);
});

test('bold and safe links work; scripts and odd links turn into plain words', async () => {
  const { parseInline, safeUrl } = await load();
  const out = parseInline('Read **this** and [our jobs](https://velaivaaipu.in/jobs) or [bad](javascript:alert(1))');
  assert.equal(out[1].t, 'bold');
  assert.equal(out[3].t, 'link');
  assert.equal(out[3].href, 'https://velaivaaipu.in/jobs');
  assert.equal(out.filter((p) => p.t === 'link').length, 1, 'only the safe link is a link');
  assert.ok(out.some((p) => p.t === 'text' && p.text === 'bad'));
  assert.equal(safeUrl('javascript:alert(1)'), '');
  assert.equal(safeUrl('data:text/html,x'), '');
  assert.equal(safeUrl('//evil.com'), '');
  assert.equal(safeUrl('/jobs'), '/jobs');
  assert.equal(safeUrl('mailto:a@b.in'), 'mailto:a@b.in');
});

test('raw HTML stays as text and pictures need a safe address', async () => {
  const { parseBody } = await load();
  const blocks = parseBody('<script>alert(1)</script>\n\n![ok](/uploads/blog/a.webp)\n\n![bad](javascript:alert(1))');
  assert.equal(blocks[0].type, 'p');
  assert.equal(blocks[0].inline[0].text, '<script>alert(1)</script>');
  assert.equal(blocks.filter((b) => b.type === 'img').length, 1);
  assert.equal(blocks.find((b) => b.type === 'img').src, '/uploads/blog/a.webp');
});

test('empty and odd input never throws', async () => {
  const { parseBody } = await load();
  assert.deepEqual(parseBody(''), []);
  assert.deepEqual(parseBody(null), []);
  assert.doesNotThrow(() => parseBody('**\n[\n]()\n#\n## \n- \n'));
});
