import React, { createContext, useContext, useState, useEffect } from "react";

const DataContext = createContext();
export const useData = () => useContext(DataContext);
let redisClient;

export default function DataProvider({ children }) {
  const [status, setStatus] = useState();

  const getMiniObj = async (key) => {
    const res = await fetch(`/api/${key}`);
    setStatus(res.status);
    const json = await res.json();
    return json;
  };

  const getStream = async (entryPoint) => {
    const res = await fetch(entryPoint);
    setStatus(res.status);
    return res.json();
  };

  const getGroupedByPatient = async () => {
    const json = await getMiniObj("groupedByPatient");
    return json;
  };

  const getPatientByIndex = async () => {
    const json = await getMiniObj("patientByIndex");
    return json;
  };

  const getIndexByPatient = async () => {
    const json = await getMiniObj("indexByPatient");
    return json;
  };

  const getNumberOfPatients = async () => {
    const json = await getMiniObj("numberOfPatients");
    return parseInt(json);
  };

  const getIndexByGene = async () => {
    const json = await getMiniObj("indexByGene");
    return json;
  };

  const getGeneByIndex = async () => {
    const json = await getMiniObj("geneByIndex");
    return json;
  };

  const getNumberOfGenes = async () => {
    const json = await getMiniObj("numberOfGenes");
    return parseInt(json);
  };

  const getMaxValue = async () => {
    const json = await getMiniObj("maxValue");
    return parseInt(json);
  };

  const getMatrix = async () => {
    const stream = await getStream(`/api/matrix`);
    return stream;
  };

  const getFlattened = async () => {
    const stream = await getStream(`/api/flattened`);
    return stream;
  };

  const getCurrentPatient = async () => {
    const json = await getMiniObj("currentPatient");
    return parseInt(json);
  };

  useEffect(() => {
    getNumberOfGenes();
  }, []);

  if (status !== 200)
    return <h2 className="serverError">Server error - {status}</h2>;

  return (
    <DataContext.Provider
      value={{
        getGroupedByPatient,
        getPatientByIndex,
        getIndexByPatient,
        getNumberOfPatients,
        getIndexByGene,
        getGeneByIndex,
        getNumberOfGenes,
        getMaxValue,
        getMatrix,
        getFlattened,
        getCurrentPatient,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}
