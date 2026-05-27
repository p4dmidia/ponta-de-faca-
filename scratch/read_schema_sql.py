import re

def search_in_file(filename):
    # Try different encodings
    for encoding in ['utf-8', 'utf-16', 'utf-8-sig', 'latin-1']:
        try:
            with open(filename, 'r', encoding=encoding) as f:
                content = f.read()
            print(f"Success reading with {encoding}")
            # Search for CREATE TABLE user_settings
            match = re.search(r'CREATE TABLE\s+(?:public\.)?user_settings\s*\((.*?)\);', content, re.DOTALL | re.IGNORECASE)
            if match:
                print("Found table user_settings definition:")
                print(match.group(0))
            else:
                print("Could not find table user_settings definition with regex.")
                # Print a few lines containing user_settings
                lines = content.split('\n')
                count = 0
                for idx, line in enumerate(lines):
                    if 'user_settings' in line:
                        print(f"Line {idx+1}: {line}")
                        count += 1
                        if count > 20:
                            break
            return
        except UnicodeDecodeError:
            continue
        except Exception as e:
            print("Error:", e)
            return

search_in_file("supabase_complete_schema.sql")
