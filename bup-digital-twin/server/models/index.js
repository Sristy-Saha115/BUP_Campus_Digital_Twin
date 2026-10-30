
const mongoose = require('mongoose');
const { Schema } = mongoose;

const GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const User = mongoose.model('User', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ['Student', 'Faculty', 'Staff', 'Visitor'],
    default: 'Student'
  },
  facultyProfile: { type: Schema.Types.ObjectId, ref: 'Faculty', default: null }
}, { timestamps: true }));

const Faculty = mongoose.model('Faculty', new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  category: { type: String, enum: ['Regular', 'Adjunct'], required: true },
  designation: { type: String, default: '' },
  department: { type: String, default: 'ICT' },
  order: { type: Number, default: 99 },
  availabilitySet: { type: Boolean, default: false }
}));

const slotSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, default: '' },
  faculty: { type: Schema.Types.ObjectId, ref: 'Faculty', required: true },
  facultyName: { type: String, required: true },
  date: { type: String, required: true },
  timeSlot: { type: String, required: true },
  reason: { type: String, required: true },
  status: {
    type: String,
    enum: [
      'Pending', 'Accepted', 'Confirmed', 'Declined',
      'Cancelled', 'Withdrawn', 'Completed'
    ],
    default: 'Pending'
  },
  note: { type: String, default: '' },
  active: { type: Boolean, default: true },
  cancelledBy: { type: String, enum: ['Faculty', 'Student', ''], default: '' },
  cancelReason: { type: String, default: '' },
  cancelledAt: { type: Date },
  completedAt: { type: Date },
  respondedAt: { type: Date }
}, { timestamps: true });

slotSchema.index(
  { faculty: 1, date: 1, timeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: { active: true }
  }
);

const SlotBooking = mongoose.model('SlotBooking', slotSchema);

const availabilitySchema = new Schema({
  faculty: { type: Schema.Types.ObjectId, ref: 'Faculty', required: true },
  date: { type: String, required: true },
  timeSlot: { type: String, required: true }
}, { timestamps: true });

availabilitySchema.index(
  { faculty: 1, date: 1, timeSlot: 1 },
  { unique: true }
);

const FacultyAvailability = mongoose.model(
  'FacultyAvailability',
  availabilitySchema
);

const Notification = mongoose.model('Notification', new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  message: { type: String, required: true },
  link: { type: String, default: '/' },
  read: { type: Boolean, default: false }
}, { timestamps: true }));

const BloodRequest = mongoose.model('BloodRequest', new Schema({
  patientName: { type: String, trim: true, default: '' },
  bloodGroup: { type: String, required: true, enum: GROUPS },
  hospital: { type: String, required: true, trim: true },
  contactNumber: { type: String, required: true, trim: true },
  district: { type: String, trim: true, default: '' },
  status: { type: String, enum: ['Open', 'Fulfilled'], default: 'Open' }
}, { timestamps: true }));

const Donor = mongoose.model('Donor', new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  name: { type: String, required: true, trim: true },
  bloodGroup: { type: String, required: true, enum: GROUPS },
  phone: { type: String, required: true, trim: true },
  batchDept: { type: String, trim: true, default: '' },
  area: { type: String, trim: true, default: '' },
  lastDonated: { type: String, default: '' },
  available: { type: Boolean, default: true }
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
  order: { type: Number, default: 99 }
}));

const ClubEvent = mongoose.model('ClubEvent', new Schema({
  clubName: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  date: { type: String, default: '' },
  venue: { type: String, default: '' },
  registrationUrl: { type: String, default: '' },
  details: { type: String, default: '' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true }));

const Scholarship = mongoose.model('Scholarship', new Schema({
  category: {
    type: String,
    enum: ['BUP', 'International', 'Government', 'University'],
    required: true,
    index: true
  },
  title: { type: String, required: true },
  type: { type: String, default: '' },
  provider: { type: String, default: '' },
  minCgpa: { type: Number },
  minGpa: { type: Number, default: 0 },
  gpaScale: { type: Number, default: 4 },
  amount: { type: String, default: '' },
  country: { type: String, default: '' },
  countryCode: { type: String, default: '' },
  level: { type: [String], default: [] },
  levels: { type: [String], default: [] },
  funding: { type: String, default: '' },
  fullyFunded: { type: Boolean, default: false },
  deadline: { type: Date, default: null },
  deadlineNote: { type: String, default: '' },
  statusManual: {
    type: String,
    enum: ['Open', 'Closed', 'Upcoming', 'Varies'],
    default: 'Varies'
  },
  eligibility: { type: [String], default: [] },
  note: { type: String, default: '' },
  description: { type: String, default: '' },
  sourceName: { type: String, default: '' },
  applyUrl: { type: String, default: 'https://www.bup.edu.bd/' },
  lastVerified: { type: Date },
  order: { type: Number, default: 99 }
}));

const Place = mongoose.model('Place', new Schema({
  title: { type: String, required: true },
  details: { type: String, default: '' },
  category: { type: String, default: 'General' },
  link: { type: String, default: '' }
}));

module.exports = {
  User,
  Faculty,
  SlotBooking,
  FacultyAvailability,
  Notification,
  BloodRequest,
  Donor,
  Club,
  ClubEvent,
  Scholarship,
  Place
};
