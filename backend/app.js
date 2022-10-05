const uWS = require("uWebSockets.js");
const emitter = require("./src/emitter");
const { declare } = require("./src/protobuf");

/**
 * 서버 포트
 * keepalive 설정
 * 디바이스 인덱스
 */
const PORT = process.env.PORT || 3000;
let isDisableKeepAlive = false;
let deviceIDX = 0;

/**
 * Protobuf 규격 설정
 */

const app = uWS
  .App({})
  .ws(`/*`, {
    /* Options */
    compression: uWS.SHARED_COMPRESSOR,
    maxPayloadLength: 16 * 1024 * 1024,
    idleTimeout: 10,
    /* Handlers */
    upgrade: upgradeHandler,
    open: openHandler,
    message: messageHandler,
    drain: drainHandler,
    close: closeHandler,
  })
  // .get("/*", (res, req) => {
  //   /* It does Http as well */
  //   res
  //     .writeStatus("200 OK")
  //     .writeHeader("IsExample", "Yes")
  //     .end("Hello there!");
  // })
  .listen(PORT, (listenSocket) => {
    if (listenSocket) {
      console.log(`${PORT}번 포트 열었음`);
    }
  });

function upgradeHandler(res, req, context) {
  /**
   * 쿼리 가지고 옴
   */
  const params = Object.fromEntries(
    req
      .getQuery()
      .split("&")
      .filter((q) => q)
      .map((q) => q.split("="))
  );
  res.upgrade(
    {
      url: req.getUrl(),
      params: params,
    },
    /* Spell these correctly */
    req.getHeader("sec-websocket-key"),
    req.getHeader("sec-websocket-protocol"),
    req.getHeader("sec-websocket-extensions"),
    context
  );
  console.log(req.getQuery());
}

function openHandler(ws) {
  if (isDisableKeepAlive) {
    ws.close();
  }

  // const viewer = createViewer();

  // emitter.emit(app, ws, viewer);
  deviceIDX++;
}

function messageHandler(ws, message, isBinary) {
  /* Ok is false if backpressure was built up, wait for drain */
  let ok = ws.send(message, isBinary);
}

function drainHandler(ws) {
  console.log("WebSocket backpressure: " + ws.getBufferedAmount());
}

function closeHandler(ws, code, message) {
  console.log("WebSocket closed");
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

module.exports = { app };
