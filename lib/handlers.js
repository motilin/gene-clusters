import { MongoClient } from "mongodb";
import JSONStream from "JSONStream";

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
// const suffix = "Test";
const suffix = "";

let db;

export const connectToDB = (callback) => {
  client.connect((err, db) => {
    if (err || !db) {
      return callback(err);
    }
  });
  db = client.db(`geneClusters${suffix}`);
  console.log("successfully connected to MongoDB");
  return callback();
};

export const getConnection = () => {
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
  const cursor = await col.find({})
  cursor.stream().pipe(JSONStream.stringify()).pipe(res);
};

export const getNumberOfPatients = () => {
  return getNumbers("numberOfPatients");
};

export const getNumberOfGenes = () => {
  return getNumbers("numberOfGenes");
};

export const getGroupedByPatient = () => {
  return getStream("groupedByPatient");
};

export const getPatientByIndex = () => {
  return getStream("patientByIndex");
};

export const getIndexByPatient = () => {
  return getStream("indexByPatient");
};

export const getIndexByGene = () => {
  return getStream("indexByGene");
};

export const getGeneByIndex = () => {
  return getStream("geneByIndex");
};

export const getMaxValue = () => {
  return getNumbers("maxValue");
};

export const getMatrix = () => {
  return getStream("matrix");
};

export const getFlattened = () => {
  return getStream("flattened");
};
