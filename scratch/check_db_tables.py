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
    
    # 1. Buscar organizações
    orgs = supabase.table("organizations").select("*").execute()
    print("\n--- ORGANIZAÇÕES ---")
    for org in orgs.data:
        print(f"ID: {org['id']}, Nome: {org['name']}")
        
    # 2. Buscar últimos afiliados criados
    affs = supabase.table("affiliates").select("*").order("created_at", desc=True).limit(5).execute()
    print("\n--- ÚLTIMOS AFILIADOS ---")
    for aff in affs.data:
        print(f"ID: {aff['id']}, UserID: {aff['user_id']}, Email: {aff['email']}, OrgID: {aff['organization_id']}, SponsorID: {aff['sponsor_id']}")
        
    # 3. Buscar últimos perfis criados
    profs = supabase.table("user_profiles").select("*").order("created_at", desc=True).limit(5).execute()
    print("\n--- ÚLTIMOS PERFIS ---")
    for prof in profs.data:
        print(f"ID: {prof['id']}, Email: {prof['email']}, OrgID: {prof['organization_id']}")

except Exception as e:
    print("Erro:", e)
