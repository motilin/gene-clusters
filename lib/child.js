const http = require("http");
const axios = require("axios");
const { MongoClient } = require("mongodb");
const { createClient } = require("redis");
const JSONStream = require("JSONStream");
const streamify = require("stream-array");

const uri = "mongodb://localhost:27017";
const suffix = "";
// const suffix = "Test";

const isIncluded = (gene, params) => {
  return true;
};

process.on("message", async (message) => {
  const { min, max, numberOfGenes, params, parentPort } = message;
  // console.log(min, max, numberOfGenes, params);
  let matrix;

  const redisClient = createClient();
  redisClient.on("error", (err) => console.log("Redis client error", err));
  await redisClient.connect();

  MongoClient.connect(uri, async (error, client) => {
    if (error) {
      throw error;
    }

    matrix = Array(max - min).fill(0);
    matrix = matrix.map(() => Array(numberOfGenes).fill(0));

    const db = client.db(`geneClusters${suffix}`);
    const fl = db.collection("flattened");
    const cursor = fl.find({});

    console.time("build matrix");

    let counter = 0;
    for await (const patient of cursor) {
      if (counter < 10) {
        counter++;

        redisClient.INCR("patient");
        let genesIncluded = [];
        for await (const gene of Object.keys(patient.value)) {
          if (isIncluded(patient[gene], params)) {
            genesIncluded.push(gene);
          }
        }

        for (let i = 0; i < genesIncluded.length; i++) {
          for (let j = i; j < genesIncluded.length; j++) {
            if (min <= genesIncluded[i] && genesIncluded[i] < max) {
              matrix[genesIncluded[i] - min][genesIncluded[j]] += 1;
            }
            if (min <= genesIncluded[j] && genesIncluded[j] < max) {
              matrix[genesIncluded[j] - min][genesIncluded[i]] += 1;
              if (genesIncluded[i] === genesIncluded[j]) {
                matrix[genesIncluded[i] - min][genesIncluded[i]] -= 1;
              }
            }
          }
        }
      }
    }

    console.timeEnd("build matrix");

    const streamArray = streamify(matrix);
    streamArray.on("end", () => {
      redisClient.QUIT();
      setTimeout(() => process.exit(), 1000);
    });

    const headers = {
      "Content-Type": "application/json",
      min: min,
    };

    try {
      axios.post(
        `http://localhost:${parentPort}`,
        streamArray.pipe(JSONStream.stringify()),
        { headers: headers }
      );
    } catch (e) {console.log('error')}
  });
});
