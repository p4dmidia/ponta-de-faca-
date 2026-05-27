from supabase import create_client, Client

url = "https://eqlqxitphaqvviazkrvi.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxbHF4aXRwaGFxdnZpYXprcnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTMwMTUsImV4cCI6MjA5NTQyOTAxNX0.NkbQKeNUhUGnh1u7cb3opAYpf4Nh6NR3KFFWxBpOocs"

supabase: Client = create_client(url, key)

email = "admin@pontadefaca.com.br"
password = "admin123"

print(f"Tentando cadastrar {email}...")

try:
    res = supabase.auth.sign_up({
        "email": email,
        "password": password,
        "options": {
            "data": {
                "nome": "Administrador",
                "sobrenome": "Mestre",
                "role": "admin_master",
                "registration_type": "individual",
                "cpf": "99999999999"
            }
        }
    })
    print("Sucesso!")
    print(res)
except Exception as e:
    print(f"Erro: {e}")
