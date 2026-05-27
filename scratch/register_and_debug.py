import random
import string
from supabase import create_client, Client

url = "https://eqlqxitphaqvviazkrvi.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxbHF4aXRwaGFxdnZpYXprcnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTMwMTUsImV4cCI6MjA5NTQyOTAxNX0.NkbQKeNUhUGnh1u7cb3opAYpf4Nh6NR3KFFWxBpOocs"

supabase: Client = create_client(url, key)

def get_random_string(length):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

# Gerar dados do teste
rand_id = get_random_string(8)
email = f"test_{rand_id}@test.com"
password = "TestPassword123!"
nome = f"Test User {rand_id}"
cpf = f"11122233{random.randint(100, 999)}"

print(f"Registrando usuario de teste:")
print(f"Email: {email}")
print(f"CPF: {cpf}")

try:
    # 1. Chamar o signUp
    res = supabase.auth.sign_up({
        "email": email,
        "password": password,
        "options": {
            "data": {
                "nome": nome,
                "sobrenome": "SobrenomeTest",
                "login": f"test_{rand_id}",
                "registration_type": "individual",
                "role": "affiliate",
                "organization_id": "5111af72-27a5-41fd-8ed9-8c51b78b4fdd",
                "cpf": cpf,
                "whatsapp": "(31) 98888-7777"
            }
        }
    })
    
    if not res.user:
        print("Erro: signUp retornou response sem usuario.")
        sys.exit(1)
        
    user_id = res.user.id
    print(f"Usuario criado no Auth com ID: {user_id}")
    
    # 2. Fazer login como admin para inspecionar os registros criados (para contornar RLS)
    admin_session = supabase.auth.sign_in_with_password({
        "email": "admin@pontadefaca.com.br",
        "password": "admin123"
    })
    print("Autenticado como admin para inspecionar tabelas.")
    
    # 3. Verificar user_profiles
    prof_res = supabase.table("user_profiles").select("*").eq("id", user_id).execute()
    if prof_res.data:
        print("UserProfile criado: SIM", prof_res.data[0])
    else:
        print("UserProfile criado: NAO")
        
    # 4. Verificar affiliates
    aff_res = supabase.table("affiliates").select("*").eq("user_id", user_id).execute()
    if aff_res.data:
        print("Affiliate criado: SIM", aff_res.data[0])
    else:
        print("Affiliate criado: NAO")
        
    # 5. Verificar user_settings
    set_res = supabase.table("user_settings").select("*").eq("user_id", user_id).execute()
    if set_res.data:
        print("UserSettings criado: SIM", set_res.data[0])
    else:
        print("UserSettings criado: NAO")
        
    # 6. Verificar debug_logs se algo falhou
    if not prof_res.data or not aff_res.data or not set_res.data:
        logs_res = supabase.table("debug_logs").select("*").execute()
        print("\n--- DEBUG LOGS NA BASE ---")
        print(logs_res.data)

except Exception as e:
    print("Erro durante teste:", e)
