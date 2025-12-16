from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'tenant', 'gm', 'dept'
    department_id = db.Column(db.Integer, db.ForeignKey('department.id'), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'department_id': self.department_id
        }

class Department(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
        }

class Ticket(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    tenant_name = db.Column(db.String(80), nullable=False)
    anonymous = db.Column(db.Boolean, default=False)
    type = db.Column(db.String(50), nullable=False) # Plumbing, Electrical, Security
    priority = db.Column(db.String(20), nullable=False) # Low, Medium, Urgent
    photo_url = db.Column(db.String(255), nullable=True)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='Pending Approval') # Pending Approval, Assigned, In Progress, Resolved
    assigned_dept_id = db.Column(db.Integer, db.ForeignKey('department.id'), nullable=True)
    estimated_fix_time = db.Column(db.String(50), nullable=True)
    feedback_rating = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)
    proof_url = db.Column(db.String(255), nullable=True)
    assigned_staff_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    staff_status = db.Column(db.String(20), nullable=True) # 'Pending', 'Accepted', 'Rejected'
    accepted_at = db.Column(db.DateTime, nullable=True)
    assigned_duration_minutes = db.Column(db.Integer, nullable=True) # Duration in minutes

    department = db.relationship('Department', backref='tickets')
    staff = db.relationship('User', foreign_keys=[assigned_staff_id], backref='assigned_tickets')

    def to_dict(self):
        return {
            'id': self.id,
            'tenant_name': 'Anonymous' if self.anonymous else self.tenant_name,
            'anonymous': self.anonymous,
            'type': self.type,
            'priority': self.priority,
            'photo_url': self.photo_url,
            'description': self.description,
            'status': self.status,
            'assigned_dept': self.department.name if self.department else None,
            'assigned_dept_id': self.assigned_dept_id,
            'estimated_fix_time': self.estimated_fix_time,
            'feedback_rating': self.feedback_rating,
            'created_at': self.created_at.isoformat(),
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'proof_url': self.proof_url,
            'assigned_staff_id': self.assigned_staff_id,
            'assigned_staff_name': self.staff.username if self.staff else None,
            'staff_status': self.staff_status,
            'accepted_at': self.accepted_at.isoformat() if self.accepted_at else None,
            'assigned_duration_minutes': self.assigned_duration_minutes
        }

class RecurringTask(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    frequency_days = db.Column(db.Integer, nullable=False)
    next_run_date = db.Column(db.Date, nullable=False)
    assigned_dept_id = db.Column(db.Integer, db.ForeignKey('department.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    department = db.relationship('Department', backref='recurring_tasks')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'frequency_days': self.frequency_days,
            'next_run_date': self.next_run_date.isoformat(),
            'assigned_dept_id': self.assigned_dept_id,
            'assigned_dept': self.department.name if self.department else None
        }
