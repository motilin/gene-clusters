import "./App.css";
import React, { useState } from "react";
import ControlPanel from "./ControlPanel";
import Heatmap from "./Heatmap";

export default function App() {
  const [stream, setStream] = useState(null);
  return (
    <>
      <ControlPanel setStream={setStream} />
      <Heatmap stream={stream} />
    </>
  );

  // add option to filter by clusters that contain genes from a list (e.g. CS list)
}
