// Run once:  npm run seed   (safe to re-run; it replaces clubs/faculty/places/scholarships)
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { Club, Faculty, Place, Scholarship, SlotBooking, FacultyAvailability } = require('./models');

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

// PLACEHOLDER faculty (copied from your old demo). Replace with verified data.
const faculty = [
  // Regular Faculty
  { name: 'Colonel Mohammed Omar Faruque, PhD', email: 'chairman.ict@bup.edu.bd', category: 'Regular' },
  { name: 'Dr. Mohammed Nasir Uddin', email: 'nasiruddin@bup.edu.bd', category: 'Regular' },
  { name: 'Md. Maynul Islam', email: 'maynul@bup.edu.bd', category: 'Regular' },
  { name: 'Saiful Islam', email: 'saifulislam@bup.edu.bd', category: 'Regular' },
  { name: 'Nazneen Akhter', email: 'nazneen.akhter@bup.edu.bd', category: 'Regular' },
  { name: 'Md. Sazzadul Islam Prottasha', email: 'prottasha@bup.edu.bd', category: 'Regular' },
  // Adjunct Faculty
  { name: 'Dr. Fahima Tabassum', email: 'fahima@juniv.edu', category: 'Adjunct' },
  { name: 'Md. Nesar Rahman Porag', email: 'porag1010@gmail.com', category: 'Adjunct' },
  { name: 'A T M Atiqur Rahman', email: 'atique.history@juniv.edu', category: 'Adjunct' },
].map((f, i) => ({ ...f, department: 'ICT', order: i + 1 }));

// PLACEHOLDER places for Smart Search. Replace/add verified rooms, offices, timetables.
const places = [
  { title: 'ICE Lab 1', details: '6th Floor, Room 604, Main Academic Building.', category: 'Lab', link: '/map' },
  { title: 'Central Library', details: 'Ground Floor, Annex Building. 8:00 AM - 8:00 PM.', category: 'Facility', link: '/map' },
  { title: 'BUP Bus Route 1', details: 'Mirpur-12 to BUP Main Campus.', category: 'Transport', link: '/bus' },
  { title: 'Emergency Blood Network', details: 'Post or find urgent blood requests.', category: 'Service', link: '/blood' },
  { title: 'Scholarships', details: 'Scholarship programs and deadlines.', category: 'Service', link: '/scholarships' },
];

const scholarships = require('./scholarshipData');   // real data: server/scholarshipData.js

(async () => {
  await connectDB();
  await Promise.all([Club.deleteMany({}), Place.deleteMany({}), Scholarship.deleteMany({})]);
  await Club.insertMany(clubs);
  await Place.insertMany(places);
  await Scholarship.insertMany(scholarships);

  // Faculty are updated in place (matched by email), so existing bookings stay linked
  await Faculty.deleteMany({ email: { $exists: false } });   // old placeholder entries
  await Faculty.bulkWrite(
    faculty.map((f) => ({ updateOne: { filter: { email: f.email }, update: { $set: f }, upsert: true } }))
  );
  await Faculty.deleteMany({ email: { $nin: faculty.map((f) => f.email) } });

  // Remove old demo bookings made before the Pending/Accepted system existed
  await SlotBooking.deleteMany({ faculty: { $exists: false } });

  // Make the database indexes match the current models (drops the old slot index)
  await Faculty.syncIndexes();
  await SlotBooking.syncIndexes();
  await FacultyAvailability.syncIndexes();

  console.log('Seed complete: clubs, faculty, places, scholarships.');
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
