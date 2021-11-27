const { MongoClient } = require("mongodb");
const { createClient } = require("redis");

const uri = "mongodb://localhost:27017";
// const suffix = "Test";
const suffix = "";

const isIncluded = (gene, params) => {
  return true;
};

process.on("message", async (message) => {
  const { serialNum, processes, params } = message;

  const redisClient = createClient();
  redisClient.on("error", (err) => console.log("Redis client error", err));
  await redisClient.connect();
  const mongoClient = new MongoClient(uri);
  await mongoClient.connect();

  const db = mongoClient.db(`geneClusters${suffix}`);
  const col = db.collection("flattened");
  const cursor = col.find({
    _id: { $mod: [processes, serialNum] },
  });
  for await (const patient of cursor) {
    console.log(patient._id);
    const cancel = await redisClient.get("cancel");
    if (cancel === "0") {
      redisClient.INCR("patient");
      let genesIncluded = [];
      for await (const gene of Object.keys(patient.value)) {
        if (isIncluded(patient[gene], params)) {
          genesIncluded.push(gene);
        }
      }
      for (let i = 0; i < genesIncluded.length; i++) {
        for (let j = 0; j < genesIncluded.length; j++) {
          await redisClient.INCR(genesIncluded[i] + "," + genesIncluded[j]);
        }
      }
    }
  }
  process.send("done");
  redisClient.QUIT();
  mongoClient.close();
});
