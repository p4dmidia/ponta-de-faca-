import json

with open("actual_schema.json", "r", encoding="utf-16") as f:
    schema = json.load(f)

# Find user_profiles and affiliates
print("Type of schema:", type(schema))
if isinstance(schema, dict):
    print("Keys of schema:", list(schema.keys())[:10])
    # Let's see if there is a 'tables' key
    if 'tables' in schema:
        print("Tables type:", type(schema['tables']))
elif isinstance(schema, list):
    print("Length of schema list:", len(schema))
    print("First element type:", type(schema[0]))
    if isinstance(schema[0], dict):
        print("First element keys:", schema[0].keys())

