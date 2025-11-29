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
    currentOperator = getNewOperator();

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
    const roundData = generateRoundData(currentNumber, currentOperator);
    
    // Calculate next operator by checking all possible outcomes
    nextOperatorPreview = getNextOperatorForPossibleOutcomes(currentNumber, currentOperator, roundData.numbers);
    
    renderInputButtons(roundData.numbers);
    updateUI();
}

function generateRoundData(currNum, currOp) {
    let randomNumbers = [];
    const NUM_COUNT = 5;

    if (currOp === '-') {
        // Subtraction Constraint: selection <= currentNumber
        // Generate unique numbers from 1 to currNum
        let availableNumbers = [];
        for (let i = 1; i <= currNum; i++) {
            availableNumbers.push(i);
        }
        
        // Shuffle and pick NUM_COUNT unique numbers
        randomNumbers = getUniqueRandomNumbers(availableNumbers, NUM_COUNT);
    } else if (currOp === '/') {
        // Division Constraint: selection must be a factor
        let factors = [];
        for (let i = 1; i <= currNum; i++) {
            if (currNum % i === 0) {
                factors.push(i);
            }
        }
        
        // Pick NUM_COUNT unique factors
        randomNumbers = getUniqueRandomNumbers(factors, NUM_COUNT);
    } else {
        // Addition and Multiplication: numbers from 1 to 10
        let availableNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        randomNumbers = getUniqueRandomNumbers(availableNumbers, NUM_COUNT);
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
function getNextOperatorForPossibleOutcomes(currNum, currOp, possibleChoices) {
    let ops = ['+', '-', '*', '/'];
    
    // Calculate all possible resulting numbers
    let allPossibleResults = possibleChoices.map(choice => 
        applyOperation(currNum, currOp, choice)
    );
    
    // Check if ALL possible results support division (have at least 5 factors)
    let allSupportDivision = allPossibleResults.every(result => 
        countFactors(result) >= 5
    );
    
    // If not all results support division, exclude it
    if (!allSupportDivision) {
        ops = ['+', '-', '*'];
    }
    
    return ops[Math.floor(Math.random() * ops.length)];
}

function getNewOperator(currNum) {
    let ops = ['+', '-', '*', '/'];
    
    // Count how many factors the current number has
    if (currNum !== undefined) {
        let factorCount = countFactors(currNum);
        
        // If there are fewer than 5 factors, exclude division operator
        if (factorCount < 5) {
            ops = ['+', '-', '*'];
        }
    }
    
    return ops[Math.floor(Math.random() * ops.length)];
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
