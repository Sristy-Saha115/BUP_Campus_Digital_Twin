// Searches the BUP website knowledge base (server/knowledge/bup-kb.json, made by `npm run kb:build`).
// If the file does not exist yet, every search simply returns [] and the assistant works as before.
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'bup-kb.json');

const STOP = new Set(('a an the of in on at to for from by with and or is are was were be been am do does did ' +
  'what which who whom whose when where why how can could should would will shall may might i me my we our you your ' +
  'it its this that these those there here about tell give show please any some bup university bangladesh ' +
  'professionals have has had get want need know find information info details detail also many much').split(' '));

// Common Bangla words -> English keywords (the website text is English)
const BN_MAP = [
  ['ভর্তি', 'admission'], ['আবেদন', 'apply admission'], ['লাইব্রেরি', 'library'], ['গ্রন্থাগার', 'library'],
  ['ফ্যাকাল্টি', 'faculty'], ['অনুষদ', 'faculty'], ['বিভাগ', 'department'], ['প্রোগ্রাম', 'program'],
  ['স্নাতকোত্তর', 'graduate masters'], ['স্নাতক', 'undergraduate'], ['যোগাযোগ', 'contact'], ['ফোন', 'phone'],
  ['ইমেইল', 'email'], ['ঠিকানা', 'address'], ['ক্যান্টিন', 'cafeteria'], ['ক্যাফেটেরিয়া', 'cafeteria'],
  ['মেডিকেল', 'medical'], ['হল', 'hall'], ['ইতিহাস', 'history'], ['ল্যাব', 'lab'], ['ক্লাব', 'club'],
  ['উপাচার্য', 'vice chancellor'], ['ভিসি', 'vice chancellor'], ['রেজিস্ট্রার', 'registrar'], ['ক্যালেন্ডার', 'calendar'],
  ['নোটিশ', 'notice'], ['ফি', 'fee'], ['নিরাপত্তা', 'security'], ['গবেষণা', 'research'], ['ভাষা', 'language'],
  ['ক্যারিয়ার', 'career'], ['প্লেসমেন্ট', 'placement'], ['সনদ', 'certificate'], ['সার্টিফিকেট', 'certificate'],
  ['বিইউপি', 'bup'], ['খেলাধুলা', 'physical education'], ['আইসিটি', 'ict'],
];

const stem = (w) => {
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
};
const tokens = (s) =>
  (String(s).toLowerCase().match(/[a-z0-9]+/g) || [])
    .filter((w) => !STOP.has(w) && (w.length > 1 || /\d/.test(w)))
    .map(stem);

const expandBn = (s) => {
  let extra = '';
  for (const [bn, en] of BN_MAP) if (s.includes(bn)) extra += ' ' + en;
  return s + extra;
};

let cache = { mtime: -1, docs: [], df: new Map(), avgLen: 1, builtAt: null };

function load() {
  let st;
  try { st = fs.statSync(FILE); } catch { cache = { mtime: 0, docs: [], df: new Map(), avgLen: 1, builtAt: null }; return cache; }
  if (st.mtimeMs === cache.mtime) return cache;
  let raw;
  try { raw = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch (e) {
    console.error('Knowledge base file is unreadable:', e.message);
    return cache;
  }
  const docs = (raw.chunks || []).map((c) => {
    const body = tokens(c.text || '');
    const tf = new Map();
    for (const w of body) tf.set(w, (tf.get(w) || 0) + 1);
    return { ...c, tt: new Set(tokens(c.title || '')), tf, len: body.length || 1 };
  });
  const df = new Map();
  for (const d of docs) {
    for (const w of new Set([...d.tf.keys(), ...d.tt])) df.set(w, (df.get(w) || 0) + 1);
  }
  const avgLen = docs.length ? docs.reduce((a, d) => a + d.len, 0) / docs.length : 1;
  cache = { mtime: st.mtimeMs, docs, df, avgLen, builtAt: raw.builtAt || null };
  return cache;
}

// Returns the best matching chunks: [{ score, coverage, title, url, text, fetchedAt }]
function searchKb(query, { limit = 3 } = {}) {
  const { docs, df, avgLen } = load();
  if (!docs.length) return [];
  const q = [...new Set(tokens(expandBn(String(query || ''))))];
  if (!q.length) return [];
  const N = docs.length;
  const k1 = 1.5, b = 0.75;
  const out = [];
  for (const d of docs) {
    let score = 0, matched = 0;
    for (const w of q) {
      const tf = d.tf.get(w) || 0;
      const inTitle = d.tt.has(w);
      if (!tf && !inTitle) continue;
      matched += 1;
      const n = df.get(w) || 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      if (tf) score += idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * d.len) / avgLen)));
      if (inTitle) score += idf * 1.2;
    }
    if (matched) out.push({ score, coverage: matched / q.length, title: d.title, url: d.url, text: d.text, fetchedAt: d.fetchedAt });
  }
  out.sort((a, c) => c.score * (0.5 + c.coverage) - a.score * (0.5 + a.coverage));
  return out.slice(0, limit);
}

// Is this match good enough to answer without a language model?
const isStrongHit = (h) => !!h && h.coverage >= 0.6 && h.score >= 4;

function kbStatus() {
  const c = load();
  return { chunks: c.docs.length, builtAt: c.builtAt };
}

module.exports = { searchKb, isStrongHit, kbStatus };
