/**
 * app을 가져와야 emitter가 연동 됨
 */
const { app } = require("../../app");
const { emitter } = require("../emitter/");
const Queue = require("../models/Queue");
const SpaceBalancer = require("../models/SpaceBalancer");
const locatoinQueue = new Queue();

const serverName = process.env.SERVER_NAME;

const users = new Map();
const spaces = new SpaceBalancer();

emitter.on(`${serverName}::open`, (app, viewer) => {
  users.set(viewer.deviceID, viewer);
  spaces.addUser(viewer);
  const count = spaces.getChannelUserCountByType(
    viewer.space,
    viewer.channel,
    "viewer"
  );
  console.log("count:", count);
});

emitter.on(`${serverName}::login`, (app, player) => {
  users.set(player.deviceID, player);
  spaces.addUser(player);
  const count = spaces.getChannelUserCountByType(
    player.space,
    player.channel,
    "player"
  );
  console.log("count:", count);
});

emitter.on(`${serverName}::close`, (app, user) => {});

process.send("ready");

function queueing() {
  // 다시해야함
  let loop = setInterval(() => {
    const q = locatoinQueue.get();

    app.publish("", q);
  }, 8);
}
