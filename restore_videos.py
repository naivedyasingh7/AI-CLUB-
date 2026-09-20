import os
import re

input_file = r"c:\Users\ASUS\Desktop\fnal\index.html"

with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix loader source
loader_bad = """<video preload playsinline autoplay loop muted class="loader-bg">
        
    </video>"""
loader_good = """<video preload playsinline autoplay loop muted class="loader-bg">
        <source src="https://hackfirst.io/video/loader.mp4" type="video/mp4">
    </video>"""
content = content.replace(loader_bad, loader_good)

# 2. Fix hero video (we removed it before and added custom styles and divs)
hero_bad_pattern = re.compile(r'<section class="hero" style="[^"]*">.*?</style>\s*</section>', re.DOTALL)
hero_good = """<section class="hero">
    <video preload playsinline autoplay loop muted class="hero-bg">
        <source src="https://hackfirst.io/video/tornado-home.mp4" type="video/mp4">
    </video>
    <div class="hero-content">
        <span class="hero-label">TENURE 26-27</span>
        <h1 class="hero-title">AI CLUB<br>18 Community Groups:<br>Event Management, PR, AI/ML &amp; more.</h1>
    </div>
</section>"""
content = re.sub(hero_bad_pattern, hero_good, content)

# 3. Fix all the empty lazy-video data-src="" attributes sequentially
# We know the exact order they appear in index.html!
video_urls = [
    "https://hackfirst.io/video/solution-01.mp4",
    "https://hackfirst.io/video/solution-02.mp4",
    "https://hackfirst.io/video/solution-03.mp4",
    "https://hackfirst.io/video/issue-01.mp4",
    "https://hackfirst.io/video/issue-02.mp4",
    "https://hackfirst.io/video/issue-03.mp4",
    "https://hackfirst.io/video/defeat.mp4",
    "https://hackfirst.io/video/about-video-3.mp4",
    "https://hackfirst.io/video/technologies.mp4",
    "https://hackfirst.io/video/started.mp4",
    "https://hackfirst.io/video/footer.mp4"
]

for url in video_urls:
    # replace the FIRST occurrence of data-src="" with the url
    content = content.replace('data-src=""', f'data-src="{url}"', 1)

with open(input_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("Restored 3D animations (videos).")
