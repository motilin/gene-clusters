// import { curveBumpX } from "d3-shape";
import React, { useState, useEffect, useCallback } from "react";
import Canvas from "./Canvas";

const numberOfLayers = 50;
const heatmapArray = Array.from(Array(10).keys())

// const getRndColor = () => {
//   var r = (255 * Math.random()) | 0,
//     g = (255 * Math.random()) | 0,
//     b = (255 * Math.random()) | 0;
//   return "rgb(" + r + "," + g + "," + b + ", 1)";
// };

// const requestAnimFrame = (() => {
//   return (
//     window.requestAnimationFrame ||
//     function (callback) {
//       window.setTimeout(callback, 1000 / 60);
//     }
//   );
// })();

export default function Heatmap() {
  const isIncluded = useCallback((geneInfo) => {
    return true;
  }, []);

  return (
    <div className="heatmap">
      <Canvas
        numberOfLayers={numberOfLayers}
        serialNum={0}
        isIncluded={isIncluded}
        isBackground={true}
      />
      {heatmapArray.map((val, i) => (
        <Canvas
          key={i}
          numberOfLayers={numberOfLayers}
          serialNum={i}
          isIncluded={isIncluded}
          isBackground={false}
        />
      ))}
    </div>
  );
}
