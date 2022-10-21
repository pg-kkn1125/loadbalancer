const WebSocket = require("ws");
const decoder = new TextDecoder();
const sockets = new Map();
const receive = new Map();

let frame = 0.1;

const protobuf = require("protobufjs");
var Type = protobuf.Type,
  Field = protobuf.Field;
function ProtoBuf(properties) {
  protobuf.Message.call(this, properties);
}

(ProtoBuf.prototype = Object.create(protobuf.Message)).constructor = ProtoBuf;

Field.d(1, "fixed32", "required")(ProtoBuf.prototype, "id");
Field.d(2, "float", "required")(ProtoBuf.prototype, "pox");
Field.d(3, "float", "required")(ProtoBuf.prototype, "poy");
Field.d(4, "float", "required")(ProtoBuf.prototype, "poz");
Field.d(5, "sfixed32", "required")(ProtoBuf.prototype, "roy");

let viwerArray = [0];
let playerArray = [0];
var good = false;
var isPlayerSend = false;
const TRY = process.env.TRY || 0;
let MIN = 1;
let AMOUNT = 400;
let MAX = (() => AMOUNT + MIN)();
const HOST = "localhost";
const players = new Map();

const bl = [0, 0, 1, Math.random() * 100];
const br = [1, 0, 1, Math.random() * 100];
const fr = [1, 0, 0, Math.random() * 100];
const fl = [0, 0, 0, Math.random() * 100];

const joystick = [bl, br, fr, fl];

function viwerFunction(i) {
  const viewerData = {
    type: "viewer",
    device: `android${i}`,
    host: "https://location.com",
    timestamp: "20220921",
  };
  sockets.get(i).send(JSON.stringify(viewerData));
}
function playFunction(i) {
  const playerData = {
    type: "player",
    id: `${i}`,
    device: "ios",
    authority: "host",
    avatar: "avatar1",
    pox: Math.floor(Math.random() * 1000) / 100,
    poy: 0,
    poz: Math.floor(Math.random() * 1000) / 100,
    roy: 5,
    state: "login",
    host: "https://localhost:3000",
    timestamp: "20220922",
  };
  players.set(i, playerData);
  sockets.get(i).send(JSON.stringify(playerData));
}

function locationFunction(i, rand, rand2) {
  const [x, y, z, ry] = joystick[parseInt(i / 4) % 4];
  const pack = new ProtoBuf({
    id: i,
    pox:
      players.get(i).pox + (Boolean(x) ? 1 : -1) * Math.sin(frame / 100) * 10,
    poy: 0.10444445163011551,
    poz:
      players.get(i).poz + (Boolean(z) ? 1 : -1) * Math.cos(frame / 100) * 10,
    roy: Math.sin(frame / 10) * 1000 + ry * rand2 * 2000,
  });
  value = ProtoBuf.encode(pack).finish();
  sockets.get(i).send(value);
  frame += 0.01;
}

function example() {
  // let driver = await new Builder().forBrowser("chrome").build();
  try {
    for (let i = MIN; i < MAX; i++) {
      sockets.set(i, new WebSocket(`ws://${HOST}:4000/?sp=A`));
      // sockets.set(i, new WebSocket(`ws://localhost:8080`));
      sockets.get(i).binaryType = "arraybuffer";
      sockets.get(i).onopen = () => {
        viwerFunction(i);
      };
      viwerArray.push(i);
    }
  } catch (err) {
    console.log(err, 2);
  } finally {
    setTimeout(() => {
      for (let i = MIN; i < MAX; i++) {
        playFunction(i);
      }
    }, 2000);

    setTimeout(() => {
      const randoms = new Array(AMOUNT).fill(0).map(() => Math.random());
      const randoms2 = new Array(AMOUNT).fill(0).map(() => Math.random());
      setInterval(() => {
        for (let i = MIN; i < MAX; i++) {
          locationFunction(i, randoms[i - MIN], randoms2[i - MIN]);
        }
      }, 16);
    }, 7000);
  }
}
example();
