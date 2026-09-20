import os
import re

# Paths to the cached markdown files (as seen in the responses)
files = {
    'index.html': r"C:\Users\ASUS\.gemini\antigravity-ide\brain\3bd035df-2149-472c-9c21-49ba1e3882eb\.system_generated\steps\320\content.md",
    'public/css/libs.min.css': r"C:\Users\ASUS\.gemini\antigravity-ide\brain\3bd035df-2149-472c-9c21-49ba1e3882eb\.system_generated\steps\361\content.md",
    'public/css/main.min.css': r"C:\Users\ASUS\.gemini\antigravity-ide\brain\3bd035df-2149-472c-9c21-49ba1e3882eb\.system_generated\steps\364\content.md",
    'public/js/libs.min.js': r"C:\Users\ASUS\.gemini\antigravity-ide\brain\3bd035df-2149-472c-9c21-49ba1e3882eb\.system_generated\steps\367\content.md",
    'public/js/animate.js': r"C:\Users\ASUS\.gemini\antigravity-ide\brain\3bd035df-2149-472c-9c21-49ba1e3882eb\.system_generated\steps\370\content.md",
    'public/js/main.min.js': r"C:\Users\ASUS\.gemini\antigravity-ide\brain\3bd035df-2149-472c-9c21-49ba1e3882eb\.system_generated\steps\373\content.md",
}

def extract_content(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    # The content is below the first '---' line
    parts = content.split('---', 1)
    if len(parts) > 1:
        return parts[1].strip()
    return content.strip()

base_dir = r"c:\Users\ASUS\Desktop\fnal"

os.makedirs(os.path.join(base_dir, 'public', 'css'), exist_ok=True)
os.makedirs(os.path.join(base_dir, 'public', 'js'), exist_ok=True)

for rel_path, cached_path in files.items():
    if not os.path.exists(cached_path):
        print(f"Missing {cached_path}")
        continue
        
    content = extract_content(cached_path)
    
    # Replace relative paths with absolute original site paths so assets load seamlessly
    if rel_path.endswith('.html'):
        # Fix image and video paths
        content = content.replace('"/img/', '"https://hackfirst.io/img/')
        content = content.replace('"/video/', '"https://hackfirst.io/video/')
        # Since it's vite, local css/js should point to /css/ or /js/
        # But we also have ?cb=... we can keep it
        # Also remove the module script so vite doesn't inject React app
        content = re.sub(r'<script type="module" src="/src/main.jsx"></script>', '', content)
    
    elif rel_path.endswith('.css'):
        content = content.replace('../fonts/', 'https://hackfirst.io/fonts/')
        content = content.replace('../img/', 'https://hackfirst.io/img/')
        
    elif rel_path.endswith('.js'):
        content = content.replace('"/video/', '"https://hackfirst.io/video/')
        content = content.replace('"/img/', '"https://hackfirst.io/img/')
        # In main.min.js there are data-src and src adjustments
        
    out_path = os.path.join(base_dir, rel_path)
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Wrote {out_path}")

print("Done building exact clone!")
