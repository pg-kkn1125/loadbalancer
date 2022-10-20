/**
 * app을 가져와야 emitter가 연동 됨
 */
import Queue from "../src/models/Queue.js";
import app, { spaces } from "../src/models/Socket.js";
import protobuf from "protobufjs";

// ---------- protobuf js ------------
var Type = protobuf.Type,
  Field = protobuf.Field;
function ProtoBuf2(properties) {
  protobuf.Message.call(this, properties);
}
(ProtoBuf2.prototype = Object.create(protobuf.Message)).constructor = ProtoBuf2;

/* Field Settings */
Field.d(1, "fixed32", "required")(ProtoBuf2.prototype, "id");
Field.d(2, "float", "required")(ProtoBuf2.prototype, "pox");
Field.d(3, "float", "required")(ProtoBuf2.prototype, "poy");
Field.d(4, "float", "required")(ProtoBuf2.prototype, "poz");
Field.d(5, "sfixed32", "required")(ProtoBuf2.prototype, "roy");

const locationMap = {
  queueLimit: 1000,
  a: new Queue(this.queueLimit),
  b: new Queue(this.queueLimit),
  c: new Queue(this.queueLimit),
  d: new Queue(this.queueLimit),
  e: new Queue(this.queueLimit),
};

process.on("message", ({ data }) => {
  const { target, packet, space, message } = data;
  console.log(data);
  if (space && message) {
    locationMap[space].enter(message);
  } else if (target) {
    app.publish(target, packet);
  }
  // const {location} = data;
  // console.log(data)
});

/**
 * 로케이션 데이터 브로드캐스트
 */
setInterval(() => {
  locationBroadcastToChannel("a");
  locationBroadcastToChannel("b");
  locationBroadcastToChannel("c");
  locationBroadcastToChannel("d");
  locationBroadcastToChannel("e");
}, 8);

function locationBroadcastToChannel(sp) {
  if (spaces.selectSpace(sp)) {
    for (let channel of spaces.selectSpace(sp).keys()) {
      if (locationMap[sp].size(channel) > 0) {
        const queue = locationMap[sp].get(channel);
        // const parsing = JSON.parse(queue);
        const queues = ProtoBuf2.encode(
          new ProtoBuf2(JSON.parse(new TextDecoder().decode(message)))
        ).finish();
        // 데이터 보존을 위해 텍스트로 받음
        tryPublish(
          `${serverName}/space${sp.toLowerCase()}/channel${channel}`,
          queues,
          true
        );
      }
    }
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

function tryPublish(target, data, isLocation = false) {
  try {
    // 데이터 보존을 위해 텍스트 디코드로 송출
    if (isLocation) {
      app.publish(target, data, true, true);
    } else {
      app.publish(target, data);
    }
  } catch (e) {
    console.log(e);
  }
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

// export { spaces };
