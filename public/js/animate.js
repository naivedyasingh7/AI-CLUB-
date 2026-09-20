const debounce = (func, delay) => {
	let timerId;
	return (...args) => {
		clearTimeout(timerId);
		timerId = setTimeout(() => {
			func.apply(this, args);
		}, delay);
	};
};

class TextSplitter {
	constructor(textElement, options = {}) {
		if (!textElement || !(textElement instanceof HTMLElement)) {
			throw new Error('Invalid text element provided.');
		}

		const { resizeCallback, splitTypeTypes } = options;

		this.textElement = textElement;
		this.onResize = typeof resizeCallback === 'function' ? resizeCallback : null;

		const splitOptions = splitTypeTypes ? { types: splitTypeTypes } : {};
		this.splitText = new SplitType(this.textElement, splitOptions);

		if (this.onResize) {
			this.initResizeObserver();
		}
	}

	initResizeObserver() {
		this.previousContainerWidth = null;

		let resizeObserver = new ResizeObserver(debounce((entries) => this.handleResize(entries), 100));
		resizeObserver.observe(this.textElement);
	}

	handleResize(entries) {
		const [{ contentRect }] = entries;
		const width = Math.floor(contentRect.width);

		if (this.previousContainerWidth && this.previousContainerWidth !== width) {
			this.splitText.split();
			this.onResize();
		}
		this.previousContainerWidth = width;
	}

	revert() {
		return this.splitText.revert();
	}

	getLines() {
		return this.splitText.lines;
	}

	getWords() {
		return this.splitText.words;
	}

	getChars() {
		return this.splitText.chars;
	}
}

const lettersAndSymbols = [
	'a',
	'b',
	'c',
	'd',
	'e',
	'f',
	'g',
	'h',
	'i',
	'j',
	'k',
	'l',
	'm',
	'n',
	'o',
	'p',
	'q',
	'r',
	's',
	't',
	'u',
	'v',
	'w',
	'x',
	'y',
	'z',
	'!',
	'@',
	'#',
	'$',
	'%',
	'^',
	'&',
	'*',
	'-',
	'_',
	'+',
	'=',
	';',
	':',
	'<',
	'>',
	',',
];

class TextAnimator {
	constructor(textElement) {
		if (!textElement || !(textElement instanceof HTMLElement)) {
			throw new Error('Invalid text element provided.');
		}

		this.textElement = textElement;
		this.originalChars = [];
		this.splitText();
	}

	splitText() {
		this.splitter = new TextSplitter(this.textElement, {
			splitTypeTypes: 'words, chars',
		});

		this.originalChars = this.splitter.getChars().map((char) => char.innerHTML);
	}

	animate() {
		this.reset();

		const chars = this.splitter.getChars();

		chars.forEach((char) => {
			const rect = char.getBoundingClientRect();
			char.style.display = 'inline-block';
			char.style.width = `${rect.width}px`;
		});

		chars.forEach((char, position) => {
			let initialHTML = char.innerHTML;

			gsap.fromTo(
				char,
				{
					opacity: 0,
				},
				{
					duration: 0.03,
					onComplete: () => gsap.set(char, { innerHTML: initialHTML, delay: 0.1 }),
					repeat: 2,
					repeatRefresh: true,
					repeatDelay: 0.05,
					delay: (position + 1) * 0.06,
					innerHTML: () => lettersAndSymbols[Math.floor(Math.random() * lettersAndSymbols.length)],
					opacity: 1,
				}
			);
		});

		gsap.fromTo(
			this.textElement,
			{
				'--anim': 0,
			},
			{
				duration: 1,
				ease: 'expo',
				'--anim': 1,
			}
		);
	}

	animateBack() {
		gsap.killTweensOf(this.textElement);
		gsap.to(this.textElement, {
			duration: 0.6,
			ease: 'power4',
			'--anim': 0,
		});
	}

	reset() {
		const chars = this.splitter.getChars();
		chars.forEach((char, index) => {
			gsap.killTweensOf(char);
			char.innerHTML = this.originalChars[index];
		});

		gsap.killTweensOf(this.textElement);
		gsap.set(this.textElement, { '--anim': 0 });
	}
}