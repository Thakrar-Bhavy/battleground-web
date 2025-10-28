/* ===================================
   MAIN GAME LOGIC (v2)
   =================================== */

const canvasMain = document.getElementById("gameCanvas");
const ctxMain = canvasMain.getContext("2d");

let players = {};
let bullets = [];
let localPlayer = {
  id: null,
  name: "",
  x: Math.random() * 500 + 100,
  y: Math.random() * 300 + 100,
  angle: 0,
  speed: 3,
  alive: true,
  health: 100,
  score: 0,
  color: "#" + Math.floor(Math.random() * 16777215).toString(16),
};

/* ===================================
   PLAYER MANAGEMENT
   =================================== */
function addRemotePlayer(id, name) {
  if (!players[id]) {
    players[id] = {
      id,
      name,
      x: Math.random() * 500,
      y: Math.random() * 500,
      angle: 0,
      alive: true,
      health: 100,
      score: 0,
      color: "#" + Math.floor(Math.random() * 16777215).toString(16),
    };
  }
}

function updateRemotePlayer(id, x, y, angle) {
  if (players[id]) {
    players[id].x = x;
    players[id].y = y;
    players[id].angle = angle;
  }
}

function spawnRemoteBullet(id, x, y, angle) {
  bullets.push({ x, y, angle, speed: 7, owner: id });
}

/* ===================================
   MOVEMENT CONTROL
   =================================== */
let keys = {};
window.addEventListener("keydown", (e) => (keys[e.key] = true));
window.addEventListener("keyup", (e) => (keys[e.key] = false));

function moveLocalPlayer() {
  const moveX = UI.joystickVector.x;
  const moveY = UI.joystickVector.y;

  if (keys["w"] || moveY < -0.3) localPlayer.y -= localPlayer.speed;
  if (keys["s"] || moveY > 0.3) localPlayer.y += localPlayer.speed;
  if (keys["a"] || moveX < -0.3) localPlayer.x -= localPlayer.speed;
  if (keys["d"] || moveX > 0.3) localPlayer.x += localPlayer.speed;

  if (mouse) {
    localPlayer.angle = Math.atan2(mouse.y - localPlayer.y, mouse.x - localPlayer.x);
  }

  localPlayer.x = Math.max(0, Math.min(canvasMain.width, localPlayer.x));
  localPlayer.y = Math.max(0, Math.min(canvasMain.height, localPlayer.y));
}

/* ===================================
   MOUSE & SHOOT
   =================================== */
let mouse = null;
canvasMain.addEventListener("mousemove", (e) => {
  mouse = { x: e.clientX, y: e.clientY };
});
canvasMain.addEventListener("click", shootBullet);

function shootBullet() {
  if (!localPlayer.alive) return;
  const bullet = {
    x: localPlayer.x,
    y: localPlayer.y,
    angle: localPlayer.angle,
    speed: 7,
    owner: Network.playerId,
  };
  bullets.push(bullet);
  UI.playSound("shoot");
  Network.sendShoot(bullet.x, bullet.y, bullet.angle);
}

/* ===================================
   BULLET SYSTEM
   =================================== */
function updateBullets() {
  bullets.forEach((b) => {
    b.x += Math.cos(b.angle) * b.speed;
    b.y += Math.sin(b.angle) * b.speed;
  });
  bullets = bullets.filter(
    (b) => b.x > 0 && b.x < canvasMain.width && b.y > 0 && b.y < canvasMain.height
  );
}

function checkBulletHits() {
  bullets.forEach((b) => {
    // Hit remote players
    for (const id in players) {
      const p = players[id];
      if (p.alive && b.owner !== id) {
        const dx = p.x - b.x;
        const dy = p.y - b.y;
        if (Math.sqrt(dx * dx + dy * dy) < 15) {
          p.health -= 25;
          if (p.health <= 0) {
            p.alive = false;
            localPlayer.score += 1;
            UI.playSound("hit");
            Network.broadcast({ type: "hit", id });
          }
        }
      }
    }
  });
}

/* ===================================
   RESPAWN SYSTEM
   =================================== */
function respawnPlayer(p) {
  p.x = Math.random() * canvasMain.width;
  p.y = Math.random() * canvasMain.height;
  p.alive = true;
  p.health = 100;
}

/* ===================================
   DRAWING
   =================================== */
function render() {
  ctxMain.clearRect(0, 0, canvasMain.width, canvasMain.height);

  // Background
  ctxMain.fillStyle = "#111";
  ctxMain.fillRect(0, 0, canvasMain.width, canvasMain.height);

  // Draw local player
  if (localPlayer.alive) drawPlayer(localPlayer);

  // Draw other players
  for (const id in players) {
    const p = players[id];
    if (p.alive) drawPlayer(p);
  }

  // Draw bullets
  bullets.forEach((b) => {
    ctxMain.fillStyle = "yellow";
    ctxMain.beginPath();
    ctxMain.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctxMain.fill();
  });

  // Draw UI overlays
  drawUI();
}

function drawPlayer(p) {
  ctxMain.save();
  ctxMain.translate(p.x, p.y);
  ctxMain.rotate(p.angle);
  ctxMain.fillStyle = p.color;
  ctxMain.beginPath();
  ctxMain.arc(0, 0, 15, 0, Math.PI * 2);
  ctxMain.fill();
  ctxMain.restore();

  // Health bar
  ctxMain.fillStyle = "red";
  ctxMain.fillRect(p.x - 20, p.y - 25, 40, 5);
  ctxMain.fillStyle = "lime";
  ctxMain.fillRect(p.x - 20, p.y - 25, (p.health / 100) * 40, 5);
}

/* ===================================
   SCOREBOARD + INFO
   =================================== */
function drawUI() {
  ctxMain.fillStyle = "white";
  ctxMain.font = "16px Arial";
  ctxMain.fillText("Health: " + localPlayer.health, 20, 25);
  ctxMain.fillText("Score: " + localPlayer.score, 20, 50);

  let y = 25;
  for (const id in players) {
    const p = players[id];
    ctxMain.fillText(`${p.name}: ${p.score}`, canvasMain.width - 150, y);
    y += 20;
  }
}

/* ===================================
   MAIN LOOP
   =================================== */
function gameLoop() {
  moveLocalPlayer();
  updateBullets();
  checkBulletHits();
  render();

  Network.sendPlayerState(localPlayer.x, localPlayer.y, localPlayer.angle);

  // Respawn local player after death
  if (!localPlayer.alive) {
    setTimeout(() => respawnPlayer(localPlayer), 3000);
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
