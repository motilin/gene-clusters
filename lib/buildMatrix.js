const { Readable } = require("stream");
const childProcess = require("child_process");
const os = require("os");

const processes = os.cpus().length;

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

async function buildMatrix(redisClient, params) {
  let done = 0;
//   redisClient.FLUSHALL();
  const stream = new Readable({
    objectMode: true,
    read(size) {
      return true;
    },
  });

  for (let i = 0; i < processes; i++) {
    const child = childProcess.fork("./lib/child.js");
    child.send({ serialNum: i, processes, params });
    child.on("message", (message) => {
      done++;
      if (done === processes) {
        console.log("parent received all results");
        return streamRedis(redisClient, stream);
      }
    });
  }
  return stream;
}

module.exports = {
  buildMatrix: buildMatrix,
};
