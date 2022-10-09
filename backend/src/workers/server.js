/**
 * app을 가져와야 emitter가 연동 됨
 */
const { app } = require("../../app");
const { emitter } = require("../emitter/");
const Queue = require("../models/Queue");
const SpaceBalancer = require("../models/SpaceBalancer");

const locationMap = {
  queueLimit: 1000,
  a: new Queue(this.queueLimit),
  b: new Queue(this.queueLimit),
  c: new Queue(this.queueLimit),
  d: new Queue(this.queueLimit),
  e: new Queue(this.queueLimit),
};

const serverName = process.env.SERVER_NAME;

const users = new Map();
const spaces = new SpaceBalancer();

let ch = 1;

emitter.on(`${serverName}::open`, (app, ws, viewer) => {
  Object.assign(viewer, {
    channel: ch,
  });
  const renewViewer = spaces.addUserInEmptyChannel(viewer);
  users.set(renewViewer.deviceID, renewViewer);
  ws.subscribe(String(renewViewer.deviceID));
  ws.subscribe(
    `${serverName}/space${renewViewer.space.toLowerCase()}/channel${
      renewViewer.channel
    }`
  );
  /* 로그인 시 플레이어 전달 */
  app.publish(
    String(renewViewer.deviceID),
    JSON.stringify(spaces.getPlayers(renewViewer.space, renewViewer.channel))
  );
  checkLog(renewViewer.space, renewViewer.channel);
});

emitter.on(`${serverName}::login`, (app, player) => {
  const renewPlayer = spaces.addUserInEmptyChannel(player);
  users.set(renewPlayer.deviceID, renewPlayer);

  app.publish(
    String(renewPlayer.deviceID),
    new TextEncoder().encode(JSON.stringify(renewPlayer))
  );
  locationMap[renewPlayer.space.toLowerCase()].enter(
    renewPlayer.channel,
    renewPlayer
  );

  checkLog(renewPlayer.space, renewPlayer.channel);
});

emitter.on(`${serverName}::location`, (app, location) => {
  const player = users.get(location.deviceID);
  Object.assign(player, location);
  users.set(location.deviceID, player);

  spaces.overrideUser(player);

  const replaceUser = spaces.selectUser(
    player.space,
    player.channel,
    player.deviceID
  );
  locationMap[replaceUser.space.toLowerCase()].enter(replaceUser.channel, {
    deviceID: replaceUser.deviceID,
    pox: replaceUser.pox,
    poy: replaceUser.poy,
    poz: replaceUser.poz,
    roy: replaceUser.roy,
  });
  // checkLog(replaceUser.space, replaceUser.channel);
});

emitter.on(`${serverName}::close`, (app, user) => {
  console.log(user.deviceID, `번 유저 제거`);
  spaces.deleteUser(users.get(user.deviceID));
  app.publish(
    `${serverName}/space${user.space.toLowerCase()}/channel${user.channel}`,
    String(user.deviceID)
  );
  checkLog(user.space, user.channel);
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

let frameA = 0;
let isBusy = false;

function locationBroadcastToChannel(sp) {
  frameA += 0.1;
  if (spaces.hasSpace(sp)) {
    for (let channel of spaces.selectSpace(sp).keys()) {
      if (locationMap[sp].size(channel) > 0) {
        const q = locationMap[sp].get(channel);
        // console.time("start check latency");
        const t0 = performance.now();
        app.publish(
          `${serverName}/space${sp.toLowerCase()}/channel${channel}`,
          q,
          true,
          true
        );
        const t1 = performance.now();
        const timeGap = t1 - t0;
        if (timeGap > 0.9) {
          isBusy = true;
          emitter.emit("receive::balancer", "busy", serverName);
        } else {
          if (isBusy) {
            isBusy = false;
            emitter.emit("receive::balancer", "comfortable", serverName);
          }
        }
        // console.log(t1 - t0, `app publish latency`);
        // console.timeEnd("start check latency");
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
function checkLog(sp, ch, disable = false) {
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
  console.log(
    `[${sp}공간|${ch}채널]`,
    `채널 내 유저 인원: ${channelUserCount} 명`.padStart(20, " ")
  );
  console.log(
    `[${sp}공간|${ch}채널]`,
    `채널 내 뷰어 인원: ${channelViewerCount} 명`.padStart(20, " ")
  );
  console.log(
    `[${sp}공간|${ch}채널]`,
    `채널 내 플레이어 인원: ${channelPlayerCount} 명`.padStart(18, " ")
  );
  console.log(
    `[${sp}공간|${ch}채널]`,
    `공간 내 유저 인원: ${spaceUserCount} 명`.padStart(20, " ")
  );
}
