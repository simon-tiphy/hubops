from app import app, db
from models import User, Department, Ticket, RecurringTask

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

        depts = [maintenance, security, housekeeping, it]

        # Create Users
        tenant = User(username='Tenant User', role='tenant')
        gm = User(username='General Manager', role='gm')
        
        db.session.add_all([tenant, gm])
        db.session.commit()

        # Create Dept Heads
        dept_heads = []
        for dept in depts:
            head = User(username=f"{dept.name.lower()}_head", role='dept', department_id=dept.id)
            db.session.add(head)
            dept_heads.append(head)
            
            # Create Staff for each department
            staff = User(username=f"{dept.name.lower()}_staff", role='staff', department_id=dept.id)
            db.session.add(staff)

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

        # Create Recurring Tasks
        from datetime import date, timedelta
        rt1 = RecurringTask(title='Inspect Fire Extinguishers', description='Check all fire extinguishers in the mall', frequency_days=30, next_run_date=date.today(), assigned_dept_id=security.id)
        rt2 = RecurringTask(title='Service Generator', description='Monthly generator service', frequency_days=30, next_run_date=date.today() + timedelta(days=5), assigned_dept_id=maintenance.id)
        
        db.session.add_all([rt1, rt2])
        db.session.commit()
        
        print("Database seeded successfully!")

if __name__ == '__main__':
    from datetime import datetime
    seed_data()
