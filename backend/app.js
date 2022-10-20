import protobuf from "protobufjs";
import uWs from "uWebSockets.js";
import broker from "./src/models/DataBroker.js";
import dev from "./src/models/DevConsole.js";
import { servers } from "./src/models/ServerBalancer.js";
import User from "./src/models/User.js";
import { spaces } from "./workers/server.js";

// ---------- protobuf js ------------
var Type = protobuf.Type,
  Field = protobuf.Field;
function ProtoBuf(properties) {
  protobuf.Message.call(this, properties);
}
(ProtoBuf.prototype = Object.create(protobuf.Message)).constructor = ProtoBuf;

/* Field Settings */
Field.d(1, "fixed32", "required")(ProtoBuf.prototype, "id");
Field.d(2, "float", "required")(ProtoBuf.prototype, "pox");
Field.d(3, "float", "required")(ProtoBuf.prototype, "poy");
Field.d(4, "float", "required")(ProtoBuf.prototype, "poz");
Field.d(5, "sfixed32", "required")(ProtoBuf.prototype, "roy");

/**
 * PORT               === 서버 포트
 * sockets            === sockets 맵
 * users              === users 맵
 * isDisableKeepAlive === keepalive 설정
 * deviceID           === 디바이스 인덱스
 * currentServer      === 스레드 === 서버
 * sp                 === 공간
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
let targetServerName = (num) => "server" + num;
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
    process.send("ready");
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
  const href = req.getHeader("origin") + req.getUrl() + "?sp=" + params.sp;
  const host = hostArray ? hostArray[2] : "test";
  const space = (params.sp || "A").toLowerCase();
  const isObserver = params.admin === "kkn" && params.ch !== undefined;

  res.upgrade(
    {
      url: req.getUrl(),
      params: params,
      /* 파라미터 추가되는 값 아래에 필드 추가 */
      space: space,
      href: href,
      host: host,
      ...(isObserver
        ? {
            observe: true,
            channel: params.ch,
          }
        : {}),
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

  if (!Boolean(params.sp)) {
    return;
  }

  if (ws.observe) {
    const observer = {
      type: "observer",
      id: "admin",
      server: Number(params.sv),
      space: params.sp,
      channel: Number(params.ch),
    };

    ws.subscribe("server");
    ws.subscribe("server" + observer.server);
    ws.subscribe("admin");
    ws.subscribe(
      `${targetServerName(
        observer.server
      )}/space${observer.space.toLowerCase()}/channel${observer.channel}`
    );

    sockets.set("admin", ws);
    users.set(ws, observer);

    broker.emit(observer.server + 1, "observer", {
      observer: observer,
    });
  } else {
    const [isStable, allocateServerNumber] = servers.in(ws);
    // [ ]: 서버 값 여기서 ws에 할당
    currentServer = allocateServerNumber;
    ws.server = currentServer;
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
      server: ws.server, // [ ]: 서버 밸런서에서 현재 서버 값 가져오기
      space: sp,
      host: host,
    }).toJSON();
    const renewViewer = spaces.add(user);

    /**
     * 전체 서버 구독
     */
    ws.subscribe("server");
    ws.subscribe("server" + ws.server);
    ws.subscribe(String(deviceID));
    ws.subscribe(
      `${targetServerName(
        ws.server
      )}/space${renewViewer.space.toLowerCase()}/channel${renewViewer.channel}`
    );

    sockets.set(String(deviceID), ws);
    users.set(ws, renewViewer);

    broker.emit(ws.server + 1, "open", {
      viewer: users.get(ws),
    });
  }
}

function messageHandler(ws, message, isBinary) {
  if (isBinary) {
    /** // NOTICE: 로케이션으로 변경
     * Player 로그인 시 / protobuf 메세지
     */
    let messageObject = JSON.parse(
      JSON.stringify(ProtoBuf.decode(new Uint8Array(message)))
    );

    if (ws.observe) return;
    broker.emit(ws.server + 1, "location", {
      location: messageObject,
    });
  } else {
    // 로그인 데이터 받음
    const data = JSON.parse(decoder.decode(message));
    if (users.get(ws).type === "observer") {
      // 옵저버 브로커는 open에 있음
      return;
    } else if (data.type === "player") {
      // NEW: 클라이언트 데이터 규격 맞춤
      const overrideUserData = Object.assign(users.get(ws), data);
      users.set(ws, overrideUserData);
      try {
        broker.emit(ws.server + 1, "player", {
          player: users.get(ws),
        });
      } catch (e) {}
    } else if (data.type === "viewer") {
      // 뷰어 데이터 덮어쓰기
      const overrideUserData = Object.assign(users.get(ws), data);
      users.set(ws, overrideUserData);
      try {
        broker.emit(ws.server + 1, "viewer", {
          viewer: users.get(ws),
        });
      } catch (e) {}
    } else if (data.type === "chat") {
      try {
        broker.emit(ws.server + 1, "chat", {
          data,
          message,
        });
      } catch (e) {}
    }
  }
}

function drainHandler(ws) {
  console.log("WebSocket backpressure: " + ws.getBufferedAmount());
}

function closeHandler(ws, code, message) {
  console.log("WebSocket closed");
  if (!Boolean(ws.params.sp)) {
    return;
  }

  const user = users.get(ws);
  try {
    broker.emit(user.server + 1, "close", {
      user: user,
    });
  } catch (e) {
    console.log(123, e);
  }
}

process.on("message", ({ data }) => {
  if (data.target === "publish") {
    const { packet } = data;
    const { topic, content, zip } = packet;
    const socket = sockets.get(String(deviceID));
    if (zip) {
      // NOTICE: 메세지를 다시 줄 때 프로토버프 사용해서 버퍼화 시켜야 함
      const parsing = JSON.parse(content);
      // 데이터 보존을 위해 텍스트로 받음
      const convertTo25Byte = ProtoBuf.encode(new ProtoBuf(parsing)).finish();

      app.publish(topic, convertTo25Byte, true, true);
    } else {
      app.publish(topic, content);
    }
  } else if (data.target === "subscribe") {
    const { packet } = data;
    const { deviceID, channel } = packet;
    const socket = sockets.get(String(deviceID));
    sockets.set(socket, deviceID);
    try {
      users.set(
        socket,
        Object.assign(users.get(socket), {
          channel: channel,
        })
      );
    } catch (e) {
      // process.exit(0);
    }
  }
});

/**
 * 프로세스 죽었을 때 SIGINT 이벤트 전달
 */
process.on("SIGINT", function () {
  isDisableKeepAlive = true;
  app.close(function () {
    process.exit(0);
  });
});

function getApp() {
  return app;
}

export { getApp };
