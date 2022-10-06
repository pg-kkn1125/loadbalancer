import { Box, styled } from "@mui/material";
import React, { useEffect, useRef } from "react";

let frame = 0;

function Canvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const { current } = canvasRef;

    const ctx = current.getContext("2d");
    current.width = innerWidth;
    current.height = innerHeight;

    function animate() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);

      ctx.fillRect(innerWidth / 2, innerHeight / 2, 35, 35);

      frame += 0.1;
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }, []);

  return (
    <Box
      ref={canvasRef}
      component={"canvas"}
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        background: "#ffffff",
        zIndex: -1,
      }}
    />
  );
}

export default Canvas;
