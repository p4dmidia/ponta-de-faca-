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
    
    emails = ["paca@gmail.com", "test_591c169f@test.com", "pig@gmail.com", "hexa@gmail.com", "bino@gmail.com"]
    
    for email in emails:
        print(f"\n==================== USER: {email} ====================")
        
        # Query user_profiles
        prof_res = supabase.table("user_profiles").select("*").eq("email", email).execute()
        if prof_res.data:
            print("USER PROFILE:")
            print(json.dumps(prof_res.data[0], indent=2))
        else:
            print("USER PROFILE: NOT FOUND")
            
        # Query affiliates
        aff_res = supabase.table("affiliates").select("*").eq("email", email).execute()
        if aff_res.data:
            print("AFFILIATE:")
            # Remove potentially long/binary fields if any
            aff_data = aff_res.data[0]
            print(json.dumps(aff_data, indent=2))
        else:
            print("AFFILIATE: NOT FOUND")

except Exception as e:
    print("Erro:", e)
