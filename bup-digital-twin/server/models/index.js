const mongoose = require('mongoose');
const { Schema } = mongoose;

const GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const User = mongoose.model('User', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['Student', 'Faculty', 'Staff', 'Visitor'], default: 'Student' },
  // Only for role === 'Faculty': which faculty member this account belongs to
  facultyProfile: { type: Schema.Types.ObjectId, ref: 'Faculty', default: null },
}, { timestamps: true }));

const Faculty = mongoose.model('Faculty', new Schema({
  name: { type: String, required: true },
  designation: { type: String, default: '' },
  department: { type: String, default: '' },   // e.g. "FST — ICT", "Faculty of Law"
}));

const slotSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, default: '' },
  faculty: { type: Schema.Types.ObjectId, ref: 'Faculty' },
  facultyName: { type: String, required: true },
  date: { type: String, required: true },      // YYYY-MM-DD
  timeSlot: { type: String, required: true },
  reason: { type: String, required: true },
  // Pending -> Confirmed | Declined (faculty) ; Confirmed -> Cancelled (faculty) ; Pending/Confirmed -> Withdrawn (student)
  status: { type: String, enum: ['Pending', 'Confirmed', 'Declined', 'Cancelled', 'Withdrawn'], default: 'Pending' },
  note: { type: String, default: '' },         // faculty's message to the student
  active: { type: Boolean, default: true },    // true while Pending/Confirmed
}, { timestamps: true });
// One active booking per faculty/date/time. Closed slots can be booked again.
slotSchema.index(
  { facultyName: 1, date: 1, timeSlot: 1 },
  { unique: true, partialFilterExpression: { active: true }, name: 'unique_active_slot' }
);
const SlotBooking = mongoose.model('SlotBooking', slotSchema);

const Notification = mongoose.model('Notification', new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  message: { type: String, required: true },
  link: { type: String, default: '/' },
  read: { type: Boolean, default: false },
}, { timestamps: true }));

const BloodRequest = mongoose.model('BloodRequest', new Schema({
  patientName: { type: String, trim: true, default: '' },
  bloodGroup: { type: String, required: true, enum: GROUPS },
  hospital: { type: String, required: true, trim: true },
  contactNumber: { type: String, required: true, trim: true },
  district: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['Open', 'Fulfilled'], default: 'Open' },
}, { timestamps: true }));

// People who volunteer to donate (one profile per user account)
const Donor = mongoose.model('Donor', new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', index: true },   // empty for imported / demo donors
  name: { type: String, required: true, trim: true },
  bloodGroup: { type: String, required: true, enum: GROUPS },
  phone: { type: String, required: true, trim: true },
  batchDept: { type: String, trim: true, default: '' },
  area: { type: String, trim: true, default: '' },
  lastDonated: { type: String, default: '' },      // YYYY-MM-DD or ''
  available: { type: Boolean, default: true },
}, { timestamps: true }));

const Club = mongoose.model('Club', new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  url: { type: String, required: true },
  icon: { type: String, default: 'fa-people-group' },
  category: { type: String, default: 'Club' },
  categoryBn: { type: String, default: 'ক্লাব' },
  description: { type: String, default: '' },
  descriptionBn: { type: String, default: '' },
  order: { type: Number, default: 99 },
}));

const ClubEvent = mongoose.model('ClubEvent', new Schema({
  clubName: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  date: { type: String, default: '' },
  venue: { type: String, default: '' },
  registrationUrl: { type: String, default: '' },
  details: { type: String, default: '' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true }));

const Scholarship = mongoose.model('Scholarship', new Schema({
  title: { type: String, required: true },
  provider: { type: String, default: '' },
  category: { type: String, enum: ['Government', 'International', 'University'], required: true },
  country: { type: String, default: '' },
  levels: { type: [String], default: [] },       // Secondary, Higher Secondary, Undergraduate, Masters, PhD
  fullyFunded: { type: Boolean, default: false },
  minGpa: { type: Number, default: 0 },
  gpaScale: { type: Number, default: 4 },        // 4 or 5
  deadline: { type: Date, default: null },       // null = rolling
  description: { type: String, default: '' },
  eligibility: { type: [String], default: [] },  // requirements / checklist
  applyUrl: { type: String, default: '' },
}));

module.exports = { User, Faculty, SlotBooking, Notification, BloodRequest, Donor, Club, ClubEvent, Scholarship };
