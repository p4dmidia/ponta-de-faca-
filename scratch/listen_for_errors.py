import time
from supabase import create_client, Client

url = "https://eqlqxitphaqvviazkrvi.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxbHF4aXRwaGFxdnZpYXprcnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTMwMTUsImV4cCI6MjA5NTQyOTAxNX0.NkbQKeNUhUGnh1u7cb3opAYpf4Nh6NR3KFFWxBpOocs"

supabase: Client = create_client(url, key)

print("Iniciando monitoramento de logs de erro...")
print("Por favor, execute o script SQL 'debug_trigger.sql' no console do Supabase e tente cadastrar um usuário no navegador.")

try:
    # Fazer login como admin
    session = supabase.auth.sign_in_with_password({
        "email": "admin@pontadefaca.com.br",
        "password": "admin123"
    })
    print("Autenticado como admin.")
    
    # Limpar logs anteriores
    supabase.table("debug_logs").delete().neq("id", 0).execute()
    print("Logs anteriores limpos. Aguardando novo log...")
    
    start_time = time.time()
    while time.time() - start_time < 120: # 2 minutos de timeout
        res = supabase.table("debug_logs").select("*").execute()
        if res.data:
            print("\n!!! ERRO DETECTADO !!!")
            for log in res.data:
                print(f"Operação: {log['operation']}")
                print(f"Mensagem: {log['message']}")
                print(f"Metadados: {log['metadata']}")
            break
        time.sleep(2)
    else:
        print("\nNenhum erro recebido no tempo limite.")
except Exception as e:
    print("Erro durante execução:", e)
