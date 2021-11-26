const { Readable } = require("stream");
const childProcess = require("child_process");
const os = require("os");

const processes = os.cpus().length;

async function buildMatrix(redisClient, params) {
  let done = 0;
  redisClient.FLUSHALL();
  for (let i = 0; i < processes; i++) {
    const child = childProcess.fork("./lib/child.js");
    child.send({ serialNum: i, processes, params });
    child.on('message', (message) => {
        console.log(`message from child: ${message}`);
        done++
        if (done === processes) {
            console.log('parent received all results')
        }
    })
  }

  const stream = new Readable({
    objectMode: true,
    read(size) {
      return true;
    },
  });

  await redisClient.INCR("counter1");
  await redisClient.INCR("counter2");

  const keys = await redisClient.KEYS("*");
  for await (const key of keys) {
    const value = await redisClient.get(key);
    stream.push({
      key: key,
      value: value,
    });
  }
  stream.push(null);
  return stream;
}

module.exports = {
  buildMatrix: buildMatrix,
};
