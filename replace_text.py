import os

input_file = r"c:\Users\ASUS\Desktop\fnal\hackfirst_raw.html"
output_file = r"c:\Users\ASUS\Desktop\fnal\index.html"

with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    "<title>HackFirst.io | Home</title>": "<title>AI CLUB - VIT BHOPAL</title>",
    
    "HackFirst: Outsmarting Attackers. Securing Tomorrow. At&#160;HackFirst, we&#160;believe that attack is&#160;the best defense": 
    "AI Club: Innovating the future. Mastering Technology. At AI Club, we believe that building is the best learning",
    
    "Cyberattack simulations": "TENURE 26-27",
    
    "Most advanced cyberattack simulations: HackFirst&#8482;": "AI CLUB<br>18 Community Groups:<br>Event Management, PR, AI/ML &amp; more.",
    
    "Modern threats require more than standard checks. <span>Audits and pentests based on&#160;compliance requirements are not enough to&#160;protect against real attacks</span>":
    "Traditional learning requires more than standard coursework. <span>Lectures and assignments based on syllabus requirements are not enough to build real AI</span>",
    
    "Compliance-based audits and pentests identify only superficial vulnerabilities. They do&#160;not simulate attacks by&#160;real hackers and do&#160;not emulate complex hacking methods such as&#160;<span>phishing</span>, <span>lateral movement</span>, <span>privilege escalation</span> and <span>persistent presence in&#160;the system</span>.":
    "Standard academic coursework covers only superficial concepts. They do not simulate building by real engineers and do not emulate complex methods such as <span>model deployment</span>, <span>data pipelines</span>, <span>cloud infrastructure</span> and <span>persistent presence in the industry</span>.",
    
    "{. of&#160;tested systems }": "{. of students }",
    "had critical vulnerabilities": "lack practical AI experience",
    "{. of&#160;companies }": "{. of tech roles }",
    "fail to&#160;recover after a&#160;major cyberattack": "require advanced AI skills today",
    "207 days": "200+",
    "average time to&#160;detect a&#160;breach": "active community members",
    
    "Hidden Vulnerabilities Can Destroy You": "Practical Experience Can Define You",
    "Security audits give you peace of&#160;mind": "Collaborative learning gives you an edge",
    "How do&#160;standard protection methods fall short?": "How do standard academic methods fall short?",
    
    "Compliance &#8800; Security": "Theory &#8800; Practice",
    "Completing a&#160;standard audit does not translate into concrete security.": "Completing a standard course does not translate into real-world AI skills.",
    
    "Limited pentests": "Limited coursework",
    "Most tests only check for obLimited pentestsvious vulnerabilities and do&#160;not simulate real attacks.": "Most classes only cover obvious algorithms and do not build complete systems.",
    
    "Real hackers use dynamic attacks": "Real industry uses dynamic AI models",
    
    "Access Denied:": "Status Confirmed:",
    "They said you were secure. But&#160;now you&#8217;re compromised": "They said AI was hard. But now you're building it",
    "To&#160;defeat hackers, you need to&#160;think like hackers.": "To master AI, you need to build with AI.",
    "🔒 Access Denied: Document is&#160;secure. return False else: print (&#171;⚠️ Intrusion Detected! System lockdown initiated.&#187;) return False # The hack failed":
    "🚀 Access Granted: Environment is ready. return True else: print (\"✨ Innovation Detected! Project initialization complete.\") return True # The build succeeded",
    
    "The ultimate solution to&#160;modern cyber threats": "The ultimate community for modern AI engineers",
    
    "<span>premium</span>\n        <span>publishers</span>": "<span>student</span>\n        <span>researchers</span>",
    "<span>independent</span>\n        <span>premium</span>": "<span>independent</span>\n        <span>student</span>",
    "<span>collective</span>": "<span>community</span>",
    
    "<span>HackFirst team simulates such attacks in</span> controlled environments without disrupting your services": "<span>AI Club teams build state-of-the-art models in</span> collaborative environments that push boundaries",
    
    "Capitalize Leveraging our proprietary AI-powered hacking tools, and deploying whole squadrons of&#160;over 10 elite ethical hackers working in&#160;unison&#160;&#8212; white hats with a&#160;black hat mindset.":
    "Capitalize Leveraging our proprietary research, and deploying whole teams of elite students working in unison — learners with a builder mindset.",
    
    "<span>VAPT</span>": "<span>Deep Learning</span>",
    "<span>Red Team</span>": "<span>Computer Vision</span>",
    "<span>Security Advisory</span>": "<span>Generative AI</span>",
    
    "Realistic Threat Simulations": "Practical AI Development",
    "Experience attacks modeled after real-world cybercriminals, testing defenses against tactics from groups like Double Dragon, Fancy Bear, and Lazarus Group":
    "Experience building models modeled after real-world production systems, testing architecture against challenges from real datasets and APIs",
    
    "Safe & Controlled Testing": "Safe & Controlled Environments",
    "Conduct simulations without disrupting operations, allowing focus on&#160;strengthening systems securely.":
    "Conduct research without disrupting operations, allowing focus on strengthening models securely.",
    
    "AI-Powered Hacking Tools": "Advanced AI Frameworks",
    "Utilize advanced AI&#160;tools developed by&#160;HackFirst to&#160;emulate sophisticated cybercriminal strategies, uncovering vulnerabilities others miss.":
    "Utilize advanced AI frameworks to emulate sophisticated ML strategies, uncovering insights others miss.",
    
    "World-Class Ethical Hackers": "World-Class Student Builders",
    "Collaborate with a&#160;team of&#160;over 10 world-class ethical hackers who think like black-hat attackers and use their skills to&#160;protect your organization.":
    "Collaborate with a team of world-class student engineers who think like industry professionals and use their skills to innovate.",
    
    "Top Hackers Lists": "Top AI Competitions",
    "Hall of&#160;Fame": "Kaggle Grandmaster",
    
    "HackFirst is&#160;a&#160;proud member of&#160;the FearsOff Alliance": "AI Club is the premier technical community",
    "Is&#160;your organization truly ready for a&#160;HackFirst level assault?": "Are you truly ready to build the future of AI?",
    "With HackFirst&#8482; Cyberattack Simulations, you&#8217;re not just checking the box on&#160;security&#160;&#8212; you&#8217;re forged in&#160;fire":
    "With AI Club's intensive research groups, you're not just learning theory — you're building reality",
    
    "HackFirst: Outsmarting Attackers. Securing Tomorrow.At HackFirst, we&#160;don&#8217;t just defend&#8212;we outsmart":
    "AI Club: Innovating the future. Mastering Technology. At AI Club, we don't just learn—we build."
}

for old_text, new_text in replacements.items():
    content = content.replace(old_text, new_text)

# Also replace the script tags so they are relative or absolute correctly?
# Wait, the raw html has <script defer src="/js/libs.min.js?cb=1751366445799"></script>
# and <link rel="stylesheet" href="/css/libs.min.css?cb=1751366445799">
# These will work if the public folder has them, which it does.
# Wait, Vite handles index.html differently. If I use index.html in Vite, I shouldn't have to change anything because the static files are in `public/`.
# However, Vite will serve index.html directly! 
# But wait, Vite injects its own scripts into index.html during development. That's fine.

with open(output_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("Replacement complete.")
