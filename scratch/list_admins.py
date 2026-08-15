from supabase import create_client, Client

url = "https://eqlqxitphaqvviazkrvi.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxbHF4aXRwaGFxdnZpYXprcnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTMwMTUsImV4cCI6MjA5NTQyOTAxNX0.NkbQKeNUhUGnh1u7cb3opAYpf4Nh6NR3KFFWxBpOocs"

supabase: Client = create_client(url, key)

try:
    res = supabase.table("user_profiles").select("id, email, role, full_name").limit(20).execute()
    print("Resultado:")
    for user in res.data:
        print(f"ID: {user['id']} | Email: {user['email']} | Role: {user['role']} | Name: {user['full_name']}")
except Exception as e:
    print(f"Erro: {e}")
