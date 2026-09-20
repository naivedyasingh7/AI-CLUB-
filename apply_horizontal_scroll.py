import os
import re

input_file = r"c:\Users\ASUS\Desktop\fnal\index.html"

with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the old styling and members section
pattern = re.compile(r'<style>\s*\.members\s*\{.*?</section>', re.DOTALL)
content = re.sub(pattern, '', content)

# 2. Prepare the new members section
new_members_html = """
<style>
.members-gallery-container {
    position: relative;
    width: 100%;
    height: 100vh;
    background: #050505;
    overflow: hidden;
}
.members-gallery-pin {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
}
.member-slide {
    position: absolute;
    top: 0; left: 0;
    width: 100%;
    height: 100%;
    will-change: transform;
}
.member-slide-inner {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transform-origin: center center;
    will-change: transform, opacity;
}
.member-photo-large {
    width: 400px;
    height: 400px;
    border-radius: 20px;
    background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
    border: 1px solid rgba(255,255,255,0.1);
    box-shadow: 0 20px 50px rgba(0,0,0,0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 150px;
    font-weight: 900;
    color: rgba(255,255,255,0.2);
    margin-bottom: 40px;
    position: relative;
    overflow: hidden;
}
.member-photo-large::after {
    content: '';
    position: absolute;
    top: 0; left: -100%;
    width: 50%; height: 100%;
    background: linear-gradient(to right, transparent, rgba(255,255,255,0.05), transparent);
    transform: skewX(-20deg);
}
.member-info-large {
    text-align: center;
}
.member-name-large {
    font-size: 48px;
    font-weight: 900;
    color: #fff;
    margin-bottom: 10px;
    letter-spacing: 2px;
}
.member-role-large {
    font-size: 20px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 4px;
    font-weight: 600;
}
.layout-head-overlay {
    position: absolute;
    top: 100px;
    left: 100px;
    z-index: 10;
}
</style>

<section class="members-gallery-container" data-layout="04">
    <div class="layout-head layout-head-overlay">
        <span>Members</span>
        <span>04</span>
    </div>
    
    <div class="members-gallery-pin">
        <!-- Member 1 -->
        <div class="member-slide">
            <div class="member-slide-inner">
                <div class="member-photo-large">A</div>
                <div class="member-info-large">
                    <div class="member-name-large">Alex Mercer</div>
                    <div class="member-role-large">Deep Learning Lead</div>
                </div>
            </div>
        </div>
        
        <!-- Member 2 -->
        <div class="member-slide">
            <div class="member-slide-inner">
                <div class="member-photo-large">S</div>
                <div class="member-info-large">
                    <div class="member-name-large">Samira Jones</div>
                    <div class="member-role-large">Computer Vision</div>
                </div>
            </div>
        </div>
        
        <!-- Member 3 -->
        <div class="member-slide">
            <div class="member-slide-inner">
                <div class="member-photo-large">D</div>
                <div class="member-info-large">
                    <div class="member-name-large">David Chen</div>
                    <div class="member-role-large">Generative AI</div>
                </div>
            </div>
        </div>
        
        <!-- Member 4 -->
        <div class="member-slide">
            <div class="member-slide-inner">
                <div class="member-photo-large">E</div>
                <div class="member-info-large">
                    <div class="member-name-large">Elena Rostova</div>
                    <div class="member-role-large">NLP Researcher</div>
                </div>
            </div>
        </div>
    </div>
</section>
"""

# Insert it before the started section
content = content.replace('<section class="started">', new_members_html + '\n<section class="started">')

# 3. Add script at the bottom
script_tag = '<script defer src="/js/members-animation.js"></script>'
if script_tag not in content:
    content = content.replace('</body>', script_tag + '\n    </body>')

with open(input_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated index.html with cinematic members section.")
