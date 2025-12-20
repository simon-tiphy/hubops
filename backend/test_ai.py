import requests
import json

def test_hubai_advanced():
    # Login as GM to get token
    login_url = 'http://localhost:5000/auth/login'
    login_data = {'role': 'gm'}
    
    try:
        session = requests.Session()
        res = session.post(login_url, json=login_data)
        if res.status_code != 200:
            print("Login failed")
            print(res.text)
            return
            
        token = res.json()['token']
        headers = {'Authorization': f'Bearer {token}'}
        
        # Test Queries
        # Note: These IDs may not exist if DB is fresh, but we test the logic path.
        queries = [
            "Show me ticket #1",
            "Search for tickets about 'leak'",
            "What are the recent tickets?",
            "How many open tickets?" 
        ]
        
        for q in queries:
            print(f"\nQUERY: {q}")
            ai_res = session.post(
                'http://localhost:5000/ai/query', 
                json={'query': q},
                headers=headers
            )
            print(f"STATUS: {ai_res.status_code}")
            answer = ai_res.json().get('answer')
            print(f"ANSWER: {answer[:100]}..." if answer else "ANSWER: None")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_hubai_advanced()
