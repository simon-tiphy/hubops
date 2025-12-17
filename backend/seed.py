from app import app, db
from models import User, Department, Ticket, RecurringTask
from datetime import datetime, timedelta
import random

def get_or_create_dept(name):
    dept = Department.query.filter_by(name=name).first()
    if not dept:
        dept = Department(name=name)
        db.session.add(dept)
    return dept

def get_or_create_user(username, role, dept_id=None):
    user = User.query.filter_by(username=username).first()
    if not user:
        user = User(username=username, role=role, department_id=dept_id)
        db.session.add(user)
    return user

def seed_data():
    with app.app_context():
        # Ensure tables exist but DO NOT DROP them
        db.create_all()

        print("Checking/Creating Departments...")
        maintenance = get_or_create_dept('Maintenance')
        security = get_or_create_dept('Security')
        housekeeping = get_or_create_dept('Housekeeping')
        it = get_or_create_dept('IT')
        
        db.session.commit()

        depts = [maintenance, security, housekeeping, it]

        print("Checking/Creating Users...")
        tenant = get_or_create_user('Tenant User', 'tenant')
        gm = get_or_create_user('General Manager', 'gm')
        
        # Create Dept Heads & Staff
        for dept in depts:
            get_or_create_user(f"{dept.name.lower()}_head", 'dept', dept.id)
            get_or_create_user(f"{dept.name.lower()}_staff", 'staff', dept.id)

        db.session.commit()

        print("Adding Original Demo Tickets (with real images)...")
        # Real files found in uploads/
        # Images
        img_leak = 'http://localhost:5000/uploads/1765582571_Screenshot_from_2025-02-25_23-48-37.png'
        img_electric = 'http://localhost:5000/uploads/1765584564_Screenshot_from_2024-10-23_02-21-33.png'
        img_faucet = 'http://localhost:5000/uploads/1765585068_Screenshot_from_2024-10-15_15-14-30.png'
        img_wifi = 'http://localhost:5000/uploads/1765842156_closeup-men-giving-money-poor-600nw-2103103568.webp' 
        img_general = 'http://localhost:5000/uploads/1765843177_Afrika-Tikkun-boy-child.jpg'
        
        # Videos
        vid_proof1 = 'http://localhost:5000/uploads/1765841319_lv_0_20250220133409.mp4'
        vid_proof2 = 'http://localhost:5000/uploads/1765842292_173462-849645864.mp4'

        available_images = [img_leak, img_electric, img_faucet, img_wifi, img_general]
        available_videos = [vid_proof1, vid_proof2]

        # 2 Pending
        t1 = Ticket(tenant_name='Tenant User', type='Plumbing', priority='Urgent', description='Leaking pipe in store 101', status='Pending Approval', photo_url=img_leak)
        t2 = Ticket(tenant_name='Tenant User', type='Electrical', priority='Medium', description='Lights flickering in hallway', status='Pending Approval', photo_url=img_electric)
        
        # 2 In Progress
        t3 = Ticket(tenant_name='Tenant User', type='Security', priority='High', description='Back door lock broken', status='In Progress', assigned_dept_id=security.id, estimated_fix_time='4 hours', accepted_at=datetime.utcnow() - timedelta(hours=2), assigned_duration_minutes=240, photo_url=img_general)
        t4 = Ticket(tenant_name='Tenant User', type='Plumbing', priority='Low', description='Dripping faucet in restroom', status='In Progress', assigned_dept_id=maintenance.id, estimated_fix_time='2 hours', accepted_at=datetime.utcnow() - timedelta(hours=1), assigned_duration_minutes=120, photo_url=img_faucet)
        
        # 1 Resolved
        t5 = Ticket(tenant_name='Tenant User', type='IT', priority='Medium', description='WiFi down in food court', status='Resolved', assigned_dept_id=it.id, estimated_fix_time='1 hour', proof_url=vid_proof1, photo_url=img_wifi, resolved_at=datetime.utcnow(), feedback_rating=5)

        db.session.add_all([t1, t2, t3, t4, t5])
        db.session.commit()

        print("Generating historical data (Add-on)...")
        # Helper to create realistic tickets
        
        ticket_types = ['Plumbing', 'Electrical', 'Security', 'HVAC', 'Cleaning', 'IT', 'General']
        priorities = ['Low', 'Medium', 'High', 'Urgent']
        descriptions = [
            'Leaking pipe in main corridor', 'Light flickering in store 101', 
            'Door handle broken', 'AC not cooling', 'Spill on floor', 
            'Internet slow', 'Strange noise from vent', 'Key card not working',
            'Water dispenser empty', 'Fire alarm beeping'
        ]
        
        # Create ~40 random tickets over last 10 days
        departments = [maintenance, security, housekeeping, it]
        
        for i in range(40):
            # Random date in last 10 days
            days_ago = random.randint(0, 9)
            created_at = datetime.utcnow() - timedelta(days=days_ago, hours=random.randint(1, 12))
            
            dept = random.choice(departments)
            t_type = random.choice(ticket_types)
            priority = random.choice(priorities)
            desc = random.choice(descriptions)
            
            # Randomly assign an image
            photo_url = random.choice(available_images) if random.random() > 0.3 else None
            
            # Determine status
            rand_val = random.random()
            
            if rand_val < 0.1: 
                status = 'Pending Approval'
                assigned_dept_id = None
                ticket = Ticket(
                    tenant_name='Tenant User', type=t_type, priority=priority, 
                    description=desc, status=status, created_at=created_at,
                    photo_url=photo_url
                )
            elif rand_val < 0.3:
                status = 'Assigned'
                ticket = Ticket(
                    tenant_name='Tenant User', type=t_type, priority=priority,
                    description=desc, status=status, created_at=created_at,
                    assigned_dept_id=dept.id, photo_url=photo_url
                )
            elif rand_val < 0.5:
                status = 'In Progress'
                accepted_at = created_at + timedelta(minutes=random.randint(10, 120))
                ticket = Ticket(
                    tenant_name='Tenant User', type=t_type, priority=priority,
                    description=desc, status=status, created_at=created_at,
                    assigned_dept_id=dept.id, accepted_at=accepted_at,
                    assigned_duration_minutes=random.randint(60, 480),
                    photo_url=photo_url
                )
            else:
                # Resolved (50% of tickets)
                status = 'Resolved'
                accepted_at = created_at + timedelta(minutes=random.randint(30, 200))
                # Resolution time varies: 1h to 48h
                fix_duration_hours = random.uniform(0.5, 12.0) 
                resolved_at = accepted_at + timedelta(hours=fix_duration_hours)
                
                # Feedback (mostly good)
                feedback = random.choices([5, 4, 3, 2, 1], weights=[60, 20, 10, 5, 5])[0]
                
                # Random proof
                proof_url = random.choice(available_videos + available_images) if random.random() > 0.2 else None
                
                ticket = Ticket(
                    tenant_name='Tenant User', type=t_type, priority=priority,
                    description=desc, status=status, created_at=created_at,
                    assigned_dept_id=dept.id, accepted_at=accepted_at,
                    assigned_duration_minutes=random.randint(60, 480),
                    resolved_at=resolved_at,
                    feedback_rating=feedback,
                    proof_url=proof_url, # Use real file
                    photo_url=photo_url
                )

            db.session.add(ticket)
            
        db.session.commit()
        
        # Create Recurring Tasks (Check existence first to avoid dupes if running multiple times)
        # For simplicity, we'll just add them. In real app, check content.
        # But user wants "original data" preserved. 
        # If we run this multiple times, we get duplicate recurring tasks. 
        # Let's check title.
        
        def create_task_if_not_exists(title, description, days, dept_id):
            task = RecurringTask.query.filter_by(title=title).first()
            if not task:
                task = RecurringTask(title=title, description=description, frequency_days=days, next_run_date=datetime.utcnow().date(), assigned_dept_id=dept_id)
                db.session.add(task)

        create_task_if_not_exists('Inspect Fire Extinguishers', 'Check all fire extinguishers in the mall', 30, security.id)
        create_task_if_not_exists('Service Generator', 'Monthly generator service', 30, maintenance.id)
        
        db.session.commit()
        
        print("Database populated successfully (Additive)!")

if __name__ == '__main__':
    seed_data()
