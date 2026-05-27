from supabase import create_client, Client

url = "https://eqlqxitphaqvviazkrvi.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxbHF4aXRwaGFxdnZpYXprcnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTMwMTUsImV4cCI6MjA5NTQyOTAxNX0.NkbQKeNUhUGnh1u7cb3opAYpf4Nh6NR3KFFWxBpOocs"

supabase: Client = create_client(url, key)

try:
    print("Tentando fazer login...")
    session = supabase.auth.sign_in_with_password({
        "email": "admin@pontadefaca.com.br",
        "password": "admin123"
    })
    print("Login OK.")
    
    # We can try to query pg_policies using custom REST queries if it's exposed, but it's likely not.
    # So let's check if the trigger function was updated, and let's check why registration is failing.
    # Wait, in the database, is the handle_new_affiliate_user function raising an error?
    # Let's inspect the last log in debug_logs. If we register a user now, does it log an error?
    # Let's write a script that signs up a new test user via python, and see if it fails.
    import uuid
    email = f"test_{uuid.uuid4().hex[:8]}@test.com"
    print(f"Cadastrando novo usuario de teste: {email}...")
    res = supabase.auth.sign_up({
        "email": email,
        "password": "Password123!",
        "options": {
            "data": {
                "nome": "Test",
                "sobrenome": "User",
                "role": "affiliate",
                "registration_type": "individual",
                "cpf": f"111222333{uuid.uuid4().hex[:2]}"
            }
        }
    })
    print("Sign up result:", res.user.id if res.user else "No user")
    
    # Let's check debug_logs again
    res_logs = supabase.table("debug_logs").select("*").execute()
    print("Debug Logs after signup:", res_logs.data)
    
except Exception as e:
    print(f"Erro: {e}")
