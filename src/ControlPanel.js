import React, { useState, useEffect } from "react";
import { useData } from "./DataProvider";

export default function ControlPanel({ setStream }) {
  const useInput = (initialValue) => {
    const [value, setValue] = useState(initialValue);
    return [
      { value, onChange: (e) => setValue(e.target.value) },
      () => setValue(initialValue),
    ];
  };

  const [numberOfPatients, setNumberOfPatients] = useState(0);
  const [patient, setPatient] = useState(0);
  const [drug, resetDrug] = useInput("Paclitaxel");
  const { getCurrentPatient, getNumberOfPatients } = useData();

  const DrugSelector = () => {
    return (
      <select {...drug}>
        <option value="Paclitaxel">Paclitaxel</option>
        <option value="Cisplatin">Cisplatin</option>
      </select>
    );
  };

  const handleSubmit = (e) => {
    setStream(null);
    e.preventDefault();
    const headers = { "Content-Type": "application/json" };
    const body = JSON.stringify({ drug });
    const requestOptions = {
      method: "POST",
      headers,
      body,
    };
    fetch("/api/submit", requestOptions)
      .then((res) => res.json())
      .then((data) => setStream(data));
  };

  const resetForm = () => {
    resetDrug();
  };

  const cancelJob = (e) => {
    e.preventDefault();
    const headers = { "Content-Type": "application/json" };
    const body = JSON.stringify({ cancel: "1" })
    const requestOptions = {
      method: "POST",
      headers,
      body,
    };
    fetch("/api/cancel", requestOptions)
  };

  useEffect(() => {
    getNumberOfPatients().then((num) => setNumberOfPatients(num));
    setInterval(() => getCurrentPatient().then((num) => setPatient(num)), 1000);
  }, []);

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <DrugSelector />
        <button type="submit">Submit</button>
      </form>
      <button onClick={resetForm}>Reset</button>
      <button onClick={cancelJob}>Cancel</button>
      <div>
        patient {patient} of {numberOfPatients}
      </div>
    </div>
  );
}
