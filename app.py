import sqlite3
import jwt
import datetime
from flask import Flask, render_template, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.config['SECRET_KEY'] = 'bup_digital_twin_secret_key'

def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS slot_bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            faculty_name TEXT NOT NULL,
            slot_time TEXT NOT NULL,
            status TEXT NOT NULL
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS blood_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            blood_group TEXT NOT NULL,
            location TEXT NOT NULL,
            phone TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

@app.route('/')
def index():
    return render_template('index.html')

# FR-01: Authentication API
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    hashed_password = generate_password_hash(data['password'], method='scrypt')
    conn = get_db_connection()
    try:
        conn.execute('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
                     (data['name'], data['email'], hashed_password, data.get('role', 'Student')))
        conn.commit()
        return jsonify({"message": f"Successfully registered as {data.get('role')}!"}), 201
    except sqlite3.IntegrityError:
        return jsonify({"error": "Email already registered!"}), 400
    finally:
        conn.close()

# FR-03: Bus Tracking API
@app.route('/api/bus-location', methods=['GET'])
def get_bus_location():
    return jsonify({
        "bus_id": "BUP-BUS-01",
        "route": "Mirpur-12 to BUP Main Campus",
        "latitude": 23.8378,
        "longitude": 90.3582,
        "eta": "8 Mins"
    })

# FR-04: Consultation Booking API
@app.route('/api/book-slot', methods=['POST'])
def book_slot():
    data = request.json
    faculty, date, time, reason = data.get('faculty'), data.get('date'), data.get('time'), data.get('reason')
    if not all([faculty, date, time, reason]):
        return jsonify({"error": "All fields are required!"}), 400

    conn = get_db_connection()
    conn.execute('INSERT INTO slot_bookings (faculty_name, slot_time, status) VALUES (?, ?, ?)',
                 (faculty, f"{date} at {time}", 'Confirmed'))
    conn.commit()
    conn.close()
    return jsonify({"message": f"Successfully booked consultation with {faculty} on {date} ({time})!"}), 200

# FR-05: Smart Campus Search Engine API
@app.route('/api/search', methods=['GET'])
def campus_search():
    query = request.args.get('q', '').lower()
    
    mock_data = [
        {"title": "ICE Lab 1", "details": "Located on 6th Floor, Room 604, Main Academic Building."},
        {"title": "Central Library", "details": "Ground Floor, Annex Building. Open 8:00 AM - 8:00 PM."},
        {"title": "Dr. Ahsan Habib", "details": "Associate Professor, Department of ICE. Office: Room 612."},
        {"title": "BUP Bus Route 1", "details": "Departs Mirpur-12 at 7:30 AM every morning."},
        {"title": "ICE 2nd Year Timetable", "details": "Classroom 602. Linear Algebra lecture on Sundays at 9:00 AM."}
    ]
    
    matched = [item for item in mock_data if query in item['title'].lower() or query in item['details'].lower()]
    return jsonify({"results": matched})

# FR-09: Emergency Blood Request API
@app.route('/api/request-blood', methods=['POST'])
def request_blood():
    data = request.json
    bg, loc, phone = data.get('blood_group'), data.get('location'), data.get('phone')
    
    if not all([bg, loc, phone]):
        return jsonify({"error": "Please fill all blood request details."}), 400

    conn = get_db_connection()
    conn.execute('INSERT INTO blood_requests (blood_group, location, phone) VALUES (?, ?, ?)',
                 (bg, loc, phone))
    conn.commit()
    conn.close()
    return jsonify({"message": f"Emergency broadcast sent to BUP {bg} donors!"}), 200

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)