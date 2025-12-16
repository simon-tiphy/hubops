import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'instance', 'hubops.db')
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
c = conn.cursor()

c.execute("SELECT id, status, proof_url FROM ticket ORDER BY id DESC LIMIT 5")
rows = c.fetchall()

for row in rows:
    print(f"ID: {row['id']}, Status: {row['status']}, Proof: {row['proof_url']}")

conn.close()
