import React, { useState } from "react";

export default function ControlPanel({ setStream }) {
  const useInput = (initialValue) => {
    const [value, setValue] = useState(initialValue);
    return [
      { value, onChange: (e) => setValue(e.target.value) },
      () => setValue(initialValue),
    ];
  };

  const [drug, resetDrug] = useInput("Paclitaxel");

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

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <DrugSelector />
        <button type="submit">Submit</button>
      </form>
      <button onClick={resetForm}>Reset</button>
    </div>
  );
}
