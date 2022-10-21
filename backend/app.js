// process.on("message", ({ data }) => {
//   if (data.target === "publish") {
//     const { packet } = data;
//     const { topic, content, zip } = packet;
//     const socket = sockets.get(String(deviceID));
//     if (zip) {
//       // NOTICE: 메세지를 다시 줄 때 프로토버프 사용해서 버퍼화 시켜야 함
//       // const parsing = JSON.parse(content);
//       // // 데이터 보존을 위해 텍스트로 받음
//       // const convertTo25Byte = ProtoBuf.encode(new ProtoBuf(parsing)).finish();
//       // app.publish(topic, convertTo25Byte, true, true);
//     } else {
//       // app.publish(topic, content);
//     }
//   } else if (data.target === "subscribe") {
//     const { packet } = data;
//     const { deviceID, channel } = packet;
//     const socket = sockets.get(String(deviceID));
//     sockets.set(socket, deviceID);
//     try {
//       users.set(
//         socket,
//         Object.assign(users.get(socket), {
//           channel: channel,
//         })
//       );
//     } catch (e) {
//       // process.exit(0);
//     }
//   }
// });
import { servers } from "./src/models/ServerBalancer";
import app from "./src/models/Socket";

const currentServer = servers.findHoleServer();

/* PORT === 서버 포트 */
const PORT = process.env.NODE_ENV === "development" ? 4000 : 3000;

app.listen(PORT, (listenSocket) => {
  // port는 숫자여야합니다. 아니면 열리지 않습니다... 😂
  process.send("ready");
  console.log(`listening on ws://locahost:${PORT}`);
  if (listenSocket) {
    console.log(`${PORT}번 포트 열었음`);
  }
});

/**
 * 프로세스 죽었을 때 SIGINT 이벤트 전달
 */
process.on("SIGINT", function () {
  isDisableKeepAlive = true;
  app.close(function () {
    process.exit(0);
  });
});

export {};
