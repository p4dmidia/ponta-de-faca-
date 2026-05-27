import os
from supabase import create_client, Client

# DB 1 (Hardcoded in py files)
url1 = "https://clnuievcdnbwqbyqhwys.supabase.co"
key1 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbnVpZXZjZG5id3FieXFod3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjExNDkzMCwiZXhwIjoyMDg3NjkwOTMwfQ.2c3qA3jew8xedEzEA_BvXKQgS2BqC1fN5Y0PKb1JKbk"

# DB 2 (From .env.local - wait, we only have anon key in .env.local, let's see if we have service key or can use anon key)
url2 = "https://qbjzhcxwtpskrlbgjagc.supabase.co"
anon_key2 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFianpoY3h3dHBza3JsYmdqYWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMjEwNjIsImV4cCI6Mj9NDc5NzA2Mn0.NAwTalsBsLCHgv29a7TN-CM-_frxNrUu5IZU87D8Rno" # wait, the anon key in env has a typo or is truncated?
# Let's inspect the key from .env.local:
# VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFianpoY3h3dHBza3JsYmdqYWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMjEwNjIsImV4cCI6MjA5NDc5NzA2Mn0.NAwTalsBsLCHgv29a7TN-CM-_frxNrUu5IZU87D8Rno

anon_key2 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFianpoY3h3dHBza3JsYmdqYWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMjEwNjIsImV4cCI6MjA5NDc5NzA2Mn0.NAwTalsBsLCHgv29a7TN-CM-_frxNrUu5IZU87D8Rno"

print("Connecting to DB 1 (clnuievcdnbwqbyqhwys)...")
try:
    client1 = create_client(url1, key1)
    res1 = client1.table("organizations").select("id, name").execute()
    print("DB 1 orgs:", res1.data)
except Exception as e:
    print("DB 1 failed:", e)

print("\nConnecting to DB 2 (qbjzhcxwtpskrlbgjagc) with Anon Key...")
try:
    client2 = create_client(url2, anon_key2)
    res2 = client2.table("products").select("id, name").limit(5).execute()
    print("DB 2 products count/list:", len(res2.data), [p['name'] for p in res2.data])
except Exception as e:
    print("DB 2 failed:", e)
