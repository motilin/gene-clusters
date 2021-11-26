import React, { useEffect } from "react";
import Canvas from "./Canvas";

export default function Heatmap({ stream }) {
  useEffect(() => {
    if (!stream) return;
    console.log(stream);
  }, [stream]);

  return null;
}
