// Adds the public "Campus Explorer" feature to the existing project.
//
//   Run from the project ROOT (the folder that contains "client" and "server"):
//       node apply-campus-explorer-patch.js
//
// Safe by design (same style as apply-scholarship-patch.js / apply-chat-kb-patch.js):
//  - Only tiny INSERTIONS are made in 5 existing files; nothing is removed or rewritten.
//    Auth, login, role checks, dashboards, models and all other routes are NOT touched.
//  - All-or-nothing: if any spot cannot be found, NOTHING is written and it tells you which one.
//  - Safe to run twice: files that are already patched are skipped.
//  - Line endings (CRLF/LF) and Bangla text stay exactly as they are.
//  - Use `git diff` afterwards (`git restore <file>` undoes a file).

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const P = (...p) => path.join(ROOT, ...p);

// the new files must already be copied in
const needed = [
  ['server', 'campusExplorerData.js'],
  ['server', 'routes', 'explorer.js'],
  ['client', 'src', 'explorerI18n.js'],
  ['client', 'src', 'explorer.css'],
  ['client', 'src', 'pages', 'CampusExplorer.jsx'],
  ['client', 'src', 'components', 'explorer', 'FacilityCard.jsx'],
  ['client', 'src', 'components', 'explorer', 'NewsCard.jsx'],
  ['client', 'src', 'components', 'explorer', 'MapBadge.jsx'],
  ['client', 'src', 'components', 'explorer', 'ExplorerMap.jsx'],
  ['client', 'src', 'components', 'explorer', 'FacilityHighlight.jsx'],
];
const missing = needed.filter((f) => !fs.existsSync(P(...f))).map((f) => f.join('/'));
if (missing.length) {
  console.error('\nThese new files are missing. Copy the campus-explorer folder contents into the project first:\n  - ' + missing.join('\n  - '));
  console.error('\n(Are you running this from the project root, the folder that has "client" and "server"?)');
  process.exit(1);
}

// Insert `add` right AFTER the (single) line that contains `anchor`. Returns null if the anchor is missing / not unique.
function insertAfterLine(src, nl, anchor, addLines) {
  const first = src.indexOf(anchor);
  if (first === -1 || src.indexOf(anchor, first + 1) !== -1) return null;
  const eol = src.indexOf('\n', first);
  const end = eol === -1 ? src.length : eol + 1;
  const prefix = eol === -1 ? nl : '';
  return src.slice(0, end) + prefix + addLines.join(nl) + nl + src.slice(end);
}

// Insert `addLines` right BEFORE the (single) line that contains `anchor`, keeping that line's indentation for the new lines.
function insertBeforeLine(src, nl, anchor, addLines) {
  const first = src.indexOf(anchor);
  if (first === -1 || src.indexOf(anchor, first + 1) !== -1) return null;
  const lineStart = src.lastIndexOf('\n', first) + 1;
  return src.slice(0, lineStart) + addLines.join(nl) + nl + src.slice(lineStart);
}

const patches = [
  {
    // public API route; mounted before the generic /api router (misc.js) like the chat route
    file: ['server', 'server.js'],
    done: "routes/explorer",
    apply: (src, nl) => insertBeforeLine(src, nl, "app.use('/api', wrap(require('./routes/misc')));", [
      "app.use('/api/explorer', wrap(require('./routes/explorer')));   // public Campus Explorer (read-only, no login)",
    ]),
  },
  {
    // import + public route (no guard, like every other page route here)
    file: ['client', 'src', 'App.jsx'],
    done: 'CampusExplorer',
    apply: (src, nl) => {
      const a = insertAfterLine(src, nl, "import Chatbot from './pages/Chatbot.jsx';", [
        "import CampusExplorer from './pages/CampusExplorer.jsx';",
      ]);
      if (a === null) return null;
      return insertAfterLine(a, nl, '<Route path="/chatbot" element={<Chatbot />} />', [
        '          <Route path="/explorer" element={<CampusExplorer />} />',
      ]);
    },
  },
  {
    // "More" dropdown entry (between Clubs and AI Assistant)
    file: ['client', 'src', 'components', 'Navbar.jsx'],
    done: "'/explorer'",
    apply: (src, nl) => insertBeforeLine(src, nl, "['/chatbot', 'nav.chatbot', 'fa-robot'],", [
      "  ['/explorer', 'nav.explorer', 'fa-compass'],",
    ]),
  },
  {
    // UI text (EN + BN), merged the same way scholarshipI18n.js is
    file: ['client', 'src', 'i18n.jsx'],
    done: 'explorerI18n',
    apply: (src, nl) => {
      const a = insertAfterLine(src, nl, "import { SCH_EN, SCH_BN } from './scholarshipI18n.js';", [
        "import { EXP_EN, EXP_BN } from './explorerI18n.js';",
      ]);
      if (a === null) return null;
      return insertAfterLine(a, nl, 'Object.assign(T.bn, SCH_BN);', [
        'Object.assign(T.en, EXP_EN);',
        'Object.assign(T.bn, EXP_BN);',
      ]);
    },
  },
  {
    // existing 2D map: /map?facility=<slug> highlights a facility, ONLY when its position is verified
    file: ['client', 'src', 'pages', 'CampusMap.jsx'],
    done: 'FacilityHighlight',
    apply: (src, nl) => {
      let out = insertAfterLine(src, nl, "import { CAMPUS_CENTER, UNIRANK_MAP_URL } from '../config.js';", [
        "import { FacilityHighlight, FacilityMapNotice } from '../components/explorer/FacilityHighlight.jsx';",
      ]);
      if (out === null) return null;
      out = insertBeforeLine(out, nl, "{tab === 'interactive' ? (", [
        "          {tab === 'interactive' && <FacilityMapNotice />}",
      ]);
      if (out === null) return null;
      return insertAfterLine(out, nl, '</CircleMarker>', [
        '              <FacilityHighlight />',
      ]);
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
  if (raw.includes(p.done)) { console.log(`- ${label}: already patched, skipped`); continue; }
  let out;
  try { out = p.apply(raw, nl); } catch (e) { console.error(`X ${label}: ${e.message}`); failed = true; continue; }
  if (out === null) { console.error(`X ${label}: could not find the spot to change (file differs from what I expected)`); failed = true; continue; }
  plan.push({ fp, label, out });
}

if (failed) {
  console.error('\nNothing was changed. Send me the lines that failed and I will adjust the patch.');
  process.exit(1);
}
plan.forEach(({ fp, label, out }) => { fs.writeFileSync(fp, out, 'utf8'); console.log(`OK ${label}`); });
console.log(plan.length
  ? '\nDone. Restart the dev server:  npm run dev   then open  http://localhost:5173/explorer'
  : '\nNothing to do.');
