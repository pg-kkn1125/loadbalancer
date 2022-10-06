/**
 * app을 가져와야 emitter가 연동 됨
 */
const { default: App } = require("../../../frontend/src/App");
const { app } = require("../../app");
const { emitter } = require("../emitter/");
const Queue = require("../models/Queue");
const locatoinQueue = new Queue();

const serverName = process.env.SERVER_NAME;

const users = new Map();

emitter.on(`${serverName}::open`, (app, viewer) => {
  console.log(`viewer`, viewer);
});

emitter.on(`${serverName}::login`, (app, player) => {
  console.log(`player`, player);
});

process.send("ready");

// function queueing() { // 다시해야함
//   let loop = setInterval(() => {
//     const q = locatoinQueue.get();
//     if (q) {
//       app.publish("", "{}");
//     } else {
//       clearInterval(loop);
//     }
//   }, 8);
// }
