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

emitter.on(`${serverName}::open`, (app, viewer) => {
  users.set(viewer.deviceID, viewer);
  spaces.addUserInEmptyChannel(viewer);
  checkLog(viewer.space, viewer.channel);
});

emitter.on(`${serverName}::login`, (app, player) => {
  users.set(player.deviceID, player);
  spaces.addUserInEmptyChannel(player);

  locationMap[player.space.toLowerCase()].enter(player.channel, player);
  checkLog(player.space, player.channel);
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
  checkLog(replaceUser.space, replaceUser.channel);
});

emitter.on(`${serverName}::close`, (app, user) => {
  console.log(user.deviceID, `번 유저 제거`);
  spaces.deleteUser(users.get(user.deviceID));
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

function locationBroadcastToChannel(ch) {
  if (spaces.hasSpace(ch)) {
    for (let channel of spaces.selectSpace(ch).keys()) {
      if (locationMap[ch].size(channel) > 0) {
        const q = locationMap[ch].get(channel);
        app.publish(`channel_${channel}`, q, true, true);
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
