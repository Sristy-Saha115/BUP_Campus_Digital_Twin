// OPTIONAL: import donors from a CSV file YOU are allowed to use (e.g. exported by the BUP blood club).
// Only import people who agreed to be listed. Usage:  node import-donors.js donors.csv
// CSV header (first line):  name,bloodGroup,phone,batchDept,area
require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { Donor } = require('./models');

const GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;

(async () => {
  const file = process.argv[2];
  if (!file) { console.log('Usage: node import-donors.js donors.csv'); process.exit(1); }
  const [head, ...lines] = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean);
  const cols = head.split(',').map((c) => c.trim());
  const docs = [];
  let skipped = 0;
  for (const line of lines) {
    const v = line.split(',').map((x) => x.trim());
    const row = Object.fromEntries(cols.map((c, i) => [c, v[i] || '']));
    if (!row.name || !GROUPS.includes(row.bloodGroup) || !BD_PHONE.test(row.phone.replace(/[\s-]/g, ''))) { skipped++; continue; }
    docs.push({ name: row.name, bloodGroup: row.bloodGroup, phone: row.phone, batchDept: row.batchDept, area: row.area, available: true });
  }
  await connectDB();
  if (docs.length) await Donor.insertMany(docs);
  console.log(`Imported ${docs.length} donors, skipped ${skipped} invalid rows.`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
