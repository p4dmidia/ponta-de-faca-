import sys
from supabase import create_client, Client

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
    
    # Buscar logs
    res = supabase.table("debug_logs").select("*").order("created_at", desc=True).limit(50).execute()
    if res.data:
        print(f"Total de {len(res.data)} logs encontrados:")
        for log in res.data:
            print(f"[{log.get('created_at')}] Operacao: {log.get('operation')}")
            print(f"  Mensagem: {log.get('message')}")
            print(f"  Metadados: {log.get('metadata')}")
    else:
        print("Nenhum log encontrado.")
except Exception as e:
    print("Erro:", e)
