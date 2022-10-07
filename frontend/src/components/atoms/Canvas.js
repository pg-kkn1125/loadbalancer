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
let select = null;

function Canvas({ ws, me, setWs, users, setUsers }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const { current } = canvasRef;

    const ctx = current.getContext("2d");
    current.width = innerWidth;
    current.height = innerHeight;

    function animate() {
      if (users.length > 0) {
        users.forEach((user) => {
          ctx.clearRect(0, 0, innerWidth, innerHeight);

          ctx.fillText(user.nickname, user.pox + 35 / 2, user.poy - 15);
          ctx.textAlign = "center";
          ctx.fillRect(user.pox, user.poy, 35, 35);
        });
      }

      console.log(me.current)
      if (
        ws &&
        (select = users.find((user) => me.current.deviceID === user.deviceID))
      ) {
        if (toggle.w) {
          select.poy -= SPEED;
        } else if (toggle.s) {
          select.poy += SPEED;
        } else if (toggle.a) {
          select.pox -= SPEED;
        } else if (toggle.d) {
          select.pox += SPEED;
        }

        ws.send(
          JSON.stringify(
            Object.assign(select, {
              deviceID: select.deviceID,
              pox: select.pox,
              poy: select.poy,
              poz: select.poz,
              roy: select.roy,
            })
          )
        );
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
  }, [users]);

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
