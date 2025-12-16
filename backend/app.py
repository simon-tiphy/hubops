from flask import Flask, request, jsonify, send_from_directory
from flask_restful import Api, Resource
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from models import db, User, Ticket, Department, RecurringTask
from datetime import datetime, timedelta
import os
import json

from werkzeug.utils import secure_filename
import time

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///hubops.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'super-secret-key'  # Change this in production
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db.init_app(app)
api = Api(app)
jwt = JWTManager(app)
CORS(app)

# --- Uploads & Static ---
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

class UploadFile(Resource):
    def post(self):
        if 'file' not in request.files:
            return {'message': 'No file part'}, 400
        file = request.files['file']
        if file.filename == '':
            return {'message': 'No selected file'}, 400
        if file:
            filename = secure_filename(file.filename)
            unique_filename = f"{int(time.time())}_{filename}"
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], unique_filename))
            return {'url': f"http://localhost:5000/uploads/{unique_filename}"}, 201

# --- Auth Resources ---
class Login(Resource):
    def post(self):
        data = request.get_json()
        role = data.get('role')
        
        # Simple demo login logic
        if role == 'tenant':
            user = User.query.filter_by(role='tenant').first()
        elif role == 'gm':
            user = User.query.filter_by(role='gm').first()
        elif role == 'dept':
            dept_name = data.get('department')
            dept = Department.query.filter_by(name=dept_name).first()
            if dept:
                user = User.query.filter_by(role='dept', department_id=dept.id).first()
            else:
                return {'message': 'Department not found'}, 404
        elif role == 'staff':
            dept_name = data.get('department')
            dept = Department.query.filter_by(name=dept_name).first()
            if dept:
                user = User.query.filter_by(role='staff', department_id=dept.id).first()
            else:
                return {'message': 'Department not found'}, 404
        else:
            return {'message': 'Invalid role'}, 400

        if not user:
            return {'message': 'User not found for this role'}, 404

        access_token = create_access_token(identity=json.dumps({'id': user.id, 'role': user.role, 'username': user.username, 'dept_id': user.department_id}))
        return {'token': access_token, 'user': user.to_dict()}, 200

# --- Ticket Resources ---
class TicketList(Resource):
    @jwt_required()
    def get(self):
        current_user = json.loads(get_jwt_identity())
        role = current_user['role']
        
        if role == 'tenant':
            # Tenants see their own tickets (or all for demo simplicity if we want)
            # For demo, let's show all tickets created by "Tenant User"
            tickets = Ticket.query.order_by(Ticket.created_at.desc()).all()
        elif role == 'gm':
            # GM sees all tickets
            tickets = Ticket.query.order_by(Ticket.created_at.desc()).all()
        elif role == 'dept':
            # Dept sees tickets assigned to their dept
            dept_id = current_user['dept_id']
            tickets = Ticket.query.filter_by(assigned_dept_id=dept_id).order_by(Ticket.created_at.desc()).all()
        elif role == 'staff':
            # Staff sees tickets assigned to them OR tickets for their department (optional, but good for visibility)
            # For now, let's show tickets assigned to their department so they can see the pool if needed, 
            # or just their assignments. The dashboard filters them anyway.
            dept_id = current_user['dept_id']
            tickets = Ticket.query.filter_by(assigned_dept_id=dept_id).order_by(Ticket.created_at.desc()).all()
        else:
            tickets = []

        return [t.to_dict() for t in tickets], 200

    @jwt_required()
    def post(self):
        data = request.get_json()
        current_user = json.loads(get_jwt_identity())
        
        new_ticket = Ticket(
            tenant_name=current_user['username'], # Or from input if anonymous
            anonymous=data.get('anonymous', False),
            type=data.get('type'),
            priority=data.get('priority'),
            photo_url=data.get('photo_url'), # In real app, handle upload separately
            description=data.get('description'),
            status='Pending Approval'
        )
        
        
        # Auto-assignment removed to enforce GM approval
        # dept_name = data.get('type')
        # if dept_name:
        #     dept = Department.query.filter_by(name=dept_name).first()
        #     if dept:
        #         new_ticket.assigned_dept_id = dept.id
        #         new_ticket.status = 'Assigned' # Auto-assign to dept

        db.session.add(new_ticket)
        db.session.commit()
        return new_ticket.to_dict(), 201

class TicketAction(Resource):
    @jwt_required()
    def put(self, ticket_id):
        data = request.get_json()
        action = data.get('action')
        ticket = Ticket.query.get_or_404(ticket_id)
        current_user = json.loads(get_jwt_identity())

        if action == 'assign':
            if current_user['role'] != 'gm':
                return {'message': 'Unauthorized'}, 403
            dept_name = data.get('department')
            dept = Department.query.filter_by(name=dept_name).first()
            if not dept:
                return {'message': 'Department not found'}, 404
            ticket.assigned_dept_id = dept.id
            ticket.status = 'Assigned'
        
        elif action == 'accept':
            if current_user['role'] != 'dept':
                return {'message': 'Unauthorized'}, 403
            ticket.estimated_fix_time = data.get('estimated_fix_time') # Human readable string
            ticket.assigned_duration_minutes = data.get('duration_minutes') # Integer for timer
            ticket.accepted_at = datetime.utcnow()
            ticket.status = 'In Progress'

        elif action == 'resolve':
            if current_user['role'] != 'dept':
                return {'message': 'Unauthorized'}, 403
            ticket.proof_url = data.get('proof_url')
            ticket.status = 'Resolved'
            ticket.resolved_at = datetime.utcnow()
        
        elif action == 'assign_staff':
            staff_id = data.get('staff_id')
            ticket.assigned_staff_id = staff_id
            ticket.staff_status = 'Pending'
            
        elif action == 'staff_accept':
            ticket.staff_status = 'Accepted'
            ticket.status = 'In Progress'
            
        elif action == 'staff_reject':
            ticket.assigned_staff_id = None
            ticket.staff_status = None
        
        elif action == 'dept_reject':
            if current_user['role'] != 'dept':
                return {'message': 'Unauthorized'}, 403
            reason = data.get('reason', 'No reason provided')
            ticket.status = 'Rejected'
            ticket.description = f"{ticket.description}\n\n[REJECTED]: {reason}"
            # Reset assignment so it can be re-assigned
            ticket.assigned_dept_id = None

        else:
            return {'message': 'Invalid action'}, 400

        db.session.commit()
        return ticket.to_dict(), 200

class StaffList(Resource):
    @jwt_required()
    def get(self, dept_id):
        staff_members = User.query.filter_by(role='staff', department_id=dept_id).all()
        return [s.to_dict() for s in staff_members], 200

# --- Recurring Task Resources ---
class RecurringTaskList(Resource):
    @jwt_required()
    def get(self):
        current_user = json.loads(get_jwt_identity())
        if current_user['role'] != 'gm':
            return {'message': 'Unauthorized'}, 403
        
        tasks = RecurringTask.query.all()
        return [t.to_dict() for t in tasks], 200

    @jwt_required()
    def post(self):
        current_user = json.loads(get_jwt_identity())
        if current_user['role'] != 'gm':
            return {'message': 'Unauthorized'}, 403
        
        data = request.get_json()
        dept_name = data.get('department')
        dept = Department.query.filter_by(name=dept_name).first()
        
        new_task = RecurringTask(
            title=data.get('title'),
            description=data.get('description'),
            frequency_days=int(data.get('frequency_days')),
            next_run_date=datetime.strptime(data.get('next_run_date'), '%Y-%m-%d').date(),
            assigned_dept_id=dept.id if dept else None
        )
        db.session.add(new_task)
        db.session.commit()
        return new_task.to_dict(), 201

class RecurringTaskItem(Resource):
    @jwt_required()
    def put(self, task_id):
        current_user = json.loads(get_jwt_identity())
        if current_user['role'] != 'gm':
            return {'message': 'Unauthorized'}, 403
        
        task = RecurringTask.query.get_or_404(task_id)
        data = request.get_json()
        
        dept_name = data.get('department')
        dept = Department.query.filter_by(name=dept_name).first()
        
        task.title = data.get('title', task.title)
        task.description = data.get('description', task.description)
        task.frequency_days = int(data.get('frequency_days', task.frequency_days))
        if data.get('next_run_date'):
            task.next_run_date = datetime.strptime(data.get('next_run_date'), '%Y-%m-%d').date()
        if dept:
            task.assigned_dept_id = dept.id
            
        db.session.commit()
        return task.to_dict(), 200

    @jwt_required()
    def delete(self, task_id):
        current_user = json.loads(get_jwt_identity())
        if current_user['role'] != 'gm':
            return {'message': 'Unauthorized'}, 403
        
        task = RecurringTask.query.get_or_404(task_id)
        db.session.delete(task)
        db.session.commit()
        return {'message': 'Task deleted'}, 200

class SchedulerCheck(Resource):
    def post(self):
        # In a real app, this would be secured or run by a cron job internally
        # For this demo, we expose it so the frontend can trigger it
        
        today = datetime.utcnow().date()
        due_tasks = RecurringTask.query.filter(RecurringTask.next_run_date <= today).all()
        
        created_tickets = []
        
        for task in due_tasks:
            # Create Ticket
            new_ticket = Ticket(
                tenant_name='System Scheduler',
                anonymous=False,
                type='Maintenance', # Generic type for now
                priority='Medium',
                description=f"Recurring Task: {task.title}\n{task.description}",
                status='Pending Approval', # Or directly 'Assigned' if we want
                assigned_dept_id=task.assigned_dept_id
            )
            
            # If we want to auto-assign, we can set status to 'Assigned'
            if task.assigned_dept_id:
                new_ticket.status = 'Assigned'
            
            db.session.add(new_ticket)
            created_tickets.append(new_ticket)
            
            # Update Next Run Date
            # If it was due days ago, should we set it to today + freq? 
            # Or keep adding freq until it's in the future?
            # For simplicity: next_run = next_run + freq
            task.next_run_date = task.next_run_date + timedelta(days=task.frequency_days)
            
        db.session.commit()
        
        return {
            'message': f'Processed {len(due_tasks)} due tasks',
            'tickets_created': [t.id for t in created_tickets]
        }, 200

# --- Dashboard Stats (GM) ---
class DashboardStats(Resource):
    @jwt_required()
    def get(self):
        # Calculate stats for charts
        tickets = Ticket.query.all()
        departments = Department.query.all()
        
        # Issues per Dept
        issues_per_dept = []
        for dept in departments:
            count = Ticket.query.filter_by(assigned_dept_id=dept.id).count()
            issues_per_dept.append({'name': dept.name, 'count': count})
            
        # Tenant Satisfaction (Mock data for now, or avg of feedback_rating)
        satisfaction = [
            {'name': 'Happy', 'value': 70},
            {'name': 'Neutral', 'value': 20},
            {'name': 'Unhappy', 'value': 10}
        ]
        
        # Avg Time to Fix (Mock or calc)
        avg_time = [
            {'day': 'Mon', 'hours': 4},
            {'day': 'Tue', 'hours': 3},
            {'day': 'Wed', 'hours': 5},
            {'day': 'Thu', 'hours': 2},
            {'day': 'Fri', 'hours': 4},
        ]
        
        # Dept Load
        dept_load = []
        for dept in departments:
            active_count = Ticket.query.filter_by(assigned_dept_id=dept.id, status='In Progress').count()
            dept_load.append({'name': dept.name, 'active_tickets': active_count})

        return {
            'issues_per_dept': issues_per_dept,
            'satisfaction': satisfaction,
            'avg_time': avg_time,
            'dept_load': dept_load
        }, 200

api.add_resource(Login, '/auth/login')
api.add_resource(TicketList, '/tickets')
api.add_resource(TicketAction, '/tickets/<int:ticket_id>/action')
api.add_resource(DashboardStats, '/dashboard/stats')
api.add_resource(RecurringTaskList, '/recurring-tasks')
api.add_resource(RecurringTaskItem, '/recurring-tasks/<int:task_id>')
api.add_resource(SchedulerCheck, '/scheduler/check')
api.add_resource(StaffList, '/departments/<int:dept_id>/staff')
api.add_resource(UploadFile, '/upload')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
