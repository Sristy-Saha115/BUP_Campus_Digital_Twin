// OPTIONAL: adds clearly-labelled DEMO donors so the donor list is not empty during a presentation.
// Phone numbers are intentionally invalid. Remove later with:  node seed-demo.js --remove
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { Donor } = require('./models');

const demo = [
  ['Demo Donor 1', 'O+', 'Mirpur'], ['Demo Donor 2', 'A+', 'Mirpur'], ['Demo Donor 3', 'B+', 'Dhaka Cantonment'],
  ['Demo Donor 4', 'AB+', 'Mirpur'], ['Demo Donor 5', 'O-', 'Dhaka Cantonment'], ['Demo Donor 6', 'A-', 'Mirpur'],
].map(([name, bloodGroup, area]) => ({ name: `${name} (demo)`, bloodGroup, area, phone: '01000000000', batchDept: 'Demo', available: true }));

(async () => {
  await connectDB();
  await Donor.deleteMany({ phone: '01000000000' });
  if (!process.argv.includes('--remove')) await Donor.insertMany(demo);
  console.log(process.argv.includes('--remove') ? 'Demo donors removed.' : 'Demo donors added.');
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
