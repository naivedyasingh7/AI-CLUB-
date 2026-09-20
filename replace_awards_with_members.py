import os

input_file = r"c:\Users\ASUS\Desktop\fnal\index.html"

with open(input_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Ensure we have the right slice
if not '<section class="awards" data-layout="04">\n' in lines[336]:
    print("Warning: Line 337 is not the start of the awards section. Searching for it...")
    start_idx = -1
    end_idx = -1
    for i, line in enumerate(lines):
        if '<section class="awards" data-layout="04">' in line:
            start_idx = i
        if start_idx != -1 and '</section>' in line and i > start_idx:
            end_idx = i
            break
else:
    start_idx = 336
    end_idx = 414 # index of line 415

members_section = """
<style>
.members {
    padding: 100px 0;
    position: relative;
    overflow: hidden;
}
.members-text {
    text-align: center;
    font-size: 24px;
    margin-bottom: 50px;
    color: rgba(255,255,255,0.7);
}
.members-scroll-container {
    display: flex;
    justify-content: center;
    gap: 30px;
    height: 60vh;
    max-height: 700px;
    overflow: hidden;
    position: relative;
    mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);
    -webkit-mask-image: linear-gradient(to bottom, transparent, black 10%, black 90%, transparent);
    padding: 0 20px;
}
.members-column {
    display: flex;
    flex-direction: column;
    gap: 30px;
    width: 280px;
}
.members-column.scroll-up {
    animation: scrollVerticalUp 30s linear infinite;
}
.members-column.scroll-down {
    animation: scrollVerticalDown 30s linear infinite;
}
.members-column:hover {
    animation-play-state: paused;
}
@keyframes scrollVerticalUp {
    0% { transform: translateY(0); }
    100% { transform: translateY(-50%); }
}
@keyframes scrollVerticalDown {
    0% { transform: translateY(-50%); }
    100% { transform: translateY(0); }
}
.member-card {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    padding: 30px 20px;
    border-radius: 12px;
    text-align: center;
    transition: background 0.3s, transform 0.3s, border-color 0.3s;
    backdrop-filter: blur(10px);
}
.member-card:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-5px);
}
.member-avatar {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    background: linear-gradient(135deg, #111, #333);
    border: 1px solid rgba(255,255,255,0.1);
    margin: 0 auto 20px auto;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    font-weight: 900;
    color: #fff;
    box-shadow: 0 10px 20px rgba(0,0,0,0.5);
}
.member-name {
    font-size: 20px;
    font-weight: bold;
    color: #fff;
    margin-bottom: 8px;
    letter-spacing: 0.5px;
}
.member-role {
    font-size: 13px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-weight: 600;
}
</style>

<section class="members" data-layout="04">
    <div class="layout-head">
        <span>Members</span>
        <span>04</span>
    </div>
    <p class="members-text" animate-blur-text>Meet the elite builders and researchers of AI Club</p>
    
    <div class="members-scroll-container">
        <!-- Column 1 (Up) -->
        <div class="members-column scroll-up">
            <!-- Set 1 -->
            <div class="member-card"><div class="member-avatar">A</div><div class="member-name">Alex Mercer</div><div class="member-role">Deep Learning Lead</div></div>
            <div class="member-card"><div class="member-avatar">S</div><div class="member-name">Samira Jones</div><div class="member-role">Computer Vision</div></div>
            <div class="member-card"><div class="member-avatar">D</div><div class="member-name">David Chen</div><div class="member-role">Generative AI</div></div>
            <div class="member-card"><div class="member-avatar">E</div><div class="member-name">Elena Rostova</div><div class="member-role">NLP Researcher</div></div>
            <!-- Set 2 (Duplicate for infinite scroll) -->
            <div class="member-card"><div class="member-avatar">A</div><div class="member-name">Alex Mercer</div><div class="member-role">Deep Learning Lead</div></div>
            <div class="member-card"><div class="member-avatar">S</div><div class="member-name">Samira Jones</div><div class="member-role">Computer Vision</div></div>
            <div class="member-card"><div class="member-avatar">D</div><div class="member-name">David Chen</div><div class="member-role">Generative AI</div></div>
            <div class="member-card"><div class="member-avatar">E</div><div class="member-name">Elena Rostova</div><div class="member-role">NLP Researcher</div></div>
        </div>
        
        <!-- Column 2 (Down) -->
        <div class="members-column scroll-down">
            <!-- Set 1 -->
            <div class="member-card"><div class="member-avatar">M</div><div class="member-name">Marcus Wright</div><div class="member-role">Data Engineer</div></div>
            <div class="member-card"><div class="member-avatar">C</div><div class="member-name">Chloe O'Brian</div><div class="member-role">UI/UX Designer</div></div>
            <div class="member-card"><div class="member-avatar">J</div><div class="member-name">James Holden</div><div class="member-role">Cloud Architect</div></div>
            <div class="member-card"><div class="member-avatar">N</div><div class="member-name">Naomi Nagata</div><div class="member-role">Systems Engineer</div></div>
            <!-- Set 2 (Duplicate for infinite scroll) -->
            <div class="member-card"><div class="member-avatar">M</div><div class="member-name">Marcus Wright</div><div class="member-role">Data Engineer</div></div>
            <div class="member-card"><div class="member-avatar">C</div><div class="member-name">Chloe O'Brian</div><div class="member-role">UI/UX Designer</div></div>
            <div class="member-card"><div class="member-avatar">J</div><div class="member-name">James Holden</div><div class="member-role">Cloud Architect</div></div>
            <div class="member-card"><div class="member-avatar">N</div><div class="member-name">Naomi Nagata</div><div class="member-role">Systems Engineer</div></div>
        </div>

        <!-- Column 3 (Up) -->
        <div class="members-column scroll-up">
            <!-- Set 1 -->
            <div class="member-card"><div class="member-avatar">L</div><div class="member-name">Lucas Vance</div><div class="member-role">AI Ethics Lead</div></div>
            <div class="member-card"><div class="member-avatar">M</div><div class="member-name">Maya Lin</div><div class="member-role">Robotics Engineer</div></div>
            <div class="member-card"><div class="member-avatar">O</div><div class="member-name">Omar Syed</div><div class="member-role">Quant Analyst</div></div>
            <div class="member-card"><div class="member-avatar">T</div><div class="member-name">Tara Maclay</div><div class="member-role">Security Ops</div></div>
            <!-- Set 2 (Duplicate for infinite scroll) -->
            <div class="member-card"><div class="member-avatar">L</div><div class="member-name">Lucas Vance</div><div class="member-role">AI Ethics Lead</div></div>
            <div class="member-card"><div class="member-avatar">M</div><div class="member-name">Maya Lin</div><div class="member-role">Robotics Engineer</div></div>
            <div class="member-card"><div class="member-avatar">O</div><div class="member-name">Omar Syed</div><div class="member-role">Quant Analyst</div></div>
            <div class="member-card"><div class="member-avatar">T</div><div class="member-name">Tara Maclay</div><div class="member-role">Security Ops</div></div>
        </div>
    </div>
    <div class="awards-separator">
        <span></span>
        <i></i>
        <span></span>
        <i></i>
        <span></span>
    </div>
</section>
"""

new_lines = lines[:start_idx] + [members_section] + lines[end_idx+1:]

with open(input_file, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Added members scrolling section successfully.")
