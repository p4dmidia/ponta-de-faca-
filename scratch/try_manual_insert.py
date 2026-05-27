from supabase import create_client, Client

url = "https://eqlqxitphaqvviazkrvi.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxbHF4aXRwaGFxdnZpYXprcnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTMwMTUsImV4cCI6MjA5NTQyOTAxNX0.NkbQKeNUhUGnh1u7cb3opAYpf4Nh6NR3KFFWxBpOocs"

supabase: Client = create_client(url, key)

user_id = "ee77ea54-52c2-4b9b-b420-eeaa3a26fcbe"

try:
    # Tenta inserir diretamente
    res = supabase.table("user_profiles").insert({
        "id": user_id,
        "email": "admin@pontadefaca.com.br",
        "role": "admin_master",
        "full_name": "Administrador Mestre",
        "login": "admin",
        "organization_id": "5111af72-27a5-41fd-8ed9-8c51b78b4fdd",
        "cpf": "99999999999",
        "registration_type": "individual"
    }).execute()
    print("Sucesso!")
    print(res.data)
except Exception as e:
    print(f"Erro: {e}")
