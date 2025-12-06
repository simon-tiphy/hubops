import requests
import json

BASE_URL = 'http://localhost:5000'

def test_staff_assignment_flow():
    # 1. Login as Tenant and Create Ticket
    print("Logging in as Tenant...")
    res = requests.post(f'{BASE_URL}/auth/login', json={'role': 'tenant'})
    tenant_token = res.json()['token']
    tenant_headers = {'Authorization': f'Bearer {tenant_token}'}
    
    print("Creating ticket for Maintenance...")
    new_ticket = {
        'type': 'Maintenance',
        'priority': 'Medium',
        'description': 'Leaky faucet in restroom',
        'anonymous': False
    }
    res = requests.post(f'{BASE_URL}/tickets', json=new_ticket, headers=tenant_headers)
    ticket_id = res.json()['id']
    print(f"Ticket created with ID: {ticket_id}")

    # 2. Login as Maintenance Head
    print("\nLogging in as Maintenance Head...")
    res = requests.post(f'{BASE_URL}/auth/login', json={'role': 'dept', 'department': 'Maintenance'})
    head_token = res.json()['token']
    head_headers = {'Authorization': f'Bearer {head_token}'}
    
    # 3. Get Staff List
    print("Fetching staff list...")
    dept_id = res.json()['user']['department_id']
    res = requests.get(f'{BASE_URL}/departments/{dept_id}/staff', headers=head_headers)
    staff_list = res.json()
    if not staff_list:
        print("No staff found!")
        return
    staff_id = staff_list[0]['id']
    print(f"Found staff member: {staff_list[0]['username']} (ID: {staff_id})")

    # 4. Assign Ticket to Staff
    print(f"Assigning ticket {ticket_id} to staff {staff_id}...")
    res = requests.put(
        f'{BASE_URL}/tickets/{ticket_id}/action',
        json={'action': 'assign_staff', 'staff_id': staff_id},
        headers=head_headers
    )
    if res.status_code == 200:
        print("Ticket assigned successfully.")
    else:
        print(f"Failed to assign ticket: {res.text}")

    # 5. Login as Staff
    print("\nLogging in as Maintenance Staff...")
    res = requests.post(f'{BASE_URL}/auth/login', json={'role': 'staff', 'department': 'Maintenance'})
    staff_token = res.json()['token']
    staff_headers = {'Authorization': f'Bearer {staff_token}'}

    # 6. Accept Ticket
    print(f"Accepting ticket {ticket_id}...")
    res = requests.put(
        f'{BASE_URL}/tickets/{ticket_id}/action',
        json={'action': 'staff_accept'},
        headers=staff_headers
    )
    if res.status_code == 200:
        print("Ticket accepted successfully.")
    else:
        print(f"Failed to accept ticket: {res.text}")

    # 7. Verify Status
    print("\nVerifying ticket status...")
    res = requests.get(f'{BASE_URL}/tickets', headers=head_headers)
    tickets = res.json()
    ticket = next((t for t in tickets if t['id'] == ticket_id), None)
    
    if ticket:
        print(f"Ticket Status: {ticket['status']}")
        print(f"Staff Status: {ticket['staff_status']}")
        if ticket['status'] == 'In Progress' and ticket['staff_status'] == 'Accepted':
            print("SUCCESS: Full flow verified.")
        else:
            print("FAILURE: Status mismatch.")
    else:
        print("FAILURE: Ticket not found.")

if __name__ == '__main__':
    test_staff_assignment_flow()
