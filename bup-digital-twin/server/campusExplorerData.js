// Public data for the Campus Explorer page.
//
// RULES FOR THIS FILE
//  - Every fact below was taken from the official BUP website (https://www.bup.edu.bd); the page it came
//    from is in `sourceUrl`. Snapshot date: CAPTURED_AT. Nothing here is guessed.
//  - If the website does not say something (a building, a floor, opening hours...), the field is left null
//    and the app shows "not published". Please keep it that way.
//  - A facility only gets a pin on the map when ALL of these are filled in `location`:
//        coords: [lat, lng]   coordsVerified: true   verifiedOn: 'YYYY-MM-DD'   verifiedBy: 'who / how'
//    (the server ignores coordinates that are not fully verified).
//  - Personal e-mail addresses of staff are not copied. Use the page link for contact details.

const SOURCE_SITE = 'https://www.bup.edu.bd';
const CAPTURED_AT = '2026-10-19';
const U = (p) => SOURCE_SITE + p;

// text = what the website says about where it is (null = not published)
const loc = (text = null, textSource = null) => ({
  text,
  textSource,
  coords: null,
  coordsVerified: false,
  verifiedOn: null,
  verifiedBy: null,
});

const CATEGORIES = [
  { key: 'library', icon: 'fa-book-open', label: 'Library & Study' },
  { key: 'health', icon: 'fa-kit-medical', label: 'Health & Safety' },
  { key: 'food', icon: 'fa-utensils', label: 'Food & Cafes' },
  { key: 'residential', icon: 'fa-bed', label: 'Student Halls' },
  { key: 'sports', icon: 'fa-futbol', label: 'Sports' },
  { key: 'labs', icon: 'fa-flask', label: 'Labs & ICT' },
  { key: 'venue', icon: 'fa-landmark', label: 'Venues' },
  { key: 'transport', icon: 'fa-bus', label: 'Transport' },
  { key: 'support', icon: 'fa-handshake-angle', label: 'Support & Research' },
];

const GENERAL_PHONE = '09666790799';

const FACILITIES = [
  {
    slug: 'central-library',
    name: 'BUP Central Library & Archive',
    category: 'library',
    icon: 'fa-book-open',
    summary:
      'The library moved in May 2026 into a new, fully air-conditioned central library of about 50,000 sq ft over five floors. As of August 2026 the website lists 32,000 department-related books and 7,324 journals and magazines. Members check books in and out themselves through an RFID-based system.',
    highlights: [
      'Book issue and open library',
      "Students' study halls and discussion room",
      "Teachers'/officers' and researchers' study halls",
      'Cyber centre, printing and Wi-Fi',
      'Newspapers, journals/magazines and a library archive',
      'Off-campus access to e-resources through Knimbus (RemoteXs)',
    ],
    hours: {
      header: ['Day', 'Nov - Feb', 'Mar - Oct'],
      rows: [
        ['Sunday - Thursday', '08:00 - 20:00', '08:00 - 21:00'],
        ['Friday - Saturday', '15:00 - 20:00', '15:00 - 21:00'],
      ],
      note: 'Closed on every government and BUP holiday. Members: anyone with a valid BUP ID card.',
    },
    phone: GENERAL_PHONE,
    location: loc('BUP Central Library Building, 2nd Floor (Lift-2, West Campus), Mirpur Cantonment', U('/office/office_details/11')),
    sourceUrl: U('/office/office_details/11'),
    sourceTitle: 'Library and Archive - bup.edu.bd',
  },
  {
    slug: 'vista-cafeteria',
    name: 'Vista Cafeteria',
    category: 'food',
    icon: 'fa-mug-hot',
    summary: 'Cafeteria listed under the Admin Section facilities on the official website.',
    highlights: [],
    hours: null,
    phone: null,
    location: loc('Academic Building, Ground Floor', U('/office/office_details/36')),
    sourceUrl: U('/office/office_details/36'),
    sourceTitle: 'Admin Section (Cafeteria) - bup.edu.bd',
  },
  {
    slug: 'amitie-friendship',
    name: 'Amitie (Friendship)',
    category: 'food',
    icon: 'fa-mug-hot',
    summary: 'Cafe listed under the Admin Section facilities on the official website.',
    highlights: [],
    hours: null,
    phone: null,
    location: loc('FBS Building, Ground Floor', U('/office/office_details/36')),
    sourceUrl: U('/office/office_details/36'),
    sourceTitle: 'Admin Section (Cafeteria) - bup.edu.bd',
  },
  {
    slug: 'third-place',
    name: 'Third Place',
    category: 'food',
    icon: 'fa-mug-hot',
    summary: 'Listed with the campus cafeterias on the official website. The page gives only the university address, not a building.',
    highlights: [],
    hours: null,
    phone: null,
    location: loc(null),
    sourceUrl: U('/office/office_details/36'),
    sourceTitle: 'Admin Section (Cafeteria) - bup.edu.bd',
  },
  {
    slug: 'medical-centre',
    name: 'BUP Medical Centre',
    category: 'health',
    icon: 'fa-suitcase-medical',
    summary:
      'Medical help for students, teachers, officers and staff. Emergency patients are kept under observation and referred to a higher facility (for example CMH Dhaka or Kurmitola General Hospital) when needed.',
    highlights: [
      'OPD consultation, vital-sign checks and medicine supply',
      'ECG and blood sugar tests',
      'Oxygen support and nebulization',
      '24/7 ambulance and on-call service for student halls',
      'Observation beds (male and female)',
      'Medical fitness and counselling',
    ],
    hours: null,
    phone: '9666790799',
    location: loc(null),
    sourceUrl: U('/office/office_details/10'),
    sourceTitle: 'Medical Centre - bup.edu.bd',
  },
  {
    slug: 'security-cell',
    name: 'Security Cell',
    category: 'health',
    icon: 'fa-shield-halved',
    summary:
      'Responsible for campus and student-hall security, access control, fire safety, anti-ragging monitoring, exam-hall CCTV monitoring, security clearance for foreign visitors and traffic control inside the campus.',
    highlights: [
      'Temporary ID cards and duty/work passes',
      'Student dress-code guidelines support',
      'Safety and fire-safety responsibilities (no evacuation or exit plan is published on the page)',
    ],
    hours: null,
    phone: null,
    location: loc(null),
    sourceUrl: U('/office/office_details/26'),
    sourceTitle: 'Security Cell - bup.edu.bd',
  },
  {
    slug: 'female-student-hall',
    name: 'Student Hall (Female)',
    category: 'residential',
    icon: 'fa-bed',
    summary:
      'The permanent female students\' hall houses about 1,000 students and is described as safe, comfortable and academically supportive, with security systems and student-welfare services.',
    highlights: ['About 1,000 residents', 'Security systems', 'Student-welfare services'],
    hours: null,
    phone: GENERAL_PHONE,
    location: loc(null),
    sourceUrl: U('/office/office_details/20'),
    sourceTitle: 'Student Hall (Female) - bup.edu.bd',
  },
  {
    slug: 'physical-education-centre',
    name: 'Physical Education Centre',
    category: 'sports',
    icon: 'fa-person-running',
    summary:
      'Supports students\' physical fitness and runs indoor and outdoor sports activities. The Indoor Games Competition 2026 (started 2 August 2026) was organised by this centre.',
    highlights: ['Indoor sports', 'Outdoor sports', 'Inter-department competitions'],
    hours: null,
    phone: GENERAL_PHONE,
    location: loc(null),
    sourceUrl: U('/office/office_details/13'),
    sourceTitle: 'Physical Education Centre - bup.edu.bd',
  },
  {
    slug: 'ict-centre',
    name: 'ICT Centre',
    category: 'labs',
    icon: 'fa-server',
    summary:
      'Runs BUP\'s ERP/academic management systems, Wi-Fi, campus network and classroom technology. It also operates a One Stop Service Centre for hardware, network, software and meeting support.',
    highlights: [
      'UCAM academic management, Microsoft 365, Turnitin',
      'Wi-Fi support and classroom maintenance',
      'Help desk / One Stop Service Centre',
      'Secured server room with fire detection and suppression',
    ],
    hours: null,
    phone: GENERAL_PHONE,
    location: loc(null),
    sourceUrl: U('/office/office_details/9'),
    sourceTitle: 'ICT Centre - bup.edu.bd',
  },
  {
    slug: 'university-labs',
    name: 'University Labs',
    category: 'labs',
    icon: 'fa-flask',
    summary: 'The website lists these labs but does not give their buildings or rooms.',
    highlights: [
      'Media Lab',
      'Computer Lab',
      'Environmental Lab',
      'Electrical and Electronics Lab',
      'Communication Lab',
      'Turkish, Chinese and BUP Language Labs',
    ],
    hours: null,
    phone: null,
    location: loc(null),
    sourceUrl: U('/labs'),
    sourceTitle: 'Labs - bup.edu.bd',
  },
  {
    slug: 'research-centre',
    name: 'BUP Research Centre (BRC)',
    category: 'support',
    icon: 'fa-microscope',
    summary:
      'Newly developed research entity that administers UGC-funded projects, runs independent research and innovation projects and undertakes consultancy (surveys, feasibility and impact studies and more).',
    highlights: ['Faculty research projects', 'Independent research / innovation', 'Consultancy services'],
    hours: null,
    phone: GENERAL_PHONE,
    location: loc('Admin Building, Mirpur Cantonment, Dhaka-1216', U('/office/office_details/40')),
    sourceUrl: U('/office/office_details/40'),
    sourceTitle: 'BUP Research Centre - bup.edu.bd',
  },
  {
    slug: 'counselling-placement-centre',
    name: 'Counselling & Placement Centre (CPC)',
    category: 'support',
    icon: 'fa-comments',
    summary:
      'Set up on 13 May 2019. Offers academic, socio-emotional and career counselling, including group counselling, and placement support for graduates.',
    highlights: ['Academic, socio-emotional and career counselling', 'Group counselling', 'Placement support'],
    hours: null,
    phone: '+8809666790790',
    location: loc('Listed as "Multipurpose Shade", Mirpur Cantonment (address line in the CPC contact block)', U('/cpc')),
    sourceUrl: U('/cpc'),
    sourceTitle: 'Counselling & Placement Center - bup.edu.bd',
  },
  {
    slug: 'mt-section',
    name: 'MT Section (University Transport)',
    category: 'transport',
    icon: 'fa-bus',
    summary:
      'Mechanical Transport section under the Registrar\'s office. Provides commuting buses for teachers, officers, staff and students from several points in Dhaka, and a 24/7 ambulance for the BUP community. A "BUP MT BUS Timing" notice dated 12 Apr 2026 is on the page.',
    highlights: ['Commuter bus service', 'Bus timing notice (12 Apr 2026)', 'Live bus page of this app: Bus Tracking'],
    hours: null,
    phone: '01769021616',
    location: loc(null),
    appLink: { to: '/bus', label: 'Bus Tracking' },
    sourceUrl: U('/office/office_details/19'),
    sourceTitle: 'MT Section - bup.edu.bd',
  },
  {
    slug: 'senate-hall',
    name: 'Senate Hall',
    category: 'venue',
    icon: 'fa-landmark',
    summary: 'Named on the official site as the venue of the World Pharmacists Day 2026 session (27 Sep 2026). No building or capacity is published.',
    highlights: ['Seen in news: World Pharmacists Day 2026 session'],
    hours: null,
    phone: null,
    location: loc(null),
    sourceUrl: U('/news/all'),
    sourceTitle: 'BUP News - bup.edu.bd',
  },
  {
    slug: 'bijoy-auditorium',
    name: 'Bijoy Auditorium',
    category: 'venue',
    icon: 'fa-landmark',
    summary: 'Named on the official site as the venue of Dean\'s interactive sessions with business-faculty departments in September 2026. No building or capacity is published.',
    highlights: ['Seen in news: Dean\'s sessions (Marketing, Accounting and Information Systems)'],
    hours: null,
    phone: null,
    location: loc(null),
    sourceUrl: U('/news/all'),
    sourceTitle: 'BUP News - bup.edu.bd',
  },
];

// type: 'news' | 'event' | 'notice'. `date` = date shown on the official site (ISO). `eventDate` = event day(s) in the text.
const N = (o) => ({ facilitySlug: null, venue: null, eventDate: null, summary: null, sourceUrl: U('/news/all'), ...o });
const NT = (o) => ({ type: 'notice', facilitySlug: null, venue: null, eventDate: null, summary: null, sourceUrl: U('/notice/all'), ...o });

const NEWS = [
  N({ id: 'edu-tour-bb-museum', type: 'news', date: '2026-10-13', title: 'Educational tour to Bangladesh Bank Currency Museum',
      summary: 'Management Studies students of the 2024-25 year visited the museum as part of the course "Insurance and Bank Management" (MGT 3203).' }),
  N({ id: 'cse-fest-2026', type: 'event', date: '2026-09-30', eventDate: '29 - 30 Sep 2026', title: 'BUP CSE FEST 2026',
      summary: 'Two-day technology festival organised by the BUP Computer Programming Club under the Department of CSE; more than 2,000 students took part.' }),
  N({ id: 'world-pharmacists-day-2026', type: 'event', date: '2026-09-27', eventDate: '27 Sep 2026, 11:00 - 12:00', venue: 'Senate Hall', facilitySlug: 'senate-hall',
      title: 'World Pharmacists Day 2026 interactive session',
      summary: 'Interactive session by the Department of Pharmacy, Faculty of Medical Studies.' }),
  N({ id: 'indoor-games-2026', type: 'event', date: '2026-09-09', eventDate: 'Competition from 2 Aug 2026', facilitySlug: 'physical-education-centre',
      title: 'BUP Indoor Games Competition 2026 - prize distribution',
      summary: 'Prize distribution of the competition organised by the Physical Education Centre.' }),
  N({ id: 'dean-marketing-session', type: 'event', date: '2026-09-09', eventDate: '9 Sep 2026', venue: 'Bijoy Auditorium', facilitySlug: 'bijoy-auditorium',
      title: "Dean's interaction session with the Department of Marketing",
      summary: 'Interactive session of the Dean of the Faculty of Business Studies with students, faculty and officials.' }),
  N({ id: 'dean-mgt-session', type: 'event', date: '2026-09-07',
      title: "Dean's interactive session with Management Studies students",
      summary: 'Session by the Dean of the Faculty of Business Studies. See the source page for the full report.' }),
  N({ id: 'dean-ais-session', type: 'event', date: '2026-09-02', eventDate: '2 Sep 2026', venue: 'Bijoy Auditorium', facilitySlug: 'bijoy-auditorium',
      title: "Dean's interactive session with Accounting and Information Systems students",
      summary: 'Held by the Dean of the Faculty of Business Studies.' }),
  N({ id: 'innovation-fair-2026', type: 'news', date: '2026-09-16', title: 'BUP at the Bangladesh Innovation Fair 2026',
      summary: 'The BUP delegation showed student-led technology projects and received a strong response.' }),
  N({ id: 'asefyls-2026', type: 'news', date: '2026-08-29', title: 'ASEF Young Leaders Summit 2026',
      summary: 'A Department of Peace, Conflict and Human Rights student took part as the only Bangladeshi participant.' }),
  N({ id: 'efma-2026', type: 'news', date: '2026-06-24', title: 'BUP faculty member presents research at the 35th EFMA Annual Meeting (Norway)',
      summary: 'Dr. M. Shahin Sarwar, Department of Finance & Banking, presented a research paper.' }),
  N({ id: 'barad-field-visit', type: 'news', date: '2026-08-23', title: 'Field visit and research-methodology training at BARD, Cumilla',
      summary: '40 Public Administration students joined a 23 - 27 Aug 2026 qualitative-research training programme.', sourceUrl: U('/news/details/1062') }),
  N({ id: 'rda-bogura-visit', type: 'news', date: '2026-04-26', title: 'Field visit to RDA, Bogura',
      summary: 'Public Administration masters students studied rural-development training and data collection.', sourceUrl: U('/news/details/978') }),
  N({ id: 'fass-deans-address', type: 'news', date: '2026-02-16', title: "FASS Dean's address to first-year students",
      summary: 'Orientation programme welcoming new students to the Faculty of Arts and Social Sciences.', sourceUrl: U('/news/details/934') }),
  N({ id: 'library-ndc-visit', type: 'news', date: '2026-10-20', facilitySlug: 'central-library', title: 'Overseas NDC course members visit the Central Library',
      summary: 'Date as listed on the library page.', sourceUrl: U('/office/office_details/11') }),
  N({ id: 'library-new-books', type: 'news', date: '2026-10-20', facilitySlug: 'central-library', title: 'New books available in the library',
      summary: 'The library page links a file listing newly procured books. Date as listed on the page.', sourceUrl: U('/office/office_details/11') }),
  N({ id: 'library-foreign-books', type: 'news', date: '2026-10-20', facilitySlug: 'central-library', title: 'Handing over of foreign-language books',
      summary: 'Following the Vice Chancellor\'s guidance. Date as listed on the library page.', sourceUrl: U('/office/office_details/11') }),

  NT({ id: 'n-mesm-2026', date: '2026-09-30', title: 'MESM admission notice (Session 2026 - 2027)' }),
  NT({ id: 'n-llm-prof', date: '2026-09-29', title: 'Admission announcement: LLM (Professional), January - April 2027' }),
  NT({ id: 'n-mcse', date: '2026-09-29', title: 'MCSE admission circular (January - June 2027)' }),
  NT({ id: 'n-mba-prof', date: '2026-09-28', title: 'Admission circular: MBA (Professional), January 2027' }),
  NT({ id: 'n-mict', date: '2026-09-28', title: 'Admission circular: MICT (Professional), 2026 - 2027' }),
  NT({ id: 'n-miss', date: '2026-09-28', title: 'Admission circular: MISS (Professional), 2026 - 2027' }),
  NT({ id: 'n-mds-prof', date: '2026-09-27', title: 'Admission notice: MDS (Professional), 2026 - 2027', sourceUrl: U('/notice/details/1081') }),
  NT({ id: 'n-mds12-routine', date: '2026-09-22', title: 'Exam routine for MDS-12, 2nd trimester (May - Aug 2026)' }),
  NT({ id: 'n-ba-bss-pass', date: '2026-09-09', title: 'Amended exam schedule: BA (Pass) and BSS (Pass) 1st - 3rd year, 2026' }),
  NT({ id: 'n-mpchrs', date: '2026-09-07', title: 'Admission circular: MPCHRS (Professional), Batch 17, January - April 2027' }),
  NT({ id: 'n-mt-bus', date: '2026-04-12', facilitySlug: 'mt-section', title: 'BUP MT bus timing', sourceUrl: U('/office/office_details/19') }),
  NT({ id: 'n-calendar', date: '2026-03-06', title: 'Academic calendar 2026', sourceUrl: U('/academic-calender') }),
];

const META = {
  site: SOURCE_SITE,
  capturedAt: CAPTURED_AT,
  newsNote:
    'News and notices change often. This is a snapshot of the official website; open the source link for the latest. ' +
    'Office pages on the official site showed "no upcoming events" when captured.',
};

module.exports = { CATEGORIES, FACILITIES, NEWS, META, SOURCE_SITE };
