import fs from "fs";
import csv from "csvtojson";
import { MongoClient } from "mongodb";

let CSV_FILE, suffix, db, mt, fl;
let gr, gbi, ibg, pbi, ibp, num;
main(1).catch(console.error);

async function main(isReal) {
  if (isReal) {
    CSV_FILE = "./preprocess/mutationsFiltered.csv";
    suffix = "";
  } else {
    CSV_FILE = "./preprocess/test.csv";
    suffix = "Test";
  }
  const uri = "mongodb://localhost:27017";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    db = client.db(`geneClusters${suffix}`);
    const collections = await db.collections();
    gr = db.collection("groupedByPatient");
    gbi = db.collection("geneByIndex");
    ibg = db.collection("indexByGene");
    pbi = db.collection("patientByIndex");
    ibp = db.collection("indexByPatient");
    num = db.collection("numbers");
    mt = db.collection(`matrix`);
    fl = db.collection(`flattened`);
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
    console.log(e.stack);
  } finally {
    await client.close();
  }
}

// Array.prototype.pairs = function (func) {
//   for (var i = 0; i < this.length; i++) {
//     for (var j = i; j < this.length; j++) {
//       func([this[i], this[j]]);
//     }
//   }
// };

// const getMiniObj = async (name) => {
//   let res = await num.findOne({ _id: name });
//   return res.value;
// };

const groupByPatient = async () => {
  let csvFile = await csv().fromFile(CSV_FILE);
  let prepared = {};
  let patientByIndex = {};
  let indexByPatient = {};
  let patientCounter = 0;
  csvFile.forEach((elem) => {
    if (elem.sample_id !== "TCGA-IB-7651") {
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
    }
  });
  for (let patient of Object.keys(prepared)) {
    try {
      await gr.insertOne({
        _id: indexByPatient[patient],
        value: prepared[patient],
      });
    } catch (e) {
      console.log(e);
    }
  }
  for (let index of Object.keys(patientByIndex)) {
    await pbi.insertOne({ _id: index, value: patientByIndex[index] });
  }
  for (let patient of Object.keys(indexByPatient)) {
    await ibp.insertOne({ _id: patient, value: indexByPatient[patient] });
  }
  await num.insertOne({ _id: "numberOfPatients", value: patientCounter });
};

const buildIndex = async () => {
  let csvFile = await csv().fromFile(CSV_FILE);
  let geneList = csvFile.map((entry) => entry.symbol);
  geneList = new Set(geneList);
  geneList = Array.from(geneList).sort();
  let index = 0;
  for (let gene of geneList) {
    await gbi.insertOne({ _id: index, value: gene });
    await ibg.insertOne({ _id: gene, value: index });
    index++;
  }
  await num.insertOne({ _id: "numberOfGenes", value: index });
};

async function buildMatrix() {
  let maxValue = 0;
  const numberOfGenes = (await num.findOne({ _id: "numberOfGenes" })).value;
  let matrix = Array(numberOfGenes).fill(0);
  matrix = matrix.map(() => Array(numberOfGenes).fill(0));
  for await (const patient of gr.find()) {
    const genes = Object.keys(patient.value);
    for (let i = 0; i < genes.length; i++) {
      for (let j = i; j < genes.length; j++) {
        const pair = [genes[i], genes[j]];
        const firstInPair = (await ibg.findOne({ _id: pair[0] })).value;
        const secondInPair = (await ibg.findOne({ _id: pair[1] })).value;
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
      }
    }
  }
  for (let i = 0; i < numberOfGenes; i++) {
    await mt.insertOne({ _id: i, value: matrix[i] });
  }
  await num.insertOne({ _id: "maxValue", value: maxValue });
}

const flattenData = async () => {
  for await (const patient of gr.find()) {
    let infoContainer = {};
    let numberOfMutationsInPatient = 0;
    const genes = Object.keys(patient.value);
    for (const gene of genes) {
      const geneIndex = (await ibg.findOne({ _id: gene })).value;
      let infoObj = {
        variantClassification: new Set(),
        polyPhen: new Set(),
        impact: new Set(),
        tDepth: 0,
        tAltCount: 0,
        tAltFrac: 0,
        drug: "",
        response: "",
        indication: "",
      };
      for (const mutation of patient.value[gene]) {
        numberOfMutationsInPatient++;
        infoObj.variantClassification.add(mutation.variant_classification);
        infoObj.polyPhen.add(mutation.polyPhen);
        infoObj.impact.add(mutation.impact);
        infoObj.tDepth = Math.max(infoObj.tDepth, mutation.t_depth);
        infoObj.tAltCount = Math.max(infoObj.tAltCount, mutation.t_alt_count);
        infoObj.tAltFrac = Math.max(
          infoObj.tAltFrac,
          mutation.t_alt_count / mutation.t_depth
        );
        infoObj.drug = mutation.drug;
        infoObj.response = mutation.response;
        infoObj.indication = mutation.indication;
      }
      infoObj.variantClassification = Array.from(infoObj.variantClassification);
      infoObj.polyPhen = Array.from(infoObj.polyPhen);
      infoObj.impact = Array.from(infoObj.impact);
      infoContainer[geneIndex] = infoObj;
    }
    const geneIndices = Object.keys(infoContainer);
    for (const geneIndex of geneIndices) {
      infoContainer[geneIndex] = {
        ...infoContainer[geneIndex],
        numberOfMutationsInPatient,
      };
    }
    await fl.insertOne({
      _id: patient._id,
      value: infoContainer,
    });
  }
};
