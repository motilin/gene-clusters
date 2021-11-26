import React, { useEffect, useCallback, useRef } from "react";
import { useData } from "./DataProvider";

const length = 10500;
const renderedLength = 250;
const color = "rgb(255, 0, 0, 0.5)";

Array.prototype.pairs = function (func) {
  for (var i = 0; i < this.length; i++) {
    for (var j = i; j < this.length; j++) {
      func([this[i], this[j]]);
    }
  }
};

export default function Canvas({
  serialNum,
  numberOfLayers,
  isIncluded,
  isBackground,
}) {
  const { getFlattened, getNumberOfGenes } = useData();
  // const [loading, setLoading] = useState(false);

  const refs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const readStream = useCallback(async (getStrem, callback) => {
    const jsonPromise = getStrem();
    jsonPromise.then((data) => callback(data));
  }, []);

  const drawPair = useCallback((genePair, ctx, cell) => {
    let pair = [...genePair];
    let i;
    let [x, y] = [1, 1];
    if (pair[0] * cell >= length) {
      x = 2;
      pair[0] -= length / cell;
    }
    if (pair[1] * cell >= length) {
      y = 3;
      pair[1] -= length / cell;
    }
    if (x * y === 6) {
      {
        i = 3;
      }
    } else {
      i = x * y - 1;
    }
    ctx[i].fillStyle = color;
    ctx[i].fillRect(pair[0] * cell, pair[1] * cell, cell, cell);
  }, []);

  useEffect(() => {
    getNumberOfGenes().then((numberOfGenes) => {
      setCanvas(numberOfGenes);
    });
  }, []);

  const setCanvas = (numberOfGenes) => {
    const cell = (2 * length) / numberOfGenes;
    for (const ref of refs) {
      if (!ref.current || !ref.current.getContext) return null;
    }
    let ctx = [];
    for (let i = 0; i < refs.length; i++) {
      ctx[i] = refs[i].current.getContext("2d");
      ctx[i].canvas.width = length;
      ctx[i].canvas.height = length;
      if (isBackground) {
        ctx[i].fillStyle = "black";
        ctx[i].fillRect(0, 0, length, length);
      }
    }
    if (!isBackground) {
      readStream(getFlattened, (json) => {
        for (let patient of json) {
          if (patient._id % numberOfLayers === serialNum) {
            console.log("patient id", patient._id);
            let genesIncluded = [];
            for (let gene of Object.keys(patient.value)) {
              if (isIncluded(patient.value[gene])) {
                genesIncluded.push(gene);
              }
            }
            genesIncluded.pairs((pair) => {
              pair = [parseInt(pair[0]), parseInt(pair[1])];
              drawPair(pair, ctx, cell);
              if (pair[0] !== pair[1]) {
                drawPair(pair.reverse(), ctx, cell);
              }
            });
          }
        }
      });
    }
  };

  return (
    <div className="quadruple">
      <canvas ref={refs[0]} style={{ left: `0px`, top: `0px` }} />
      <canvas
        ref={refs[1]}
        style={{ left: `${renderedLength}px`, top: `0px` }}
      />
      <canvas
        ref={refs[2]}
        style={{ left: `0px`, top: `${renderedLength}px` }}
      />
      <canvas
        ref={refs[3]}
        style={{
          left: `${renderedLength}px`,
          top: `${renderedLength}px`,
        }}
      />
    </div>
  );
}
