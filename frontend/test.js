const WebSocket = require("ws");
const decoder = new TextDecoder();
const sockets = new Map();
const receive = new Map();

let viwerArray = [0];
let playerArray = [0];
var good = false;
var isPlayerSend = false;
let MAX = 49;

// const protobuf = require("protobufjs");
const { Message, declareProtobuf } = require("./src/model/Message.test");
// var Type = protobuf.Type,
//   Field = protobuf.Field;
// function ProtoBuf(properties) {
//   protobuf.Message.call(this, properties);
// }
// (ProtoBuf.prototype = Object.create(protobuf.Message)).constructor = ProtoBuf;

//Field.d(1, "fixed32", "required")(ProtoBuf.prototype, "id")
//Field.d(2, "bytes", "required")(ProtoBuf.prototype, "pos")
//Field.d(3, "sfixed32", "required")(ProtoBuf.prototype, "angle")
// Field.d(1, "string", "required")(ProtoBuf.prototype, "id");
// Field.d(2, "float", "required")(ProtoBuf.prototype, "pox");
// Field.d(3, "float", "required")(ProtoBuf.prototype, "poy");
// Field.d(4, "float", "required")(ProtoBuf.prototype, "poz");
// Field.d(5, "sfixed32", "required")(ProtoBuf.prototype, "roy");

function viwerFunction(i) {
  const viewerData = {
    type: "viewer",
    device: `android${i}`,
    host: "https://location.com",
    timestamp: "20220921",
  };
  sockets
    .get(i)
    .send(Message.encode(declareProtobuf.setMessage(viewerData)).finish());
}
function playFunction(i) {
  const playerData = {
    id: `${i}`, //
    type: "player", //
    device: "ios", //
    authority: "host",
    avatar: "avatar1",
    pox: Math.floor(Math.random() * 1000) / 100, //
    poy: Math.floor(Math.random() * 1000) / 100, //
    poz: 0, //
    roy: 0, //
    state: "login", //
    host: "https://localhost:3000",
    timestamp: "20220922",
  };
  sockets
    .get(i)
    .send(Message.encode(declareProtobuf.setMessage(playerData)).finish());
}

function locationFunction(i) {
  console.log(i);
  const pack = {
    deviceID: sockets.get(i),
    pox: Math.floor(Math.random() * 1000) / 100,
    poy: Math.floor(Math.random() * 1000) / 100,
    poz: 0,
    roy: 0,
  };
  value = JSON.stringify(pack);
  sockets.get(i).send(value);
}

(async function example() {
  // let driver = await new Builder().forBrowser("chrome").build();
  try {
    for (let i = 1; i < MAX; i++) {
      sockets.set(i, new WebSocket(`ws://localhost:4000?sp=A`));
      sockets.get(i).binaryType = "arraybuffer";
      sockets.get(i).onopen = () => {
        viwerFunction(i);
      };
      viwerArray.push(i);
    }
  } catch (err) {
    console.log(err, 2);
  } finally {
    sockets.get(MAX - 1).onmessage = (message) => {
      // console.log(message.data);
      if (isPlayerSend === false) {
        if (typeof message.data === "string") {
          // let newData = JSON.parse(message.data);
          for (let i = 1; i < MAX; i++) {
            playFunction(i);
            isPlayerSend = true;
          }
        } else {
          //console.log("good");
        }
      }
    };
    setTimeout(() => {
      setInterval(() => {
        for (let i = 1; i < MAX; i++) {
          locationFunction(i);
        }
      }, 16);
    }, 4000);
  }
})();
