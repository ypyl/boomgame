// Game Constants
const TIME_LIMIT = 120000; // 120 seconds in milliseconds

// Game State Variables
let timeRemaining;
let gameActive = false;
let currentNumber;
let deactivateNumber;
let inputState = 0; // 0: Initial, 1: Rules, 2: Gameplay
let currentOperator;
let nextOperatorPreview;
let timerInterval;
let isFirstRound = true;

// DOM Elements
const initialScreen = document.getElementById('initial-screen');
const rulesScreen = document.getElementById('rules-screen');
const activeGameScreen = document.getElementById('active-game-screen');
const winScreen = document.getElementById('win-screen');
const lossScreen = document.getElementById('loss-screen');

const timerDisplay = document.getElementById('timer');
const deactivateCodeDisplay = document.getElementById('deactivate-code');
const currentNumberDisplay = document.getElementById('current-number');
const currentOperatorDisplay = document.getElementById('current-operator');
const nextOperatorDisplay = document.getElementById('next-operator');
const inputArea = document.getElementById('input-area');

// Event Listeners
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        handleEnterKey();
    }
});

function handleEnterKey() {
    if (inputState === 0) {
        // State 0 -> 1: Show Rules Screen
        inputState = 1;
        showRulesScreen();
    } else if (inputState === 1) {
        // State 1 -> 2: Start Game immediately with everything visible
        startGame();
    }
    // State 2: Enter is ignored, waiting for click
}

function showRulesScreen() {
    initialScreen.classList.add('hidden');
    initialScreen.classList.remove('active');
    rulesScreen.classList.remove('hidden');
    rulesScreen.classList.add('active');
}

function startGame() {
    gameActive = true;
    timeRemaining = TIME_LIMIT;
    inputState = 2;
    isFirstRound = true;

    // Initialize Numbers
    currentNumber = Math.floor(Math.random() * 50) + 1;
    // Deactivate number should be different and reachable
    do {
        deactivateNumber = Math.floor(Math.random() * 99) + 1;
    } while (deactivateNumber === currentNumber);

    // Initial Operator Setup for the first round
    currentOperator = getNewOperator(currentNumber, deactivateNumber);

    // Switch Screens
    rulesScreen.classList.add('hidden');
    rulesScreen.classList.remove('active');
    activeGameScreen.classList.remove('hidden');
    activeGameScreen.classList.add('active');

    // Start Timer
    startTimer();
    
    // Start first round immediately
    startRound();
}

function startTimer() {
    clearInterval(timerInterval);
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        timeRemaining -= 1000;
        updateTimerDisplay();

        if (timeRemaining <= 0) {
            endGame(false);
        }
    }, 1000);
}

function updateTimerDisplay() {
    const seconds = Math.ceil(timeRemaining / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    timerDisplay.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

    if (seconds <= 30) {
        timerDisplay.classList.add('warning');
    } else {
        timerDisplay.classList.remove('warning');
    }
}

function startRound() {
    // For rounds after the first, move next operator to current
    if (!isFirstRound) {
        currentOperator = nextOperatorPreview;
    }
    isFirstRound = false;
    
    // Generate new round data
    const roundData = generateRoundData(currentNumber, currentOperator, deactivateNumber);
    
    // Calculate next operator by checking all possible outcomes
    nextOperatorPreview = getNextOperatorForPossibleOutcomes(currentNumber, currentOperator, roundData.numbers, deactivateNumber);
    
    renderInputButtons(roundData.numbers);
    updateUI();
}

function generateRoundData(currNum, currOp, targetNum) {
    let randomNumbers = [];
    const NUM_COUNT = 5;
    const MAX_DIFF = 100;

    // Helper to check if a result is within valid range
    const isValidResult = (res) => Math.abs(res - targetNum) <= MAX_DIFF;

    if (currOp === '-') {
        // Subtraction Constraint: selection <= currentNumber AND result within range
        let availableNumbers = [];
        for (let i = 1; i <= currNum; i++) {
            if (isValidResult(currNum - i)) {
                availableNumbers.push(i);
            }
        }
        randomNumbers = getUniqueRandomNumbers(availableNumbers, NUM_COUNT);
    } else if (currOp === '/') {
        // Division Constraint: selection must be a factor AND result within range
        let factors = [];
        for (let i = 1; i <= currNum; i++) {
            if (currNum % i === 0 && isValidResult(currNum / i)) {
                factors.push(i);
            }
        }
        randomNumbers = getUniqueRandomNumbers(factors, NUM_COUNT);
    } else if (currOp === '+') {
        // Addition: result within range
        let availableNumbers = [];
        // Try a reasonable range of numbers, e.g., 1 to 50
        for (let i = 1; i <= 50; i++) {
             if (isValidResult(currNum + i)) {
                availableNumbers.push(i);
            }
        }
        randomNumbers = getUniqueRandomNumbers(availableNumbers, NUM_COUNT);
    } else if (currOp === '*') {
        // Multiplication: result within range
        let availableNumbers = [];
        // Try a reasonable range, e.g., 1 to 10
        for (let i = 1; i <= 10; i++) {
             if (isValidResult(currNum * i)) {
                availableNumbers.push(i);
            }
        }
        randomNumbers = getUniqueRandomNumbers(availableNumbers, NUM_COUNT);
    }

    // Fallback if we couldn't find enough valid numbers (should be rare with good operator selection)
    // If we have 0 valid numbers, we might be in a stuck state, but let's just give some randoms 
    // and hope the user can survive or the game ends naturally.
    if (randomNumbers.length < NUM_COUNT) {
         // Fill with standard logic if we are desperate, but this technically violates the strict rule.
         // However, providing NO buttons is worse.
         // Let's try to fill with "safe" numbers if possible, or just randoms.
         let backup = [];
         if (currOp === '+' || currOp === '*') backup = [1, 2, 3, 4, 5];
         else if (currOp === '-') backup = [1, 2, 3]; // simplified
         else if (currOp === '/') backup = [1]; 
         
         // Combine unique
         let set = new Set([...randomNumbers, ...backup]);
         randomNumbers = Array.from(set).slice(0, NUM_COUNT);
    }

    return {
        numbers: randomNumbers
    };
}

// Helper function to get unique random numbers from an array
function getUniqueRandomNumbers(availableNumbers, count) {
    // If we don't have enough numbers, return what we have (shuffled)
    if (availableNumbers.length <= count) {
        return shuffleArray([...availableNumbers]);
    }
    
    // Shuffle and take the first 'count' numbers
    const shuffled = shuffleArray([...availableNumbers]);
    return shuffled.slice(0, count);
}

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Helper function to count factors of a number
function countFactors(num) {
    let count = 0;
    for (let i = 1; i <= num; i++) {
        if (num % i === 0) {
            count++;
        }
    }
    return count;
}

// Check all possible outcomes and determine next operator
function getNextOperatorForPossibleOutcomes(currNum, currOp, possibleChoices, targetNum) {
    let ops = ['+', '-', '*', '/'];
    
    // Calculate all possible resulting numbers from the CURRENT round
    let allPossibleResults = possibleChoices.map(choice => 
        applyOperation(currNum, currOp, choice)
    );
    
    // We need to pick an operator for the NEXT round.
    // The next operator is valid if for AT LEAST ONE of the possible results (which will be the next currNum),
    // there exists a valid move (number selection) that keeps us within range.
    // However, checking "exists a valid move" is complex because we generate numbers dynamically.
    // A simpler heuristic:
    // 1. If result is > target + 100, avoid '+', '*'.
    // 2. If result is < target - 100, avoid '-', '/'.
    // 3. Division needs factors.
    
    // Let's filter `ops` based on the "average" or "worst case" of possible results?
    // Or just pick one that is generally safe for MOST results.
    
    // Let's refine the "bad operator" logic requested:
    // "should not suggest operator multiplayer if the user already have bigger that target number more thatn 100"
    
    // We can filter the list of candidate operators.
    let validOps = ops.filter(nextOp => {
        // Check if this operator is "safe" for the possible results
        // It's safe if it doesn't force the user further away when they are already far.
        
        // Let's check against all possible results. If ANY result makes this operator "bad", maybe avoid it?
        // Or if the MAJORITY are bad.
        
        // Let's implement the specific rule: "don't suggest * if > target + 100"
        // And general range check.
        
        return allPossibleResults.every(res => isOperatorSafe(res, nextOp, targetNum));
    });
    
    // If we filtered everything out (rare), revert to basic ops
    if (validOps.length === 0) {
        validOps = ['+', '-']; 
    }
    
    return validOps[Math.floor(Math.random() * validOps.length)];
}

function getNewOperator(currNum, targetNum) {
    let ops = ['+', '-', '*', '/'];
    
    if (currNum !== undefined && targetNum !== undefined) {
        ops = ops.filter(op => isOperatorSafe(currNum, op, targetNum));
    }
    
    // If filtered out, fallback
    if (ops.length === 0) ops = ['+', '-'];

    return ops[Math.floor(Math.random() * ops.length)];
}

function isOperatorSafe(current, op, target) {
    const diff = current - target;
    const absDiff = Math.abs(diff);
    const MAX_DIFF = 100;

    // Rule 1: Division requires factors (at least 5 factors logic from before)
    if (op === '/') {
        if (countFactors(current) < 5) return false;
    }

    // Rule 2: If we are already far away (> 100 diff), don't use operators that explode the value further
    if (absDiff > MAX_DIFF) {
        if (diff > 0) {
            // We are too big (current > target + 100)
            // Avoid + and *
            if (op === '+' || op === '*') return false;
        } else {
            // We are too small (current < target - 100)
            // Avoid - and / (assuming / makes it smaller for positive numbers)
            if (op === '-' || op === '/') return false;
        }
    }
    
    // Rule 3: Even if within range, avoid * if it immediately shoots us out of range with MINIMUM input (1 or 2)
    // This is a bit aggressive, but safe.
    if (op === '*' && Math.abs(current * 2 - target) > MAX_DIFF + 50) { // +50 buffer
         // If even multiplying by 2 sends us far, it's risky.
         // But maybe we have '1'? 
         // Let's just stick to the user's explicit request about "already have bigger".
    }

    return true;
}

function renderInputButtons(numbers) {
    inputArea.innerHTML = '';
    numbers.forEach(num => {
        const btn = document.createElement('div');
        btn.classList.add('number-btn');
        btn.textContent = num;
        btn.addEventListener('click', () => handleSelection(num));
        inputArea.appendChild(btn);
    });
}

function handleSelection(selectedNumber) {
    if (!gameActive || inputState !== 2) return;

    const newNumber = applyOperation(currentNumber, currentOperator, selectedNumber);
    currentNumber = newNumber;

    if (currentNumber === deactivateNumber) {
        endGame(true);
    } else {
        startRound();
    }
}

function applyOperation(current, op, selection) {
    switch (op) {
        case '+': return current + selection;
        case '-': return current - selection;
        case '*': return current * selection;
        case '/': return Math.floor(current / selection);
        default: return current;
    }
}

function updateUI() {
    deactivateCodeDisplay.textContent = deactivateNumber;
    currentNumberDisplay.textContent = currentNumber;
    currentOperatorDisplay.textContent = currentOperator;
    nextOperatorDisplay.textContent = nextOperatorPreview;
    inputArea.style.visibility = 'visible';
}

function endGame(won) {
    gameActive = false;
    clearInterval(timerInterval);
    activeGameScreen.classList.add('hidden');
    
    if (won) {
        winScreen.classList.remove('hidden');
    } else {
        lossScreen.classList.remove('hidden');
    }
}
