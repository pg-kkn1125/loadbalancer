/**
 * app을 가져와야 emitter가 연동 됨
 */
import pm2 from "pm2";
import protobuf from "protobufjs";
import uWs from "uWebSockets.js";
import { servers } from "./ServerBalancer.js";
import SpaceBalancer from "./SpaceBalancer.js";
import User from "./User.js";

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
const { SERVER_NAME, SERVER_PID } = process.env;
const decoder = new TextDecoder();
const serverNumber = SERVER_PID;
const serverName = SERVER_NAME + serverNumber;
const sockets = new Map();
const users = new Map();
const spaces = new SpaceBalancer(50);
let isDisableKeepAlive = false;
let deviceID = 0;
let currentServer = 2;
let sp = "a"; // 공간은 URL 배정 받음
let targetServerName = (num) => "server" + num;

pm2.list((err, list) => {
  list.forEach((process) => {
    pm2.sendDataToProcessId(
      process.pm_id,
      {
        topic: true,
        data: {
          success: true,
        },
        type: "process:msg",
      },
      (err) => {
        //
      }
    );
  });
});

function sendToProcess(target, data) {
  pm2.sendDataToProcessId(
    currentServer,
    {
      topic: true,
      type: "process:msg",
      data: {
        ...data,
        target,
      },
    },
    (err) => {}
  );
}

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
    let user = {
      type: "observer",
      id: "admin",
      deviceID: "admin",
      server: Number(params.sv),
      space: params.sp,
      channel: Number(params.ch),
    };
    ws.server = params.sv;
    currentServer = Number(ws.server);

    ws.subscribe("server");
    ws.subscribe("server" + user.server);
    ws.subscribe(user.deviceID);
    ws.subscribe(
      `${targetServerName(
        user.server
      )}/space${user.space.toLowerCase()}/channel${user.channel}`
    );

    sockets.set(user.deviceID, ws);
    users.set(ws, user);

    sendToProcess("observer", {
      topic: user.deviceID,
      user: user,
    });

    // sendToProcess("admin", {
    //   packet: JSON.stringify(new Array(user)),
    // });

    // if (
    //   spaces.checkChannelUserAmountByType(user.space, user.channel, "player") >
    //   0
    // ) {
    //   sendToProcess("admin", {
    //     packet: JSON.stringify(spaces.getPlayers(user.space, user.channel)),
    //   });
    // }
  } else {
    const [isStable, allocateServerNumber] = servers.in(ws);
    // [ ]: 서버 값 여기서 ws에 할당
    ws.server = allocateServerNumber;
    currentServer = Number(ws.server);
    deviceID++;

    let user = new User({
      id: null,
      type: "viewer",
      timestamp: new Date().getTime(),
      deviceID: deviceID,
      server: ws.server, // [ ]: 서버 밸런서에서 현재 서버 값 가져오기
      space: sp,
      host: host,
    }).toJSON();

    if (isDisableKeepAlive) {
      ws.close();
    }

    sp = params.sp;

    const renewViewer = spaces.add(user);
    /**
     * 전체 서버 구독
     */
    ws.subscribe("server");
    ws.subscribe("server" + allocateServerNumber);
    ws.subscribe(String(renewViewer.deviceID));
    ws.subscribe(
      `${targetServerName(
        allocateServerNumber
      )}/space${renewViewer.space.toLowerCase()}/channel${renewViewer.channel}`
    );

    sockets.set(String(renewViewer.deviceID), ws);
    users.set(ws, renewViewer);

    sendToProcess("open", {
      topic: String(renewViewer.deviceID),
      user: renewViewer,
    });
    // sendToProcess(String(renewViewer.deviceID), {
    //   packet: JSON.stringify(new Array(renewViewer)),
    // });
    // if (
    //   spaces.checkChannelUserAmountByType(user.space, user.channel, "player") >
    //   0
    // ) {
    //   sendToProcess(String(user.deviceID), {
    //     packet: JSON.stringify(spaces.getPlayers(user.space, user.channel)),
    //   });
    // }
  }
  checkLog(users.get(ws).server, users.get(ws).space, users.get(ws).channel);
}

function messageHandler(ws, message, isBinary) {
  if (isBinary) {
    /** // NOTICE: 로케이션으로 변경
     * Player 로그인 시 / protobuf 메세지
     */
    const messageStrings = JSON.stringify(
      ProtoBuf.decode(new Uint8Array(message))
    );
    const messageObject = JSON.parse(messageStrings);
    const location = {
      deviceID: messageObject.id,
      pox: messageObject.id,
      poy: messageObject.poy,
      poz: messageObject.poz,
      roy: messageObject.roy,
    };

    users.set(ws, Object.assign(users.get(ws), location));
    // spaces.overrideUser(users.get(ws));

    if (ws.observe) return;
    sendToProcess("location", {
      topic: String(users.get(ws).channel),
      space: users.get(ws).space,
      channel: users.get(ws).channel,
      message: messageObject,
    });
    // sendToProcess(String(users.get(ws).channel), {
    //   space: users.get(ws).space,
    //   channel: users.get(ws).channel,
    //   message: messageObject,
    // });
  } else {
    if (ws.observe) return;
    // 로그인 데이터 받음
    const data = JSON.parse(decoder.decode(message));
    if (data.type === "observer") {
      // 옵저버 브로커는 open에 있음
      return;
    } else if (data.type === "player") {
      // NEW: 클라이언트 데이터 규격 맞춤
      const overrideUserData = Object.assign(users.get(ws), data);
      users.set(ws, overrideUserData);
      try {
        // sendToProcess("player", {
        //   topic: `${targetServerName(
        //     users.get(ws).server
        //   )}/space${overrideUserData.space.toLowerCase()}/channel${
        //     overrideUserData.channel
        //   }`,
        //   user: JSON.stringify(
        //     spaces.getPlayers(overrideUserData.space, overrideUserData.channel)
        //   ),
        // });
        sendToProcess("player", {
          topic: String(overrideUserData.deviceID),
          user: JSON.stringify(overrideUserData),
        });
        // sendToProcess(
        //   `${targetServerName(
        //     users.get(ws).server
        //   )}/space${overrideUserData.space.toLowerCase()}/channel${
        //     overrideUserData.channel
        //   }`,
        //   {
        //     packet: JSON.stringify(
        //       spaces.getPlayers(
        //         overrideUserData.space,
        //         overrideUserData.channel
        //       )
        //     ),
        //   }
        // );
        // sendToProcess(String(overrideUserData.deviceID), {
        //   packet: JSON.stringify(overrideUserData),
        // });
      } catch (e) {}
    } else if (data.type === "viewer") {
      // 뷰어 데이터 덮어쓰기
      const overrideUserData = Object.assign(users.get(ws), data);
      users.set(ws, overrideUserData);
      try {
        sendToProcess("viewer", {
          topic: `${targetServerName(
            users.get(ws).server
          )}/space${overrideUserData.space.toLowerCase()}/channel${
            overrideUserData.channel
          }`,
          user: JSON.stringify(overrideUserData),
        });
        // sendToProcess(
        //   `${targetServerName(
        //     users.get(ws).server
        //   )}/space${overrideUserData.space.toLowerCase()}/channel${
        //     overrideUserData.channel
        //   }`,
        //   {
        //     packet: JSON.stringify(overrideUserData),
        //   }
        // );
      } catch (e) {}
    } else if (data.type === "chat") {
      try {
        //
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
  // spaces.removeUser(user.space, user.channel, user.deviceID);
  try {
    sendToProcess("close", {
      topic: `${targetServerName(
        users.get(ws).server
      )}/space${user.space.toLowerCase()}/channel${user.channel}`,
      user: user,
    });
    // sendToProcess(
    //   `${targetServerName(
    //     users.get(ws).server
    //   )}/space${user.space.toLowerCase()}/channel${user.channel}`,
    //   { packet: JSON.stringify(spaces.getPlayers(user.space, user.channel)) }
    // );
  } catch (e) {
    console.log(123, e);
  }
}

/**
 * 채널 현황 로그
 * @param {string} sp - 공간
 * @param {number} ch - 채널
 * @param {boolean} disable - 로그 비활성화 default: false
 */
function checkLog(sv, sp, ch, disable = false) {
  if (disable) return;

  const channelUserCount = spaces.checkChannelUserAmount(sp, ch);
  const channelViewerCount = spaces.checkChannelUserAmountByType(
    sp,
    ch,
    "viewer"
  );
  const channelPlayerCount = spaces.checkChannelUserAmountByType(
    sp,
    ch,
    "player"
  );
  const spaceUserCount = spaces.checkSpaceUserAmount(sp);
  console.log(`✨ current server is "${serverName}"`);
  console.log(
    `[${sv}서버${sp}공간|${ch}채널]`,
    `채널 내 유저 인원: ${channelUserCount
      .toString()
      .padStart(3, " ")} 명`.padStart(22, " ")
  );
  console.log(
    `[${sv}서버${sp}공간|${ch}채널]`,
    `채널 내 뷰어 인원: ${channelViewerCount
      .toString()
      .padStart(3, " ")} 명`.padStart(22, " ")
  );
  console.log(
    `[${sv}서버${sp}공간|${ch}채널]`,
    `채널 내 플레이어 인원: ${channelPlayerCount
      .toString()
      .padStart(3, " ")} 명`.padStart(20, " ")
  );
  console.log(
    `[${sv}서버${sp}공간|${ch}채널]`,
    `공간 내 유저 인원: ${spaceUserCount
      .toString()
      .padStart(3, " ")} 명`.padStart(22, " ")
  );
}

/**
 * 프로세스 죽었을 때 SIGINT 이벤트 전달
 */
process.on("SIGINT", function () {
  isDisableKeepAlive = true;
  app.close(function () {
    process.exit(0);
  });
});

export default app;

export { sockets, users, spaces };
