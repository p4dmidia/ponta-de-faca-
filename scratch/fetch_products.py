import urllib.request
import json
import os

def main():
    env_vars = {}
    with open('.env.local', 'r', encoding='utf-8') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                k, v = line.strip().split('=', 1)
                env_vars[k.strip()] = v.strip().strip('"').strip("'")
                
    supabase_url = env_vars.get('VITE_SUPABASE_URL')
    key = env_vars.get('VITE_SUPABASE_ANON_KEY')

    url = f"{supabase_url}/rest/v1/products?select=id,name,price,category_id,is_active&limit=100"
    req = urllib.request.Request(url)
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print("=== ACTIVE PRODUCTS ===")
            for p in data:
                if p['is_active']:
                    print(f"ID: {p['id']} | Name: {p['name']} | Price: {p['price']} | Cat: {p['category_id']}")
    except Exception as e:
        print("Error fetching products:", e)

if __name__ == '__main__':
    main()
