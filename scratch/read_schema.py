import json

try:
    with open('actual_schema_utf8.json', 'r', encoding='utf-16') as f:
        data = json.load(f)
        
    definitions = data.get('definitions', {})
    for def_name in ['user_settings', 'company_purchases', 'orders']:
        if def_name in definitions:
            properties = definitions[def_name].get('properties', {})
            print(f"\nProperties of '{def_name}':", sorted(list(properties.keys())))
except Exception as e:
    print("Error:", e)
