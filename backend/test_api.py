import requests
import json

BASE_URL = 'http://localhost:5000'

def run_test():
    print("--- Starting API Verification ---")

    # 1. Login as Tenant
    print("\n1. Logging in as Tenant...")
    res = requests.post(f'{BASE_URL}/auth/login', json={'role': 'tenant'})
    if res.status_code != 200:
        print("FAILED: Tenant Login")
        return
    tenant_token = res.json()['token']
    print("SUCCESS: Tenant Logged In")

    # 2. Create Ticket
    print("\n2. Creating Ticket...")
    ticket_data = {
        'type': 'Plumbing',
        'priority': 'High',
        'description': 'Test Leak',
        'anonymous': False
    }
    res = requests.post(f'{BASE_URL}/tickets', json=ticket_data, headers={'Authorization': f'Bearer {tenant_token}'})
    if res.status_code != 201:
        print("FAILED: Create Ticket")
        print(res.text)
        return
    ticket_id = res.json()['id']
    print(f"SUCCESS: Ticket Created (ID: {ticket_id})")

    # 3. Login as GM
    print("\n3. Logging in as GM...")
    res = requests.post(f'{BASE_URL}/auth/login', json={'role': 'gm'})
    gm_token = res.json()['token']
    print("SUCCESS: GM Logged In")

    # 4. Assign Ticket
    print("\n4. Assigning Ticket to Maintenance...")
    res = requests.put(f'{BASE_URL}/tickets/{ticket_id}/action', 
                       json={'action': 'assign', 'department': 'Maintenance'},
                       headers={'Authorization': f'Bearer {gm_token}'})
    if res.status_code != 200:
        print("FAILED: Assign Ticket")
        print(res.json())
        return
    print("SUCCESS: Ticket Assigned")

    # 5. Login as Maintenance Dept
    print("\n5. Logging in as Maintenance Dept...")
    res = requests.post(f'{BASE_URL}/auth/login', json={'role': 'dept', 'department': 'Maintenance'})
    dept_token = res.json()['token']
    print("SUCCESS: Dept Logged In")

    # 6. Accept Ticket
    print("\n6. Accepting Ticket...")
    res = requests.put(f'{BASE_URL}/tickets/{ticket_id}/action', 
                       json={'action': 'accept', 'estimated_fix_time': '1 hour'},
                       headers={'Authorization': f'Bearer {dept_token}'})
    if res.status_code != 200:
        print("FAILED: Accept Ticket")
        return
    print("SUCCESS: Ticket Accepted")

    # 7. Resolve Ticket
    print("\n7. Resolving Ticket...")
    res = requests.put(f'{BASE_URL}/tickets/{ticket_id}/action', 
                       json={'action': 'resolve', 'proof_url': 'http://proof.com/img.jpg'},
                       headers={'Authorization': f'Bearer {dept_token}'})
    if res.status_code != 200:
        print("FAILED: Resolve Ticket")
        return
    print("SUCCESS: Ticket Resolved")

    print("\n--- Verification Complete: ALL TESTS PASSED ---")

if __name__ == '__main__':
    try:
        run_test()
    except Exception as e:
        print(f"ERROR: {e}")
