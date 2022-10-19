/**
 * app을 가져와야 emitter가 연동 됨
 */
import { app } from "../app.js";
import Queue from "../src/models/Queue.js";
import SpaceBalancer from "../src/models/SpaceBalancer.js";
import pm2 from "pm2";
import { emitter } from "../src/emitter/index.js";

const locationMap = {
  queueLimit: 1000,
  a: new Queue(this.queueLimit),
  b: new Queue(this.queueLimit),
  c: new Queue(this.queueLimit),
  d: new Queue(this.queueLimit),
  e: new Queue(this.queueLimit),
};

const { SERVER_NAME, SERVER_PID } = process.env;
const serverNumber = SERVER_PID - 1;
const serverName = SERVER_NAME + serverNumber;
const users = new Map();
const spaces = new SpaceBalancer(50);



emitter.on(`${serverName}::open`, (app, ws, viewer) => {
  const renewViewer = spaces.add(viewer);
  users.set(String(renewViewer.deviceID), renewViewer);
  ws.subscribe(String(renewViewer.deviceID));
  ws.subscribe(
    `${serverName}/space${renewViewer.space.toLowerCase()}/channel${
      renewViewer.channel
    }`
  );
  // 뷰어 데이터 전달
  app.publish(
    String(renewViewer.deviceID),
    JSON.stringify(new Array(renewViewer))
  );
  // 로그인 시 플레이어 전달
  if (
    spaces.checkChannelUserAmountByType(
      renewViewer.space,
      renewViewer.channel,
      "player"
    ) > 0
  ) {
    app.publish(
      `${renewViewer.deviceID}`,
      JSON.stringify(spaces.getPlayers(renewViewer.space, renewViewer.channel))
    );
  }
  checkLog(renewViewer.server, renewViewer.space, renewViewer.channel);

  emitter.emit("check::user::amount", serverNumber + 1);
});

// NOTICE: Observer 추가 (원활한 테스트를 위함)
emitter.on(`${serverName}::observer`, (app, ws, observer) => {
  ws.subscribe("-1");
  ws.subscribe(
    `${serverName}/space${observer.space.toLowerCase()}/channel${
      observer.channel
    }`
  );

  users.set("-1", observer);

  if (
    spaces.checkChannelUserAmountByType(
      observer.space,
      observer.channel,
      "player"
    ) > 0
  ) {
    ws.send(
      JSON.stringify(spaces.getPlayers(observer.space, observer.channel))
    );
  }

  checkLog(observer.server, observer.space, observer.channel);
});

emitter.on(`${serverName}::viewer`, (app, viewer) => {
  const renewViewer = spaces.overrideUser(viewer);
  users.set(String(renewViewer.deviceID), renewViewer);

  app.publish(
    `${serverName}/space${renewViewer.space.toLowerCase()}/channel${
      renewViewer.channel
    }`,
    JSON.stringify(renewViewer)
  );

  checkLog(renewViewer.server, renewViewer.space, renewViewer.channel);
});

emitter.on(`${serverName}::login`, (app, player) => {
  const renewPlayer = spaces.add(player);
  users.set(String(renewPlayer.deviceID), renewPlayer);
  app.publish(
    `${serverName}/space${renewPlayer.space.toLowerCase()}/channel${
      renewPlayer.channel
    }`,
    JSON.stringify(spaces.getPlayers(renewPlayer.space, renewPlayer.channel))
  );

  app.publish(
    `${serverName}/space${renewPlayer.space.toLowerCase()}/channel${
      renewPlayer.channel
    }`,
    JSON.stringify(renewPlayer)
  );

  checkLog(renewPlayer.server, renewPlayer.space, renewPlayer.channel);
});

emitter.on(`${serverName}::location`, (app, location, message) => {
  const { id, pox, poy, poz, roy } = location;
  const locationConverter = {
    deviceID: id,
    pox,
    poy,
    poz,
    roy,
  };

  const player = users.get(String(locationConverter.deviceID));
  const replacePlayer = Object.assign(player, locationConverter);
  users.set(String(locationConverter.deviceID), replacePlayer);

  spaces.overrideUser(replacePlayer);

  const replaceUser = spaces.selectUser(
    replacePlayer.space,
    replacePlayer.channel,
    replacePlayer.deviceID
  );

  locationMap[replaceUser.space.toLowerCase()].enter(
    replaceUser.channel,
    message
  );
});

emitter.on(`${serverName}::close`, (app, ws, user) => {
  if (user.type === "observer") {
    // ...
  } else {
    console.log(user.deviceID, `번 유저 제거`);
    const foundUser = JSON.parse(
      JSON.stringify(spaces.selectUser(user.space, user.channel, user.deviceID))
    );
    const getUser = users.get(String(foundUser.deviceID));
    spaces.removeUser(getUser.space, getUser.channel, getUser.deviceID);
    users.delete(ws);
    app.publish(
      `${serverName}/space${foundUser.space.toLowerCase()}/channel${
        foundUser.channel
      }`,
      JSON.stringify(spaces.getPlayers(foundUser.space, foundUser.channel))
    );
  }
  checkLog(foundUser.server, foundUser.space, foundUser.channel);
});

process.send("ready");

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

export { users, spaces };
