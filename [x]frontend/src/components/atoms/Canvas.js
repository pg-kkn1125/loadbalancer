import { Box, styled } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";

let frame = 0;
let toggle = {
  w: false,
  s: false,
  a: false,
  d: false,
};
const SPEED = 5;

function Canvas({ ws, myId, usersMap, users }) {
  const canvasRef = useRef(null);

  const sendData = () => {
    const player = usersMap.get(myId);
    if (player) {
      console.log(player);
      ws.send(
        JSON.stringify(
          Object.assign(player, {
            deviceID: player.deviceID,
            pox: player.pox,
            poy: player.poy,
            poz: player.poz,
            roy: player.roy,
          })
        )
      );
    }
  };

  useEffect(() => {
    const { current } = canvasRef;

    const ctx = current.getContext("2d");
    current.width = innerWidth;
    current.height = innerHeight;
    function animate() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      if (users.length > 0) {
        users.forEach((user) => {
          ctx.fillText(user.nickname, user.pox + 35 / 2, user.poy - 15);
          ctx.textAlign = "center";
          ctx.fillRect(user.pox, user.poy, 35, 35);
        });
      }

      let player = usersMap.get(myId);
      if (player) {
        if (toggle.w) {
          player.poy -= SPEED;
        }
        if (toggle.s) {
          player.poy += SPEED;
        }
        if (toggle.a) {
          player.pox -= SPEED;
        }
        if (toggle.d) {
          player.pox += SPEED;
        }

        if ([...Object.values(toggle)].some((tg) => tg === true)) {
          sendData();
        }
      }

      frame += 0.1;
      requestAnimationFrame(animate);
    }
    const animateTime = requestAnimationFrame(animate);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    function handleKeyDown(e) {
      toggle[e.key] = true;
    }

    function handleKeyUp(e) {
      toggle[e.key] = false;
    }

    return () => {
      cancelAnimationFrame(animateTime);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [users, myId]);

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
