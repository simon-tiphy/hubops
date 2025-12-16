import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'instance', 'hubops.db')
if not os.path.exists(db_path):
    print(f"Database not found at {db_path}")
    exit(1)

conn = sqlite3.connect(db_path)
c = conn.cursor()

try:
    c.execute("ALTER TABLE ticket ADD COLUMN accepted_at DATETIME")
    print("Added accepted_at column")
except Exception as e:
    print(f"Error adding accepted_at: {e}")

try:
    c.execute("ALTER TABLE ticket ADD COLUMN assigned_duration_minutes INTEGER")
    print("Added assigned_duration_minutes column")
except Exception as e:
    print(f"Error adding assigned_duration_minutes: {e}")

conn.commit()
conn.close()
