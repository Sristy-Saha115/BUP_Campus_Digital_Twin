-- FR-01: Users Table (Roles: Student, Faculty, Staff, Visitor)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Student'
);

-- FR-04 & FR-05: Slot Bookings (Faculty Consultation & Exam Slots)
CREATE TABLE IF NOT EXISTS slot_bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    faculty_name TEXT NOT NULL,
    slot_time TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    FOREIGN KEY (student_id) REFERENCES users(id)
);

-- FR-07: Emergency Blood Donor Network
CREATE TABLE IF NOT EXISTS blood_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_name TEXT NOT NULL,
    blood_group TEXT NOT NULL,
    hospital TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    status TEXT DEFAULT 'Open'
);

-- FR-08: Campus Events and Career Listings
CREATE TABLE IF NOT EXISTS campus_listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- 'Event' or 'Job'
    description TEXT,
    date_posted TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);