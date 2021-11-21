import fs from "fs";
import csv from "csvtojson";
import { MongoClient } from "mongodb";

let CSV_FILE, suffix, db, mini, mt, fl;
main(0).catch(console.error);

async function main(isReal) {
  if (isReal) {
    CSV_FILE = "mutationsFiltered.csv";
    suffix = "";
  } else {
    CSV_FILE = "./preprocess/test.csv";
    suffix = "Test";
  }
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    db = client.db("geneClusters");
    const collections = await db.collections();
    mini = db.collection(`smallObjects${suffix}`);
    mt = db.collection(`matrix${suffix}`);
    fl = db.collection(`flattened${suffix}`);
    try {
      await db.dropDatabase();
    } catch (e) {
      console.log(e);
    }

    await groupByPatient();
    await buildIndex();
    await buildMatrix();
    await flattenData();
  } catch (e) {
    console.log(e);
  } finally {
    await client.close();
  }
}

Array.prototype.pairs = function (func) {
  for (var i = 0; i < this.length; i++) {
    for (var j = i; j < this.length; j++) {
      func([this[i], this[j]]);
    }
  }
};

const getMiniObj = async (name) => {
  let res = await mini.findOne({ _id: name });
  return res[name];
};

const groupByPatient = async () => {
  let csvFile = await csv().fromFile(CSV_FILE);
  let prepared = {};
  let patientByIndex = {};
  let indexByPatient = {};
  let patientCounter = 0;
  csvFile.forEach((elem) => {
    if (!(elem.sample_id in prepared)) {
      patientByIndex[patientCounter] = elem.sample_id;
      indexByPatient[elem.sample_id] = patientCounter;
      patientCounter++;
      const gene = {};
      gene[elem.symbol] = [elem];
      prepared[elem.sample_id] = gene;
    } else if (!(elem.symbol in prepared[elem.sample_id])) {
      prepared[elem.sample_id][elem.symbol] = [elem];
    } else {
      prepared[elem.sample_id][elem.symbol].push(elem);
    }
  });
  await mini.insertOne({ groupedByPatient: prepared, _id: "groupedByPatient" });
  await mini.insertOne({
    patientByIndex: patientByIndex,
    _id: "patientByIndex",
  });
  await mini.insertOne({
    indexByPatient: indexByPatient,
    _id: "indexByPatient",
  });
  await mini.insertOne({
    numberOfPatients: patientCounter,
    _id: "numberOfPatients",
  });
};

const buildIndex = async () => {
  let csvFile = await csv().fromFile(CSV_FILE);
  let geneList = csvFile.map((entry) => entry.symbol);
  geneList = new Set(geneList);
  geneList = Array.from(geneList).sort();
  let genes = {};
  let indices = {};
  let index = 0;
  geneList.forEach((gene) => {
    genes[index] = gene;
    indices[gene] = index;
    index++;
  });
  await mini.insertOne({ indexByGene: indices, _id: "indexByGene" });
  await mini.insertOne({ geneByIndex: genes, _id: "geneByIndex" });
  await mini.insertOne({ numberOfGenes: index, _id: "numberOfGenes" });
};

const buildMatrix = async () => {
  let maxValue = 0;
  const mutations = await getMiniObj("groupedByPatient");
  const indexByGene = await getMiniObj("indexByGene");
  const numberOfGenes = await getMiniObj("numberOfGenes");
  let matrix = Array(numberOfGenes).fill(0);
  matrix = matrix.map(() => Array(numberOfGenes).fill(0));
  Object.values(mutations).forEach((patient) => {
    const genes = Object.keys(patient);
    genes.pairs((pair) => {
      const firstInPair = indexByGene[pair[0]];
      const secondInPair = indexByGene[pair[1]];
      matrix[firstInPair][secondInPair] += 1;
      if (matrix[firstInPair][secondInPair] > maxValue) {
        maxValue = matrix[firstInPair][secondInPair];
      }
      if (firstInPair !== secondInPair) {
        matrix[secondInPair][firstInPair] += 1;
        if (matrix[secondInPair][firstInPair] > maxValue) {
          maxValue = matrix[secondInPair][firstInPair];
        }
      }
    });
  });
  for (let i = 0; i < numberOfGenes; i++) {
    await mt.insertOne({ i: matrix[i], _id: i });
  }
  await mini.insertOne({ maxValue: maxValue, _id: "maxValue" });
};

const flattenData = async () => {
  const patients = await getMiniObj("groupedByPatient");
  const indexByGene = await getMiniObj("indexByGene");
  const indexByPatient = await getMiniObj("indexByPatient");

  for (const patient of Object.keys(patients)) {
    let infoContainer = {};
    let number_of_mutations = 0;
    const patientIndex = indexByPatient[patient];
    const genes = Object.keys(patients[patient]);
    for (const gene of genes) {
      const geneIndex = indexByGene[gene];
      let infoObj = {
        variant_classification: new Set(),
        polyPhen: new Set(),
        impact: new Set(),
        t_depth: 0,
        t_alt_count: 0,
        t_alt_frac: 0,
        drug: "",
        response: "",
        indication: "",
        genes: genes.map((gene) => indexByGene[gene]),
      };
      for (const mutation of patients[patient][gene]) {
        number_of_mutations++;
        infoObj.variant_classification.add(mutation.variant_classification);
        infoObj.polyPhen.add(mutation.polyPhen);
        infoObj.impact.add(mutation.impact);
        infoObj.t_depth = Math.max(infoObj.t_depth, mutation.t_depth);
        infoObj.t_alt_count = Math.max(
          infoObj.t_alt_count,
          mutation.t_alt_count
        );
        infoObj.t_alt_frac = Math.max(
          infoObj.t_alt_frac,
          mutation.t_alt_count / mutation.t_depth
        );
        infoObj.drug = mutation.drug;
        infoObj.response = mutation.response;
        infoObj.indication = mutation.indication;
      }
      infoObj.variant_classification = Array.from(
        infoObj.variant_classification
      );
      infoObj.polyPhen = Array.from(infoObj.polyPhen);
      infoObj.impact = Array.from(infoObj.impact);
      infoContainer[geneIndex] = infoObj;
    }
    const geneIndices = Object.keys(infoContainer);
    for (const geneIndex of geneIndices) {
      infoContainer[geneIndex] = {
        ...infoContainer[geneIndex],
        number_of_mutations,
        patientIndex,
      };
      await fl.insertOne({
        patientIndex: patientIndex,
        geneIndex: geneIndex,
        info: infoContainer[geneIndex],
      });
    }
  }
};
