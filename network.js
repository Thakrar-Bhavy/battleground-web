/* ===================================
   NETWORK SYSTEM (PeerJS Multiplayer)
   =================================== */

// PeerJS connection
let peer;
let connections = [];
let playerId;
let gameRoomId;

// Create Room (Host)
function startHostConnection() {
  peer = new Peer(); // auto-generate ID
  peer.on("open", (id) => {
    playerId = id;
    gameRoomId = id;
    document.getElementById("roomInfo").innerText =
      "Room Created! Share this Room ID: " + id;
    console.log("Host ID:", id);
    setupPeerEvents();
    UI.startGameUI();
  });
}

// Join Room (Client)
function joinExistingRoom(roomId) {
  peer = new Peer();
  peer.on("open", (id) => {
    playerId = id;
    gameRoomId = roomId;

    const conn = peer.connect(roomId);
    conn.on("open", () => {
      conn.send({ type: "join", id: playerId, name: playerName });
      connections.push(conn);
      console.log("Joined room:", roomId);
      UI.startGameUI();
    });
    conn.on("data", handleNetworkData);
  });

  peer.on("connection", (conn) => {
    connections.push(conn);
    conn.on("data", handleNetworkData);
  });
}

// Setup host peer event
function setupPeerEvents() {
  peer.on("connection", (conn) => {
    connections.push(conn);
    conn.on("open", () => {
      conn.send({
        type: "welcome",
        id: playerId,
        name: playerName,
      });
    });
    conn.on("data", handleNetworkData);
  });
}

/* ===================================
   DATA EXCHANGE
   =================================== */

function broadcast(data) {
  for (const conn of connections) {
    if (conn.open) conn.send(data);
  }
}

function handleNetworkData(data) {
  switch (data.type) {
    case "join":
      console.log(data.name, "joined the game!");
      addRemotePlayer(data.id, data.name);
      break;

    case "state":
      updateRemotePlayer(data.id, data.x, data.y, data.angle);
      break;

    case "shoot":
      spawnRemoteBullet(data.id, data.x, data.y, data.angle);
      break;

    case "hit":
      UI.playSound("hit");
      break;

    default:
      console.log("Unknown data:", data);
  }
}

/* ===================================
   SEND PLAYER STATE TO OTHERS
   =================================== */

function sendPlayerState(x, y, angle) {
  broadcast({
    type: "state",
    id: playerId,
    x,
    y,
    angle,
  });
}

/* ===================================
   SEND BULLET DATA
   =================================== */

function sendShoot(x, y, angle) {
  broadcast({
    type: "shoot",
    id: playerId,
    x,
    y,
    angle,
  });
  UI.playSound("shoot");
}

/* ===================================
   EXPORT TO MAIN.JS
   =================================== */
window.Network = {
  sendPlayerState,
  sendShoot,
  broadcast,
  playerId,
};
