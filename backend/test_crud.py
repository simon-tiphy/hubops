import requests
import json

BASE_URL = 'http://localhost:5000'

def test_crud_flow():
    # 1. Login as GM
    print("Logging in as GM...")
    res = requests.post(f'{BASE_URL}/auth/login', json={'role': 'gm'})
    if res.status_code != 200:
        print(f"Login failed: {res.text}")
        return
    token = res.json()['token']
    headers = {'Authorization': f'Bearer {token}'}
    print("Login successful.")

    # 2. Create Task
    print("\nCreating task 'To be deleted'...")
    new_task = {
        'title': 'To be deleted',
        'description': 'Temporary task',
        'frequency_days': 7,
        'department': 'Maintenance',
        'next_run_date': '2025-12-25'
    }
    res = requests.post(f'{BASE_URL}/recurring-tasks', json=new_task, headers=headers)
    if res.status_code == 201:
        task_id = res.json()['id']
        print(f"Task created with ID: {task_id}")
    else:
        print(f"Failed to create task: {res.text}")
        return

    # 3. Update Task
    print(f"\nUpdating task {task_id}...")
    update_data = {
        'title': 'To be deleted (Edited)',
        'frequency_days': 14
    }
    res = requests.put(f'{BASE_URL}/recurring-tasks/{task_id}', json=update_data, headers=headers)
    if res.status_code == 200:
        updated_task = res.json()
        if updated_task['title'] == 'To be deleted (Edited)' and updated_task['frequency_days'] == 14:
            print("Task updated successfully.")
        else:
            print(f"Update verification failed: {updated_task}")
    else:
        print(f"Failed to update task: {res.text}")

    # 4. Delete Task
    print(f"\nDeleting task {task_id}...")
    res = requests.delete(f'{BASE_URL}/recurring-tasks/{task_id}', headers=headers)
    if res.status_code == 200:
        print("Task deleted successfully.")
    else:
        print(f"Failed to delete task: {res.text}")

    # 5. Verify Deletion
    print("\nVerifying deletion...")
    res = requests.get(f'{BASE_URL}/recurring-tasks', headers=headers)
    tasks = res.json()
    found = any(t['id'] == task_id for t in tasks)
    if not found:
        print("SUCCESS: Task no longer exists.")
    else:
        print("FAILURE: Task still exists.")

if __name__ == '__main__':
    test_crud_flow()
