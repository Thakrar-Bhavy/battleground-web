/* ===========================
   UI & CONTROL SYSTEM
   =========================== */

// DOM Elements
const lobby = document.getElementById("lobby");
const playerNameInput = document.getElementById("playerName");
const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const joinRoomInput = document.getElementById("joinRoomInput");
const roomIdInput = document.getElementById("roomIdInput");
const joinNowBtn = document.getElementById("joinNowBtn");
const roomInfo = document.getElementById("roomInfo");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const joystickContainer = document.getElementById("joystickContainer");
const joystick = document.getElementById("joystick");
const shootBtn = document.getElementById("shootBtn");
const mobileControls = document.getElementById("mobileControls");

// Resize canvas to screen
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/* ===========================
   LOBBY HANDLING
   =========================== */

let playerName = "";
let roomId = "";
let isHost = false;

// Create Room
createRoomBtn.onclick = () => {
  playerName = playerNameInput.value.trim() || "Player";
  isHost = true;
  startHostConnection();
};

// Join Room UI
joinRoomBtn.onclick = () => {
  joinRoomInput.style.display = "block";
};

// Join Existing Room
joinNowBtn.onclick = () => {
  playerName = playerNameInput.value.trim() || "Player";
  roomId = roomIdInput.value.trim();
  if (roomId === "") return alert("Enter Room ID!");
  isHost = false;
  joinExistingRoom(roomId);
};

// Switch from lobby to game
function startGameUI() {
  lobby.style.display = "none";
  canvas.style.display = "block";
  mobileControls.style.display = "flex";
}

/* ===========================
   MOBILE JOYSTICK CONTROL
   =========================== */

let joystickActive = false;
let joystickCenter = { x: 0, y: 0 };
let joystickVector = { x: 0, y: 0 };

joystickContainer.addEventListener("touchstart", (e) => {
  e.preventDefault();
  joystickActive = true;
  const touch = e.touches[0];
  const rect = joystickContainer.getBoundingClientRect();
  joystickCenter.x = rect.left + rect.width / 2;
  joystickCenter.y = rect.top + rect.height / 2;
});

joystickContainer.addEventListener("touchmove", (e) => {
  if (!joystickActive) return;
  const touch = e.touches[0];
  const dx = touch.clientX - joystickCenter.x;
  const dy = touch.clientY - joystickCenter.y;
  const distance = Math.min(Math.sqrt(dx * dx + dy * dy), 40);
  const angle = Math.atan2(dy, dx);

  joystickVector.x = Math.cos(angle) * (distance / 40);
  joystickVector.y = Math.sin(angle) * (distance / 40);

  joystick.style.left = 25 + joystickVector.x * 25 + "px";
  joystick.style.top = 25 + joystickVector.y * 25 + "px";
});

joystickContainer.addEventListener("touchend", () => {
  joystickActive = false;
  joystickVector = { x: 0, y: 0 };
  joystick.style.left = "25px";
  joystick.style.top = "25px";
});

/* ===========================
   SHOOT BUTTON
   =========================== */
shootBtn.addEventListener("touchstart", () => {
  if (typeof shootBullet === "function") {
    shootBullet();
  }
});

/* ===========================
   SOUND SYSTEM
   =========================== */
const sounds = {
  shoot: new Audio("sounds/shoot.mp3"),
  hit: new Audio("sounds/hit.mp3"),
  death: new Audio("sounds/death.mp3"),
};

function playSound(name) {
  if (sounds[name]) {
    sounds[name].currentTime = 0;
    sounds[name].play().catch(() => {});
  }
}

/* ===========================
   EXPORTS FOR MAIN GAME
   =========================== */
window.UI = {
  startGameUI,
  joystickVector,
  playSound,
};
