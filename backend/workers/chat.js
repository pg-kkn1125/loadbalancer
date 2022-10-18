import { app } from "../app.js";
import { emitter } from "../src/emitter/index.js";
import ChatQueue from "../src/models/Queue.js";
import { spaces } from "./server.js";

const { SERVER_NAME } = process.env;
const serverName = SERVER_NAME;
const chatQueue = new ChatQueue();
let publishTarget = null;

emitter.on(`chat`, (app, chat, message) => {
  const user = spaces.findUserByDeviceID(chat.deviceID);
  publishTarget = `${serverName}/space${user.space.toLowerCase()}/channel${
    user.channel
  }`;
  // 뷰어 데이터 전달
  chatQueue.enter(user.channel, message);
});

const sendChat = setInterval(() => {
  if (chatQueue.count !== 0) {
    app.publish("server", chatQueue.get());
  }
}, 100);

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
          app,
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

process.send("ready");
