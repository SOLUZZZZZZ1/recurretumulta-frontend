import React, { useState } from "react";

const API = "/api";

export default function PartnerPanelExpedientes() {
  const [token, setToken] = useState("");
  const [cases, setCases] = useState([]);

  async function cargar() {
    const res = await fetch(`${API}/partner/cases`, {
      headers: {
        Authorization: "Bearer " + token,
      },
    });

    const data = await res.json();
    setCases(data.items || []);
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Panel gestorías</h1>

      <input
        placeholder="Token asesoría"
        value={token}
        onChange={(e) => setToken(e.target.value)}
      />

      <button onClick={cargar}>Cargar</button>

      {cases.map((c) => (
        <div key={c.case_id} style={{ marginTop: 10 }}>
          <b>{c.case_id}</b>
          <div>{c.client_name}</div>
          <div>{c.client_email}</div>
          <div>{c.status}</div>
        </div>
      ))}
    </div>
  );
}