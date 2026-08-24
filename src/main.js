import textsData from './texts.json';

let targetText = "";

let currentIndex = 0;
let isErrorState = false;
let isSuccessState = false;

// DOM Elements
const textDisplay = document.getElementById('text-display');
const keyboardContainer = document.getElementById('keyboard');
const owlOverlay = document.getElementById('owl-overlay');
const owlImage = document.getElementById('owl-image');
const speechBubble = document.getElementById('speech-bubble');
const confettiCanvas = document.getElementById('confetti-canvas');
const restartBtn = document.getElementById('restart-btn');
const randomBtn = document.getElementById('random-btn');

// Keyboard Layout
const rows = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', '.', ','],
  [' ']
];

// Initialize Text Display
function initTextDisplay() {
  textDisplay.innerHTML = '';
  for (let i = 0; i < targetText.length; i++) {
    const span = document.createElement('span');
    span.textContent = targetText[i];
    span.id = `char-${i}`;
    if (i === 0) span.classList.add('current');
    textDisplay.appendChild(span);
  }
}

// Initialize Virtual Keyboard
function initKeyboard() {
  keyboardContainer.innerHTML = '';
  rows.forEach(row => {
    const rowDiv = document.createElement('div');
    rowDiv.classList.add('keyboard-row');
    row.forEach(key => {
      const keyDiv = document.createElement('div');
      keyDiv.classList.add('key');
      if (key === ' ') {
        keyDiv.classList.add('space');
        keyDiv.dataset.key = ' ';
      } else {
        keyDiv.textContent = key;
        keyDiv.dataset.key = key;
      }
      
      // Virtual key click support
      keyDiv.addEventListener('mousedown', () => handleInput(key));
      
      rowDiv.appendChild(keyDiv);
    });
    keyboardContainer.appendChild(rowDiv);
  });
}

// Handle Input (Physical or Virtual)
function handleInput(key) {
  if (isErrorState || isSuccessState) return;

  const expectedChar = targetText[currentIndex];
  
  // Highlight virtual key
  const virtualKey = document.querySelector(`.key[data-key="${key.toLowerCase()}"]`) || 
                     (key === ' ' ? document.querySelector('.key.space') : null);
  
  if (virtualKey) {
    virtualKey.classList.add('active');
    setTimeout(() => virtualKey.classList.remove('active'), 150);
  }

  // Handle Shift or other modifiers if needed, but our text uses uppercase.
  // We'll compare characters directly (case-sensitive) or we could simplify.
  // The requirement just says "type completely correctly".
  // Let's do exact match.
  if (key === expectedChar) {
    handleCorrectTyping();
  } else if (key.length === 1) { // Only handle single character presses as errors
    handleIncorrectTyping();
  }
}

function handleCorrectTyping() {
  const currentSpan = document.getElementById(`char-${currentIndex}`);
  currentSpan.classList.remove('current', 'error');
  currentSpan.classList.add('typed');

  currentIndex++;

  if (currentIndex < targetText.length) {
    const nextSpan = document.getElementById(`char-${currentIndex}`);
    nextSpan.classList.add('current');
  } else {
    handleSuccess();
  }
}

function handleIncorrectTyping() {
  isErrorState = true;
  const currentSpan = document.getElementById(`char-${currentIndex}`);
  currentSpan.classList.add('error');

  showOwlError();

  setTimeout(() => {
    currentSpan.classList.remove('error');
    hideOwl();
    isErrorState = false;
  }, 2000); // 2 seconds timeout for error
}

function showOwlError() {
  // Using a data URI with an SVG emoji since image generation is unavailable
  owlImage.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🦉</text></svg>'; 
  owlImage.style.filter = 'drop-shadow(0 10px 15px rgba(255,0,0,0.4)) grayscale(30%)';
  speechBubble.textContent = 'Oopsie! Check that letter again!';
  speechBubble.className = 'speech-bubble error';
  owlOverlay.classList.remove('hidden');
}

function showOwlSuccess() {
  owlImage.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🦉</text></svg>';
  owlImage.style.filter = 'drop-shadow(0 10px 15px rgba(0,255,0,0.4)) hue-rotate(30deg) brightness(1.2)';
  speechBubble.textContent = 'Awesome Job! You did it!';
  speechBubble.className = 'speech-bubble success';
  owlOverlay.classList.remove('hidden');
}

function hideOwl() {
  owlOverlay.classList.add('hidden');
}

function handleSuccess() {
  isSuccessState = true;
  showOwlSuccess();
  
  // Trigger Confetti
  const duration = 3000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 5,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());
}

function loadRandomText() {
  const randomIndex = Math.floor(Math.random() * textsData.length);
  targetText = textsData[randomIndex].text;
  restart();
}

function restart() {
  currentIndex = 0;
  isErrorState = false;
  isSuccessState = false;
  hideOwl();
  initTextDisplay();
}

restartBtn.addEventListener('click', restart);
randomBtn.addEventListener('click', loadRandomText);

// Listen to physical keyboard
window.addEventListener('keydown', (e) => {
  if (e.key === 'Shift' || e.key === 'CapsLock' || e.key === 'Tab') return;
  
  // Prevent default scrolling for spacebar
  if (e.key === ' ') e.preventDefault();

  handleInput(e.key);
});

// Init
loadRandomText();
initKeyboard();
