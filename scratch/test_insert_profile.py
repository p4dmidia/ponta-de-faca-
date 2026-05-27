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
    
    # Tentar inserir o perfil manualmente
    print("Tentando inserir perfil para pig@gmail.com (id: bfb73aab-5d63-4845-ac00-2d7af4f49b1f)...")
    res = supabase.table("user_profiles").insert({
        "id": "bfb73aab-5d63-4845-ac00-2d7af4f49b1f",
        "email": "pig@gmail.com",
        "role": "affiliate",
        "full_name": "pepa pig",
        "login": "pig",
        "whatsapp": "(31) 95544-7788",
        "cpf": None,
        "cnpj": None,
        "registration_type": "individual",
        "organization_id": "5111af72-27a5-41fd-8ed9-8c51b78b4fdd",
        "sponsor_id": None,
        "referrer_id": None,
        "status": "active",
        "rank": "Consultor"
    }).execute()
    print("Inserção bem-sucedida! Dados:", res.data)
except Exception as e:
    print("Erro durante inserção do perfil:")
    print(e)
