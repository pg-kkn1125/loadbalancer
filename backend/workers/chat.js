import Queue from "../src/models/Queue.js";
import { spaces } from "./server.js";

const { SERVER_NAME } = process.env;
const serverName = SERVER_NAME;
let isDisableKeepAlive = false;
const locationMap = {
  queueLimit: 1000,
  a: new Queue(this.queueLimit),
  b: new Queue(this.queueLimit),
  c: new Queue(this.queueLimit),
  d: new Queue(this.queueLimit),
  e: new Queue(this.queueLimit),
};

// emitter.on(`chat`, (app, chat, message) => {
//   const user = spaces.findUserByDeviceID(chat.deviceID);
//   publishTarget = `${serverName}/space${user.space.toLowerCase()}/channel${
//     user.channel
//   }`;
//   // 뷰어 데이터 전달
//   locationMap[chat.space].enter(user.channel, message);
// });

/**
 * 로케이션 데이터 브로드캐스트
 */
setInterval(() => {
  chatBroadcastToChannel("a");
  chatBroadcastToChannel("b");
  chatBroadcastToChannel("c");
  chatBroadcastToChannel("d");
  chatBroadcastToChannel("e");
}, 100);

function chatBroadcastToChannel(sp) {
  if (spaces.selectSpace(sp)) {
    for (let channel of spaces.selectSpace(sp).keys()) {
      if (locationMap[sp].size(channel) > 0) {
        const queue = locationMap[sp].get(channel);
        tryPublish(
          getApp(),
          `${serverName}/space${sp.toLowerCase()}/channel${channel}`,
          queue,
          true
        );
      }
    }
  }
}
function tryPublish(app, target, data, isLocation = false) {
  try {
    if (isLocation) {
      app.publish(target, data, true, true);
    } else {
      app.publish(target, data);
    }
  } catch (e) {
    // console.log(e);
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

process.send("ready");
