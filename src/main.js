import textsData from './texts.json';

const textDisplay = document.getElementById('text-display');
const keyboardContainer = document.getElementById('keyboard');
const owlOverlay = document.getElementById('owl-overlay');
const owlImage = document.getElementById('owl-image');
const speechBubble = document.getElementById('speech-bubble');
const confettiCanvas = document.getElementById('confetti-canvas');
const restartBtn = document.getElementById('restart-btn');
const randomBtn = document.getElementById('random-btn');
const langBtn = document.getElementById('lang-btn');

let currentLang = 'en';
let isShiftPressed = false;
let isVirtualShift = false;

const enRows = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'backspace'],
  ['tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['capslock', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'enter'],
  ['shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'shift'],
  ['control', 'meta', 'alt', ' ', 'alt', 'meta', 'contextmenu', 'control']
];

const enToKaBase = {
  'q': 'ქ', 'w': 'წ', 'e': 'ე', 'r': 'რ', 't': 'ტ', 'y': 'ყ', 'u': 'უ', 'i': 'ი', 'o': 'ო', 'p': 'პ',
  'a': 'ა', 's': 'ს', 'd': 'დ', 'f': 'ფ', 'g': 'გ', 'h': 'ჰ', 'j': 'ჯ', 'k': 'კ', 'l': 'ლ',
  'z': 'ზ', 'x': 'ხ', 'c': 'ც', 'v': 'ვ', 'b': 'ბ', 'n': 'ნ', 'm': 'მ'
};

const enToKaShift = {
  'w': 'ჭ', 'W': 'ჭ', 'r': 'ღ', 'R': 'ღ', 't': 'თ', 'T': 'თ', 's': 'შ', 'S': 'შ', 
  'j': 'ჟ', 'J': 'ჟ', 'z': 'ძ', 'Z': 'ძ', 'c': 'ჩ', 'C': 'ჩ'
};

let targetText = '';
let currentIndex = 0;
let isErrorState = false;
let isSuccessState = false;

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

// Update visuals without rebuilding DOM
function updateKeyboardVisuals() {
  const keys = document.querySelectorAll('.key');
  keys.forEach(keyDiv => {
    const key = keyDiv.dataset.key;
    if (['shift', 'control', 'alt', 'meta', 'backspace', 'tab', 'capslock', 'enter', 'contextmenu', ' '].includes(key)) {
      if (key === 'shift') {
        if (isShiftPressed || isVirtualShift) {
          keyDiv.classList.add('active-toggle');
        } else {
          keyDiv.classList.remove('active-toggle');
        }
      }
      return;
    }
    
    if (currentLang === 'ka') {
      if (isShiftPressed || isVirtualShift) {
        keyDiv.textContent = enToKaShift[key] || enToKaBase[key] || key;
      } else {
        keyDiv.textContent = enToKaBase[key] || key;
      }
    } else {
      if (isShiftPressed || isVirtualShift) {
        keyDiv.textContent = key.toUpperCase();
      } else {
        keyDiv.textContent = key;
      }
    }
  });
}

// Initialize Virtual Keyboard
function initKeyboard() {
  keyboardContainer.innerHTML = '';
  enRows.forEach(row => {
    const rowDiv = document.createElement('div');
    rowDiv.classList.add('keyboard-row');
    row.forEach(key => {
      const keyDiv = document.createElement('div');
      keyDiv.classList.add('key');
      
      if (key === ' ') {
        keyDiv.classList.add('space');
        keyDiv.dataset.key = ' ';
      } else {
        keyDiv.dataset.key = key;
        if (['shift', 'control', 'alt', 'meta', 'backspace', 'tab', 'capslock', 'enter', 'contextmenu'].includes(key)) {
          const displayKey = { 
            'control': 'ctrl', 'meta': 'win', 'backspace': 'back', 
            'capslock': 'caps', 'contextmenu': 'menu'
          }[key] || key;
          keyDiv.textContent = displayKey;
          keyDiv.classList.add({ 'meta': 'win', 'control': 'ctrl', 'backspace': 'back', 'capslock': 'caps', 'contextmenu': 'menu' }[key] || key);
        } else {
          keyDiv.textContent = key;
        }
      }
      
      // Virtual key click support
      keyDiv.addEventListener('mousedown', () => {
        if (key === 'shift') {
          isVirtualShift = !isVirtualShift;
          updateKeyboardVisuals();
          return;
        }
        
        handleInput(key);
        
        // Auto-disable virtual shift after a letter is typed
        if (isVirtualShift && !['control', 'alt', 'meta', 'capslock', 'tab', 'backspace', 'enter', 'contextmenu'].includes(key)) {
          isVirtualShift = false;
          updateKeyboardVisuals();
        }
      });
      
      rowDiv.appendChild(keyDiv);
    });
    keyboardContainer.appendChild(rowDiv);
  });
  updateKeyboardVisuals();
}

// Handle Input (Physical or Virtual)
function handleInput(key) {
  if (isErrorState || isSuccessState) return;

  const expectedChar = targetText[currentIndex];

  let mappedKey = key;
  if (currentLang === 'ka' && !/[ა-ჰ]/.test(key)) {
     if ((key >= 'A' && key <= 'Z') || isShiftPressed || isVirtualShift) {
        mappedKey = enToKaShift[key.toLowerCase()] || enToKaBase[key.toLowerCase()] || key;
     } else {
        mappedKey = enToKaBase[key.toLowerCase()] || key;
     }
  } else if (currentLang === 'en') {
    if (key.length === 1 && (isShiftPressed || isVirtualShift) && key >= 'a' && key <= 'z') {
      mappedKey = key.toUpperCase();
    }
  }
  
  // Highlight virtual keys based on layout reverse mapping
  let highlightKey = key.toLowerCase();
  if (currentLang === 'ka' && /[ა-ჰ]/.test(highlightKey)) {
     const entry = Object.entries(enToKaBase).find(([k, v]) => v === highlightKey);
     if (entry) highlightKey = entry[0];
     else {
       const shiftEntry = Object.entries(enToKaShift).find(([k, v]) => v === highlightKey);
       if (shiftEntry) highlightKey = shiftEntry[0].toLowerCase();
     }
  }

  const virtualKeys = highlightKey === ' ' 
    ? [document.querySelector('.key.space')]
    : document.querySelectorAll(`.key[data-key="${highlightKey}"]`);
  
  virtualKeys.forEach(virtualKey => {
    if (virtualKey) {
      virtualKey.classList.add('active');
      setTimeout(() => virtualKey.classList.remove('active'), 150);
    }
  });

  // Ignore modifier keys for typing evaluation
  if (['shift', 'control', 'alt', 'meta', 'capslock', 'tab', 'backspace', 'enter', 'contextmenu'].includes(highlightKey)) {
    return;
  }

  // Evaluate typing
  if (mappedKey === expectedChar) {
    handleCorrectTyping();
  } else if (mappedKey.length === 1) { // Only handle single character presses as errors
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
  targetText = currentLang === 'en' ? textsData[randomIndex].text : textsData[randomIndex].text_ka;
  restart();
}

function restart() {
  currentIndex = 0;
  isErrorState = false;
  isSuccessState = false;
  hideOwl();
  initTextDisplay();
}

function toggleLanguage() {
  currentLang = currentLang === 'en' ? 'ka' : 'en';
  langBtn.textContent = `Lang: ${currentLang.toUpperCase()}`;
  updateKeyboardVisuals();
  loadRandomText();
}

restartBtn.addEventListener('click', restart);
randomBtn.addEventListener('click', loadRandomText);
langBtn.addEventListener('click', toggleLanguage);

// Listen to physical keyboard
window.addEventListener('keydown', (e) => {
  if (e.key === 'Shift') {
    isShiftPressed = true;
    updateKeyboardVisuals();
  }

  // Prevent default scrolling for spacebar and shortcuts that might interfere
  if (e.key === ' ') e.preventDefault();
  if (e.altKey && e.key.length === 1) e.preventDefault(); 

  handleInput(e.key);
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'Shift') {
    isShiftPressed = false;
    updateKeyboardVisuals();
  }
});

// Init
loadRandomText();
initKeyboard();
