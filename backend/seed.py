from app import app, db
from models import User, Department, Ticket

def seed_data():
    with app.app_context():
        db.drop_all()
        db.create_all()

        # Create Departments
        maintenance = Department(name='Maintenance')
        security = Department(name='Security')
        housekeeping = Department(name='Housekeeping')
        it = Department(name='IT')
        
        db.session.add_all([maintenance, security, housekeeping, it])
        db.session.commit()

        # Create Users
        tenant = User(username='Tenant User', role='tenant')
        gm = User(username='General Manager', role='gm')
        maint_head = User(username='Maintenance Head', role='dept', department_id=maintenance.id)
        sec_head = User(username='Security Head', role='dept', department_id=security.id)
        
        db.session.add_all([tenant, gm, maint_head, sec_head])
        db.session.commit()

        # Create Tickets
        # 2 Pending
        t1 = Ticket(tenant_name='Tenant User', type='Plumbing', priority='Urgent', description='Leaking pipe in store 101', status='Pending Approval')
        t2 = Ticket(tenant_name='Tenant User', type='Electrical', priority='Medium', description='Lights flickering in hallway', status='Pending Approval')
        
        # 2 In Progress
        t3 = Ticket(tenant_name='Tenant User', type='Security', priority='High', description='Back door lock broken', status='In Progress', assigned_dept_id=security.id, estimated_fix_time='4 hours')
        t4 = Ticket(tenant_name='Tenant User', type='Plumbing', priority='Low', description='Dripping faucet in restroom', status='In Progress', assigned_dept_id=maintenance.id, estimated_fix_time='2 hours')
        
        # 1 Resolved
        t5 = Ticket(tenant_name='Tenant User', type='IT', priority='Medium', description='WiFi down in food court', status='Resolved', assigned_dept_id=it.id, estimated_fix_time='1 hour', proof_url='http://example.com/proof.jpg', resolved_at=datetime.utcnow())

        db.session.add_all([t1, t2, t3, t4, t5])
        db.session.commit()
        
        print("Database seeded successfully!")

if __name__ == '__main__':
    from datetime import datetime
    seed_data()
