/**
 * app을 가져와야 emitter가 연동 됨
 */
import broker from "../src/models/DataBroker.js";
import dev from "../src/models/DevConsole.js";
import Queue from "../src/models/Queue.js";
import SpaceBalancer from "../src/models/SpaceBalancer.js";

const locationMap = {
  queueLimit: 1000,
  a: new Queue(this.queueLimit),
  b: new Queue(this.queueLimit),
  c: new Queue(this.queueLimit),
  d: new Queue(this.queueLimit),
  e: new Queue(this.queueLimit),
};

let isDisableKeepAlive = false;
const { SERVER_NAME, SERVER_PID } = process.env;
const serverNumber = SERVER_PID - 1;
const serverName = SERVER_NAME + serverNumber;
const users = new Map();
const spaces = new SpaceBalancer(50);

process.on("message", ({ data }) => {
  const { target, packet } = data;
  if (target === "observer") {
    const { observer } = packet;
    users.set("admin", observer);
    if (
      spaces.checkChannelUserAmountByType(
        observer.space,
        observer.channel,
        "player"
      ) > 0
    ) {
      broker.emit(0, "publish", {
        topic: "admin",
        content: JSON.stringify(
          spaces.getPlayers(observer.space, observer.channel)
        ),
      });
    }

    checkLog(observer.server, observer.space, observer.channel);
  } else if (target === "open") {
    const { viewer } = packet;

    const addedViewer = spaces.add(viewer);

    broker.emit(0, "subscribe", {
      topic: "",
      content: {
        deviceID: addedViewer.deviceID,
        channel: addedViewer.deviceID,
      },
    });

    users.set(String(addedViewer.deviceID), addedViewer);
    broker.emit(0, "subscribe", {
      deviceID: addedViewer.deviceID,
      channel: addedViewer.channel,
    });

    // 뷰어 데이터 전달
    broker.emit(0, "publish", {
      topic: String(addedViewer.deviceID),
      content: JSON.stringify(new Array(addedViewer)),
    });
    // 로그인 시 플레이어 전달
    if (
      spaces.checkChannelUserAmountByType(
        addedViewer.space,
        addedViewer.channel,
        "player"
      ) > 0
    ) {
      broker.emit(0, "publish", {
        topic: String(addedViewer.deviceID),
        content: JSON.stringify(
          spaces.getPlayers(addedViewer.space, addedViewer.channel)
        ),
      });
    }
    checkLog(addedViewer.server, addedViewer.space, addedViewer.channel);

    // emitter.emit("check::user::amount", serverNumber + 1); // [ ]: broker로 변경해야 함
  } else if (target === "viewer") {
    const { viewer } = packet;
    const renewViewer = spaces.overrideUser(viewer);
    users.set(String(renewViewer.deviceID), renewViewer);

    broker.emit(0, "publish", {
      topic: `${serverName}/space${renewViewer.space.toLowerCase()}/channel${
        renewViewer.channel
      }`,
      content: JSON.stringify(renewViewer),
    });

    checkLog(renewViewer.server, renewViewer.space, renewViewer.channel);
  } else if (target === "player") {
    const { player } = packet;
    const renewPlayer = spaces.add(player);
    users.set(String(renewPlayer.deviceID), renewPlayer);

    broker.emit(0, "publish", {
      topic: `${serverName}/space${renewPlayer.space.toLowerCase()}/channel${
        renewPlayer.channel
      }`,
      content: JSON.stringify(
        spaces.getPlayers(renewPlayer.space, renewPlayer.channel)
      ),
    });

    broker.emit(0, "publish", {
      topic: String(renewPlayer.deviceID),
      content: JSON.stringify(renewPlayer),
    });

    checkLog(renewPlayer.server, renewPlayer.space, renewPlayer.channel);
  } else if (target === "location") {
    const { location } = packet;
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
      new TextEncoder().encode(JSON.stringify(location))
      // 데이터 보존을 위해 텍스트로 인코딩
    );
  } else if (target === "close") {
    const { user } = packet;
    if (user.type === "observer") {
      // ...
    } else {
      console.log(user.deviceID, `번 유저 제거`);
      const foundUser = JSON.parse(
        JSON.stringify(
          spaces.selectUser(user.space, user.channel, user.deviceID)
        )
      );
      const getUser = users.get(String(foundUser.deviceID));
      spaces.removeUser(getUser.space, getUser.channel, getUser.deviceID);
      users.delete(getUser.deviceID);

      broker.emit(0, "publish", {
        topic: `${serverName}/space${foundUser.space.toLowerCase()}/channel${
          foundUser.channel
        }`,
        content: JSON.stringify(
          spaces.getPlayers(foundUser.space, foundUser.channel)
        ),
      });
    }
    checkLog(user.server, user.space, user.channel);
  }
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
        const array = new TextDecoder().decode(queue).match(/\{(.+?)\}/g);
        array.forEach((item) => {
          tryPublish(
            `${serverName}/space${sp.toLowerCase()}/channel${channel}`,
            new TextEncoder().encode(item),
            true
          );
        });
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
    broker.emit(0, "publish", {
      topic: target,
      content: new TextDecoder().decode(data),
      zip: isLocation,
    });
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

export { users, spaces };
