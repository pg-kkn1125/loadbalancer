const WebSocket = require("ws");
const decoder = new TextDecoder();
const sockets = new Map();
const receive = new Map();

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
let MIN = 2;
let AMOUNT = 300;
let MAX = (() => AMOUNT + MIN)();
const HOST = "localhost";

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
  sockets.get(i).send(JSON.stringify(playerData));
}

function locationFunction(i) {
  const pack = new ProtoBuf({
    id: i,
    pox: Math.floor(Math.random() * 1000) / 100,
    poy: 0,
    poz: Math.floor(Math.random() * 1000) / 100,
    roy: 0,
  });
  value = ProtoBuf.encode(pack).finish();
  sockets.get(i).send(value);
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

    //     sockets.get(3).onmessage = (message) => {
    //         console.log(message.data);
    //         if (isPlayerSend === false) {
    //             if (typeof message.data === "string") {
    //                 let newData = JSON.parse(message.data);
    //                 if (Object.values(newData)[0] !== undefined) {
    //                     var newType = Object.values(newData)[0];
    //                     if (newType.deviceID === 4) {
    //                         for (let i = 3; i < 4; i++) {
    //                             playFunction(i);
    //                             isPlayerSend = true;
    //                         }
    //                     } else {
    //                         return;
    //                     }
    //                 }
    //             } else {
    //                 //console.log("good");
    //             }
    //         }
    //     };
    setTimeout(() => {
      setInterval(() => {
        for (let i = MIN; i < MAX; i++) {
          locationFunction(i);
        }
      }, 16);
    }, 7000);
  }
}
example();
