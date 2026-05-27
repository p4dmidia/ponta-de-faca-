from supabase import create_client, Client

url = "https://eqlqxitphaqvviazkrvi.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxbHF4aXRwaGFxdnZpYXprcnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTMwMTUsImV4cCI6MjA5NTQyOTAxNX0.NkbQKeNUhUGnh1u7cb3opAYpf4Nh6NR3KFFWxBpOocs"

supabase: Client = create_client(url, key)

email = "admin@pontadefaca.com.br"

print(f"Buscando perfil para {email}...")

try:
    res = supabase.table("user_profiles").select("*").eq("email", email).execute()
    print("Resultado de user_profiles:")
    print(res.data)
    
    # Também vamos ver se foi inserido em affiliates se for o caso
    res_aff = supabase.table("affiliates").select("*").eq("email", email).execute()
    print("\nResultado de affiliates:")
    print(res_aff.data)
except Exception as e:
    print(f"Erro: {e}")
