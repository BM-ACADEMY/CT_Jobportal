// Flags job text with vulgar, abusive or adult wording so an admin can look at it. Like the scam check, it never hides
// or blocks a job: a flag only adds the job to the admin's "Needs review" count.
// Whole words only, so honest text ("sex ratio" in a survey job, "Essex", "classic") is left alone.
const WORDS = [
  'porn', 'porno', 'pornography', 'nude', 'nudes', 'naked', 'xxx', 'onlyfans', 'escort', 'escorts', 'call girl', 'callgirl', 'gigolo',
  'sex chat', 'sexting', 'adult video', 'adult videos', 'hookup', 'erotic', 'fuck', 'fucking', 'fucker', 'motherfucker', 'bitch', 'bastard', 'slut', 'whore', 'dick', 'pussy', 'cunt', 'asshole',
  // common abusive words written in English letters (Tamil / Hindi)
  'punda', 'pundai', 'otha', 'ommala', 'sunni', 'thevidiya', 'thevdiya', 'koothi', 'myiru', 'mayiru', 'gotha',
  'madarchod', 'behenchod', 'bhosdi', 'bhosdike', 'chutiya', 'randi', 'harami', 'gaandu', 'lund'
];
const RE = new RegExp(`(?<![a-z0-9])(?:${WORDS.map((w) => w.replace(/ /g, '\\s+')).join('|')})(?![a-z0-9])`, 'i');

const inappropriateText = (text) => RE.test(String(text || '').replace(/<[^>]*>/g, ' ').replace(/[*_.\-]+(?=\w)/g, ''));

module.exports = { inappropriateText };
