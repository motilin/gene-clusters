const { MongoClient } = require("mongodb");
const JSONStream = require("JSONStream");
const { buildMatrix } = require("./buildMatrix.js");
const { createClient } = require("redis");

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
const suffix = "Test";
// const suffix = "";

let db;
let redisClient;

/// On Windows I've made use of Memurai
const connectToRedis = async () => {
  redisClient = createClient();
  redisClient.on("error", (err) => console.log("Redis client error", err));
  await redisClient.connect();
  return redisClient;
};

const connectToDB = (callback) => {
  client.connect((err, db) => {
    if (err || !db) {
      return callback(err);
    }
  });
  db = client.db(`geneClusters${suffix}`);
  console.log("successfully connected to MongoDB");
  return callback();
};

const getConnection = () => {
  return db;
};

const getNumbers = (name) => async (req, res) => {
  const mini = db.collection(`numbers`);
  const entry = await mini.findOne({ _id: name });
  res.json(entry.value);
};

const getStream = (collection) => async (req, res) => {
  res.set("Content-Type", "application/json");
  const col = await db.collection(collection);
  const cursor = await col.find({});
  cursor.stream().pipe(JSONStream.stringify()).pipe(res);
};

const getNumberOfPatients = () => {
  return getNumbers("numberOfPatients");
};

const getNumberOfGenes = () => {
  return getNumbers("numberOfGenes");
};

const getGroupedByPatient = () => {
  return getStream("groupedByPatient");
};

const getPatientByIndex = () => {
  return getStream("patientByIndex");
};

const getIndexByPatient = () => {
  return getStream("indexByPatient");
};

const getIndexByGene = () => {
  return getStream("indexByGene");
};

const getGeneByIndex = () => {
  return getStream("geneByIndex");
};

const getMaxValue = () => {
  return getNumbers("maxValue");
};

const getMatrix = () => {
  return getStream("matrix");
};

const getFlattened = () => {
  return getStream("flattened");
};

const submitForm = (req, res) => {
  res.set("Content-Type", "application/json");
  try {
    buildMatrix(redisClient, req.body).then((stream) =>
      stream.pipe(JSONStream.stringify()).pipe(res)
    );
  } catch (e) {
    console.log(e);
  }
};

module.exports = {
  connectToDB: connectToDB,
  connectToRedis: connectToRedis,
  getNumberOfPatients: getNumberOfPatients,
  getNumberOfGenes: getNumberOfGenes,
  getGroupedByPatient: getGroupedByPatient,
  getPatientByIndex: getPatientByIndex,
  getIndexByPatient: getIndexByPatient,
  getIndexByGene: getIndexByGene,
  getGeneByIndex: getGeneByIndex,
  getMaxValue: getMaxValue,
  getMatrix: getMatrix,
  getFlattened: getFlattened,
  submitForm: submitForm,
};
