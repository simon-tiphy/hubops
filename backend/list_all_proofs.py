import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'instance', 'hubops.db')
conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT id, status, proof_url FROM ticket WHERE proof_url IS NOT NULL")
rows = c.fetchall()

if not rows:
    print("No tickets with proof found.")
else:
    for row in rows:
        print(f"Proof: {row[2]}")

conn.close()
