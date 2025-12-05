from flask import Flask, request, jsonify
from flask_restful import Api, Resource
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from models import db, User, Ticket, Department
from datetime import datetime
import os
import json

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///hubops.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'super-secret-key'  # Change this in production

db.init_app(app)
api = Api(app)
jwt = JWTManager(app)
CORS(app)

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
            dept_name = data.get('department', 'Maintenance')
            dept = Department.query.filter_by(name=dept_name).first()
            if dept:
                user = User.query.filter_by(role='dept', department_id=dept.id).first()
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
            ticket.estimated_fix_time = data.get('estimated_fix_time')
            ticket.status = 'In Progress'

        elif action == 'resolve':
            if current_user['role'] != 'dept':
                return {'message': 'Unauthorized'}, 403
            ticket.proof_url = data.get('proof_url')
            ticket.status = 'Resolved'
            ticket.resolved_at = datetime.utcnow()
        
        else:
            return {'message': 'Invalid action'}, 400

        db.session.commit()
        return ticket.to_dict(), 200

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

if __name__ == '__main__':
    app.run(debug=True, port=5000)
