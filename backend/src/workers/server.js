/**
 * app을 가져와야 emitter가 연동 됨
 */
const { app } = require("../../app");
const { emitter } = require("../emitter/");
const Queue = require("../models/Queue");
const SpaceBalancer = require("../models/SpaceBalancer");
const pm2 = require("pm2");
let increaseServer = false;
let overflowCount = 3;

const locationMap = {
  queueLimit: 1000,
  a: new Queue(this.queueLimit),
  b: new Queue(this.queueLimit),
  c: new Queue(this.queueLimit),
  d: new Queue(this.queueLimit),
  e: new Queue(this.queueLimit),
};

const serverPrefix = process.env.SERVER_NAME;
const serverCount = process.env.SERVER_COUNT;
const serverName = serverPrefix + serverCount;

const users = new Map();
const spaces = new SpaceBalancer(50);

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

// setTimeout(() => {
testUser(500);
// }, 5000);
function testUser(amount = 1) {
  const usersList = new Array(amount).fill(0).map((user, idx) => ({
    deviceID: idx + 1,
    id: idx + 1,
    nickname: "test" + idx + 1,
    pox: idx + 100 * Math.random(),
    poy: idx + 100 * Math.random(),
    poz: idx + 100 * Math.random(),
    roy: idx + 100 * Math.random(),
    space: /* "a", */ String.fromCharCode(97 + idx / 200),
    channel: 1,
  }));

  usersList.forEach((user) => {
    const renewPlayer = spaces.addUserInEmptyChannel(user);
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

  setInterval(() => {
    usersList.forEach((user) => {
      const location = {
        deviceID: user.deviceID,
        pox: Math.random() * 100,
        poy: Math.random() * 100,
        poz: Math.random() * 100,
        roy: Math.random() * 100,
      };

      Object.assign(user, location);
      users.set(location.deviceID, user);

      spaces.overrideUser(user);

      const replaceUser = spaces.selectUser(
        user.space,
        user.channel,
        user.deviceID
      );

      locationMap[replaceUser.space.toLowerCase()].enter(replaceUser.channel, {
        deviceID: replaceUser.deviceID,
        pox: replaceUser.pox,
        poy: replaceUser.poy,
        poz: replaceUser.poz,
        roy: replaceUser.roy,
        time: new Date(),
      });
    });
  }, 8);
}

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

function locationBroadcastToChannel(sp) {
  if (spaces.hasSpace(sp)) {
    for (let channel of spaces.selectSpace(sp).keys()) {
      if (locationMap[sp].size(channel) > 0) {
        const q = locationMap[sp].get(channel);
        // let timeGap = 0;
        // console.time("start check latency");
        // const start = performance.now();
        // const start2 = performance.now();
        // new Promise((resolve, reject) => {
        // return resolve(
        app.publish(
          `${serverName}/space${sp.toLowerCase()}/channel${channel}`,
          q,
          true,
          true
        );
        //   );
        // }).then((result) => {
        //   const end = performance.now();
        //   console.log("end1", end - start);
        // });
        // const end2 = performance.now();
        // console.log("end2", end2 - start2);

        // console.log(t1 - t0, `app publish latency`);
        // console.timeEnd("start check latency");
      }
    }
  }
}

function getServer() {
  return new Promise((resolve, reject) => {
    pm2.list((err, list) => {
      const found = list.find((item) => item.pm_id === Number(serverCount));
      if (found) {
        resolve(found);
      } else {
        reject(null);
      }
    });
  });
}

// setInterval(() => {
//   getServer().then((result) => {
//     if (!result) return;
//     const { cpu, memory } = result.monit;

//     if (!increaseServer) {
//       console.log(serverName, "CPU", cpu, "%");
//       console.log(serverName, "Memory", memory / 1000 / 1000, "MB");
//       if (cpu > 80 && memory > 140) {
//         overflowCount--;
//         if (overflowCount === 0) {
//           emitter.emit("receive::balancer", "busy", serverName);
//           increaseServer = true;
//         }
//       }
//       // else {
//       //   emitter.emit("receive::balancer", "comfortable", serverName);
//       //   // increaseServer = false;
//       // }
//     }
//   });
// }, 1000);

// setInterval(() => {
//   emitter.emit("receive::balancer", "busy", serverName);
// }, 1000);

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

module.exports = { users, spaces };
