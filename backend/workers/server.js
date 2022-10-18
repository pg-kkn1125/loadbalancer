/**
 * app을 가져와야 emitter가 연동 됨
 */
import { app } from "../app.js";
import Queue from "../src/models/Queue.js";
import SpaceBalancer from "../src/models/SpaceBalancer.js";
import SpaceBalancer2 from "../src/models/SpaceBalancer2.js";
import pm2 from "pm2";
import { emitter } from "../src/emitter/index.js";
import { Message } from "../src/protobuf/index.js";
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

const { SERVER_NAME, SERVER_PID } = process.env;
const serverName = SERVER_NAME + (SERVER_PID - 1);
const users = new Map();
// const spaces = new SpaceBalancer(50);
const spaces = new SpaceBalancer2(50);

let ch = 1;

emitter.on(`${serverName}::open`, (app, ws, viewer) => {
  // Object.assign(viewer, {
  //   channel: ch,
  // });
  const renewViewer = spaces.add(viewer);
  users.set(String(renewViewer.deviceID), renewViewer);
  console.log(renewViewer.channel);
  console.log(
    `${serverName}/space${renewViewer.space.toLowerCase()}/channel${
      renewViewer.channel
    }`
  );
  ws.subscribe(String(renewViewer.deviceID));
  ws.subscribe(
    `${serverName}/space${renewViewer.space.toLowerCase()}/channel${
      renewViewer.channel
    }`
  );
  console.log(
    "구독::",
    `${serverName}/space${renewViewer.space.toLowerCase()}/channel${
      renewViewer.channel
    }`
  );
  // 뷰어 데이터 전달
  app.publish(
    String(renewViewer.deviceID),
    JSON.stringify(new Array(renewViewer))
  );
  console.log("viewer : ", renewViewer);
  // 로그인 시 플레이어 전달
  console.log(
    "player 인원 : ",
    spaces.checkChannelUserAmountByType(
      renewViewer.space,
      renewViewer.channel,
      "player"
    ),
    " 명"
  );
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

  checkLog(renewViewer.space, renewViewer.channel);
});

// NOTICE: viewer data 보류
emitter.on(`${serverName}::viewer`, (app, viewer) => {
  console.log("viewer");
  const renewViewer = spaces.overrideUser(viewer);
  users.set(String(renewViewer.deviceID), renewViewer);
  console.log(renewViewer);

  app.publish(
    `${serverName}/space${renewViewer.space.toLowerCase()}/channel${
      renewViewer.channel
    }`,
    JSON.stringify(renewViewer)
  );

  checkLog(renewViewer.space, renewViewer.channel);
});

emitter.on(`${serverName}::login`, (app, player) => {
  console.log("login");
  const renewPlayer = spaces.add(player);
  users.set(String(renewPlayer.deviceID), renewPlayer);
  console.log("current player :", renewPlayer);
  app.publish(
    `${serverName}/space${renewPlayer.space.toLowerCase()}/channel${
      renewPlayer.channel
    }`,
    JSON.stringify(spaces.getPlayers(renewPlayer.space, renewPlayer.channel))
  );

  // DEL: 클라이언트 연동으로 보류
  // locationMap[renewPlayer.space.toLowerCase()].enter(
  //   renewPlayer.channel,
  //   renewPlayer
  // );
  app.publish(
    `${serverName}/space${renewPlayer.space.toLowerCase()}/channel${
      renewPlayer.channel
    }`,
    JSON.stringify(renewPlayer)
  );

  checkLog(renewPlayer.space, renewPlayer.channel);
});

emitter.on(`${serverName}::location`, (app, location, message) => {
  // console.log(`============================`);
  // console.log(location);
  // console.log(location.id);
  // console.log("location id", location.id);
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

  // console.log("message", message); // NOTICE: 25byte 임
  locationMap[replaceUser.space.toLowerCase()].enter(
    replaceUser.channel,
    message
  );
});

// setTimeout(() => {
// testUser(500);
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
    const renewPlayer = spaces.add(user);
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
        deviceID: String(user.deviceID),
        pox: Math.random() * 100,
        poy: Math.random() * 100,
        poz: Math.random() * 100,
        roy: Math.random() * 100,
      };

      Object.assign(user, location);
      users.set(String(location.deviceID), user);

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
        // time: new Date(),
      });
    });
  }, 8);
}

emitter.on(`${serverName}::close`, (app, user) => {
  // console.log(user.deviceID, `번 유저 제거`);
  const foundUser = JSON.parse(
    JSON.stringify(spaces.selectUser(user.space, user.channel, user.deviceID))
  );
  const getUser = users.get(String(foundUser.deviceID));
  spaces.removeUser(getUser.space, getUser.channel, getUser.deviceID);
  app.publish(
    `${serverName}/space${foundUser.space.toLowerCase()}/channel${
      foundUser.channel
    }`,
    JSON.stringify(spaces.getPlayers(foundUser.space, foundUser.channel))
  );
  checkLog(foundUser.space, foundUser.channel);
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
        // console.log(queue);
        // let timeGap = 0;
        // console.time("start check latency");
        // const start = performance.now();
        // const start2 = performance.now();
        // new Promise((resolve, reject) => {
        // return resolve(
        tryPublish(
          app,
          `${serverName}/space${sp.toLowerCase()}/channel${channel}`,
          queue,
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
      const found = list.find((item) => item.pm_id === Number(SERVER_PID));
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
    `채널 내 유저 인원: ${channelUserCount
      .toString()
      .padStart(3, " ")} 명`.padStart(22, " ")
  );
  console.log(
    `[${sp}공간|${ch}채널]`,
    `채널 내 뷰어 인원: ${channelViewerCount
      .toString()
      .padStart(3, " ")} 명`.padStart(22, " ")
  );
  console.log(
    `[${sp}공간|${ch}채널]`,
    `채널 내 플레이어 인원: ${channelPlayerCount
      .toString()
      .padStart(3, " ")} 명`.padStart(20, " ")
  );
  console.log(
    `[${sp}공간|${ch}채널]`,
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

process.on("process:msg", (packet) => {
  console.log(packet);
});

export { users, spaces };
