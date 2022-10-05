import React, { useEffect, useState } from "react";

const address = `ws://localhost:3000/connect?ch=A`;
let ws = new WebSocket(address);

function Socket() {
  // const [ws, setWs] = useState(null);
  useEffect(() => {
    // setWs(new WebSocket(address));
    if (ws) {
      ws.onopen = onopen;
      ws.onclose = onclose;
      ws.onmessage = onmessage;
      ws.onerror = onerror;
    }
    return () => {
      console.log("소켓 닫음");
      if (ws) {
        ws.close();
      }
    };
  }, []);

  function onopen(e) {
    console.log("서버 연결 됨");
  }
  function onclose(e) {
    console.log("서버 연결 끊어짐");
  }
  function onmessage(message) {
    console.log(message);
  }
  function onerror(e) {
    console.log(e);
  }

  return <div>test</div>;
}

export default Socket;
