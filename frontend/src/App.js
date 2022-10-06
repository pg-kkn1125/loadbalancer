import Container from "@mui/material/Container";
import React, { Suspense, useState } from "react";
import Canvas from "./components/atoms/Canvas";
import Socket from "./components/atoms/Socket";

export default function App() {
  const [ws, setWs] = useState(null);

  return (
    <Container maxWidth='sm'>
      <Socket ws={ws} setWs={setWs} />
      <Canvas />
    </Container>
  );
}
