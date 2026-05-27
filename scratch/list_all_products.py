import urllib.request
import json

def main():
    env_vars = {}
    with open('.env.local', 'r', encoding='utf-8') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                k, v = line.strip().split('=', 1)
                env_vars[k.strip()] = v.strip().strip('"').strip("'")
                
    supabase_url = env_vars.get('VITE_SUPABASE_URL')
    key = env_vars.get('VITE_SUPABASE_ANON_KEY')

    # Fetch Categories
    cat_url = f"{supabase_url}/rest/v1/product_categories?select=id,name"
    req = urllib.request.Request(cat_url)
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    categories = {}
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            for c in data:
                categories[c['id']] = c['name']
    except Exception as e:
        print("Error fetching categories:", e)

    # Fetch Products
    prod_url = f"{supabase_url}/rest/v1/products?select=id,name,price,category_id,is_active&limit=200"
    req = urllib.request.Request(prod_url)
    req.add_header("apikey", key)
    req.add_header("Authorization", f"Bearer {key}")
    
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print("=== ALL PRODUCTS ===")
            for p in data:
                cat_name = categories.get(p['category_id'], str(p['category_id']))
                print(f"ID: {p['id']} | Name: {p['name']} | Price: {p['price']} | Cat: {cat_name} | Active: {p['is_active']}")
    except Exception as e:
        print("Error fetching products:", e)

if __name__ == '__main__':
    main()
