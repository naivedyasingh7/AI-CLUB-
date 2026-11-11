import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';

gsap.registerPlugin(ScrollTrigger);

const lettersAndSymbols = [
  'a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z',
  '!','@','#','$','%','^','&','*','-','_','+','=',';',':','<','>',','
];

export class TextAnimator {
  constructor(textElement) {
    if (!textElement || !(textElement instanceof HTMLElement)) return;
    this.textElement = textElement;
    this.originalChars = [];
    this.splitText();
  }

  splitText() {
    try {
      this.splitter = new SplitType(this.textElement, { types: 'words, chars' });
      if (this.splitter.chars) {
        this.originalChars = this.splitter.chars.map((char) => char.innerHTML);
      }
    } catch (e) {
      console.warn('SplitType error:', e);
    }
  }

  animate() {
    if (!this.splitter || !this.splitter.chars) return;
    this.reset();
    const chars = this.splitter.chars;

    chars.forEach((char) => {
      const rect = char.getBoundingClientRect();
      char.style.display = 'inline-block';
      char.style.width = `${rect.width}px`;
    });

    chars.forEach((char, position) => {
      let initialHTML = char.innerHTML;

      gsap.fromTo(
        char,
        { opacity: 0 },
        {
          duration: 0.03,
          onComplete: () => gsap.set(char, { innerHTML: initialHTML, delay: 0.1 }),
          repeat: 2,
          repeatRefresh: true,
          repeatDelay: 0.05,
          delay: (position + 1) * 0.04,
          innerHTML: () => lettersAndSymbols[Math.floor(Math.random() * lettersAndSymbols.length)],
          opacity: 1
        }
      );
    });

    gsap.fromTo(
      this.textElement,
      { '--anim': 0 },
      { duration: 0.5, ease: 'power2.out', '--anim': 1 }
    );
  }

  animateBack() {
    gsap.killTweensOf(this.textElement);
    gsap.to(this.textElement, {
      duration: 0.4,
      ease: 'power4.out',
      '--anim': 0
    });
  }

  reset() {
    if (!this.splitter || !this.splitter.chars) return;
    const chars = this.splitter.chars;
    chars.forEach((char, index) => {
      gsap.killTweensOf(char);
      if (this.originalChars[index] !== undefined) {
        char.innerHTML = this.originalChars[index];
      }
    });

    gsap.killTweensOf(this.textElement);
    gsap.set(this.textElement, { '--anim': 0 });
  }
}

export function initGlobalAnimations() {
  // 1. Text Blur Reveal Animations
  document.querySelectorAll('[animate-blur-text]').forEach((el) => {
    try {
      new SplitType(el, { types: 'words', tagName: 'span' });
      const words = el.querySelectorAll('.word');
      if (words.length) {
        gsap.fromTo(
          words,
          { opacity: 0, y: '0.8em', filter: 'blur(12px)' },
          {
            opacity: 1,
            y: '0em',
            filter: 'blur(0px)',
            duration: 0.7,
            ease: 'power2.out',
            stagger: { amount: 0.25 },
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              toggleActions: 'play none none reverse'
            }
          }
        );
      }
    } catch { /* Leave unsplittable text visible. */ }
  });

  document.querySelectorAll('[animate-blur-el]').forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: '1em', filter: 'blur(10px)' },
      {
        opacity: 1,
        y: '0em',
        filter: 'blur(0px)',
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  });

  // 2. Character Scramble Hover for Links
  document.querySelectorAll('a.hover-effect').forEach((el) => {
    const animator = new TextAnimator(el);
    el.addEventListener('mouseenter', () => animator.animate());
    el.addEventListener('mouseleave', () => animator.animateBack());
  });

  // 3. Stats Data Counter Character Slide Effect
  document.querySelectorAll('[data-counter]').forEach((el) => {
    const text = el.getAttribute('data-counter') || el.textContent.trim();
    const chars = Array.from(text);
    
    el.innerHTML = '<span class="idle"></span><span class="hover"></span>';
    const idleSpan = el.querySelector('.idle');
    const hoverSpan = el.querySelector('.hover');

    if (idleSpan && hoverSpan) {
      idleSpan.innerHTML = chars.map((c) => `<span class="char">${c}</span>`).join('');
      hoverSpan.innerHTML = chars.map((c) => `<span class="char">${c}</span>`).join('');
    }

    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      onEnter: () => el.classList.add('is-inview')
    });
  });
}
