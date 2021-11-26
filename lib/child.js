const { MongoClient } = require("mongodb");
const { createClient } = require("redis");

const uri = "mongodb://localhost:27017";
const suffix = "Test";
// const suffix = "";

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
/////////////////  continue here, fix the accessor for patient and gene in collection object
  for await (const patient of cursor) {
      let genesIncluded = []
      for await (const gene of patient) {
          if (isIncluded(gene, params)) {
              genesIncluded.push()
          }
      }
  }



  redisClient.QUIT()
});
