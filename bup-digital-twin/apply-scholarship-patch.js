// Applies the 5 small edits needed for the Scholarship feature.
//
//   Run from the project ROOT (the folder that contains "client" and "server"):
//       node apply-scholarship-patch.js
//
// Safe by design:
//  - It only changes the small parts it needs; nothing else in those files is touched
//    (Bangla text, other features, line endings stay exactly as they are).
//  - All-or-nothing: if any one spot cannot be found, NOTHING is written and it tells you which one.
//  - Safe to run twice: parts that are already patched are skipped.
//  - Use `git diff` afterwards to see exactly what changed (`git restore <file>` undoes a file).

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const P = (...p) => path.join(ROOT, ...p);

// the new files must already be copied in (step 1)
const needed = [
  ['server', 'routes', 'scholarships.js'],
  ['server', 'scholarshipData.js'],
  ['client', 'src', 'scholarshipI18n.js'],
  ['client', 'src', 'scholarships.css'],
  ['client', 'src', 'components', 'ScholarshipCard.jsx'],
  ['client', 'src', 'components', 'ScholarshipModal.jsx'],
  ['client', 'src', 'pages', 'Scholarships.jsx'],
];
const missing = needed.filter((f) => !fs.existsSync(P(...f))).map((f) => f.join('/'));
if (missing.length) {
  console.error('\nThese new files are missing. Copy the zip contents into the project first:\n  - ' + missing.join('\n  - '));
  console.error('\n(Are you running this from the project root, the folder that has "client" and "server"?)');
  process.exit(1);
}

const NEW_SCHEMA = `const Scholarship = mongoose.model('Scholarship', new Schema({
  category: { type: String, enum: ['BUP', 'International'], required: true, index: true },
  title: { type: String, required: true },
  type: { type: String, default: '' },            // BUP: "Merit Based"
  minCgpa: { type: Number },                      // BUP only
  amount: { type: String, default: '' },          // "BDT 2,500/month"
  country: { type: String, default: '' },
  countryCode: { type: String, default: '' },     // 'gb', 'eu', 'us' ... (flag-icons)
  level: { type: [String], default: [] },         // ["Master's", 'PhD']
  funding: { type: String, default: '' },
  deadline: { type: Date },                       // when set, status flips Open -> Closed by itself
  deadlineNote: { type: String, default: '' },    // shown on the card when there is no fixed date
  statusManual: { type: String, enum: ['Open', 'Closed', 'Upcoming', 'Varies'], default: 'Varies' },
  eligibility: { type: [String], default: [] },
  note: { type: String, default: '' },
  sourceName: { type: String, default: '' },
  applyUrl: { type: String, default: 'https://www.bup.edu.bd/' },
  lastVerified: { type: Date },
  order: { type: Number, default: 99 },
}));`;

// Each patch: file, "already done" marker, and a function that returns the new text (or null if the spot is not found)
const patches = [
  {
    file: ['server', 'models', 'index.js'],
    done: "level: { type: [String]",   // the final schema; an older hand-edited schema (level: String) gets replaced
    apply: (src, nl) => {
      const rx = /const Scholarship = mongoose\.model\('Scholarship', new Schema\(\{[\s\S]*?\}\)\);/;
      if (!rx.test(src)) return null;
      return src.replace(rx, () => NEW_SCHEMA.replace(/\n/g, nl));
    },
  },
  {
    file: ['server', 'server.js'],
    done: '/api/scholarships',
    apply: (src, nl) => {
      const rx = /(app\.use\('\/api\/clubs'[^\r\n]*\r?\n)/;
      if (!rx.test(src)) return null;
      return src.replace(rx, (m) => m + "app.use('/api/scholarships', wrap(require('./routes/scholarships')));" + nl);
    },
  },
  {
    file: ['server', 'routes', 'misc.js'],
    done: null, // checked below (both parts)
    apply: (src) => {
      let out = src;
      const imp = /const \{ Scholarship, (Place[^}]*)\} = require\('\.\.\/models'\);/;
      const route = /\/\/ Scholarships\r?\nrouter\.get\('\/scholarships'[\s\S]*?\r?\n\}\);\r?\n(\r?\n)?/;
      const hasImp = imp.test(out);
      const hasRoute = route.test(out);
      if (!hasImp && !hasRoute) return out;   // already patched
      if (!hasImp || !hasRoute) return null;
      out = out.replace(imp, (m, rest) => `const { ${rest}} = require('../models');`);
      out = out.replace(route, '');
      return out;
    },
  },
  {
    file: ['server', 'seed.js'],
    done: "require('./scholarshipData')",
    apply: (src, nl) => {
      const rx = /\/\/ PLACEHOLDER scholarship[^\r\n]*\r?\nconst scholarships = \[[\s\S]*?\r?\n\];\r?\n/;
      if (!rx.test(src)) return null;
      return src.replace(rx, () => "const scholarships = require('./scholarshipData');   // real data: server/scholarshipData.js" + nl);
    },
  },
  {
    file: ['client', 'src', 'i18n.jsx'],
    done: 'scholarshipI18n',
    apply: (src, nl) => {
      const firstImport = /^(\uFEFF?import [^\r\n]*\r?\n)/;
      const ctx = /(\r?\n)(const Ctx = createContext\(null\);)/;
      if (!firstImport.test(src) || !ctx.test(src)) return null;
      let out = src.replace(firstImport, (m) => m + "import { SCH_EN, SCH_BN } from './scholarshipI18n.js';" + nl);
      out = out.replace(ctx, (m, brk, line) =>
        `${brk}Object.assign(T.en, SCH_EN);   // scholarship texts${nl}Object.assign(T.bn, SCH_BN);${nl}${line}`);
      return out;
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
  const src = fs.readFileSync(fp, 'utf8');
  const nl = src.includes('\r\n') ? '\r\n' : '\n';
  if (p.done && src.includes(p.done)) { console.log(`- ${label}: already patched, skipped`); continue; }
  const out = p.apply(src, nl);
  if (out === null) { console.error(`X ${label}: could not find the spot to change (file differs from what I expected)`); failed = true; continue; }
  if (out === src) { console.log(`- ${label}: already patched, skipped`); continue; }
  plan.push({ fp, label, out });
}

if (failed) {
  console.error('\nNothing was changed. Send me the lines above (or the file named) and I will fix it.');
  process.exit(1);
}
for (const x of plan) {
  fs.writeFileSync(x.fp, x.out, 'utf8');
  console.log(`OK ${x.label}: patched`);
}
console.log(plan.length ? '\nDone. Next:  npm run seed   then   npm run dev' : '\nNothing to do (everything was already patched).');
