document.addEventListener("DOMContentLoaded", () => {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.error("GSAP or ScrollTrigger not found for members animation");
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const gallery = document.querySelector('.members-gallery-container');
    if (!gallery) return;

    const slides = gsap.utils.toArray('.member-slide');
    const inners = gsap.utils.toArray('.member-slide-inner');

    if (slides.length === 0) return;

    // Set initial states
    gsap.set(slides, { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" });
    // Keep them slightly visible and scaled down so you can see them enter/leave
    gsap.set(inners, { scale: 0.4, opacity: 0.1 });
    
    // First slide is visible and scaled up initially
    gsap.set(slides[0], { xPercent: 0 });
    gsap.set(inners[0], { scale: 1, opacity: 1 });

    // Subsequent slides start off-screen to the right
    for (let i = 1; i < slides.length; i++) {
        gsap.set(slides[i], { xPercent: 100 });
    }

    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: gallery,
            pin: true,
            scrub: 1, // Smooth scrub linking animation to scrollbar
            start: "top top",
            // Pin for a distance relative to the number of slides
            end: () => `+=${slides.length * 100}%`,
        }
    });

    // Create the animation sequence
    slides.forEach((slide, i) => {
        if (i === 0) return; 

        // Transition label to make animations happen simultaneously
        const label = `transition-${i}`;

        // 1. PREVIOUS slide zooms out and dims
        tl.to(inners[i - 1], { 
            scale: 0.4, 
            opacity: 0.1, 
            ease: "power1.inOut",
            duration: 1 
        }, label);
        
        // 2. PREVIOUS slide moves out to the left
        tl.to(slides[i - 1], { 
            xPercent: -100, 
            ease: "power1.inOut",
            duration: 1 
        }, label);

        // 3. CURRENT slide moves in from the right
        tl.to(slides[i], { 
            xPercent: 0, 
            ease: "power1.inOut",
            duration: 1 
        }, label);

        // 4. CURRENT slide zooms in and brightens
        tl.to(inners[i], { 
            scale: 1, 
            opacity: 1, 
            ease: "power1.inOut",
            duration: 1 
        }, label);
    });

    // Attach Matrix glitch effect on hover to the main titles
    document.querySelectorAll(".hero-glitch-trigger").forEach((el) => {
        if (typeof TextAnimator !== 'undefined') {
            const animator = new TextAnimator(el);
            el.addEventListener("mouseenter", () => animator.animate());
            el.addEventListener("mouseleave", () => animator.animateBack());
        }
    });
});
