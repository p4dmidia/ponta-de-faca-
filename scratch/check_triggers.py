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
    
    # Vamos rodar uma query usando a tabela debug_logs ou outra se tivermos algum RPC, 
    # mas wait! We can run a query via RPC if we have one. Do we have admin_delete_user?
    # Yes, we have public.admin_delete_user(p_user_id uuid).
    # But that doesn't return anything.
    # Wait, can we execute a query? We don't have exec_sql RPC.
    # Let's see if we can query some views or systems.
    # In Supabase, the REST API only exposes tables/views that are in the 'public' schema (or other schemas exposed in settings).
    # Is pg_trigger exposed? Usually not.
    # Let's check if we can query any logs or see what else.
    print("Verificando logs de debug...")
    res = supabase.table("debug_logs").select("*").execute()
    print("Debug logs content:", res.data)
except Exception as e:
    print(f"Erro: {e}")
