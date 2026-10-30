// Adds the BUP website knowledge base to the AI Assistant.
//
//   Run from the project ROOT (the folder that contains "client" and "server"):
//       node apply-chat-kb-patch.js
//
// Safe by design (same style as apply-scholarship-patch.js):
//  - Only the small spots it needs are changed; Bangla text and line endings stay as they are.
//  - All-or-nothing: if any spot cannot be found, NOTHING is written and it tells you which one.
//  - Safe to run twice: parts that are already patched are skipped.
//  - Use `git diff` afterwards to see what changed (`git restore <file>` undoes a file).

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const P = (...p) => path.join(ROOT, ...p);

const needed = [['server', 'knowledge', 'search.js'], ['server', 'scripts', 'build-kb.js']];
const missing = needed.filter((f) => !fs.existsSync(P(...f))).map((f) => f.join('/'));
if (missing.length) {
  console.error('\nThese new files are missing. Copy them into the project first:\n  - ' + missing.join('\n  - '));
  process.exit(1);
}

const nlify = (s, nl) => s.replace(/\r?\n/g, nl);

// ---------------------------------------------------------------- chat.js
const HELPERS = `const { Faculty, Scholarship, Club, ClubEvent, Donor } = require('../models');
const { optionalAuth } = require('../middleware/auth');
const { searchKb, isStrongHit } = require('../knowledge/search');

// ---- BUP website knowledge + role-aware helpers (added by apply-chat-kb-patch.js) ----
// Same rule as /api/scholarships: Students see all, Faculty see International only, everyone else none.
const scholarScope = (user) => {
  if (user && user.role === 'Student') return {};
  if (user && user.role === 'Faculty') return { category: 'International' };
  return { _id: null };
};
const LOGIN_SCH = {
  en: 'Scholarship details are available to logged-in student and faculty accounts. Please log in first.',
  bn: 'স্কলারশিপের তথ্য শুধু লগইন করা শিক্ষার্থী ও শিক্ষক অ্যাকাউন্টের জন্য। অনুগ্রহ করে আগে লগইন করুন।',
};
// Questions about live project data go to the database code, not to the website knowledge base
const LIVE_RX = /scholar|stipend|blood|donor|\\bbus\\b|\\bslot|consult|appoint|\\bbook\\b|login|sign ?up|\\bclub|\\bevent|who (is|are) in|teacher|professor|lecturer|\\bsir\\b|madam|বৃত্তি|স্কলার|রক্ত|বাস|ক্লাব|ইভেন্ট|স্লট|পরামর্শ|শিক্ষক/i;
const clip = (s, n) => {
  const t = String(s || '');
  if (t.length <= n) return t;
  const cut = t.slice(0, n);
  const at = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('\\n'));
  return (at > n * 0.5 ? cut.slice(0, at + 1) : cut) + ' ...';
};
function kbAnswer(msg, lang) {
  if (LIVE_RX.test(msg)) return null;
  const hits = searchKb(msg, { limit: 1 });
  if (!hits.length || !isStrongHit(hits[0])) return null;
  const h = hits[0];
  const intro = lang === 'bn' ? 'বিইউপি-র অফিসিয়াল ওয়েবসাইট অনুযায়ী (ইংরেজি তথ্য):' : 'From the official BUP website:';
  const src = lang === 'bn' ? 'সূত্র: ' : 'Source: ';
  const links = [{ label: src + h.title, to: h.url }];
  if (/\\bwhere\\b|\\blocat|\\bmap\\b|কোথায়|অবস্থান/i.test(msg)) links.push({ label: lang === 'bn' ? 'ক্যাম্পাস ম্যাপ' : 'Campus Map', to: '/map' });
  return { text: intro + '\\n' + clip(h.text, 700), links };
}
function kbQuery(message, history = []) {
  const prev = [...history].reverse().find((m) => m.role === 'user');
  return message.length < 40 && prev ? prev.content + ' ' + message : message;
}
function kbBlock(message, history) {
  const hits = searchKb(kbQuery(message, history), { limit: 4 });
  if (!hits.length) return 'BUP WEBSITE FACTS: (no matching page found in the knowledge base)';
  return ['BUP WEBSITE FACTS (copied from bup.edu.bd; cite the URL):']
    .concat(hits.map((h, i) => '[' + (i + 1) + '] ' + h.title + ' - ' + h.url + ' (captured ' + (h.fetchedAt || '?') + ')\\n' + clip(h.text, 900)))
    .join('\\n');
}
function sourceLinks(message, history) {
  const hits = searchKb(kbQuery(message, history), { limit: 3 }).filter((h) => h.coverage >= 0.5);
  const seen = new Set();
  return hits.filter((h) => !seen.has(h.url) && seen.add(h.url)).slice(0, 2).map((h) => ({ label: 'Source: ' + h.title, to: h.url }));
}
const dedupeLinks = (links) => { const s = new Set(); return links.filter((l) => !s.has(l.to) && s.add(l.to)); };
// ---- end of added helpers ----`;

const CAMPUS_CONTEXT = `async function campusContext(user) {
  const [faculty, schol, clubs, events] = await Promise.all([
    Faculty.find(),
    Scholarship.find(scholarScope(user)),
    Club.find().sort('order'),
    ClubEvent.find().sort('-createdAt').limit(15),
  ]);
  const role = user && user.role ? user.role : 'guest (not logged in)';
  return [
    'LIVE PROJECT DATA (from the project database). Today is ' + new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }) + ' (Dhaka time). The user is: ' + role + '.',
    'FACULTY (name | designation | department):',
    ...faculty.map((f) => \`\${f.name} | \${f.designation} | \${f.department}\`),
    user && (user.role === 'Student' || user.role === 'Faculty')
      ? 'SCHOLARSHIPS (title | category | country | levels | min GPA | deadline | fully funded):'
      : 'SCHOLARSHIPS: not shown to this user. Tell them scholarship details are for logged-in students and faculty.',
    ...schol.map((s) => \`\${s.title} | \${s.category} | \${s.country} | \${s.levels.join('/')} | \${s.minGpa}/\${s.gpaScale} | \${s.deadline ? s.deadline.toISOString().slice(0, 10) : 'rolling'} | \${s.fullyFunded ? 'yes' : 'no'}\`),
    'CLUBS: ' + clubs.map((c) => c.name).join('; '),
    'CLUB EVENTS (title | club | date | venue):',
    ...(events.length ? events.map((e) => \`\${e.title} | \${e.clubName} | \${e.date || 'date TBA'} | \${e.venue || '-'}\`) : ['(no events posted)']),
  ].join('\\n');
}
`;

const GROUNDING = `    'There are two kinds of facts. (1) LIVE PROJECT DATA below is the only source for faculty, scholarships, clubs and club events. (2) BUP WEBSITE FACTS below are copied from the official bup.edu.bd website and are the only source for general questions about BUP (history, faculties, departments, programs, admission, offices, contacts, facilities).',
    'Never guess. If the answer is in neither section, say you do not have verified information and point to https://www.bup.edu.bd or info@bup.edu.bd. When you use a website fact, end with a line "Source: <url>". Fees, deadlines and dates can change: tell the user to confirm on the official page. Scholarship deadlines in the live data are sample data: tell users to confirm on the official website.',
    'Bus times, the campus map and consultation slots are in the app pages (Bus Tracking, Campus Map, Faculty Slots): send users there instead of inventing times or locations.',
`;

const REPLACE_ONCE = (src, from, to) => {
  if (typeof from === 'string') {
    const i = src.indexOf(from);
    return i === -1 ? null : src.slice(0, i) + to + src.slice(i + from.length);
  }
  return from.test(src) ? src.replace(from, () => to) : null;
};

function patchChat(src, nl) {
  let out = src;
  const steps = [
    ["const { Faculty, Scholarship, Club, Donor } = require('../models');", nlify(HELPERS, nl)],
    [/async function campusContext\(\) \{[\s\S]*?\r?\n\}\r?\n/, nlify(CAMPUS_CONTEXT, nl)],
    ['async function askClaude(message, history, lang) {', 'async function askClaude(message, history, lang, user) {'],
    [/^[ \t]*'Use ONLY the data below[^\r\n]*\r?\n/m, nlify(GROUNDING, nl)],
    ["'', await campusContext(),", "'', await campusContext(user), '', kbBlock(message, history),"],
    ['async function ruleBased(message, lang) {', 'async function ruleBased(message, lang, user = null) {'],
    ['return reply(t.unknown);', "const weak = searchKb(msg, { limit: 1 })[0];" + nl + "  if (weak && weak.coverage >= 0.3 && !LIVE_RX.test(msg)) {" + nl + "    const near = lang === 'bn' ? 'সঠিক উত্তর খুঁজে পাইনি। বিইউপি-র অফিসিয়াল ওয়েবসাইটের সবচেয়ে কাছাকাছি পেজ:' : 'I could not find an exact answer. The closest page on the official BUP website is:';" + nl + "    return reply(near + ' ' + weak.title, [{ label: (lang === 'bn' ? 'সূত্র: ' : 'Source: ') + weak.title, to: weak.url }]);" + nl + "  }" + nl + "  return reply(t.unknown);"],
    [/\/\/ Scholarships \(optionally with a GPA/, "// BUP website knowledge (general questions)" + nl + "  const kbHit = kbAnswer(msg, lang);" + nl + "  if (kbHit) return reply(kbHit.text, kbHit.links);" + nl + nl + "  // Scholarships (optionally with a GPA"],
    ['Scholarship.find().sort({ deadline: 1 })', 'Scholarship.find(scholarScope(user)).sort({ deadline: 1 })'],
    ['if (!list.length) return reply(t.scholNone,', "if (!user || !['Student', 'Faculty'].includes(user.role)) return reply(LOGIN_SCH[lang], [{ label: t.open, to: '/login' }]);" + nl + "    if (!list.length) return reply(t.scholNone,"],
    ["router.post('/', async (req, res) => {", "router.post('/', optionalAuth, async (req, res) => {"],
    ['const rules = await ruleBased(message, lang);', 'const rules = await ruleBased(message, lang, req.user);'],
    ['const ai = await askClaude(message, history, lang);', 'const ai = await askClaude(message, history, lang, req.user);'],
    ["if (ai) return res.json({ reply: ai, links: rules.links, mode: 'ai' });", "if (ai) return res.json({ reply: ai, links: dedupeLinks([...(rules.links || []), ...sourceLinks(message, history)]), mode: 'ai' });"],
  ];
  for (const [from, to] of steps) {
    out = REPLACE_ONCE(out, from, to);
    if (out === null) return { fail: String(from).slice(0, 70) };
  }
  return { out };
}

// ---------------------------------------------------------------- the file list
const patches = [
  {
    file: ['server', 'routes', 'chat.js'],
    done: "require('../knowledge/search')",
    apply: (src, nl) => {
      const r = patchChat(src, nl);
      if (r.fail) { console.error('   could not find: ' + r.fail); return null; }
      return r.out;
    },
  },
  {
    // /api/chat must be mounted BEFORE the misc router, because misc.js still has an old /chat rule
    // that answers first and hides the real assistant.
    file: ['server', 'server.js'],
    apply: (src, nl) => {
      const chatLine = /app\.use\('\/api\/chat', wrap\(require\('\.\/routes\/chat'\)\)\);\r?\n/;
      const miscLine = "app.use('/api', wrap(require('./routes/misc')));";
      const ci = src.search(chatLine);
      const mi = src.indexOf(miscLine);
      if (ci === -1 || mi === -1) return null;
      if (ci < mi) return src;   // already in the right order
      const without = src.replace(chatLine, '');
      const at = without.indexOf(miscLine);
      return without.slice(0, at) + "app.use('/api/chat', wrap(require('./routes/chat')));" + nl + without.slice(at);
    },
  },
  {
    file: ['server', 'package.json'],
    done: 'kb:build',
    apply: (src) => {
      const j = JSON.parse(src);
      j.scripts = { ...j.scripts, 'kb:build': 'node scripts/build-kb.js' };
      j.dependencies = { ...j.dependencies, cheerio: '^1.0.0' };
      return JSON.stringify(j, null, 2) + '\n';
    },
  },
  {
    file: ['package.json'],
    done: 'kb:build',
    apply: (src) => {
      const j = JSON.parse(src);
      j.scripts = { ...j.scripts, 'kb:build': 'npm run kb:build --prefix server' };
      return JSON.stringify(j, null, 2) + '\n';
    },
  },
  {
    file: ['client', 'src', 'pages', 'Chatbot.jsx'],
    done: 'noopener noreferrer',
    apply: (src) => {
      const rx = /\{m\.links\.map\(\(l\) => <Link key=\{l\.to\} to=\{l\.to\} className="btn btn-sm btn-navy me-2">\{l\.label\}[^\r\n]*?<\/Link>\)\}/;
      if (!rx.test(src)) return null;
      const repl =
        '{m.links.map((l) => (/^https?:\\/\\//.test(l.to)' +
        '\n                      ? <a key={l.to} href={l.to} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-navy me-2 mb-1">{l.label} \u2197</a>' +
        '\n                      : <Link key={l.to} to={l.to} className="btn btn-sm btn-navy me-2 mb-1">{l.label} \u2192</Link>))}';
      return src.replace(rx, () => repl);
    },
  },
];

// ---- plan everything first, write only if ALL succeed ----
const plan = [];
let failed = false;
for (const p of patches) {
  const fp = P(...p.file);
  const label = p.file.join('/');
  if (!fs.existsSync(fp)) { console.error(`X ${label}: file not found`); failed = true; continue; }
  const raw = fs.readFileSync(fp, 'utf8');
  const nl = raw.includes('\r\n') ? '\r\n' : '\n';
  if (p.done && raw.includes(p.done)) { console.log(`- ${label}: already patched, skipped`); continue; }
  let out;
  try { out = p.apply(raw, nl); } catch (e) { console.error(`X ${label}: ${e.message}`); failed = true; continue; }
  if (out === null) { console.error(`X ${label}: could not find the spot to change (file differs from what I expected)`); failed = true; continue; }
  if (out === raw) { console.log(`- ${label}: already patched, skipped`); continue; }
  const lineFix = nl === '\r\n' && !p.file.includes('package.json') ? out.replace(/\r?\n/g, '\r\n') : out;
  plan.push({ fp, label, out: lineFix });
}

if (failed) {
  console.error('\nNothing was changed. Send me the lines that failed and I will adjust the patch.');
  process.exit(1);
}
plan.forEach(({ fp, label, out }) => { fs.writeFileSync(fp, out, 'utf8'); console.log(`OK ${label}`); });
console.log(plan.length ? '\nDone. Next:  npm install --prefix server   then   npm run kb:build   then   npm run dev' : '\nNothing to do.');
