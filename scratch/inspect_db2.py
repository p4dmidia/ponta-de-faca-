import os
from supabase import create_client, Client

url2 = "https://qbjzhcxwtpskrlbgjagc.supabase.co"
anon_key2 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFianpoY3h3dHBza3JsYmdqYWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMjEwNjIsImV4cCI6MjA5NDc5NzA2Mn0.NAwTalsBsLCHgv29a7TN-CM-_frxNrUu5IZU87D8Rno"

client = create_client(url2, anon_key2)

tables = ["organizations", "products", "orders", "affiliates", "companies", "waiting_list", "user_profiles"]
for t in tables:
    try:
        res = client.table(t).select("*", count="exact").limit(1).execute()
        print(f"Table {t} count: {res.count if hasattr(res, 'count') else len(res.data)}")
    except Exception as e:
        print(f"Table {t} failed: {e}")
