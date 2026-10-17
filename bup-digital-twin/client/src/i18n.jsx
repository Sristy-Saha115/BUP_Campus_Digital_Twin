import { createContext, useContext, useEffect, useState } from 'react';

const T = {
  en: {
    brand: 'BUP Digital Twin',
    'nav.home': 'Home', 'nav.map': 'Campus Map', 'nav.bus': 'Bus Tracking', 'nav.faculty': 'Faculty Slots',
    'nav.search': 'Smart Search', 'nav.blood': 'Blood Network', 'nav.clubs': 'Clubs & Events',
    'nav.scholarships': 'Scholarships', 'nav.chatbot': 'AI Assistant', 'nav.more': 'More',
    'nav.login': 'Login', 'nav.logout': 'Logout',
    'home.title': 'Welcome to BUP Digital Twin',
    'home.subtitle': 'A smart campus platform: interactive map, bus tracking, faculty consultation, campus search, emergency blood network, clubs and scholarships.',
    'home.explore': 'Explore Features', 'home.clubs': 'Campus Life', 'home.features': 'Campus Features',
    'f.map': 'Explore the campus on an interactive map.', 'f.bus': 'See route and position of BUP buses.',
    'f.faculty': 'Book a consultation slot with a faculty member.', 'f.search': 'Find places, faculty, clubs and events fast.',
    'f.blood': 'Post or find urgent blood requests.', 'f.clubs': 'Nine BUP clubs and their events in one place.',
    'f.scholarships': 'Scholarship programs and deadlines.', 'f.chatbot': 'Ask questions about campus services.',
    'common.open': 'Open', 'common.loading': 'Loading…', 'common.submit': 'Submit', 'common.none': 'Nothing here yet.',
    'common.loginFirst': 'Please log in to use this feature.', 'common.demo': 'Demo data — not a verified live feed.',
    'map.title': 'Interactive Campus Map', 'map.sub': 'Explore the BUP campus area and the official 2D map.',
    'map.tabInteractive': 'Interactive map', 'map.tabOfficial': 'Official 2D map',
    'map.openExternal': 'Open in new tab', 'map.note': 'If the 2D map does not appear below, the site blocks embedding — use the button to open it.',
    'map.campus': 'BUP campus (approximate point)',
    'bus.title': 'Real-Time Bus Tracking', 'bus.sub': 'Route overview and live-style location feed.',
    'bus.route': 'Route', 'bus.eta': 'ETA', 'bus.min': 'min', 'bus.refresh': 'Refresh', 'bus.demoNote': 'Positions are simulated. Real tracking needs an authorized GPS device/provider.',
    'slot.title': 'Faculty Consultation Slots', 'slot.sub': 'Choose a faculty member, date, time and topic.',
    'slot.faculty': 'Faculty member', 'slot.choose': 'Choose…', 'slot.date': 'Date', 'slot.time': 'Time slot',
    'slot.reason': 'Reason / topic', 'slot.confirm': 'Confirm booking', 'slot.mine': 'My bookings', 'slot.taken': 'booked',
    'slot.status': 'Status',
    'search.title': 'Smart Campus Search', 'search.sub': 'Search places, faculty, clubs and events.',
    'search.placeholder': 'Try: library, lab, robotics, bus…', 'search.button': 'Search', 'search.noResults': 'No results found.',
    'blood.title': 'Report an Emergency Blood Request', 'blood.patient': 'Patient name', 'blood.group': 'Blood group',
    'blood.select': 'Select', 'blood.hospital': 'Hospital / address', 'blood.phone': 'Contact number', 'blood.district': 'District / area',
    'blood.submit': 'Post request', 'blood.videoTitle': 'Blood Donation Awareness', 'blood.recent': 'Recent Blood Requests',
    'blood.filter': 'Filter by group', 'blood.all': 'All', 'blood.markDone': 'Mark fulfilled', 'blood.call': 'Call',
    'blood.note': 'For urgent needs, also contact the hospital directly.',
    'clubs.title': 'Clubs & Event Management', 'clubs.sub': 'Nine BUP clubs. Tap a card to open the club’s Facebook page.',
    'clubs.open': 'Open club page', 'events.add': 'Add a club event', 'events.club': 'Club', 'events.name': 'Event title',
    'events.date': 'Date', 'events.venue': 'Venue', 'events.url': 'Registration URL', 'events.details': 'Details',
    'events.publish': 'Publish event', 'events.saved': 'Saved events', 'events.register': 'Register', 'events.delete': 'Delete',
    'events.tba': 'To be announced',
    'sch.title': 'Scholarship Programs', 'sch.sub': 'Check eligibility and deadlines with the official provider before applying.',
    'sch.deadline': 'Deadline', 'sch.eligibility': 'Eligibility', 'sch.official': 'Official information', 'sch.check': 'Check official notice',
    'chat.title': 'BUP AI Assistant', 'chat.sub': 'Ask about maps, buses, slots, blood, clubs or scholarships.',
    'chat.hello': 'Assalamu alaikum! How can I help you with BUP campus services today?', 'chat.placeholder': 'Type your question…',
    'chat.note': 'Rule-based demo assistant (not a generative AI).',
    'auth.login': 'Login', 'auth.register': 'Register', 'auth.name': 'Full name', 'auth.email': 'Email', 'auth.password': 'Password',
    'auth.role': 'Role', 'auth.noAccount': 'No account? Register', 'auth.haveAccount': 'Have an account? Login',
    'nf.title': 'Page not found', 'nf.back': 'Back to home',
    footer: '© 2026 BUP Digital Twin · Smart Campus · Connected Community',
  },
  bn: {
    brand: 'বিইউপি ডিজিটাল টুইন',
    'nav.home': 'হোম', 'nav.map': 'ক্যাম্পাস ম্যাপ', 'nav.bus': 'বাস ট্র্যাকিং', 'nav.faculty': 'ফ্যাকাল্টি স্লট',
    'nav.search': 'স্মার্ট সার্চ', 'nav.blood': 'রক্ত নেটওয়ার্ক', 'nav.clubs': 'ক্লাব ও ইভেন্ট',
    'nav.scholarships': 'স্কলারশিপ', 'nav.chatbot': 'এআই সহকারী', 'nav.more': 'আরও',
    'nav.login': 'লগইন', 'nav.logout': 'লগআউট',
    'home.title': 'বিইউপি ডিজিটাল টুইনে স্বাগতম',
    'home.subtitle': 'একটি স্মার্ট ক্যাম্পাস প্ল্যাটফর্ম: ইন্টারেক্টিভ ম্যাপ, বাস ট্র্যাকিং, ফ্যাকাল্টি পরামর্শ, ক্যাম্পাস সার্চ, জরুরি রক্ত নেটওয়ার্ক, ক্লাব ও স্কলারশিপ।',
    'home.explore': 'ফিচারসমূহ দেখুন', 'home.clubs': 'ক্যাম্পাস লাইফ', 'home.features': 'ক্যাম্পাস ফিচার',
    'f.map': 'ইন্টারেক্টিভ ম্যাপে ক্যাম্পাস ঘুরে দেখুন।', 'f.bus': 'বিইউপি বাসের রুট ও অবস্থান দেখুন।',
    'f.faculty': 'শিক্ষকের সাথে পরামর্শের সময় বুক করুন।', 'f.search': 'স্থান, শিক্ষক, ক্লাব ও ইভেন্ট দ্রুত খুঁজুন।',
    'f.blood': 'জরুরি রক্তের অনুরোধ দিন বা খুঁজুন।', 'f.clubs': 'বিইউপির নয়টি ক্লাব ও তাদের ইভেন্ট এক জায়গায়।',
    'f.scholarships': 'স্কলারশিপ প্রোগ্রাম ও আবেদনের সময়সীমা।', 'f.chatbot': 'ক্যাম্পাস সেবা নিয়ে প্রশ্ন করুন।',
    'common.open': 'খুলুন', 'common.loading': 'লোড হচ্ছে…', 'common.submit': 'জমা দিন', 'common.none': 'এখনো কিছু নেই।',
    'common.loginFirst': 'এই সুবিধা ব্যবহার করতে লগইন করুন।', 'common.demo': 'ডেমো ডেটা — যাচাইকৃত লাইভ ফিড নয়।',
    'map.title': 'ইন্টারেক্টিভ ক্যাম্পাস ম্যাপ', 'map.sub': 'বিইউপি ক্যাম্পাস এলাকা ও অফিসিয়াল ২ডি ম্যাপ দেখুন।',
    'map.tabInteractive': 'ইন্টারেক্টিভ ম্যাপ', 'map.tabOfficial': 'অফিসিয়াল ২ডি ম্যাপ',
    'map.openExternal': 'নতুন ট্যাবে খুলুন', 'map.note': 'নিচে ২ডি ম্যাপ না এলে ওয়েবসাইটটি এমবেড ব্লক করেছে — বাটনে ক্লিক করে খুলুন।',
    'map.campus': 'বিইউপি ক্যাম্পাস (আনুমানিক অবস্থান)',
    'bus.title': 'রিয়েল-টাইম বাস ট্র্যাকিং', 'bus.sub': 'রুটের সারসংক্ষেপ ও অবস্থানের তথ্য।',
    'bus.route': 'রুট', 'bus.eta': 'পৌঁছাতে', 'bus.min': 'মিনিট', 'bus.refresh': 'রিফ্রেশ', 'bus.demoNote': 'অবস্থান সিমুলেটেড। আসল ট্র্যাকিংয়ের জন্য অনুমোদিত জিপিএস ডিভাইস/প্রোভাইডার দরকার।',
    'slot.title': 'ফ্যাকাল্টি পরামর্শ স্লট', 'slot.sub': 'শিক্ষক, তারিখ, সময় ও বিষয় নির্বাচন করুন।',
    'slot.faculty': 'শিক্ষক', 'slot.choose': 'নির্বাচন করুন…', 'slot.date': 'তারিখ', 'slot.time': 'সময়',
    'slot.reason': 'কারণ / বিষয়', 'slot.confirm': 'বুকিং নিশ্চিত করুন', 'slot.mine': 'আমার বুকিং', 'slot.taken': 'বুকড',
    'slot.status': 'অবস্থা',
    'search.title': 'স্মার্ট ক্যাম্পাস সার্চ', 'search.sub': 'স্থান, শিক্ষক, ক্লাব ও ইভেন্ট খুঁজুন।',
    'search.placeholder': 'যেমন: লাইব্রেরি, ল্যাব, রোবোটিক্স, বাস…', 'search.button': 'খুঁজুন', 'search.noResults': 'কিছু পাওয়া যায়নি।',
    'blood.title': 'জরুরি রক্তের অনুরোধ জানান', 'blood.patient': 'রোগীর নাম', 'blood.group': 'রক্তের গ্রুপ',
    'blood.select': 'নির্বাচন করুন', 'blood.hospital': 'হাসপাতাল / ঠিকানা', 'blood.phone': 'যোগাযোগের নম্বর', 'blood.district': 'জেলা / এলাকা',
    'blood.submit': 'অনুরোধ পাঠান', 'blood.videoTitle': 'রক্তদান নিয়ে সচেতনতা', 'blood.recent': 'সাম্প্রতিক রক্তের অনুরোধসমূহ',
    'blood.filter': 'গ্রুপ অনুযায়ী', 'blood.all': 'সব', 'blood.markDone': 'সম্পন্ন চিহ্নিত করুন', 'blood.call': 'কল করুন',
    'blood.note': 'জরুরি প্রয়োজনে সরাসরি হাসপাতালেও যোগাযোগ করুন।',
    'clubs.title': 'ক্লাব ও ইভেন্ট ম্যানেজমেন্ট', 'clubs.sub': 'বিইউপির নয়টি ক্লাব। কার্ডে ক্লিক করে ক্লাবের ফেসবুক পেজে যান।',
    'clubs.open': 'ক্লাব পেজ খুলুন', 'events.add': 'ক্লাব ইভেন্ট যোগ করুন', 'events.club': 'ক্লাব', 'events.name': 'ইভেন্টের নাম',
    'events.date': 'তারিখ', 'events.venue': 'স্থান', 'events.url': 'রেজিস্ট্রেশন লিংক', 'events.details': 'বিস্তারিত',
    'events.publish': 'ইভেন্ট প্রকাশ করুন', 'events.saved': 'সংরক্ষিত ইভেন্ট', 'events.register': 'রেজিস্টার', 'events.delete': 'মুছুন',
    'events.tba': 'পরে জানানো হবে',
    'sch.title': 'স্কলারশিপ প্রোগ্রাম', 'sch.sub': 'আবেদনের আগে অফিসিয়াল সূত্রে যোগ্যতা ও সময়সীমা যাচাই করুন।',
    'sch.deadline': 'শেষ তারিখ', 'sch.eligibility': 'যোগ্যতা', 'sch.official': 'অফিসিয়াল তথ্য', 'sch.check': 'অফিসিয়াল নোটিশ দেখুন',
    'chat.title': 'বিইউপি এআই সহকারী', 'chat.sub': 'ম্যাপ, বাস, স্লট, রক্ত, ক্লাব বা স্কলারশিপ নিয়ে জিজ্ঞাসা করুন।',
    'chat.hello': 'আসসালামু আলাইকুম! বিইউপি ক্যাম্পাস সেবা নিয়ে আজ কীভাবে সাহায্য করতে পারি?', 'chat.placeholder': 'আপনার প্রশ্ন লিখুন…',
    'chat.note': 'রুল-ভিত্তিক ডেমো সহকারী (জেনারেটিভ এআই নয়)।',
    'auth.login': 'লগইন', 'auth.register': 'রেজিস্টার', 'auth.name': 'পূর্ণ নাম', 'auth.email': 'ইমেইল', 'auth.password': 'পাসওয়ার্ড',
    'auth.role': 'ভূমিকা', 'auth.noAccount': 'অ্যাকাউন্ট নেই? রেজিস্টার করুন', 'auth.haveAccount': 'অ্যাকাউন্ট আছে? লগইন করুন',
    'nf.title': 'পেজ পাওয়া যায়নি', 'nf.back': 'হোমে ফিরুন',
    footer: '© ২০২৬ বিইউপি ডিজিটাল টুইন · স্মার্ট ক্যাম্পাস · সংযুক্ত কমিউনিটি',
  },
};

const Ctx = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('bup_lang') || 'en'; } catch { return 'en'; }
  });
  useEffect(() => {
    try { localStorage.setItem('bup_lang', lang); } catch { /* ignore */ }
    document.documentElement.lang = lang;
  }, [lang]);
  const t = (key) => T[lang][key] ?? T.en[key] ?? key;
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
