import uWs from "uWebSockets.js";
import User from "./src/models/User.js";
import { Message } from "./src/protobuf/index.js";
import { emitter } from "./src/emitter/index.js";

/**
 * PORT               === 서버 포트
 * sockets            === sockets 맵
 * users              === users 맵
 * isDisableKeepAlive === keepalive 설정
 * deviceID           === 디바이스 인덱스
 * server             === 스레드 === 서버
 * sp                 === 공간
 * ch                 === 채널
 * targetServerName   === 타겟 서버 명
 * decoder            === message가 바이너리가 아닐 때
 */
const PORT = process.env.NODE_ENV === "development" ? 4000 : 3000;
const sockets = new Map();
const users = new Map();
let isDisableKeepAlive = false;
let deviceID = 0;
let currentServer = 1;
let sp = "a"; // 공간은 URL 배정 받음
let targetServerName = "";
const decoder = new TextDecoder();

const app = uWs
  .App({})
  .ws(`/*`, {
    /* Options */
    idleTimeout: 32,
    maxBackpressure: 1024,
    maxPayloadLength: 1024, // 패킷 데이터 용량 (용량이 넘을 시 서버 끊김)
    compression: uWs.DEDICATED_COMPRESSOR_3KB,
    /* Handlers */
    upgrade: upgradeHandler,
    open: openHandler,
    message: messageHandler,
    drain: drainHandler,
    close: closeHandler,
  })
  // port는 숫자여야합니다. 아니면 열리지 않습니다... 😂
  .listen(PORT, (listenSocket) => {
    console.log(`listening on ws://locahost:${PORT}`);
    if (listenSocket) {
      console.log(`${PORT}번 포트 열었음`);
    }
  });

function upgradeHandler(res, req, context) {
  /**
   * 쿼리 가지고 옴
   */
  const params = Object.fromEntries(
    req
      .getQuery()
      .split("&")
      .filter((q) => q)
      .map((q) => q.split("="))
  );
  const hostArray = req.getHeader("origin").match(/http(s)?:\/\/([\w\W]+)/);
  const href = req.getHeader("origin") + req.getUrl() + "?" + req.getQuery();
  const host = hostArray ? hostArray[2] : "test";
  const space = (params.sp || "A").toLowerCase();
  res.upgrade(
    {
      url: req.getUrl(),
      params: params,
      /* 파라미터 추가되는 값 아래에 필드 추가 */
      space: space,
      href: href,
      host: host,
    },
    /* Spell these correctly */
    req.getHeader("sec-websocket-key"),
    req.getHeader("sec-websocket-protocol"),
    req.getHeader("sec-websocket-extensions"),
    context
  );
}

function openHandler(ws) {
  const { url, params, space, href, host } = ws;
  if (!Boolean(params.sp)) return;

  deviceID++;

  if (isDisableKeepAlive) {
    ws.close();
  }

  sp = params.sp;

  const user = new User({
    id: null,
    type: "viewer",
    timestamp: new Date().getTime(),
    deviceID: deviceID,
    server: currentServer,
    space: sp,
    host: host,
  }).toJSON();

  /**
   * 전체 서버 구독
   */
  ws.subscribe("server");
  sockets.set(ws, deviceID);
  users.set(ws, user);

  targetServerName = `server${user.server}`;
  emitter.emit(`${targetServerName}::open`, app, ws, users.get(ws));
}

function messageHandler(ws, message, isBinary) {
  if (isBinary) {
    /** // NOTICE: 로케이션으로 변경
     * Player 로그인 시 / protobuf 메세지
     */
    let messageObject = JSON.parse(
      JSON.stringify(Message.decode(new Uint8Array(message)))
    );
    emitter.emit(`${targetServerName}::location`, app, messageObject, message);
  } else {
    // 로그인 데이터 받음
    const data = JSON.parse(decoder.decode(message));
    // NEW: 클라이언트 데이터 규격 맞춤
    if (data.type === "player") {
      const overrideUserData = Object.assign(users.get(ws), data);
      users.set(ws, overrideUserData);
      try {
        emitter.emit(`${targetServerName}::login`, app, users.get(ws));
      } catch (e) {}
    } else if (data.type === "viewer") {
      // 뷰어 데이터 덮어쓰기
      const overrideUserData = Object.assign(users.get(ws), data);
      users.set(ws, overrideUserData);
      try {
        emitter.emit(`${targetServerName}::viewer`, app, users.get(ws));
      } catch (e) {}
    } else if (data.type === "chat") {
      try {
        emitter.emit(`chat`, app, data, message);
      } catch (e) {}
    }
  }
}

function drainHandler(ws) {
  console.log("WebSocket backpressure: " + ws.getBufferedAmount());
}

function closeHandler(ws, code, message) {
  console.log("WebSocket closed");
  try {
    emitter.emit(`${targetServerName}::close`, app, users.get(ws));
  } catch (e) {}
}

/**
 * // NOTICE: pm2 서버 무한 실행 문제 발생
 * 서버 부하 검사
 */
// emitter.on(`receive::balancer`, (state, serverName) => {
//   const serverNumber = Number(serverName.match(/server([\d]+)/)[1]);
//   // console.log(serverNumber);
//   if (state === "busy") {
//     currentServer += 1; // 서버 수 증가
//     console.log(currentServer, "번 서버 실행!");
//     console.log("it's too busy!!");
//   } else if (state === "comfortable") {
//     console.log("comfortable!");
//   }
// });

/**
 * 프로세스 죽었을 때 SIGINT 이벤트 전달
 */
process.on("SIGINT", function () {
  isDisableKeepAlive = true;
  app.close(function () {
    process.exit(0);
  });
});

process.send("ready");

export { app };
