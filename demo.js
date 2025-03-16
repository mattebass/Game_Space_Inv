import { SequiturRecorder } from './js/recorder/sequiturRecorder.js';
import { SequiturPlayer } from './js/player/sequiturPlayer.js';
import { ScoreManager } from './js/core/scoreManager.js';

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('canvas');
/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext('2d');
/** @type {HTMLButtonElement} */
const recordBtn = document.getElementById('recordBtn');
/** @type {HTMLButtonElement} */
const playBtn = document.getElementById('playBtn');
/** @type {HTMLButtonElement} */
const loadBtn = document.getElementById('loadBtn');

/** 
 * Circle object representing the movable shape on canvas
 * @type {{
 *   x: number,
 *   y: number,
 *   radius: number,
 *   moveLeft: boolean,
 *   moveRight: boolean,
 *   moveUp: boolean,
 *   moveDown: boolean
 * }}
 */
const circle = {
    x: 200,
    y: 200,
    radius: 10,
    moveLeft: false,
    moveRight: false,
    moveUp: false,
    moveDown: false
};

/** @type {SequiturRecorder} */
const recorder = new SequiturRecorder();
/** @type {SequiturPlayer} */
const player = new SequiturPlayer();
/** @type {boolean} */
let isRecording = false;
/** @type {number} */
let currentFrame = 0;

/**
 * Draws the circle on the canvas with current position and state
 */
function drawCircle() {
    ctx.beginPath();
    ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
    ctx.fillStyle = isRecording ? 'red' : 'blue';
    ctx.fill();
    ctx.closePath();
}

/**
 * Clears the entire canvas
 */
function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Main animation loop that updates circle position and handles recording/playback
 */
function update() {
    if (circle.moveLeft) circle.x = Math.max(circle.radius, circle.x - 2);
    if (circle.moveRight) circle.x = Math.min(canvas.width - circle.radius, circle.x + 2);
    if (circle.moveUp) circle.y = Math.max(circle.radius, circle.y - 2);
    if (circle.moveDown) circle.y = Math.min(canvas.height - circle.radius, circle.y + 2);

    clear();
    drawCircle();

    if (isRecording) {
        currentFrame++;
    } else if (player.isPlaying) {
        player.step();
    }

    requestAnimationFrame(update);
}

/**
 * Handles keydown events during recording
 * @param {KeyboardEvent} e - The keyboard event
 */
function handleKeyDown(e) {
    if (!isRecording) return;
    
    switch(e.key) {
        case 'ArrowLeft':
            if (!circle.moveLeft) {
                recorder.recordEvent(currentFrame, 'moveLeft', true);
                circle.moveLeft = true;
            }
            break;
        case 'ArrowRight':
            if (!circle.moveRight) {
                recorder.recordEvent(currentFrame, 'moveRight', true);
                circle.moveRight = true;
            }
            break;
        case 'ArrowUp':
            if (!circle.moveUp) {
                recorder.recordEvent(currentFrame, 'moveUp', true);
                circle.moveUp = true;
            }
            break;
        case 'ArrowDown':
            if (!circle.moveDown) {
                recorder.recordEvent(currentFrame, 'moveDown', true);
                circle.moveDown = true;
            }
            break;
    }
}

/**
 * Handles keyup events during recording
 * @param {KeyboardEvent} e - The keyboard event
 */
function handleKeyUp(e) {
    if (!isRecording) return;
    
    switch(e.key) {
        case 'ArrowLeft':
            recorder.recordEvent(currentFrame, 'moveLeft', false);
            circle.moveLeft = false;
            break;
        case 'ArrowRight':
            recorder.recordEvent(currentFrame, 'moveRight', false);
            circle.moveRight = false;
            break;
        case 'ArrowUp':
            recorder.recordEvent(currentFrame, 'moveUp', false);
            circle.moveUp = false;
            break;
        case 'ArrowDown':
            recorder.recordEvent(currentFrame, 'moveDown', false);
            circle.moveDown = false;
            break;
    }
}

// Event Listeners

/**
 * Handles record button clicks to start/stop recording
 */
recordBtn.addEventListener('click', async () => {
    if (!isRecording) {
        isRecording = true;
        currentFrame = 0;
        recordBtn.textContent = 'Stop Recording';
        
        circle.x = 200;
        circle.y = 200;
        
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
    } else {
        isRecording = false;
        recordBtn.textContent = 'Start Recording';
        playBtn.disabled = false;
        
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        
        await recorder.saveRecording();
        player.loadScore(recorder.getScore());
    }
});

/**
 * Handles play button clicks to start playback
 */
playBtn.addEventListener('click', () => {
    // Reset circle position and state
    circle.x = 200;
    circle.y = 200;
    circle.moveLeft = false;
    circle.moveRight = false;
    circle.moveUp = false;
    circle.moveDown = false;

    console.log('Starting playback');
    player.observe(circle, 'keys'); // Make sure 'keys' matches the track name in your recording
    player.play();
});

/**
 * Handles load button clicks to load a saved recording
 */
loadBtn.addEventListener('click', async () => {
    const success = await ScoreManager.loadScore();
    if (success) {
        const score = ScoreManager.getActiveScore();
        console.log('Loaded score:', score);
        player.loadScore(score);
        playBtn.disabled = false;
    }
});

// Start animation loop
requestAnimationFrame(update);