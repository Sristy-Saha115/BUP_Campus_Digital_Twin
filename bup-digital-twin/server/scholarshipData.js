// Scholarship data used by seed.js   (run: npm run seed)
//
// HOW TO KEEP THIS CURRENT
//  - International data was checked on 19 Oct 2026 (see VERIFIED). Deadlines and rounds change every
//    year, so re-check each applyUrl, update the fields below and run `npm run seed` again.
//  - `deadline` (a Date) makes the status switch from Open to Closed automatically.
//    If there is no fixed date, set `deadlineNote` (shown on the card) and `statusManual`.
//  - BUP minimum CGPA / amounts are NOT a guarantee: the committee can review them, so every BUP
//    card says "confirm with the official BUP source". Replace applyUrl with the exact BUP notice link.

const VERIFIED = new Date('2026-10-19');
const BUP_URL = 'https://www.bup.edu.bd/';

const bupNote =
  'Selection is subject to BUP scholarship and stipend policy. The committee may review the minimum CGPA, so please confirm the latest criteria with the official BUP source.';

const bup = (order, title, minCgpa, amountPerMonth) => ({
  category: 'BUP',
  title,
  type: 'Merit Based',
  minCgpa,
  amount: `BDT ${amountPerMonth.toLocaleString('en-US')}/month`,
  eligibility: ['BUP students', `Minimum CGPA: ${minCgpa.toFixed(2)} (current policy; may be reviewed by the committee)`],
  note: bupNote,
  sourceName: 'BUP Official Website',
  applyUrl: BUP_URL,
  lastVerified: VERIFIED,
  order,
});

const scholarships = [
  // ---------------------------------------------------------------- BUP (students only)
  bup(1, 'Chancellor Scholarship', 3.9, 2500),
  bup(2, 'Vice Chancellor Stipend', 3.8, 1500),
  bup(3, 'BUP Scholarship', 3.75, 2000),
  bup(4, 'BUP Stipend', 3.5, 1000),

  // ---------------------------------------------------------------- International (students + faculty)
  {
    category: 'International',
    title: "Commonwealth Master's Scholarship",
    country: 'United Kingdom',
    countryCode: 'gb',
    level: ["Master's"],
    funding: 'Fully Funded',
    deadline: new Date('2026-10-20T15:00:00Z'), // 20 Oct 2026, 16:00 BST (9:00 PM Bangladesh time)
    deadlineNote: '20 Oct 2026',
    eligibility: [
      'Citizen of an eligible Commonwealth country',
      'Bangladesh is eligible',
      "Bachelor's degree required",
      'Full-time taught Master\'s at a UK university (not research Master\'s or MBA)',
      'Other official requirements apply',
    ],
    note: 'CSC closing time for the 2027/28 round is 16:00 BST (9:00 PM Bangladesh time). Applications go through a nominating agency, which may set an earlier deadline, so check that first.',
    sourceName: 'Commonwealth Scholarship Commission (UK)',
    applyUrl: 'https://cscuk.fcdo.gov.uk/scholarships/commonwealth-masters-scholarships/',
    lastVerified: VERIFIED,
    order: 1,
  },
  // Optional card, useful for faculty. Delete this block if you do not want it.
  {
    category: 'International',
    title: 'Commonwealth PhD Scholarship',
    country: 'United Kingdom',
    countryCode: 'gb',
    level: ['PhD'],
    funding: 'Fully Funded',
    deadline: new Date('2026-10-20T15:00:00Z'),
    deadlineNote: '20 Oct 2026',
    eligibility: [
      'Citizen of an eligible Commonwealth country',
      'Bangladesh is eligible',
      'Must meet the academic requirements of the CSC PhD scheme',
      'Other official requirements apply',
    ],
    note: 'Same CSC closing time as the Master\'s scheme (16:00 BST on 20 Oct 2026). Applications go through a nominating agency, which may set an earlier deadline.',
    sourceName: 'Commonwealth Scholarship Commission (UK)',
    applyUrl: 'https://cscuk.fcdo.gov.uk/scholarships/commonwealth-phd-scholarships/',
    lastVerified: VERIFIED,
    order: 2,
  },
  {
    category: 'International',
    title: 'Erasmus Mundus Joint Masters',
    country: 'Europe (multiple countries)',
    countryCode: 'eu',
    level: ["Master's"],
    funding: 'Fully Funded',
    deadline: null,
    deadlineNote: 'Varies by programme',
    statusManual: 'Varies',
    eligibility: [
      'Open to students from all over the world, including Bangladesh',
      "Bachelor's degree (or equivalent) required",
      'Each Joint Master sets its own admission and language requirements',
      'There is no single application: apply directly to each programme',
    ],
    note: 'Deadlines are set by each programme (many fall between autumn 2026 and early 2027 for the 2027 intake). Search the official catalogue and read the programme page.',
    sourceName: 'EACEA / Erasmus+',
    applyUrl: 'https://www.eacea.ec.europa.eu/scholarships/emjmd-catalogue_en',
    lastVerified: VERIFIED,
    order: 3,
  },
  {
    category: 'International',
    title: 'Fulbright Foreign Student Program',
    country: 'United States',
    countryCode: 'us',
    level: ["Master's"],
    funding: 'Fully Funded',
    deadline: new Date('2026-07-11T17:59:00Z'), // 11 Jul 2026, 11:59 PM Bangladesh time (2027-28 round)
    deadlineNote: '11 Jul 2026',
    eligibility: [
      'Bangladeshi citizen residing in Bangladesh at the time of application',
      "No Master's degree from outside Bangladesh (a Bangladeshi Master's is fine)",
      'Preference for junior faculty at higher-education institutions in Bangladesh',
      'Other official requirements apply',
    ],
    note: 'The 2027-28 round has closed. Watch the U.S. Embassy Dhaka announcements for the next call.',
    sourceName: 'U.S. Embassy Dhaka',
    applyUrl: 'https://bd.usembassy.gov/',
    lastVerified: VERIFIED,
    order: 4,
  },
  {
    category: 'International',
    title: 'MEXT Japanese Government Scholarship',
    country: 'Japan',
    countryCode: 'jp',
    level: ["Master's", 'PhD'],
    funding: 'Fully Funded',
    deadline: null,
    deadlineNote: 'Next call: expected Apr-May 2027 (unconfirmed)',
    statusManual: 'Closed',
    eligibility: [
      'Apply through the Embassy of Japan in your country (Dhaka for Bangladesh)',
      "Research Students route covers Master's, PhD and non-degree research",
      'Academic, age and experience conditions are listed in the official Application Guidelines',
      'Other official requirements apply',
    ],
    note: 'The 2027 round has closed. The next call is usually announced by the Embassy in spring; the exact date is not confirmed yet.',
    sourceName: 'Study in Japan (Government of Japan)',
    applyUrl: 'https://www.studyinjapan.go.jp/en/smap-stopj-applications-research.html',
    lastVerified: VERIFIED,
    order: 5,
  },
  {
    category: 'International',
    title: 'DAAD Development-Related Postgraduate Courses (EPOS)',
    country: 'Germany',
    countryCode: 'de',
    level: ["Master's"],
    funding: 'Funded (monthly stipend)',
    deadline: null,
    deadlineNote: 'Varies by course',
    statusManual: 'Varies',
    eligibility: [
      'University graduate from an eligible developing or newly industrialised country (check the DAAD country list for Bangladesh)',
      'At least two years of relevant professional experience',
      'Development-related motivation',
      'Each course has its own application deadline',
    ],
    note: 'DAAD publishes a course-by-course deadline list for the 2027/28 intake. Check the course you want before applying.',
    sourceName: 'DAAD',
    applyUrl: 'https://www.daad.de/epos',
    lastVerified: VERIFIED,
    order: 6,
  },
  {
    category: 'International',
    title: 'Australia Awards Scholarships',
    country: 'Australia',
    countryCode: 'au',
    level: ["Master's"],
    funding: 'Fully Funded',
    deadline: new Date('2026-04-30T13:59:00Z'), // 30 Apr 2026, 11:59 PM AEST (2027 intake)
    deadlineNote: '30 Apr 2026',
    eligibility: [
      'Citizen of Bangladesh, residing in and applying from Bangladesh',
      'Must meet the Australia Awards Scholarships Policy Handbook requirements',
      'Applications are lodged online through OASIS',
      'Other official requirements apply',
    ],
    note: 'The 2027 intake has closed. Recent Bangladesh rounds opened on 1 Feb and closed on 30 Apr; the next round has not been confirmed.',
    sourceName: 'Australian Government (DFAT)',
    applyUrl: 'https://www.dfat.gov.au/people-to-people/australia-awards',
    lastVerified: VERIFIED,
    order: 7,
  },
];

module.exports = scholarships;
