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
    print("Login realizado com sucesso! ID:", session.user.id)
    
    # Agora que estamos autenticados, vamos fazer a query
    res = supabase.table("user_profiles").select("*").execute()
    print("User Profiles:")
    print(res.data)
    
    res_aff = supabase.table("affiliates").select("*").execute()
    print("\nAffiliates:")
    print(res_aff.data)
except Exception as e:
    print(f"Erro: {e}")
