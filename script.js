// Simple Pong game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const playerScoreEl = document.getElementById('playerScore');
const computerScoreEl = document.getElementById('computerScore');
const startBtn = document.getElementById('startBtn');

const W = canvas.width;
const H = canvas.height;

// Game objects
const paddleWidth = 12;
const paddleHeight = 100;

const player = {
  x: 20,
  y: (H - paddleHeight) / 2,
  width: paddleWidth,
  height: paddleHeight,
  speed: 6,
  dy: 0
};

const computer = {
  x: W - 20 - paddleWidth,
  y: (H - paddleHeight) / 2,
  width: paddleWidth,
  height: paddleHeight,
  speed: 4 // AI speed
};

const ball = {
  x: W / 2,
  y: H / 2,
  r: 8,
  speed: 6,
  vx: 6,
  vy: 0
};

let playerScore = 0;
let computerScore = 0;

let running = false;
let animationId = null;

// Helpers
function clamp(val, a, b) {
  return Math.max(a, Math.min(b, val));
}

function resetBall(servingToPlayer = false) {
  ball.x = W / 2;
  ball.y = H / 2;
  ball.speed = 6;
  const angle = (Math.random() * Math.PI / 3) - (Math.PI / 6); // -30 to +30 deg
  const dir = servingToPlayer ? -1 : 1;
  ball.vx = dir * ball.speed * Math.cos(angle);
  ball.vy = ball.speed * Math.sin(angle);
}

// Collision detection: ball vs paddle (circle vs rect)
function ballHitsPaddle(b, p) {
  // Find closest point on paddle to ball center
  const closestX = clamp(b.x, p.x, p.x + p.width);
  const closestY = clamp(b.y, p.y, p.y + p.height);
  const dx = b.x - closestX;
  const dy = b.y - closestY;
  return (dx * dx + dy * dy) <= (b.r * b.r);
}

// Game update loop
function update() {
  // Move player by keyboard velocity
  player.y += player.dy;
  // Ensure player stays in bounds
  player.y = clamp(player.y, 0, H - player.height);

  // Computer AI: move toward the ball's y with limited speed
  const targetY = ball.y - computer.height / 2;
  const diff = targetY - computer.y;
  // Move proportional but limited by computer.speed
  if (Math.abs(diff) > 1) {
    computer.y += clamp(diff * 0.12, -computer.speed, computer.speed);
    computer.y = clamp(computer.y, 0, H - computer.height);
  }

  // Ball movement
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Wall collisions
  if (ball.y - ball.r <= 0) {
    ball.y = ball.r;
    ball.vy = -ball.vy;
  } else if (ball.y + ball.r >= H) {
    ball.y = H - ball.r;
    ball.vy = -ball.vy;
  }

  // Paddle collisions
  if (ball.vx < 0 && ballHitsPaddle(ball, player)) {
    // reflect and add spin based on hit position
    const relative = (ball.y - (player.y + player.height / 2)) / (player.height / 2); // -1..1
    const maxBounce = Math.PI / 3; // 60 degrees
    const bounceAngle = relative * maxBounce;
    const speedIncrease = 1.05;
    const newSpeed = Math.min(14, Math.hypot(ball.vx, ball.vy) * speedIncrease);
    ball.vx = Math.abs(newSpeed * Math.cos(bounceAngle));
    ball.vy = newSpeed * Math.sin(bounceAngle);
    // nudge ball out to avoid sticking
    ball.x = player.x + player.width + ball.r + 0.5;
  } else if (ball.vx > 0 && ballHitsPaddle(ball, computer)) {
    const relative = (ball.y - (computer.y + computer.height / 2)) / (computer.height / 2);
    const maxBounce = Math.PI / 3;
    const bounceAngle = relative * maxBounce;
    const speedIncrease = 1.05;
    const newSpeed = Math.min(14, Math.hypot(ball.vx, ball.vy) * speedIncrease);
    ball.vx = -Math.abs(newSpeed * Math.cos(bounceAngle));
    ball.vy = newSpeed * Math.sin(bounceAngle);
    ball.x = computer.x - ball.r - 0.5;
  }

  // Score check
  if (ball.x - ball.r <= 0) {
    // Computer scores
    computerScore += 1;
    computerScoreEl.textContent = computerScore;
    resetBall(true); // serve toward player (ball moves right-to-left)
  } else if (ball.x + ball.r >= W) {
    // Player scores
    playerScore += 1;
    playerScoreEl.textContent = playerScore;
    resetBall(false);
  }
}

function drawNet() {
  const step = 16;
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  const centerX = W / 2;
  for (let y = 10; y < H; y += step) {
    ctx.fillRect(centerX - 1, y, 2, 10);
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  // Background gradient
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, 'rgba(7,17,34,0.5)');
  g.addColorStop(1, 'rgba(4,10,18,0.6)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Net
  drawNet();

  // Paddles
  ctx.fillStyle = '#9be7ff';
  ctx.fillRect(player.x, player.y, player.width, player.height);
  ctx.fillRect(computer.x, computer.y, computer.width, computer.height);

  // Ball
  ctx.beginPath();
  ctx.fillStyle = '#fff8';
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.closePath();
}

function loop() {
  update();
  draw();
  animationId = requestAnimationFrame(loop);
}

function startGame() {
  if (animationId) cancelAnimationFrame(animationId);
  playerScore = 0;
  computerScore = 0;
  playerScoreEl.textContent = playerScore;
  computerScoreEl.textContent = computerScore;
  player.y = (H - player.height) / 2;
  computer.y = (H - computer.height) / 2;
  resetBall(Math.random() < 0.5);
  running = true;
  loop();
}

// Input handling: mouse
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleY = canvas.height / rect.height; // handle CSS scaling
  const mouseY = (e.clientY - rect.top) * scaleY;
  player.y = clamp(mouseY - player.height / 2, 0, H - player.height);
});

// Keyboard input: up/down arrows
const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (e.code === 'ArrowUp') {
    player.dy = -player.speed;
  } else if (e.code === 'ArrowDown') {
    player.dy = player.speed;
  }
});
window.addEventListener('keyup', (e) => {
  keys[e.code] = false;
  if (!keys['ArrowUp'] && !keys['ArrowDown']) {
    player.dy = 0;
  } else if (keys['ArrowUp']) {
    player.dy = -player.speed;
  } else if (keys['ArrowDown']) {
    player.dy = player.speed;
  }
});

// Start button
startBtn.addEventListener('click', startGame);

// Start initially paused — show initial state
resetBall(true);
draw();
