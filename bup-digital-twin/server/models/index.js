const mongoose = require('mongoose');
const { Schema } = mongoose;

const User = mongoose.model('User', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['Student', 'Faculty', 'Staff', 'Visitor'], default: 'Student' },
}, { timestamps: true }));

const Faculty = mongoose.model('Faculty', new Schema({
  name: { type: String, required: true },
  department: { type: String, required: true },
}));

const slotSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  facultyName: { type: String, required: true },
  date: { type: String, required: true },      // YYYY-MM-DD
  timeSlot: { type: String, required: true },
  reason: { type: String, required: true },
  status: { type: String, default: 'Confirmed' },
}, { timestamps: true });
// Prevents two students booking the same faculty/date/time
slotSchema.index({ facultyName: 1, date: 1, timeSlot: 1 }, { unique: true });
const SlotBooking = mongoose.model('SlotBooking', slotSchema);

const BloodRequest = mongoose.model('BloodRequest', new Schema({
  patientName: { type: String, trim: true, default: '' },
  bloodGroup: { type: String, required: true, enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
  hospital: { type: String, required: true, trim: true },
  contactNumber: { type: String, required: true, trim: true },
  district: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['Open', 'Fulfilled'], default: 'Open' },
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
  level: { type: String, default: '' },
  deadline: { type: String, default: '' },
  eligibility: { type: String, default: '' },
  details: { type: String, default: '' },
  applyUrl: { type: String, default: 'https://www.bup.edu.bd/' },
}));

const Place = mongoose.model('Place', new Schema({
  title: { type: String, required: true },
  details: { type: String, default: '' },
  category: { type: String, default: 'General' },
  link: { type: String, default: '' },   // in-app route, e.g. /bus
}));

module.exports = { User, Faculty, SlotBooking, BloodRequest, Club, ClubEvent, Scholarship, Place };
