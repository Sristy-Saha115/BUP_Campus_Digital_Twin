# Scholarship Feature: VS Code-এ বসানোর গাইড

> **সহজ উপায়:** ধাপ ২-এর হাতে-edit করার বদলে root ফোল্ডারে `node apply-scholarship-patch.js` চালালে ৫টা ছোট বদল নিজে নিজেই হয়ে যায়
> (কিছু না মিললে কিছুই বদলায় না, দুবার চালালেও সমস্যা নেই)। ধাপ ২ শুধু হাতে করতে চাইলে বা script কাজ না করলে দেখুন।
> কাজ শেষে `apply-scholarship-patch.js` আর `INSTALL-bn.md` মুছে দিতে পারেন।

## ধাপ ০: প্রস্তুতি
1. প্রজেক্ট ফোল্ডারের একটা backup নিন (অথবা `git commit` করে রাখুন)।
2. VS Code-এ প্রজেক্ট খুলুন। root ফোল্ডারে `client` আর `server` থাকবে।
3. এই zip unzip করুন। ভেতরে `client` আর `server` ফোল্ডার আছে, আপনার প্রজেক্টের ঠিক একই কাঠামোয়।

## ধাপ ১: নতুন ফাইল কপি করুন (৭টি ফাইল)
unzip করা ফোল্ডারের `client` ও `server` ফোল্ডার দুটো নিজের প্রজেক্টের root-এ কপি-পেস্ট করুন। "Replace/Merge" জিজ্ঞেস করলে Merge বা Yes দিন।

| ফাইল | অবস্থা |
|---|---|
| `server/routes/scholarships.js` | নতুন |
| `server/scholarshipData.js` | নতুন |
| `client/src/components/ScholarshipCard.jsx` | নতুন |
| `client/src/components/ScholarshipModal.jsx` | নতুন |
| `client/src/scholarships.css` | নতুন |
| `client/src/scholarshipI18n.js` | নতুন |
| `client/src/pages/Scholarships.jsx` | **পুরোনোটা replace হবে** (এটাই একমাত্র overwrite) |

## ধাপ ২: ৪টি পুরোনো ফাইলে ছোট edit (বাংলা টেক্সটওয়ালা ফাইল পুরো replace করিনি, যাতে ভাঙা না পড়ে)

### (ক) `server/models/index.js`
`const Scholarship = mongoose.model('Scholarship', new Schema({ ... }));` এই পুরো ব্লকটি মুছে নিচেরটা বসান:

```js
const Scholarship = mongoose.model('Scholarship', new Schema({
  category: { type: String, enum: ['BUP', 'International'], required: true, index: true },
  title: { type: String, required: true },
  type: { type: String, default: '' },            // BUP: "Merit Based"
  minCgpa: { type: Number },                      // শুধু BUP
  amount: { type: String, default: '' },          // "BDT 2,500/month"
  country: { type: String, default: '' },
  countryCode: { type: String, default: '' },     // 'gb', 'eu', 'us' ... (flag-icons)
  level: { type: [String], default: [] },         // ["Master's", 'PhD']
  funding: { type: String, default: '' },
  deadline: { type: Date },                       // থাকলে status নিজে নিজে Open/Closed হয়
  deadlineNote: { type: String, default: '' },    // তারিখ না থাকলে card-এ এটা দেখায়
  statusManual: { type: String, enum: ['Open', 'Closed', 'Upcoming', 'Varies'], default: 'Varies' },
  eligibility: { type: [String], default: [] },
  note: { type: String, default: '' },
  sourceName: { type: String, default: '' },
  applyUrl: { type: String, default: 'https://www.bup.edu.bd/' },
  lastVerified: { type: Date },
  order: { type: Number, default: 99 },
}));
```

### (খ) `server/server.js`
`app.use('/api/clubs', ...)` লাইনের ঠিক নিচে এই লাইন যোগ করুন (`/api` misc-এর **আগে** থাকতে হবে):

```js
app.use('/api/scholarships', wrap(require('./routes/scholarships')));
```

### (গ) `server/routes/misc.js`
1. উপরের import থেকে `Scholarship, ` মুছুন:
   `const { Scholarship, Place, Faculty, ClubEvent, Club } = require('../models');`
   হবে
   `const { Place, Faculty, ClubEvent, Club } = require('../models');`
2. এই ব্লকটি পুরো মুছে দিন:
```js
// Scholarships
router.get('/scholarships', async (req, res) => {
  res.json({ scholarships: await Scholarship.find().sort('title') });
});
```

### (ঘ) `server/seed.js`
1. `// PLACEHOLDER scholarship...` কমেন্ট থেকে শুরু করে পুরোনো `const scholarships = [ ... ];` ব্লকটি মুছে সেখানে এই এক লাইন বসান:
```js
const scholarships = require('./scholarshipData');
```
(নিচের `Scholarship.deleteMany` ও `Scholarship.insertMany(scholarships)` আগে থেকেই আছে, ওগুলো ছোঁবেন না।)

### (ঙ) `client/src/i18n.jsx`
1. ফাইলের একদম উপরে, বাকি import-এর নিচে যোগ করুন:
```js
import { SCH_EN, SCH_BN } from './scholarshipI18n.js';
```
2. `const Ctx = createContext(null);` লাইনটির **ঠিক উপরে** (অর্থাৎ `T` অবজেক্ট বন্ধ হওয়া `};`-এর পরে) যোগ করুন:
```js
Object.assign(T.en, SCH_EN);
Object.assign(T.bn, SCH_BN);
```

## ধাপ ৩: database-এ data ঢোকান
Mongo চালু আছে কি না দেখে নিন, তারপর টার্মিনালে:
```
cd server
npm run seed
```
"Seed complete" দেখালে ঠিক আছে। (সাবধান: seed ক্লাব, place আর স্কলারশিপ নতুন করে বসায়, ফ্যাকাল্টি ও বুকিং ঠিক থাকে।)

## ধাপ ৪: চালিয়ে দেখুন
দুটো টার্মিনাল খুলুন:
```
cd server && npm run dev     # (বা আপনি যেভাবে server চালান)
cd client && npm run dev
```
ব্রাউজারে `http://localhost:5173/scholarships` খুলুন।

## ধাপ ৫: পরীক্ষা
- লগইন ছাড়া: "Please log in" দেখাবে।
- Student: BUP Scholarships + International Scholarships দুটো section।
- Faculty: শুধু International Scholarships।
- Staff / Visitor: "শুধু শিক্ষার্থী ও শিক্ষকদের জন্য" বার্তা।
- search, Country / Level / Status filter, **View Details** modal (Esc বা বাইরে ক্লিকে বন্ধ) পরীক্ষা করুন।
- প্রতিটি "Visit Official ..." link ক্লিক করে খুলছে কি না দেখুন।

## তথ্য হালনাগাদ রাখা
`server/scholarshipData.js` ফাইলে তথ্য বদলে আবার `npm run seed` চালান। `deadline` তারিখ দিলে status নিজেই Open থেকে Closed হয়। BUP-র `applyUrl` এখন `https://www.bup.edu.bd/`, সঠিক notice-এর লিংক পেলে সেটা বসিয়ে দিন।
