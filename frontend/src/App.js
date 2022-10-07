import { Container } from "@mui/material";
import React, { Suspense, useRef, useState } from "react";
import Canvas from "./components/atoms/Canvas";
import Socket from "./components/atoms/Socket";

export default function App() {
  const [ws, setWs] = useState(null);
  const [users, setUsers] = useState([]);
  const me = useRef(0);

  return (
    <Container maxWidth='sm'>
      <Socket ws={ws} me={me} setWs={setWs} users={users} setUsers={setUsers} />
    </Container>
  );
}
