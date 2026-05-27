import os

for f in os.listdir("."):
    if f.endswith(".sql"):
        try:
            with open(f, 'r', encoding='utf-8') as file:
                content = file.read()
            if 'bank_name' in content:
                print(f"Found 'bank_name' in {f}")
        except Exception as e:
            try:
                with open(f, 'r', encoding='utf-16') as file:
                    content = file.read()
                if 'bank_name' in content:
                    print(f"Found 'bank_name' in {f}")
            except Exception as e2:
                print(f"Failed to read {f}: {e2}")
