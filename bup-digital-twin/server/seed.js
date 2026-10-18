// Run:  npm run seed
// Replaces clubs, faculty and scholarships. Users, requests, donors and events are NOT touched.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { Club, Faculty, Scholarship } = require('./models');

const clubs = [
  { slug: 'robotics', name: 'BUP Robotics Club', url: 'https://www.facebook.com/share/18ZBoEdjBG/', icon: 'fa-robot', category: 'Technology', categoryBn: 'প্রযুক্তি', description: 'Robotics, automation and hardware projects.', descriptionBn: 'রোবোটিক্স, অটোমেশন ও হার্ডওয়্যার প্রজেক্ট।' },
  { slug: 'programming', name: 'BUP Computer Programming Club', url: 'https://www.facebook.com/share/1JSLGNDANC/', icon: 'fa-code', category: 'Technology', categoryBn: 'প্রযুক্তি', description: 'Competitive programming, coding practice and contests.', descriptionBn: 'কম্পিটিটিভ প্রোগ্রামিং, কোডিং অনুশীলন ও প্রতিযোগিতা।' },
  { slug: 'infotech', name: 'BUP Info Tech Club', url: 'https://www.facebook.com/share/1B6Svgpk5N/', icon: 'fa-laptop-code', category: 'Technology', categoryBn: 'প্রযুক্তি', description: 'IT skills, workshops and technology events.', descriptionBn: 'আইটি দক্ষতা, ওয়ার্কশপ ও প্রযুক্তি ইভেন্ট।' },
  { slug: 'law', name: 'BUP Law & Moot Court Club', url: 'https://www.facebook.com/share/19ouy4DG18/', icon: 'fa-scale-balanced', category: 'Law', categoryBn: 'আইন', description: 'Legal debates, moot court and law discussions.', descriptionBn: 'আইনি বিতর্ক, মুট কোর্ট ও আলোচনা।' },
  { slug: 'finance', name: 'BUP Finance Club', url: 'https://www.facebook.com/share/18ZoUhbTii/', icon: 'fa-chart-line', category: 'Business', categoryBn: 'ব্যবসা', description: 'Finance, investing and business learning.', descriptionBn: 'ফাইন্যান্স, বিনিয়োগ ও ব্যবসা বিষয়ক শিক্ষা।' },
  { slug: 'media', name: 'BUP Media & Communication Club', url: 'https://www.facebook.com/share/18AxwEZcXU/', icon: 'fa-video', category: 'Media', categoryBn: 'মিডিয়া', description: 'Photography, video, journalism and communication.', descriptionBn: 'ফটোগ্রাফি, ভিডিও, সাংবাদিকতা ও যোগাযোগ।' },
  { slug: 'literature', name: 'BUP Literature & Drama Club', url: 'https://www.facebook.com/share/1VwRwSjSM6/', icon: 'fa-masks-theater', category: 'Culture', categoryBn: 'সংস্কৃতি', description: 'Literature, drama, recitation and cultural events.', descriptionBn: 'সাহিত্য, নাটক, আবৃত্তি ও সাংস্কৃতিক অনুষ্ঠান।' },
  { slug: 'career', name: 'BUP Career Club', url: 'https://www.facebook.com/share/1H5XDXMZx8/', icon: 'fa-briefcase', category: 'Career', categoryBn: 'ক্যারিয়ার', description: 'Career guidance, CV help and job preparation.', descriptionBn: 'ক্যারিয়ার গাইডলাইন, সিভি ও চাকরির প্রস্তুতি।' },
  { slug: 'development', name: "BUP Development Leaders' Club", url: 'https://www.facebook.com/share/18ybspKMFG/', icon: 'fa-hands-holding-circle', category: 'Leadership', categoryBn: 'নেতৃত্ব', description: 'Leadership, social development and volunteering.', descriptionBn: 'নেতৃত্ব, সামাজিক উন্নয়ন ও স্বেচ্ছাসেবা।' },
].map((c, i) => ({ ...c, order: i + 1 }));

// Faculty list supplied by you
const faculty = [
  { name: "Dr. Mohammed Nasir Uddin", designation: "Professor", department: "FST — ICT" },
  { name: "Nandita Barman", designation: "Assistant Professor", department: "FST — ICT" },
  { name: "Md. Maynul Islam", designation: "Assistant Professor", department: "FST — ICT" },
  { name: "Mirza Rehenuma Tabassum", designation: "Assistant Professor", department: "FST — ICT" },
  { name: "Tajbia Karim", designation: "Assistant Professor", department: "FST — ICT" },
  { name: "Shanto Rahman", designation: "Assistant Professor", department: "FST — ICT" },
  { name: "Saiful Islam", designation: "Assistant Professor", department: "FST — ICT" },
  { name: "Nazneen Akhter", designation: "Assistant Professor", department: "FST — ICT" },
  { name: "Md. Jaber Al Nahian", designation: "Lecturer", department: "FST — ICT" },
  { name: "Md. Musfiqur Rahman Mridha", designation: "Lecturer", department: "FST — ICT" },
  { name: "Afrina Khatun", designation: "Assistant Professor", department: "FST — CSE" },
  { name: "Md. Hasan Al Banna", designation: "Lecturer", department: "FST — CSE" },
  { name: "Iyolita Islam", designation: "Lecturer", department: "FST — CSE" },
  { name: "Sobhana Jahan", designation: "Lecturer", department: "FST — CSE" },
  { name: "Tahmid Tamrin Suki", designation: "Lecturer", department: "FST — CSE" },
  { name: "Sayma Alam Suha", designation: "Lecturer", department: "FST — CSE" },
  { name: "Rumana Yasmin", designation: "Lecturer", department: "FST — CSE" },
  { name: "Md. Mahabubur Rahman", designation: "Lecturer", department: "FST — CSE" },
  { name: "Dr. Shamsunnahar Khanam", designation: "Associate Professor", department: "FST — Environmental Science" },
  { name: "Alamgir Kabir", designation: "Assistant Professor", department: "FST — Environmental Science" },
  { name: "Mahbub Alam", designation: "Assistant Professor", department: "FST — Environmental Science" },
  { name: "Israt Jahan", designation: "Assistant Professor", department: "FST — Environmental Science" },
  { name: "Md. Arifur Rahman Bhuiyan", designation: "Assistant Professor", department: "FST — Environmental Science" },
  { name: "Md. Golam Muktadir", designation: "Assistant Professor", department: "FST — Environmental Science" },
  { name: "Fateeha Noor", designation: "Assistant Professor", department: "FST — Environmental Science" },
  { name: "Amit Hasan Anik", designation: "Lecturer", department: "FST — Environmental Science" },
  { name: "Md. Abu Hanif", designation: "Associate Professor", department: "Faculty of Law" },
  { name: "Md. Abu Bakar Siddique", designation: "Assistant Professor", department: "Faculty of Law" },
  { name: "Md. Sadekul Islam", designation: "Assistant Professor", department: "Faculty of Law" },
  { name: "Preeti Kana Sikder", designation: "Assistant Professor", department: "Faculty of Law" },
  { name: "Dr. Jannatul Ferdaous", designation: "Professor", department: "FBS — Finance & Banking" },
  { name: "Kazi Asequl Arefin", designation: "Assistant Professor", department: "FBS — Finance & Banking" },
  { name: "Md. Nahid Alam", designation: "Assistant Professor", department: "FBS — Finance & Banking" },
  { name: "Sarabia Rahman", designation: "Assistant Professor", department: "FBS — Finance & Banking" },
  { name: "M. Shahin Sarwar", designation: "Associate Professor", department: "FBS — Finance & Banking" },
  { name: "Senjuti Barua", designation: "Assistant Professor", department: "FBS — Finance & Banking" },
  { name: "Ummay Mahima Ima", designation: "Assistant Professor", department: "FBS — Finance & Banking" },
  { name: "Maliha Rabeta", designation: "Assistant Professor", department: "FBS — Finance & Banking" },
  { name: "Md. Faruk Hossain", designation: "Associate Professor", department: "Business Administration — General" },
  { name: "Md. Mahedi Hasan", designation: "Assistant Professor", department: "Business Administration — General" },
  { name: "Md. Sahidul Islam", designation: "Assistant Professor", department: "Business Administration — General" },
  { name: "Md. Kaysher Hamid", designation: "Assistant Professor", department: "Business Administration — General" },
  { name: "Azharul Islam", designation: "Assistant Professor", department: "Business Administration — General" },
  { name: "Jarin Tasnim", designation: "Assistant Professor", department: "Business Administration — General" },
  { name: "Md. H. Asibur Rahman", designation: "Assistant Professor", department: "Business Administration — General" },
  { name: "Reajmin Sultana", designation: "Assistant Professor", department: "Business Administration — General" },
  { name: "Dr. Mohammad Zahedul Alam", designation: "Professor", department: "Business Administration — Marketing" },
  { name: "Barnali Nandi", designation: "Assistant Professor", department: "Business Administration — Marketing" },
  { name: "Anamika Dey", designation: "Assistant Professor", department: "Business Administration — Marketing" },
  { name: "Takrima Jannat", designation: "Assistant Professor", department: "Business Administration — Marketing" },
];

// SAMPLE scholarships (deadlines are "days from the day you run the seed"). Confirm everything on the official websites.
const inDays = (n) => new Date(Date.now() + n * 864e5);
const generic = (extra) => [...extra, 'Check the official website for the latest requirements and dates'];
const scholarships = [
  { title: 'Chevening Scholarship (UK)', provider: 'UK Government', category: 'International', country: 'UK', levels: ['Masters'], fullyFunded: true, minGpa: 3, gpaScale: 4, deadline: inDays(25), description: "One-year master's scholarship in the UK for future leaders; requires work experience.", eligibility: generic(['Work experience required', 'Bachelor degree']), applyUrl: 'https://www.chevening.org/' },
  { title: "Prime Minister's Education Assistance Trust Stipend", provider: "PM's Education Assistance Trust", category: 'Government', country: 'Bangladesh', levels: ['Secondary', 'Higher Secondary', 'Undergraduate'], fullyFunded: false, minGpa: 4, gpaScale: 5, deadline: inDays(45), description: 'Government stipend for meritorious and financially needy students from secondary to undergraduate level.', eligibility: generic(['Meritorious and financially needy students']), applyUrl: 'https://pmeat.gov.bd/' },
  { title: 'Commonwealth Scholarship (UK)', provider: 'UK FCDO', category: 'International', country: 'UK', levels: ['Masters', 'PhD'], fullyFunded: true, minGpa: 3.3, gpaScale: 4, deadline: inDays(60), description: "Master's and PhD scholarships for citizens of Commonwealth countries.", eligibility: generic(['Citizen of a Commonwealth country']), applyUrl: 'https://cscuk.fcdo.gov.uk/' },
  { title: 'Eiffel Excellence Scholarship (France)', provider: 'French Ministry for Europe and Foreign Affairs', category: 'International', country: 'France', levels: ['Masters', 'PhD'], fullyFunded: false, minGpa: 3.3, gpaScale: 4, deadline: inDays(80), description: "Master's and PhD scholarship in France for top international students.", eligibility: generic(['Nominated through a French institution']), applyUrl: 'https://www.campusfrance.org/en/eiffel-scholarship-program-of-excellence' },
  { title: 'DAAD Scholarship (Germany)', provider: 'German Academic Exchange Service', category: 'International', country: 'Germany', levels: ['Masters', 'PhD'], fullyFunded: true, minGpa: 3, gpaScale: 4, deadline: inDays(90), description: "Scholarships for master's and doctoral study in Germany.", eligibility: generic(['Strong academic record']), applyUrl: 'https://www.daad.de/en/' },
  { title: 'Türkiye Burslari Scholarship', provider: 'Government of Türkiye', category: 'International', country: 'Turkey', levels: ['Undergraduate', 'Masters', 'PhD'], fullyFunded: true, minGpa: 3, gpaScale: 4, deadline: inDays(120), description: "Fully funded scholarship for undergraduate, master's and PhD study in Türkiye.", eligibility: generic(['International students']), applyUrl: 'https://turkiyeburslari.gov.tr/' },
  { title: 'Fulbright Scholarship (USA)', provider: 'US Government', category: 'International', country: 'USA', levels: ['Masters', 'PhD'], fullyFunded: true, minGpa: 3.3, gpaScale: 4, deadline: inDays(150), description: "Prestigious scholarship for master's and PhD study in the US.", eligibility: generic(['Strong academic and leadership record']), applyUrl: 'https://foreign.fulbrightonline.org/' },
  { title: 'Chinese Government Scholarship (CSC)', provider: 'Government of China', category: 'International', country: 'China', levels: ['Undergraduate', 'Masters', 'PhD'], fullyFunded: false, minGpa: 3, gpaScale: 4, deadline: inDays(170), description: "Full or partial scholarship for undergraduate, master's and PhD study in China.", eligibility: generic(['Non-Chinese citizen']), applyUrl: 'https://www.campuschina.org/' },
  { title: 'MEXT Scholarship (Japan)', provider: 'Government of Japan', category: 'International', country: 'Japan', levels: ['Undergraduate', 'Masters', 'PhD'], fullyFunded: true, minGpa: 3, gpaScale: 4, deadline: inDays(200), description: 'Fully funded scholarship for undergraduate and graduate study in Japan.', eligibility: generic(['Age and academic requirements apply']), applyUrl: 'https://www.studyinjapan.go.jp/en/' },
  { title: "BUET Dean's List & Merit Stipend", provider: 'BUET', category: 'University', country: 'Bangladesh', levels: ['Undergraduate'], fullyFunded: false, minGpa: 3.75, gpaScale: 4, deadline: null, description: 'Merit-based stipend and fee waiver for BUET undergraduate students.', eligibility: generic(['BUET undergraduate student']), applyUrl: 'https://www.buet.ac.bd/' },
  { title: 'Dhaka University Trust Fund Scholarship', provider: 'University of Dhaka', category: 'University', country: 'Bangladesh', levels: ['Undergraduate', 'Masters'], fullyFunded: false, minGpa: 3.5, gpaScale: 4, deadline: null, description: 'Scholarships for meritorious and needy students across faculties.', eligibility: generic(['University of Dhaka student']), applyUrl: 'https://www.du.ac.bd/' },
  { title: 'BUP Merit Scholarship', provider: 'Bangladesh University of Professionals', category: 'University', country: 'Bangladesh', levels: ['Undergraduate'], fullyFunded: false, minGpa: 3.7, gpaScale: 4, deadline: null, description: 'Fee waivers for top-ranking students each semester.', eligibility: generic(['BUP student with top semester result']), applyUrl: 'https://www.bup.edu.bd/' },
];

(async () => {
  await connectDB();
  await Promise.all([Club.deleteMany({}), Faculty.deleteMany({}), Scholarship.deleteMany({})]);
  await Club.insertMany(clubs);
  await Faculty.insertMany(faculty);
  await Scholarship.insertMany(scholarships);
  console.log(`Seed complete: ${clubs.length} clubs, ${faculty.length} faculty, ${scholarships.length} scholarships.`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
