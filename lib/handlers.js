import { MongoClient } from "mongodb";
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
const suffix = "Test";

let db;

export const connectToDB = (callback) => {
  client.connect((err, db) => {
    if (err || !db) {
      return callback(err);
    }
  });
  db = client.db("geneClusters");
  console.log("successfully connected to MongoDB");
  return callback();
};

export const getConnection = () => {
  return db;
};

const getMiniObj = async (name) => {
  const mini = db.collection(`smallObjects${suffix}`);
  const res = await mini.findOne({ _id: name });
  return res[name];
};

export const getNumberOfPatients = async (req, res) => {
  const numberOfPatients = await getMiniObj("numberOfPatients");
  res.json(numberOfPatients);
};

export const getNumberOfGenes = async (req, res) => {
  const numberOfGenes = await getMiniObj("numberOfGenes");
  res.json(numberOfGenes);
};

export const getGroupedByPatient = async (req, res) => {
  const grouped = await getMiniObj("groupedByPatient");
  res.json(grouped);
};

export const getPatientByIndex = async (req, res) => {
  const patientByIndex = await getMiniObj("patientByIndex");
  res.json(patientByIndex);
};

export const getIndexByPatient = async (req, res) => {
  const indexByPatient = await getMiniObj("indexByPatient");
  res.json(indexByPatient);
};

export const getIndexByGene = async (req, res) => {
  const indexByGene = await getMiniObj("indexByGene");
  res.json(indexByGene);
};

export const getGeneByIndex = async (req, res) => {
  const geneByIndex = await getMiniObj("geneByIndex");
  res.json(geneByIndex);
};

export const getMaxValue = async (req, res) => {
  const maxValue = await getMiniObj("maxValue");
  res.json(maxValue);
};

// export const getMatrix = async (req, res) => {
//   const mt.findMany({});
// };

// const getFlattened = async () => {
//   return fl.findMany({});
// };
