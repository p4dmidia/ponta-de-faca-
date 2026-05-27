import json

with open("actual_schema.json", "r", encoding="utf-16") as f:
    schema = json.load(f)

definitions = schema.get("definitions", {})

for name in ["user_profiles", "affiliates", "user_settings"]:
    if name in definitions:
        print(f"--- Definition: {name} ---")
        props = definitions[name].get("properties", {})
        required = definitions[name].get("required", [])
        print("Required fields:", required)
        for prop_name, prop_val in props.items():
            prop_type = prop_val.get("type")
            format_val = prop_val.get("format")
            desc = prop_val.get("description", "")
            print(f"  Field: {prop_name} | Type: {prop_type} | Format: {format_val} | Desc: {desc}")
