import requests
import json

BASE_URL = 'http://localhost:5000'

def test_recurring_flow():
    # 1. Login as GM
    print("Logging in as GM...")
    res = requests.post(f'{BASE_URL}/auth/login', json={'role': 'gm'})
    if res.status_code != 200:
        print(f"Login failed: {res.text}")
        return
    token = res.json()['token']
    headers = {'Authorization': f'Bearer {token}'}
    print("Login successful.")

    # 2. Get Recurring Tasks
    print("\nFetching recurring tasks...")
    res = requests.get(f'{BASE_URL}/recurring-tasks', headers=headers)
    if res.status_code == 200:
        tasks = res.json()
        print(f"Found {len(tasks)} tasks.")
        for t in tasks:
            print(f"- {t['title']} (Next run: {t['next_run_date']})")
    else:
        print(f"Failed to fetch tasks: {res.text}")

    # 3. Create New Task
    print("\nCreating new recurring task...")
    new_task = {
        'title': 'Test Recurring Task',
        'description': 'This is a test',
        'frequency_days': 1,
        'department': 'Maintenance',
        'next_run_date': '2023-01-01' # Past date to ensure it triggers immediately
    }
    res = requests.post(f'{BASE_URL}/recurring-tasks', json=new_task, headers=headers)
    if res.status_code == 201:
        print("Task created successfully.")
    else:
        print(f"Failed to create task: {res.text}")

    # 4. Run Scheduler
    print("\nRunning Scheduler...")
    res = requests.post(f'{BASE_URL}/scheduler/check')
    if res.status_code == 200:
        print(f"Scheduler result: {res.json()}")
    else:
        print(f"Scheduler failed: {res.text}")

    # 5. Verify Ticket Created
    print("\nVerifying ticket creation...")
    res = requests.get(f'{BASE_URL}/tickets', headers=headers)
    if res.status_code == 200:
        tickets = res.json()
        found = False
        for t in tickets:
            if 'Test Recurring Task' in t['description']:
                print(f"SUCCESS: Found ticket for 'Test Recurring Task' (ID: {t['id']})")
                found = True
                break
        if not found:
            print("FAILURE: Ticket not found.")
    else:
        print(f"Failed to fetch tickets: {res.text}")

if __name__ == '__main__':
    test_recurring_flow()
