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
    
    # Listar registros de companies
    res = supabase.table("companies").select("*").execute()
    print(f"\nTotal de {len(res.data)} PDVs encontrados:")
    for company in res.data:
        print(f"ID: {company.get('id')}")
        print(f"  Razao Social: {company.get('razao_social')}")
        print(f"  Nome Fantasia: {company.get('nome_fantasia')}")
        print(f"  CNPJ: {company.get('cnpj')}")
        print(f"  Responsavel: {company.get('responsavel')}")
        print(f"  Email: {company.get('email')}")
        print(f"  Senha Hash: {company.get('senha_hash')}")
        print(f"  Billing Model: {company.get('billing_model')}")

except Exception as e:
    print("Erro:", e)
