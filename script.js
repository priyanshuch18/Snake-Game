// --- DOM references ---
const board = document.querySelector('.board');              // main game board (grid container)
const startBtn = document.querySelector('.btn-start');      // start button inside modal
const modal = document.querySelector('.modal');             // overlay modal (start / game over)
const startGameModal = document.querySelector('.start-game');
const gameOverModal = document.querySelector('.game-over');
const restartBtn = document.querySelector('.btn-restart');  // restart button in game-over view
const highScoreElement = document.querySelector('.high-score');
const scoreElement = document.querySelector('.score');
const timeElement = document.querySelector('.time');        // shows elapsed time


// --- Layout constants (match CSS grid cell size) ---
const blockHeight = 30; // px - height of each grid cell
const blockWidth = 30;  // px - width of each grid cell


// --- Game state ---
let score = 0;
// highScore stored as string in localStorage, fallback to 0
let highScore = Number(localStorage.getItem('highScore')) || 0;
let time = `00:00`; // displayed as MM:SS
highScoreElement.innerText = highScore;

// Compute how many columns/rows fit in the board currently (based on its clientWidth/clientHeight)
const cols = Math.floor(board.clientWidth / blockWidth);
const rows = Math.floor(board.clientHeight / blockHeight);

// blocks will be used as a map: key = "row-col" -> DOM element for that cell
const blocks = [];

// Snake represented as an array of segments; each segment is {x: row, y: col}
// The head of the snake is snake[0]
let snake = [ { x: 2, y: 2 } ];

// current moving direction: 'left'|'right'|'up'|'down'
let direction = 'right';

// interval ids for the game loop and timer so we can clear them later
let intervalId = null;
let timerIntervalId = null; // declared explicitly (was implicitly global before)

// place initial food at a random location on the grid
let food = { x: Math.floor(Math.random() * rows), y: Math.floor(Math.random() * cols) };


// for (let i = 0; i < cols*rows; i++) {
//     const block = document.createElement('div');
//     block.classList.add("block")
    
//     board.appendChild(block);
// }

// Create the grid cells and keep references in `blocks` for quick access.
// We use a simple string key "row-col" to index the cell DOM element.
for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
        const block = document.createElement('div');
        block.classList.add('block');
        board.appendChild(block);
        blocks[`${row}-${col}`] = block;
    }
}
        
function renderSnake() {
    // Copy the current head (we'll update its coordinates based on direction)
    let head = { ...snake[0] };

    // Ensure the food is rendered on the board (in case it was just created)
    blocks[`${food.x}-${food.y}`].classList.add('food');

    // Move head position based on current direction
    switch (direction) {
        case 'left':
            head.y -= 1;
            break;
        case 'right':
            head.y += 1;
            break;
        case 'up':
            head.x -= 1;
            break;
        case 'down':
            head.x += 1;
            break;
    }

    // Collision with walls -> game over
    if (head.x < 0 || head.x >= rows || head.y < 0 || head.y >= cols) {
        // stop the game loop and show game-over UI
        clearInterval(intervalId);
        clearInterval(timerIntervalId);
        modal.style.display = 'flex';
        startGameModal.style.display = 'none';
        gameOverModal.style.display = 'flex';
        return;
    }

    // If we ate food: grow snake (by adding new head and not removing tail), respawn food, and update score
    if (head.x === food.x && head.y === food.y) {
        // remove 'food' class from the old food cell and pick a new random spot
        blocks[`${food.x}-${food.y}`].classList.remove('food');
        food = { x: Math.floor(Math.random() * rows), y: Math.floor(Math.random() * cols) };
        blocks[`${food.x}-${food.y}`].classList.add('food');

        // add new head (snake grows)
        snake.unshift(head);

        // update score and high score
        score += 10;
        scoreElement.innerText = score;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore.toString());
            highScoreElement.innerText = highScore;
        }

        // After eating, we return early because we've already updated the snake shape above
    }

    // Clear the visual 'fill' class for all current snake segments (we'll redraw below)
    snake.forEach(segment => {
        blocks[`${segment.x}-${segment.y}`].classList.remove('fill');
    });

    // Move the snake forward: add new head and remove tail to keep length constant
    snake.unshift(head);
    snake.pop();

    // Draw the snake on the board by adding 'fill' to each occupied cell
    snake.forEach(segment => {
        blocks[`${segment.x}-${segment.y}`].classList.add('fill');
    });
}


// intervalId = setInterval(() => {

//     renderSnake();
//     }, 300);

// Start game when user clicks Start
startBtn.addEventListener('click', () => {
    modal.style.display = 'none';

    // Main game loop: update snake position every 300ms
    intervalId = setInterval(() => {
        renderSnake();
    }, 300);

    // Timer: increment displayed time every second
    timerIntervalId = setInterval(() => {
        let [minutes, seconds] = time.split(':').map(Number);
        seconds++;
        if (seconds === 60) {
            seconds = 0;
            minutes++;
        }
        time = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        timeElement.innerText = time;
    }, 1000);
});



// Restart the game from the game-over modal
restartBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    restartGame();
    intervalId = setInterval(() => {
        renderSnake();
    }, 300);
    // restart timer as well
    timerIntervalId = setInterval(() => {
        let [minutes, seconds] = time.split(':').map(Number);
        seconds++;
        if (seconds === 60) {
            seconds = 0;
            minutes++;
        }
        time = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        timeElement.innerText = time;
    }, 1000);
});

function restartGame() {
    direction = 'right';
    // snake.length = 0;
    snake.forEach(segment => {
        blocks[`${segment.x}-${segment.y}`].classList.remove('fill');
    });
        score = 0;      
        scoreElement.innerText = score;
        time = `00:00`;
    snake=[{x: 2, y: 2}];
    direction = 'right';
    blocks[`${food.x}-${food.y}`].classList.remove('food');
    food = {x: Math.floor(Math.random()*rows), y: Math.floor(Math.random()*cols)};
    blocks[`${food.x}-${food.y}`].classList.add('food');
}



// Simple keyboard controls: arrow keys change the direction of movement.
// (There is no prevention of reversing into the snake's own body in this simple version.)
document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowLeft':
            direction = 'left';
            break;
        case 'ArrowRight':
            direction = 'right';
            break;
        case 'ArrowUp':
            direction = 'up';
            break;
        case 'ArrowDown':
            direction = 'down';
            break;
    }
});

// Mobile swipe controls: detect swipe gestures on touch devices
let touchStartX = 0;
let touchStartY = 0;
const minSwipeDistance = 30; // Minimum pixels to register as swipe (lowered for sensitivity)

document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchmove', (e) => {
    // Prevent scrolling if it's a potential swipe
    if (touchStartX && touchStartY) {
        const deltaX = e.touches[0].clientX - touchStartX;
        const deltaY = e.touches[0].clientY - touchStartY;
        if (Math.abs(deltaX) > 20 || Math.abs(deltaY) > 20) {
            e.preventDefault();
        }
    }
});

document.addEventListener('touchend', (e) => {
    if (!touchStartX || !touchStartY) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Determine swipe direction based on larger delta
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
            direction = deltaX > 0 ? 'right' : 'left';
        }
    } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
            direction = deltaY > 0 ? 'down' : 'up';
        }
    }

    // Reset for next swipe
    touchStartX = 0;
    touchStartY = 0;
});