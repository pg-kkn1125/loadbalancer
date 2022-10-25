const uWS = require("uWebSockets.js");
// const fetch = require("node-fetch");
// console.log(process.env.pm_id);
//var port = Number(process.argv[2])
var port = Number(process.env.PORT);
const Queue = require("./queue/queue.js");
const Queue2 = require("./queue/queue2.js");
const Queue3 = require("./queue/queue3.js");
const sockets = new Map();
const viewers1 = new Map();
const viewers2 = new Map();
const viewers3 = new Map();
const viewers4 = new Map();
const viewers5 = new Map();
const players1 = new Map();
const players2 = new Map();
const players3 = new Map();
const players4 = new Map();
const players5 = new Map();
const locationQueue = new Queue3();
const chatQueue = new Queue2();
const stateQueue = new Queue2();
const chatLog = new Queue();
const decoder = new TextDecoder();
var deviceID = 0;

// ---------- protobuf js ------------
const protobuf = require("protobufjs");
var Type = protobuf.Type,
  Field = protobuf.Field;
function ProtoBuf(properties) {
  protobuf.Message.call(this, properties);
}
(ProtoBuf.prototype = Object.create(protobuf.Message)).constructor = ProtoBuf;

//Field.d(1, "fixed32", "required")(ProtoBuf.prototype, "id")
//Field.d(2, "bytes", "required")(ProtoBuf.prototype, "pos")
//Field.d(3, "sfixed32", "required")(ProtoBuf.prototype, "angle")
Field.d(1, "fixed32", "required")(ProtoBuf.prototype, "id");
Field.d(2, "float", "required")(ProtoBuf.prototype, "pox");
Field.d(3, "float", "required")(ProtoBuf.prototype, "poy");
Field.d(4, "float", "required")(ProtoBuf.prototype, "poz");
Field.d(5, "sfixed32", "required")(ProtoBuf.prototype, "roy");
/*
for(let i = 0; i < 5000; i++) {
    locationQueue.enter(`{"id":"tewtewt","pox":${i},"poy":${2.213124515},"poz":${1223.241421123123},"rox":${i},"roy":${2.213124515},"roz":${1223.241421123123}}`)
}
*/

var uint8array, messageString, messageObject, locationTmp;
let channels = new Map();

// let req = {
//   method: "POST",
//   mode: "cors",
//   cache: "no-cache",
//   credentials: "same-origin",
//   headers: new Headers({
//     "Content-Type": "application/json",
//   }),
//   referrerPolicy: "no-referrer",
//   body: {},
// };

// const serverCheck = async () => {
//   await fetch("http://192.168.88.242:50186/v1/api/users/serverCheck", req)
//     .then((response) => response.json())
//     .then((data) => {
//       // if (data.payload.rows[0].recent < 250) {
//       //     port = data.payload.rows[0].port - 46195
//       // } else if (data.payload.rows[1].recent < 250) {
//       //     port = data.payload.rows[1].port - 46195
//       // } else if (data.payload.rows[2].recent < 250) {
//       //     port = data.payload.rows[2].port - 46195
//       // } else if (data.payload.rows[3].recent < 250) {
//       //     port = data.payload.rows[3].port - 46195
//       // }

//       open();
//     })
//     .catch((error) => {
//       console.log(error);
//     });
// };

// const addUser = async (space) => {
//   let request = Object.assign(req, {
//     body: JSON.stringify({ port: port + 46195, space: space }),
//   });
//   await fetch("http://175.45.203.210:3000/v1/api/users/addUser", request)
//     .then((response) => response.json())
//     .then((data) => {
//       //console.log(Number(port + 46195) + ' server: add 1 user')
//     })
//     .catch((error) => {
//       console.log(error);
//     });
// };

// const deleteUser = async (space) => {
//   let request = Object.assign(req, {
//     body: JSON.stringify({ port: port + 46195, space: space }),
//   });
//   await fetch("http://175.45.203.210:3000/v1/api/users/deleteUser", req)
//     .then((response) => response.json())
//     .then((data) => {
//       //console.log(Number(port + 46195) + ' server: delete 1 user')
//     })
//     .catch((error) => {
//       console.log(error);
//     });
// };

//serverCheck()

const app = uWS
  .App()
  .ws("/*", {
    compression: uWS.SHARED_COMPRESSOR,
    //maxPayloadLength: 16 * 1024 * 1024,
    idleTimeout: 1800,
    //maxBackpressure: 1024,

    open: (ws) => {
      deviceID++;
      ws.subscribe(String(deviceID));
      //ws.subscribe(messageObject.space)
      sockets.set(ws, deviceID);
    },
    message: (ws, message, isBinary) => {
      if (isBinary) {
        locationQueue.enter(message);
        locationTmp = ProtoBuf.decode(new Uint8Array(message));
        if (players1.has(locationTmp.id)) {
          Object.assign(players1.get(locationTmp.id), {
            pox: locationTmp.pox,
            poy: locationTmp.poy,
            poz: locationTmp.poz,
            //rox: messageObject.rox,
            roy: locationTmp.roy,
            //roz: messageObject.roz,
            //row: messageObject.row,
          });
        } else if (players2.has(locationTmp.id)) {
          Object.assign(players2.get(locationTmp.id), {
            pox: locationTmp.pox,
            poy: locationTmp.poy,
            poz: locationTmp.poz,
            //rox: messageObject.rox,
            roy: locationTmp.roy,
            //roz: messageObject.roz,
            //row: messageObject.row,
          });
        } else if (players3.has(locationTmp.id)) {
          Object.assign(players3.get(locationTmp.id), {
            pox: locationTmp.pox,
            poy: locationTmp.poy,
            poz: locationTmp.poz,
            //rox: messageObject.rox,
            roy: locationTmp.roy,
            //roz: messageObject.roz,
            //row: messageObject.row,
          });
        } else if (players4.has(locationTmp.id)) {
          Object.assign(players4.get(locationTmp.id), {
            pox: locationTmp.pox,
            poy: locationTmp.poy,
            poz: locationTmp.poz,
            //rox: messageObject.rox,
            roy: locationTmp.roy,
            //roz: messageObject.roz,
            //row: messageObject.row,
          });
        } else if (players5.has(locationTmp.id)) {
          Object.assign(players5.get(locationTmp.id), {
            pox: locationTmp.pox,
            poy: locationTmp.poy,
            poz: locationTmp.poz,
            //rox: messageObject.rox,
            roy: locationTmp.roy,
            //roz: messageObject.roz,
            //row: messageObject.row,
          });
        }
      } else {
        messageString = decoder.decode(new Uint8Array(message));
        messageObject = JSON.parse(messageString);
        messageHandler(messageString, messageObject, ws, isBinary);
      }
    },
    drain: (ws) => {
      console.log("WebSocket backpressure: " + ws.getBufferedAmount());
    },
    close: (ws, code, message) => {
      //if (viewers.has(sockets.get(ws))) viewers.delete(sockets.get(ws))

      if (viewers1.has(sockets.get(ws))) {
        // deleteUser(viewers1.get(sockets.get(ws)).space);
        viewers1.delete(sockets.get(ws));
      } else if (viewers2.has(sockets.get(ws))) {
        // deleteUser(viewers2.get(sockets.get(ws)).space);
        viewers2.delete(sockets.get(ws));
      } else if (viewers3.has(sockets.get(ws))) {
        // deleteUser(viewers3.get(sockets.get(ws)).space);
        viewers3.delete(sockets.get(ws));
      } else if (viewers4.has(sockets.get(ws))) {
        // deleteUser(viewers4.get(sockets.get(ws)).space);
        viewers4.delete(sockets.get(ws));
      } else if (viewers5.has(sockets.get(ws))) {
        // deleteUser(viewers5.get(sockets.get(ws)).space);
        viewers5.delete(sockets.get(ws));
      }

      if (players1.has(sockets.get(ws))) {
        // deleteUser(players1.get(sockets.get(ws)).space);
        players1.delete(sockets.get(ws));
        app.publish(
          messageObject.space,
          JSON.stringify(Object.fromEntries(players1))
        );
      } else if (players2.has(sockets.get(ws))) {
        // deleteUser(players2.get(sockets.get(ws)).space);
        players2.delete(sockets.get(ws));
        app.publish(
          messageObject.space,
          JSON.stringify(Object.fromEntries(players2))
        );
      } else if (players3.has(sockets.get(ws))) {
        // deleteUser(players3.get(sockets.get(ws)).space);
        players3.delete(sockets.get(ws));
        app.publish(
          messageObject.space,
          JSON.stringify(Object.fromEntries(players3))
        );
      } else if (players4.has(sockets.get(ws))) {
        // deleteUser(players4.get(sockets.get(ws)).space);
        players4.delete(sockets.get(ws));
        app.publish(
          messageObject.space,
          JSON.stringify(Object.fromEntries(players4))
        );
      } else if (players5.has(sockets.get(ws))) {
        // deleteUser(players5.get(sockets.get(ws)).space);
        players5.delete(sockets.get(ws));
        app.publish(
          messageObject.space,
          JSON.stringify(Object.fromEntries(players5))
        );
      }

      console.log(sockets.get(ws) + " exited!");
      sockets.delete(ws);
      //console.log(Number(port + 46195) + 'server current connect players: ' + players.size + ' / current connect viewers: ' + viewers.size)
    },
  })
  .any("/*", (res, req) => {
    res.end("Nothing to see here!");
  })
  .listen(port, (token) => {
    if (token) {
      // process.send("ready")
      console.log("Listening to port " + port);
    } else {
      console.log("Failed to listen to port " + port);
    }
  });

function messageHandler(messageString, messageObject, ws, isBinary) {
  if (messageObject.type === "viewer") {
    // addUser(messageObject.space);
    ws.subscribe(messageObject.space);
    //viewers.set(sockets.get(ws), Object.assign(messageObject, { deviceID: sockets.get(ws) }))
    switch (messageObject.space) {
      case "mayor":
        viewers1.set(
          sockets.get(ws),
          Object.assign(messageObject, { deviceID: sockets.get(ws) })
        );
        app.publish(
          String(sockets.get(ws)),
          JSON.stringify(new Array(viewers1.get(sockets.get(ws))))
        );
        if (players1.size > 0)
          app.publish(
            messageObject.space,
            JSON.stringify(Object.fromEntries(players1))
          );
        break;
      case "model":
        viewers2.set(
          sockets.get(ws),
          Object.assign(messageObject, { deviceID: sockets.get(ws) })
        );
        app.publish(
          String(sockets.get(ws)),
          JSON.stringify(new Array(viewers2.get(sockets.get(ws))))
        );
        if (players2.size > 0)
          app.publish(
            messageObject.space,
            JSON.stringify(Object.fromEntries(players2))
          );
        break;
      case "sing":
        viewers3.set(
          sockets.get(ws),
          Object.assign(messageObject, { deviceID: sockets.get(ws) })
        );
        app.publish(
          String(sockets.get(ws)),
          JSON.stringify(new Array(viewers3.get(sockets.get(ws))))
        );
        if (players3.size > 0)
          app.publish(
            messageObject.space,
            JSON.stringify(Object.fromEntries(players3))
          );
        break;
      case "space4":
        viewers4.set(
          sockets.get(ws),
          Object.assign(messageObject, { deviceID: sockets.get(ws) })
        );
        app.publish(
          String(sockets.get(ws)),
          JSON.stringify(new Array(viewers4.get(sockets.get(ws))))
        );
        if (players4.size > 0)
          app.publish(
            messageObject.space,
            JSON.stringify(Object.fromEntries(players4))
          );
        break;
      case "space5":
        viewers5.set(
          sockets.get(ws),
          Object.assign(messageObject, { deviceID: sockets.get(ws) })
        );
        app.publish(
          String(sockets.get(ws)),
          JSON.stringify(new Array(viewers5.get(sockets.get(ws))))
        );
        if (players5.size > 0)
          app.publish(
            messageObject.space,
            JSON.stringify(Object.fromEntries(players5))
          );
        break;
    }

    //clients.get(deviceID).send(JSON.stringify(new Array(players.get(deviceID))), isBinary)
    //app.publish(String(sockets.get(ws)), JSON.stringify(new Array(viewers.get(sockets.get(ws)))))

    // switch (messageObject.space) {
    //     case 'mayor':
    //         if (players1.size > 0) app.publish(messageObject.space, JSON.stringify(Object.fromEntries(players1)))
    //         break
    //     case 'model':
    //         if (players2.size > 0) app.publish(messageObject.space, JSON.stringify(Object.fromEntries(players2)))
    //         break
    //     case 'sing':
    //         if (players3.size > 0) app.publish(messageObject.space, JSON.stringify(Object.fromEntries(players3)))
    //         break
    //     case 'space4':
    //         if (players4.size > 0) app.publish(messageObject.space, JSON.stringify(Object.fromEntries(players4)))
    //         break
    //     case 'space5':
    //         if (players5.size > 0) app.publish(messageObject.space, JSON.stringify(Object.fromEntries(players5)))
    //         break
    // }

    console.log("deviceID: " + messageObject.deviceID + " has joined!");
    //console.log(Number(port + 46195) + ' server current connect players: ' + players.size + ' / current connect viewers: ' + viewers.size)
  } else if (messageObject.type === "player") {
    //players.set(sockets.get(ws), Object.assign(messageObject, { deviceID: sockets.get(ws) }))
    switch (messageObject.space) {
      case "mayor":
        players1.set(
          sockets.get(ws),
          Object.assign(messageObject, { deviceID: sockets.get(ws) })
        );
        app.publish(
          messageObject.space,
          JSON.stringify(Object.fromEntries(players1))
        );
        viewers1.delete(sockets.get(ws));
        break;
      case "model":
        players2.set(
          sockets.get(ws),
          Object.assign(messageObject, { deviceID: sockets.get(ws) })
        );
        app.publish(
          messageObject.space,
          JSON.stringify(Object.fromEntries(players2))
        );
        viewers2.delete(sockets.get(ws));
        break;
      case "sing":
        players3.set(
          sockets.get(ws),
          Object.assign(messageObject, { deviceID: sockets.get(ws) })
        );
        app.publish(
          messageObject.space,
          JSON.stringify(Object.fromEntries(players3))
        );
        viewers3.delete(sockets.get(ws));
        break;
      case "space4":
        players4.set(
          sockets.get(ws),
          Object.assign(messageObject, { deviceID: sockets.get(ws) })
        );
        app.publish(
          messageObject.space,
          JSON.stringify(Object.fromEntries(players4))
        );
        viewers4.delete(sockets.get(ws));
        break;
      case "space5":
        players5.set(
          sockets.get(ws),
          Object.assign(messageObject, { deviceID: sockets.get(ws) })
        );
        app.publish(
          messageObject.space,
          JSON.stringify(Object.fromEntries(players5))
        );
        viewers5.delete(sockets.get(ws));
        break;
    }
    //viewers.delete(sockets.get(ws))
    ws.unsubscribe(String(sockets.get(ws)));

    //app.publish(messageObject.space, JSON.stringify(Object.fromEntries(players)))
    console.log(
      "deviceID: " +
        messageObject.deviceID +
        " has logined! to " +
        messageObject.id +
        "!!"
    );
    //console.log(Number(port + 46195) + ' server current connect players: ' + players.size + ' / current connect viewers: ' + viewers.size)
  } else if (messageObject.type === "chat") {
    chatQueue.enter(messageString);
  } else if (messageObject.type === "state") {
    //console.log('state')
    stateQueue.enter(messageString);
    if (messageObject.state === "changeAvatar") {
      //Object.assign(players.get(sockets.get(ws)), { avatar: messageObject.data })
      switch (messageObject.space) {
        case "mayor":
          Object.assign(players1.get(sockets.get(ws)), {
            avatar: messageObject.data,
          });
          break;
        case "model":
          Object.assign(players2.get(sockets.get(ws)), {
            avatar: messageObject.data,
          });
          break;
        case "sing":
          Object.assign(players3.get(sockets.get(ws)), {
            avatar: messageObject.data,
          });
          break;
        case "space4":
          Object.assign(players4.get(sockets.get(ws)), {
            avatar: messageObject.data,
          });
          break;
        case "space5":
          Object.assign(players5.get(sockets.get(ws)), {
            avatar: messageObject.data,
          });
          break;
      }
    }
  }
}

const sendLocation = setInterval(() => {
  if (locationQueue.count !== 0) {
    let location = locationQueue.get();
    app.publish("mayor", location, true, true);
    app.publish("model", location, true, true);
    app.publish("sing", location, true, true);
    //app.publish(messageObject.space, locationQueue.get(), true, true)
    //app.publish(messageObject.space, locationQueue.get(), true, true)
  }
}, 8);

const sendElse = setInterval(() => {
  if (chatQueue.count !== 0) {
    let chat = chatQueue.get();
    app.publish("mayor", chat);
    app.publish("model", chat);
    app.publish("sing", chat);
    //app.publish('sing', chat)
    //app.publish('sing', chat)
  }
  if (stateQueue.count !== 0) {
    let state = stateQueue.get();
    app.publish("mayor", state);
    app.publish("model", state);
    app.publish("sing", state);
    //app.publish('mayor', state)
    //app.publish('mayor', state)
  }
}, 100);

/*
setTimeout(() => 
    const sendChat = setInterval(() => {
        app.publish(messageObject.space, chatQueue.get())
    }, 16)
}, 10)

setTimeout(() => {
    const sendState = setInterval(() => {
        app.publish(messageObject.space, stateQueue.get())
    }, 16)
}, 14)
*/

//ping
setInterval(() => {
  app.publish("mayor", "");
  app.publish("model", "");
  app.publish("sing", "");
  //app.publish('model', '')
  //app.publish('model', '')
}, 55000);
