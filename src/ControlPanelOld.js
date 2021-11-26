import React, { useState, useEffect } from "react";
import { useData } from "./DataProvider";

const CHEMO = "Paclitaxel";

export default function ControlPanel({ setDiffMatrix }) {
  const { patients, indexByGene, numberOfGenes } = useData();
  const [isCompleteResponse, setIsCompleteResponse] = useState(true);
  const [isPartialResponse, setIsPartialResponse] = useState(true);

  const filterMatrix = () => {
    let matrix = Array(numberOfGenes).fill(0);
    matrix = matrix.map(() => Array(numberOfGenes).fill(0));
    patients.forEach((patient) => {
      const genes = Object.keys(patient);
      genes.forEach((gene) => {
        const mutations = patient[gene];
        let mutationsCounter = mutations.length;
        mutations.forEach((mutation) => {
          if (!isMutation(mutation)) mutationsCounter -= 1;
        });
        if (mutationsCounter === 0) {
          const geneIndex = indexByGene[gene];
          matrix[geneIndex][geneIndex] = -1;
          genes.forEach((gene) => {
            const otherGeneIndex = indexByGene[gene];
            if (geneIndex !== otherGeneIndex) {
              matrix[geneIndex][otherGeneIndex] = -1;
              matrix[otherGeneIndex][geneIndex] = -1;
            }
          });
        }
      });
    });
    setDiffMatrix(matrix);
  };

  const isResponse = (mutation) => {
    if (!isCompleteResponse && mutation.response === "Complete Response")
      return false;
    if (!isPartialResponse && mutation.response === "Partial Response")
      return false;
    return true;
  };

  const isMutation = (mutation) => {
    if (isResponse(mutation)) return true;
    return false;
  };

  useEffect(() => {
    if (!patients || !indexByGene || !numberOfGenes) return;
    filterMatrix();
  }, [isCompleteResponse, isPartialResponse]);

  return (
    <fieldset className="field">
      <legend className="fieldLegend">Response</legend>
      <input
        className="checkbox"
        type="checkbox"
        id="isCompleteResponse"
        checked={isCompleteResponse}
        onChange={() => setIsCompleteResponse(!isCompleteResponse)}
      />
      <label className="label" htmlFor="isCompleteResponse">
        Complete Response
      </label>
      <input
        className="checkbox"
        type="checkbox"
        id="isPatrialResponse"
        checked={isPartialResponse}
        onChange={() => setIsPartialResponse(!isPartialResponse)}
      />
      <label className="label" htmlFor="isPartialResponse">
        Partial Response
      </label>
    </fieldset>
  );
}
