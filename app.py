from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import json
import random
import string
from datetime import datetime
import os
import threading
import json as pyjson
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv

app = Flask(__name__)

# Load environment variables from .env file
load_dotenv()

# Set up rate limiting
limiter = Limiter(get_remote_address, app=app, default_limits=["100 per hour"])

# Restrict CORS to your frontend domain (replace with your real domain in production)
CORS(app, origins=[os.getenv('FRONTEND_ORIGIN', 'http://localhost:3000')])

# Use environment variable for admin password
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'vizient2024')

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///data.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

REG_STATUS_FILE = 'registration_status.json'
REG_STATUS_LOCK = threading.Lock()

QUESTIONS_FILE = 'hackathon_questions.json'
QUESTIONS_LOCK = threading.Lock()

def load_reg_status():
    if not os.path.exists(REG_STATUS_FILE):
        return {}
    with open(REG_STATUS_FILE, 'r') as f:
        return pyjson.load(f)

def save_reg_status(status):
    with REG_STATUS_LOCK:
        with open(REG_STATUS_FILE, 'w') as f:
            pyjson.dump(status, f)

def load_questions():
    if not os.path.exists(QUESTIONS_FILE):
        return {}
    with open(QUESTIONS_FILE, 'r') as f:
        return pyjson.load(f)

def save_questions(questions):
    with QUESTIONS_LOCK:
        with open(QUESTIONS_FILE, 'w') as f:
            pyjson.dump(questions, f)

# Helper to generate a unique 6-character alphanumeric code
def generate_edit_code(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

class Registration(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    hackathon = db.Column(db.String(50))  # New field for hackathon name
    reg_type = db.Column(db.String(10))  # 'team' or 'solo'
    team_name = db.Column(db.String(100))
    team_category = db.Column(db.String(50))
    members = db.Column(db.Text)  # Store as JSON string for team members
    open_to_more = db.Column(db.Boolean)
    solo_email = db.Column(db.String(100))
    solo_proficiency = db.Column(db.Integer)
    edit_code = db.Column(db.String(12), unique=True)
    team_custom_answers = db.Column(db.Text)  # JSON string
    team_member_custom_answers = db.Column(db.Text)  # JSON string
    solo_custom_answers = db.Column(db.Text)  # JSON string
    hype_song = db.Column(db.String(200))  # New field for hype song

class HackathonEvent(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    hackathon_key = db.Column(db.String(50), unique=True, nullable=False)
    start_datetime = db.Column(db.String(32), nullable=True)  # ISO 8601 string

with app.app_context():
    db.create_all()

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json
    password_attempt = data.get('password')
    if not password_attempt:
        return jsonify({'error': 'Password is required.'}), 400

    # Compare with the ADMIN_PASSWORD from environment variables
    if password_attempt == ADMIN_PASSWORD:
        # For simplicity, we'll just return a success message.
        # In a more complex app, you might issue a session token here.
        return jsonify({'message': 'Admin login successful!'}), 200
    else:
        return jsonify({'error': 'Invalid admin password.'}), 401

@app.route('/api/register', methods=['POST'])
@limiter.limit("5 per minute")
def register():
    data = request.json
    reg_type = data.get('reg_type')
    hackathon = data.get('hackathon')
    if not hackathon:
        return jsonify({'error': 'Hackathon is required.'}), 400
    edit_code = generate_edit_code()

    if reg_type == 'team':
        registration = Registration(
            hackathon=hackathon,
            reg_type='team',
            team_name=data.get('team_name'),
            team_category=data.get('team_category'),
            members=json.dumps(data.get('members', [])),
            open_to_more=data.get('open_to_more', False),
            edit_code=edit_code,
            team_custom_answers=json.dumps(data.get('team_custom_answers', {})),
            team_member_custom_answers=json.dumps(data.get('team_member_custom_answers', [])),
            hype_song=data.get('hype_song'),
        )
    elif reg_type == 'solo':
        registration = Registration(
            hackathon=hackathon,
            reg_type='solo',
            solo_email=data.get('solo_email'),
            solo_proficiency=data.get('solo_proficiency'),
            edit_code=edit_code,
            solo_custom_answers=json.dumps(data.get('solo_custom_answers', {})),
            hype_song=data.get('hype_song'),
        )
    else:
        return jsonify({'error': 'Invalid registration type'}), 400

    db.session.add(registration)
    db.session.commit()
    return jsonify({'message': 'Registration saved!', 'edit_code': edit_code}), 201

@app.route('/api/register/<edit_code>', methods=['GET'])
def get_registration(edit_code):
    reg = Registration.query.filter_by(edit_code=edit_code).first()
    if not reg:
        return jsonify({'error': 'No registration found for that code.'}), 404

    reg_data = {
        'id': reg.id,
        'hackathon': reg.hackathon,
        'reg_type': reg.reg_type,
        'team_name': reg.team_name,
        'team_category': reg.team_category,
        'members': reg.members,
        'open_to_more': reg.open_to_more,
        'solo_email': reg.solo_email,
        'solo_proficiency': reg.solo_proficiency,
        'edit_code': reg.edit_code,
        'team_custom_answers': reg.team_custom_answers,
        'team_member_custom_answers': reg.team_member_custom_answers,
        'solo_custom_answers': reg.solo_custom_answers,
        'hype_song': reg.hype_song,
    }
    return jsonify({'registration': reg_data}), 200

@app.route('/api/register/<edit_code>', methods=['PUT'])
@limiter.limit("5 per minute")
def update_registration(edit_code):
    reg = Registration.query.filter_by(edit_code=edit_code).first()
    if not reg:
        return jsonify({'error': 'No registration found for that code.'}), 404

    data = request.json
    if reg.reg_type == 'team':
        reg.team_name = data.get('team_name', reg.team_name)
        reg.team_category = data.get('team_category', reg.team_category)
        reg.members = json.dumps(data.get('members', json.loads(reg.members) if reg.members else []))
        reg.open_to_more = data.get('open_to_more', reg.open_to_more)
        reg.team_custom_answers = json.dumps(data.get('team_custom_answers', json.loads(reg.team_custom_answers) if reg.team_custom_answers else {}))
        reg.team_member_custom_answers = json.dumps(data.get('team_member_custom_answers', json.loads(reg.team_member_custom_answers) if reg.team_member_custom_answers else []))
    elif reg.reg_type == 'solo':
        reg.solo_email = data.get('solo_email', reg.solo_email)
        reg.solo_proficiency = data.get('solo_proficiency', reg.solo_proficiency)
        reg.solo_custom_answers = json.dumps(data.get('solo_custom_answers', json.loads(reg.solo_custom_answers) if reg.solo_custom_answers else {}))
    if 'hype_song' in data:
        reg.hype_song = data['hype_song']
    else:
        reg.hype_song = None

    db.session.commit()
    return jsonify({'message': 'Registration updated!'}), 200

@app.route('/api/register/<edit_code>', methods=['DELETE'])
def delete_registration(edit_code):
    """
    Delete a registration by its edit code.
    Returns a success message if deleted, or a 404 if not found.
    """
    reg = Registration.query.filter_by(edit_code=edit_code).first()
    if not reg:
        return jsonify({'error': 'No registration found for that code.'}), 404
    db.session.delete(reg)
    db.session.commit()
    return jsonify({'message': 'Registration deleted!'}), 200

@app.route('/api/registrations', methods=['GET'])
def get_all_registrations():
    hackathon = request.args.get('hackathon')
    if not hackathon:
        return jsonify({'error': 'Hackathon is required.'}), 400
    regs = Registration.query.filter_by(hackathon=hackathon).all()
    result = []
    for reg in regs:
        reg_data = {
            'id': reg.id,
            'hackathon': reg.hackathon,
            'reg_type': reg.reg_type,
            'team_name': reg.team_name,
            'team_category': reg.team_category,
            'members': reg.members,
            'open_to_more': reg.open_to_more,
            'solo_email': reg.solo_email,
            'solo_proficiency': reg.solo_proficiency,
            'edit_code': reg.edit_code,
            'team_custom_answers': reg.team_custom_answers,
            'team_member_custom_answers': reg.team_member_custom_answers,
            'solo_custom_answers': reg.solo_custom_answers,
            'hype_song': reg.hype_song,
        }
        result.append(reg_data)
    return jsonify({'registrations': result}), 200

@app.route('/api/check-emails', methods=['POST'])
def check_emails():
    """
    Check if any of the provided emails are already registered (team or solo) across all hackathons.
    Optionally exclude a registration by edit_code (for editing).
    Returns a list of dicts: {email, type: 'team'|'solo', team_name (if team)}
    """
    data = request.json
    emails = data.get('emails', [])
    edit_code = data.get('edit_code')
    if not emails:
        return jsonify({'duplicates': []}), 200
    duplicates = []
    # Check team members
    team_regs = Registration.query.filter(Registration.reg_type == 'team')
    if edit_code:
        team_regs = team_regs.filter(Registration.edit_code != edit_code)
    for reg in team_regs:
        members = json.loads(reg.members) if reg.members else []
        for m in members:
            if m.get('email') in emails:
                duplicates.append({
                    'email': m.get('email'),
                    'type': 'team',
                    'team_name': reg.team_name or '(no name)'
                })
    # Check solo
    solo_regs = Registration.query.filter(Registration.reg_type == 'solo')
    if edit_code:
        solo_regs = solo_regs.filter(Registration.edit_code != edit_code)
    for reg in solo_regs:
        if reg.solo_email in emails:
            duplicates.append({
                'email': reg.solo_email,
                'type': 'solo',
                'team_name': None
            })
    return jsonify({'duplicates': duplicates}), 200

@app.route('/api/hackathon-dates', methods=['GET'])
def get_hackathon_dates():
    events = HackathonEvent.query.all()
    result = {e.hackathon_key: e.start_datetime for e in events}
    return jsonify(result), 200

@app.route('/api/hackathon-date', methods=['POST'])
def set_hackathon_date():
    data = request.json
    hackathon_key = data.get('hackathon_key')
    start_datetime = data.get('start_datetime')  # ISO 8601 string
    if not hackathon_key:
        return jsonify({'error': 'hackathon_key is required.'}), 400
    event = HackathonEvent.query.filter_by(hackathon_key=hackathon_key).first()
    if event:
        if start_datetime:
            event.start_datetime = start_datetime
    else:
        event = HackathonEvent(
            hackathon_key=hackathon_key,
            start_datetime=start_datetime
        )
        db.session.add(event)
    db.session.commit()
    return jsonify({'message': 'Hackathon date/settings set.'}), 200

@app.route('/api/registration-status', methods=['GET'])
def get_registration_status():
    return jsonify(load_reg_status()), 200

@app.route('/api/registration-status', methods=['POST'])
def set_registration_status():
    data = request.json
    hackathon_key = data.get('hackathon_key')
    registration_open = data.get('registration_open')
    if hackathon_key is None or registration_open is None:
        return jsonify({'error': 'hackathon_key and registration_open are required.'}), 400
    status = load_reg_status()
    status[hackathon_key] = bool(registration_open)
    save_reg_status(status)
    return jsonify({'message': 'Registration status updated.'}), 200

@app.route('/api/hackathon-questions', methods=['GET'])
def get_hackathon_questions():
    hackathon_key = request.args.get('hackathon')
    if not hackathon_key:
        return jsonify({'error': 'Missing hackathon parameter.'}), 400
    questions = load_questions()
    return jsonify({'questions': questions.get(hackathon_key, [])}), 200

@app.route('/api/hackathon-questions', methods=['POST'])
def set_hackathon_questions():
    data = request.json
    hackathon_key = data.get('hackathon_key')
    questions = data.get('questions')
    if not hackathon_key or questions is None:
        return jsonify({'error': 'hackathon_key and questions are required.'}), 400
    all_questions = load_questions()
    all_questions[hackathon_key] = questions
    save_questions(all_questions)
    return jsonify({'message': 'Questions updated.'}), 200

if __name__ == '__main__':
    app.run(debug=True) 