// Builds server/knowledge/bup-kb.json from the public pages of https://www.bup.edu.bd
//
//   Run:  npm run kb:build        (from the project root or from the server folder)
//
// - Downloads a fixed list of pages (about 40) politely, one at a time.
// - Removes menus/footers (lines that repeat on many pages), cuts the text into small chunks.
// - If one page fails, its OLD chunks are kept, so the knowledge base never gets emptier by accident.
// - Add your own verified facts in server/knowledge/manual.json:
//     [ { "title": "Library hours", "url": "https://www.bup.edu.bd/...", "text": "..." } ]
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const BASE = 'https://www.bup.edu.bd';
const OUT = path.join(__dirname, '..', 'knowledge', 'bup-kb.json');
const MANUAL_FILE = path.join(__dirname, '..', 'knowledge', 'manual.json');
const UA = 'BUP-Digital-Twin-KB-Builder/1.0 (university project; polite crawl)';
const DELAY_MS = 800;
const MAX_DISCOVERED = 40;
const CHUNK_MAX = 800;
const MAX_CHUNKS_PER_PAGE = 40;

// [path, title shown to the user as the source name]
const PAGES = [
  ['/about', 'About BUP (history)'],
  ['/facts-figures', 'BUP Facts & Figures / FAQ'],
  ['/contact', 'Contact BUP'],
  ['/citizen-charter', 'BUP Citizen Charter'],
  ['/faculty_home/1', 'Faculty of Arts & Social Sciences (FASS)'],
  ['/faculty_home/2', 'Faculty of Security & Strategic Studies (FSSS)'],
  ['/faculty_home/3', 'Faculty of Science & Technology (FST)'],
  ['/faculty_home/4', 'Faculty of Business Studies (FBS)'],
  ['/faculty_home/7', 'Faculty of Medical Studies (FMS)'],
  ['/faculty_home/8', 'Centre for Modern Languages (CML)'],
  ['/faculty_home/9', 'Centre for Higher Studies and Research (CHSR)'],
  ['/chsr', 'CHSR (MPhil & PhD)'],
  ['/academics/1', 'Undergraduate programs'],
  ['/academics/2', 'Graduate programs'],
  ['/all-academics', 'All academic programs'],
  ['/academics/admission/1', 'Admission: Undergraduate'],
  ['/academics/admission/2', 'Admission: Graduate'],
  ['/academics/admission/3', 'Admission: Postgraduate'],
  ['/office/office_details/11', 'Library and Archive'],
  ['/office/office_details/20', 'Student Hall'],
  ['/office/office_details/13', 'Physical Education Centre'],
  ['/office/office_details/9', 'ICT Centre'],
  ['/office/office_details/36', 'Cafeteria'],
  ['/office/office_details/26', 'Security Cell'],
  ['/office/office_details/10', 'Medical Centre'],
  ['/office/office_details/19', 'MT Section'],
  ['/office/office_details/17', 'Office of International Affairs'],
  ['/office/office_details/40', 'BUP Research Centre'],
  ['/office', 'All offices'],
  ['/cpc', 'Counselling & Placement Center (CPC)'],
  ['/iqac', 'Institutional Quality Assurance Cell (IQAC)'],
  ['/oefcd', 'Office of Evaluation, Faculty & Curriculum Development (OEFCD)'],
  ['/clubs', 'BUP Clubs'],
  ['/labs', 'BUP Labs'],
  ['/all-department-chairman', 'Chairmen of the Departments'],
  ['/vc_information', 'Vice Chancellor'],
  ['/pro-vc-information', 'Pro-Vice Chancellor'],
  ['/registrar-information', 'Registrar'],
  ['/treasurer-information', 'Treasurer'],
  ['/custom-page/16', "Freshers' Corner"],
  ['/academic-calender', 'Academic Calendar'],
  ['/news/all', 'BUP News (changes often)'],
  ['/notice/all', 'BUP Notices (changes often)'],
];

// Facts copied from the BUP home page (header, footer, menu). They repeat on every page, so the
// menu/footer cleaner would delete them; that is why they are written here by hand.
const TODAY = new Date().toISOString().slice(0, 10);
const MANUAL = [
  { url: `${BASE}/contact`, title: 'Contact BUP',
    text: 'Bangladesh University of Professionals (BUP), Mirpur Cantonment, Dhaka-1216, Bangladesh. Phone: +8809666790799. Fax: +88-02-223373197. Email: info@bup.edu.bd.' },
  { url: `${BASE}/about`, title: 'About BUP',
    text: 'BUP was established on 05 June 2008 as the 31st public university of Bangladesh. It is a public university run by the armed forces. Motto: "Excellence Through Knowledge". The campus is in Mirpur Cantonment, Dhaka.' },
  { url: BASE, title: 'BUP faculties and centres',
    text: 'The BUP website lists these faculties and centres: Faculty of Arts & Social Sciences (FASS), Faculty of Security & Strategic Studies (FSSS), Faculty of Science & Technology (FST), Faculty of Business Studies (FBS), Faculty of Medical Studies (FMS), Centre for Modern Languages (CML), Centre for Higher Studies and Research (CHSR) and the BUP Research Centre.' },
  { url: BASE, title: 'BUP student and admission portals',
    text: 'UCAM student portal: https://webportal.bup.edu.bd/ . Admission website: https://admission.bup.edu.bd . International students: https://internationalstudents.bup.edu.bd/ . Certificate verification: https://certificateverification.bup.edu.bd/ . Certificate application: https://certificateapplication.bup.edu.bd/ . NOC: https://bup.edu.bd/noc . Alumni: https://alumni.bup.edu.bd/ . Career: https://career.bup.edu.bd/ . Academic calendar: https://www.bup.edu.bd/academic-calender .' },
  { url: BASE, title: 'On-campus offices on the BUP website',
    text: `On-campus offices and where to read about them: Library and Archive ${BASE}/office/office_details/11 ; Student Hall ${BASE}/office/office_details/20 ; Physical Education Centre ${BASE}/office/office_details/13 ; ICT Centre ${BASE}/office/office_details/9 ; Cafeteria ${BASE}/office/office_details/36 ; Security Cell ${BASE}/office/office_details/26 ; Medical Centre ${BASE}/office/office_details/10 ; MT Section ${BASE}/office/office_details/19 .` },
].map((m) => ({ ...m, fetchedAt: TODAY, manual: true }));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    try {
      const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'text/html' }, signal: ctrl.signal, redirect: 'follow' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.text();
    } catch (e) {
      if (attempt === 3) throw e;
      await sleep(1500 * attempt);
    } finally {
      clearTimeout(timer);
    }
  }
  return '';
}

function parsePage(html) {
  const $ = cheerio.load(html);

  // Links first (menus are still in the page at this point)
  const links = [];
  $('a[href]').each((_, a) => {
    try {
      const u = new URL($(a).attr('href'), BASE);
      if (!/(^|\.)bup\.edu\.bd$/.test(u.hostname)) return;
      u.hash = '';
      links.push({ path: u.pathname + u.search, text: $(a).text().replace(/\s+/g, ' ').trim() });
    } catch { /* ignore bad hrefs */ }
  });

  $('script, style, noscript, svg, iframe, form, select, button, nav, header, footer, img').remove();
  $('br').replaceWith('\n');
  $('p, div, li, tr, h1, h2, h3, h4, h5, h6, section, article, ul, ol, table, dt, dd').each((_, el) => { $(el).append('\n'); });
  $('td, th').each((_, el) => { $(el).append(' | '); });

  const lines = [];
  for (const raw of $('body').text().split('\n')) {
    const l = raw.replace(/\s+/g, ' ').replace(/\s*\|\s*$/, '').trim();
    if (!l || /^[\W_]+$/.test(l) || /^\d{1,2}$/.test(l)) continue;
    if (lines[lines.length - 1] === l) continue;
    lines.push(l);
  }
  return { lines, links };
}

// Cut lines into chunks of about CHUNK_MAX characters; a short heading-like line starts a new chunk
function chunkLines(lines) {
  const chunks = [];
  let cur = '';
  const flush = () => { if (cur.trim().length > 40) chunks.push(cur.trim()); cur = ''; };
  for (const l of lines) {
    const heading = l.length < 80 && !/[.!?:]$/.test(l);
    if (cur && heading && cur.length > 400) flush();
    if (cur && cur.length + l.length + 1 > CHUNK_MAX) flush();
    cur += (cur ? '\n' : '') + l;
  }
  flush();
  return chunks.slice(0, MAX_CHUNKS_PER_PAGE);
}

function readOld() {
  try { return JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch { return { chunks: [] }; }
}

(async () => {
  const old = readOld();
  const pages = PAGES.map(([p, title]) => ({ path: p, title, url: BASE + p }));
  const results = [];   // { page, lines, ok, error }
  let homeLinkPaths = new Set();

  // The home page is only used to learn which links belong to the common menu
  try {
    const home = parsePage(await get(BASE));
    homeLinkPaths = new Set(home.links.map((l) => l.path));
    console.log(`Home page loaded (${home.links.length} menu links noted).`);
  } catch (e) { console.warn('Could not load the home page:', e.message); }
  await sleep(DELAY_MS);

  const known = new Set(pages.map((p) => p.path));
  const discovered = [];

  for (const page of pages) {
    process.stdout.write(`Fetching ${page.path} ... `);
    try {
      const { lines, links } = parsePage(await get(page.url));
      results.push({ page, lines, ok: true });
      console.log(`${lines.length} lines`);
      // Department / programme pages are linked from the faculty and academics pages
      if (/^\/(faculty_home|academics)/.test(page.path)) {
        for (const l of links) {
          if (discovered.length >= MAX_DISCOVERED) break;
          if (known.has(l.path) || homeLinkPaths.has(l.path)) continue;
          if (/\.(pdf|jpe?g|png|gif|docx?|xlsx?|zip)$/i.test(l.path) || l.path === '/' || l.path.length < 2) continue;
          known.add(l.path);
          discovered.push({ path: l.path, title: l.text || l.path, url: BASE + l.path });
        }
      }
    } catch (e) {
      results.push({ page, lines: [], ok: false, error: e.message });
      console.log(`FAILED (${e.message})`);
    }
    await sleep(DELAY_MS);
  }

  if (discovered.length) {
    console.log(`\nFound ${discovered.length} extra department/programme pages:`);
    discovered.forEach((d) => console.log(`  ${d.path}  (${d.title})`));
  }
  for (const page of discovered) {
    process.stdout.write(`Fetching ${page.path} ... `);
    try {
      const { lines } = parsePage(await get(page.url));
      results.push({ page, lines, ok: true });
      console.log(`${lines.length} lines`);
    } catch (e) {
      results.push({ page, lines: [], ok: false, error: e.message });
      console.log(`FAILED (${e.message})`);
    }
    await sleep(DELAY_MS);
  }

  // Remove menu/footer lines: anything repeated on many pages
  const okPages = results.filter((r) => r.ok);
  const seenOn = new Map();
  okPages.forEach((r) => new Set(r.lines).forEach((l) => seenOn.set(l, (seenOn.get(l) || 0) + 1)));
  const limit = Math.max(4, Math.ceil(okPages.length * 0.35));
  const isBoiler = (l) => (seenOn.get(l) || 0) >= limit;

  const chunks = [];
  const report = [];
  for (const r of results) {
    if (!r.ok) {
      const kept = old.chunks.filter((c) => c.url === r.page.url && !c.manual);
      chunks.push(...kept);
      report.push([r.page.path, 'FAILED', kept.length ? `old data kept (${kept.length} chunks)` : 'no data']);
      continue;
    }
    const text = r.lines.filter((l) => !isBoiler(l));
    const pieces = chunkLines(text);
    pieces.forEach((t, i) => chunks.push({ id: `${r.page.path}#${i + 1}`, url: r.page.url, title: r.page.title, text: t, fetchedAt: TODAY }));
    const chars = text.join(' ').length;
    report.push([r.page.path, chars < 300 ? 'THIN' : 'ok', `${pieces.length} chunks, ${chars} chars`]);
  }

  MANUAL.forEach((m, i) => chunks.push({ id: `manual#${i + 1}`, ...m }));
  try {
    const extra = JSON.parse(fs.readFileSync(MANUAL_FILE, 'utf8'));
    extra.forEach((m, i) => {
      if (m && m.text && m.url) chunks.push({ id: `custom#${i + 1}`, title: m.title || 'BUP', url: m.url, text: String(m.text), fetchedAt: m.fetchedAt || TODAY, manual: true });
    });
    console.log(`Added ${extra.length} entries from manual.json`);
  } catch { /* manual.json is optional */ }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ builtAt: new Date().toISOString(), source: BASE, chunks }, null, 1), 'utf8');

  console.log('\n=== REPORT ===');
  report.forEach(([p, s, n]) => console.log(`${s.padEnd(7)} ${p.padEnd(34)} ${n}`));
  console.log(`\nSaved ${chunks.length} chunks to ${path.relative(process.cwd(), OUT)}`);
  const bad = report.filter((r) => r[1] !== 'ok');
  if (bad.length) console.log(`Check these pages by hand (THIN = little text, maybe loaded by JavaScript; FAILED = download error): ${bad.map((b) => b[0]).join(', ')}`);
})().catch((e) => { console.error(e); process.exit(1); });
