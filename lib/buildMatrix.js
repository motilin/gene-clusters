const http = require("http");
const axios = require("axios");
const { PassThrough, Readable } = require("stream");
const JSONStream = require("JSONStream");
const childProcess = require("child_process");
const os = require("os");

const parentPort = 3034;
const processes = os.cpus().length;

async function streamMongo(collection, stream) {
  const cursor = await collection.find({});
  for await (const doc of cursor) {
    stream.push({
      key: doc._id,
      value: doc.value,
    });
  }
  stream.push(null);
  return stream;
}

async function streamRedis(redisClient, stream) {
  const keys = await redisClient.KEYS("*");
  for await (const key of keys) {
    if (key !== "patient") {
      const value = await redisClient.get(key);
      stream.push({
        key: key,
        value: value,
      });
    }
  }
  stream.push(null);
  redisClient.FLUSHALL();
  return stream;
}

function watchCancel(redisClient, children) {
  setInterval(async () => {
    const cancel = await redisClient.get("cancel");
    if (cancel === "1") {
      for (const child of children) {
        child.kill();
      }
    }
  }, 1000);
}

async function streamMatrices(passThrough) {
  let streams = [];
  for (let i = 0; i < processes; i++) {
    axios
      .get(`http://localhost:${parentPort + i + 1}`)
      .then((res) => {
        streams.push(res);
      })
      .catch((err) => {
        console.log(err);
      });
  }
  let waiting = streams.length;
  for (const stream of streams) {
    passThrough = stream.pipe(passThrough, { end: false });
    stream.once("end", () => --waiting === 0 && passThrough.emit("end"));
  }
  return passThrough;
}

async function buildMatrix(req, res, db, redisClient) {
  const params = req.body;
  let children = [];
  watchCancel(redisClient, children);
  let done = 0;
  let numberOfGenes = await db
    .collection("numbers")
    .findOne({ _id: "numberOfGenes" });
  numberOfGenes = numberOfGenes.value;
  const interval = Math.ceil(numberOfGenes / processes);

  redisClient.FLUSHALL();

  for (let i = 0; i < processes; i++) {
    const child = childProcess.fork("./lib/child.js");
    children.push(child);
    const _min = i * interval;
    const _max = (i + 1) * interval;
    const min = _min > numberOfGenes ? numberOfGenes : _min;
    const max = _max > numberOfGenes ? numberOfGenes : _max;
    child.send({ min, max, numberOfGenes, params, parentPort });
  }

  let streams = [];
  let waiting = processes;
  let passThrough = new PassThrough({ objectMode: true });
  http
    .createServer((req, resToChild) => {
      const min = parseInt(req.headers.min);
      streams.push({ min: min, stream: req });
      if (streams.length === processes) {
        streams = streams.sort((a, b) => a.min - b.mie);
        streams = streams.map((obj) => obj.stream);
        for (const stream of streams) {
          passThrough = stream.pipe(passThrough, { end: false });
          stream.once("end", () => --waiting === 0 && passThrough.emit("end"));
        }
        passThrough
          .pipe(JSONStream.parse())
          .pipe(JSONStream.stringify())
          .pipe(res);
      }
    })
    .listen(parentPort);
}

module.exports = {
  buildMatrix: buildMatrix,
};
