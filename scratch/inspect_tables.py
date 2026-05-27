import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local')

url = os.environ.get('VITE_SUPABASE_URL')
key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

if not url or not key:
    print("Supabase credentials not found in .env.local")
    sys.exit(1)

supabase: Client = create_client(url, key)

print("--- Inspecting companies table ---")
try:
    res = supabase.table('companies').select('*').limit(1).execute()
    if res.data:
        print("Columns in 'companies':", list(res.data[0].keys()))
        print("Sample data:", res.data[0])
    else:
        print("Table 'companies' is empty.")
except Exception as e:
    print("Error querying 'companies':", e)

print("\n--- Listing all public tables ---")
try:
    # Since we can't run arbitrary SQL easily without a custom RPC, let's try querying standard tables
    # or query some guessed table names to see if they exist.
    possible_tables = [
        'companies', 'company_cashiers', 'company_purchases', 'orders', 'order_items', 
        'products', 'product_categories', 'waiting_list', 'stock_alerts', 
        'replenishments', 'replenishment_requests', 'pdv_stock', 'stock_replenishments'
    ]
    for table in possible_tables:
        try:
            res = supabase.table(table).select('count', count='exact').limit(0).execute()
            print(f"Table '{table}' exists (row count: {res.count})")
        except Exception as e:
            if "relation" in str(e) and "does not exist" in str(e):
                # Table does not exist
                pass
            else:
                print(f"Table '{table}' query error: {e}")
except Exception as e:
    print("Error listing tables:", e)
