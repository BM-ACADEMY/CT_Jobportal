// Turns the plain text of an admin-written blog post into simple blocks. No HTML is ever used, so a post
// cannot run scripts. Marks:  ## Heading   ### Smaller heading   - bullet   1. numbered   > quote
//                             **bold**   [link text](https://...)   ![picture description](https://... or /uploads/...)
// A blank line starts a new paragraph.

const SAFE_URL = /^(https?:\/\/|\/(?!\/)|mailto:)[^\s"'<>]*$/i;
export const safeUrl = (u) => (SAFE_URL.test(String(u || '').trim()) ? String(u).trim() : '');

// "text **bold** [link](url)" -> [{ t: 'text'|'bold'|'link', text, href? }]
export const parseInline = (text) => {
  const out = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0; let m;
  const s = String(text || '');
  while ((m = re.exec(s))) {
    if (m.index > last) out.push({ t: 'text', text: s.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ t: 'bold', text: m[1] });
    else {
      const href = safeUrl(m[3]);
      out.push(href ? { t: 'link', text: m[2], href } : { t: 'text', text: m[2] });
    }
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ t: 'text', text: s.slice(last) });
  return out;
};

export const parseBody = (body) => {
  const lines = String(body || '').replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let para = []; let list = null;
  const flushPara = () => { if (para.length) { blocks.push({ type: 'p', inline: parseInline(para.join(' ')) }); para = []; } };
  const flushList = () => { if (list) { blocks.push(list); list = null; } };

  for (const raw of lines) {
    const line = raw.trim();
    let m;
    if (!line) { flushPara(); flushList(); continue; }
    if ((m = line.match(/^(#{2,3})\s+(.+)$/))) { flushPara(); flushList(); blocks.push({ type: m[1].length === 2 ? 'h2' : 'h3', inline: parseInline(m[2]) }); continue; }
    if ((m = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/))) {
      flushPara(); flushList();
      const src = safeUrl(m[2]);
      if (src) blocks.push({ type: 'img', alt: m[1], src });
      continue;
    }
    if ((m = line.match(/^>\s?(.*)$/))) { flushPara(); flushList(); blocks.push({ type: 'quote', inline: parseInline(m[1]) }); continue; }
    if ((m = line.match(/^[-*]\s+(.+)$/))) {
      flushPara();
      if (!list || list.type !== 'ul') { flushList(); list = { type: 'ul', items: [] }; }
      list.items.push(parseInline(m[1])); continue;
    }
    if ((m = line.match(/^\d+[.)]\s+(.+)$/))) {
      flushPara();
      if (!list || list.type !== 'ol') { flushList(); list = { type: 'ol', items: [] }; }
      list.items.push(parseInline(m[1])); continue;
    }
    flushList();
    para.push(line);
  }
  flushPara(); flushList();
  return blocks;
};
