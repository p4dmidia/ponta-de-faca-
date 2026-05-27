from supabase import create_client, Client
import json

url = "https://eqlqxitphaqvviazkrvi.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxbHF4aXRwaGFxdnZpYXprcnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTMwMTUsImV4cCI6MjA5NTQyOTAxNX0.NkbQKeNUhUGnh1u7cb3opAYpf4Nh6NR3KFFWxBpOocs"

supabase: Client = create_client(url, key)

try:
    # Fazer login como admin
    session = supabase.auth.sign_in_with_password({
        "email": "admin@pontadefaca.com.br",
        "password": "admin123"
    })
    print("Autenticado como admin.")
    
    # Listar todos os perfis
    profs = supabase.table("user_profiles").select("id, email, full_name, cpf, cnpj, role, created_at").execute()
    print("\n--- ALL USER PROFILES ---")
    for p in profs.data:
        print(f"ID: {p['id']}, Email: {p['email']}, Role: {p['role']}, CPF: {p['cpf']}, CNPJ: {p['cnpj']}, Name: {p['full_name']}")
        
    # Listar todos os afiliados
    affs = supabase.table("affiliates").select("id, user_id, email, full_name, cpf, cnpj, referral_code, created_at").execute()
    print("\n--- ALL AFFILIATES ---")
    for a in affs.data:
        print(f"ID: {a['id']}, UserID: {a['user_id']}, Email: {a['email']}, Code: {a['referral_code']}, CPF: {a['cpf']}, CNPJ: {a['cnpj']}, Name: {a['full_name']}")

except Exception as e:
    print("Erro:", e)
