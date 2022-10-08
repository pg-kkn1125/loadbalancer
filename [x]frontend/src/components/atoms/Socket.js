import { Alert, Box, Button, Paper, Stack, TextField } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import User from "../../models/User";
import { Message } from "../../utils/Message";
import Canvas from "./Canvas";

const declareProtobuf = new Message({
  id: "fixed32",
  type: "string",
  nickname: "string",
  device: "string",
  deviceID: "string",
  authority: "bool",
  avatar: "string",
  pox: "float",
  poy: "float",
  poz: "float",
  roy: "float",
  state: "string",
  host: "string",
  timestamp: "fixed64",
});

let usersMap = new Map();
let users = [];

const HOST = process.env.SERVER_HOST || "localhost";
const PORT = process.env.SERVER_PORT || 3000;

function Socket({ ws, setWs }) {
  let [myId, setMyId] = useState(null);
  const nickRef = useRef(null);
  const [show, isShow] = useState(null);
  const [login, setLogin] = useState(false);

  const onopen = (e) => {
    isShow(true);
    console.log("서버에 연결되었습니다.");
  };

  const onmessage = (message) => {
    if (message.data instanceof Blob) {
      /*  */
    } else if (message.data instanceof ArrayBuffer) {
      const decoder = new TextDecoder();
      const jsonString = decoder.decode(message.data);
      const object = JSON.parse(jsonString);
      if (object.hasOwnProperty("type")) {
        // login
        setMyId(object.deviceID);
        users.push(object);
        usersMap.set(object.deviceID, object);
      } else {
        // location
        if (!object) return;
        const user = usersMap.get(object.deviceID);
        user.pox = object.pox;
        user.poy = object.poy;
      }
    }
  };

  const onerror = (e) => {
    console.log(e);
  };

  const onclose = (e) => {
    console.log(e);
    isShow(false);
  };

  const createSocket = () => {
    const temp = new WebSocket(`ws://${HOST}:${PORT}/server?sp=A`);
    temp.binaryType = "arraybuffer";
    temp.onopen = onopen;
    temp.onmessage = onmessage;
    temp.onerror = onerror;
    temp.onclose = onclose;
    setWs(temp);
  };

  useEffect(() => {
    createSocket();
    setTimeout(() => {
      isShow(null);
    }, 3000);
  }, []);

  const handleLogin = () => {
    if (nickRef.current.value === "") return;
    const user = new User({
      id: 1,
      type: "player",
      nickname: nickRef.current.value,
      device: "labtop",
      state: "online",
      pox: innerWidth / 2 - 35 / 2,
      poy: innerHeight / 2 - 35 / 2,
      poz: 0,
      roy: 0,
    }).toJSON();
    // 작동 안되는 이유는 User class에서 type없으면 모두 널 값이 되도록 해서.
    ws.send(Message.encode(declareProtobuf.setMessage(user)).finish());
    setLogin(true);
  };

  return (
    <>
      {show === true && <Alert severity='success'>연결되었습니다.</Alert>}
      {show === false && <Alert severity='error'>연결이 끊어졌습니다.</Alert>}
      {!login && ws && (
        <Stack
          component={Paper}
          elevation={5}
          sx={{
            minWidth: 500,
            position: "absolute",
            p: 5,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}>
          <TextField label='nickname' inputRef={nickRef} />
          <Button onClick={handleLogin}>로그인</Button>
        </Stack>
      )}
      <Canvas ws={ws} myId={myId} usersMap={usersMap} users={users} />
    </>
  );
}

export default Socket;
