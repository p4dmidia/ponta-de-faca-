import os
from supabase import create_client, Client

url1 = "https://clnuievcdnbwqbyqhwys.supabase.co"
key1 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

client = create_client(url1, key1)

tables = ["products", "orders", "affiliates", "companies", "waiting_list", "user_profiles"]
for t in tables:
    try:
        res = client.table(t).select("count", count="exact").limit(1).execute()
        print(f"Table {t} count: {res.count}")
    except Exception as e:
        print(f"Table {t} failed: {e}")
