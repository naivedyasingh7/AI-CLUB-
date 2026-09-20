import os

input_file = r"c:\Users\ASUS\Desktop\fnal\index.html"

with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    # Fix videos
    'src="/video/': 'src="https://hackfirst.io/video/',
    'data-src="/video/': 'data-src="https://hackfirst.io/video/',
    'data-video="video/': 'data-video="https://hackfirst.io/video/',
    
    # Fix award images
    'src="/img/awards-': 'src="https://hackfirst.io/img/awards-',
    
    # Replace logos with AI CLUB text
    '<img src="/img/svg/logo-new.svg" alt="">': '<div style="font-size: 24px; font-weight: 900; color: white; display: inline-block; font-family: sans-serif;">AI CLUB</div>',
    '<img src="/img/svg/logo-new.svg" alt="" class="menu-logo">': '<div class="menu-logo" style="font-size: 24px; font-weight: 900; color: white; display: inline-block; font-family: sans-serif;">AI CLUB</div>',
    '<img src="/img/svg/logo-black-new.svg" alt="" animate-blur-el loading="lazy">': '<div animate-blur-el style="font-size: 80px; font-weight: 900; color: black; display: inline-block; font-family: sans-serif; margin: 40px 0;">AI CLUB</div>',
    '<img src="/img/svg/logo-new.svg" alt="" class="footer-logo" loading="lazy">': '<div class="footer-logo" style="font-size: 36px; font-weight: 900; color: white; display: inline-block; font-family: sans-serif;">AI CLUB</div>'
}

for old_text, new_text in replacements.items():
    content = content.replace(old_text, new_text)

with open(input_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updates complete.")
