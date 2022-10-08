import { Message, declareProtobuf } from "./src/model/Message";
import User from "./src/model/user";

/**
 * general variables
 */
let ws = null;
let myId = null;
let socket = null;
let toggle = {
  w: false,
  s: false,
  a: false,
  d: false,
};
const SPEED = 5;
const users = [];
const usersMap = new Map();

const param = Object.fromEntries(
  location.search
    .slice(1)
    .split("&")
    .map((q) => q.split("="))
);

const connect = () => {
  ws = new WebSocket(`ws://localhost:3000/server?sp=${param.sp || "A"}`);
  ws.binaryType = "arraybuffer";
  ws.onopen = handleOpen;
  ws.onmessage = handleMessage;
  ws.onerror = handleError;
  ws.onclose = handleClose;
};

connect();

function handleOpen(e) {
  console.log("서버에 연결되었습니다.");
  renderLogin(ws);
}
function handleMessage(message) {
  if (message.data instanceof Blob) {
    /*  */
  } else if (message.data instanceof ArrayBuffer) {
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(message.data);
    const object = JSON.parse(jsonString.match(/(\{(.+?)\})/)[0]);
    if (object instanceof Array) {
      // array인 경우는 아직 없음.
      object.forEach((obj) => {
        if (obj.hasOwnProperty("type")) {
          // login
          users.push(obj);
          usersMap.set(obj.deviceID, obj);
        } else {
          // location
          if (!obj) return;
          const user = usersMap.get(obj.deviceID);
          user.pox = obj.pox;
          user.poy = obj.poy;
        }
      });
    } else {
      if (object.hasOwnProperty("type")) {
        // 다른 유저 접속 감지 후 추가
        if (!object) return;
        users.push(object);
        usersMap.set(object.deviceID, object);
      } else {
        // 유저가 움직일 때 브로드캐스트로 받음
        if (!object) return;
        const user = usersMap.get(object.deviceID);
        if (user) {
          user.pox = object.pox;
          user.poy = object.poy;
        }
      }
    }
  } else if (typeof message.data === "string") {
    const players = JSON.parse(message.data);

    if (players instanceof Array) {
      /* 로그인때 받음 */
      users.push(...players);
      users.forEach((user) => {
        usersMap.set(user.deviceID, user);
      });
    } else if (typeof players === "number") {
      /* 유저 나갔을 때 */
      const index = users.findIndex((user) => user.deviceID === players);
      if (index > -1) {
        users.splice(index, 1);
      }
      usersMap.delete(String(players));
    } else {
      /* open 시 받는 접속되어있는 플레이어 정보 */
      myId = players.deviceID;
    }
  }
}
function handleError(e) {
  console.log(e);
}
function handleClose(e) {
  console.log(e);
}

let canvas = null;
let ctx = null;
let frame = 0;

function renderLogin(ws) {
  socket = ws;
  const target = logins;
  target.innerHTML = `<form onsubmit="return false;" id="loginWindow">
		<input id="nickName" type="text" class="border-set padding-set" />
		<button class="border-set padding-set btn" onclick="handleLogin()">Login</button>
	</form>`;
}

function handleLogin() {
  const nickNames = nickName.value;
  const user = new User({
    id: 1,
    type: "player",
    nickname: nickNames,
    device: "labtop",
    state: "online",
    pox: innerWidth / 2 - 35 / 2,
    poy: innerHeight / 2 - 35 / 2,
    poz: 0,
    roy: 0,
  }).toJSON();
  // 작동 안되는 이유는 User class에서 type없으면 모두 널 값이 되도록 해서.

  socket.send(Message.encode(declareProtobuf.setMessage(user)).finish());

  clear();

  setTimeout(() => {
    const found = users.find((user) => user.nickname === nickNames);
    if (!found) {
			/* 사용량이 많을 때 로그인 안되는 이슈 발생 */
      renderLogin(socket);
    }
  }, 100);
}
window.handleLogin = handleLogin;

/**
 * 로그인 창 제거
 */
function clear() {
  const target = logins;
  target.innerHTML = "";
}

renderCanvas();

/**
 * 캔버스 렌더링
 */
function renderCanvas() {
  const target = document.body;
  canvas = document.createElement("canvas");
  canvas.id = "canvas";

  target.append(canvas);

  canvas = canvas;
  ctx = canvas.getContext("2d");

  update();
}

function update() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  requestAnimationFrame(animate);
}

function animate() {
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  users.forEach((user) => {
    ctx.fillText(user.nickname, user.pox + 35 / 2, user.poy - 15);
    ctx.textAlign = "center";
    ctx.fillRect(user.pox, user.poy, 35, 35);
  });

  let player = usersMap.get(myId);
  if (player) {
    if (toggle.w) {
      player.poy -= SPEED;
    }
    if (toggle.s) {
      player.poy += SPEED;
    }
    if (toggle.a) {
      player.pox -= SPEED;
    }
    if (toggle.d) {
      player.pox += SPEED;
    }

    if ([...Object.values(toggle)].some((tg) => tg === true)) {
      sendData();
    }
  }

  frame += 0.1;

  requestAnimationFrame(animate);
}

let autoFrame = 0;
let toggleAuto = false;
function automove() {
  if (!toggleAuto) return;

  autoFrame += 0.01;
  if (myId !== null) {
    let player = usersMap.get(myId);
    // console.log(Math.cos(autoFrame));
    player.pox += Math.cos(autoFrame) * 2;
    sendData();
    requestAnimationFrame(automove);
  }
}

function autoUpdate() {
  toggleAuto = !toggleAuto;
  automove();
}
window.automove = autoUpdate;

function sendData() {
  const player = usersMap.get(myId);
  if (player) {
    // console.log(player);
    socket.send(
      JSON.stringify(
        Object.assign(player, {
          deviceID: player.deviceID,
          pox: player.pox,
          poy: player.poy,
          poz: player.poz,
          roy: player.roy,
        })
      )
    );
  }
}

window.addEventListener("keydown", handleKeyDown);
window.addEventListener("keyup", handleKeyUp);
window.addEventListener("blur", () => {
  toggle.w = false;
  toggle.s = false;
  toggle.a = false;
  toggle.d = false;
});

function handleKeyDown(e) {
  toggle[e.key] = true;
}

function handleKeyUp(e) {
  toggle[e.key] = false;
}
