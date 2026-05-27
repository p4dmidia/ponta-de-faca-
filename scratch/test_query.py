from supabase import create_client, Client

url = "https://eqlqxitphaqvviazkrvi.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxbHF4aXRwaGFxdnZpYXprcnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTMwMTUsImV4cCI6MjA5NTQyOTAxNX0.NkbQKeNUhUGnh1u7cb3opAYpf4Nh6NR3KFFWxBpOocs"

supabase: Client = create_client(url, key)

tables = ["products", "orders", "affiliates", "companies", "waiting_list", "user_profiles", "user_settings"]
for t in tables:
    try:
        res = supabase.table(t).select("count", count="exact").limit(1).execute()
        print(f"Table {t} count: {res.count}")
    except Exception as e:
        print(f"Table {t} failed: {e}")
