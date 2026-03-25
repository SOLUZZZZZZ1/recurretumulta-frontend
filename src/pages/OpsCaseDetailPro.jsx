import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";

const API = "/api";

async function fetchJson(url, options = {}) {
  const r = await fetch(url, options);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.detail || "Error");
  return data;
}

function first(...v) {
  return v.find(x => x !== undefined && x !== null && x !== "") || "";
}

export default function OpsCaseDetailPro() {
  const { caseId } = useParams();

  const [docs, setDocs] = useState([]);
  const [events, setEvents] = useState([]);
  const [ai, setAi] = useState(null);

  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("ops_token") || "";
  const headers = { "X-Operator-Token": token };

  async function load() {
    if (!token) return setError("Sin token OPS");

    setLoading(true);
    try {
      const d = await fetchJson(`${API}/ops/cases/${caseId}/documents`, { headers });
      const e = await fetchJson(`${API}/ops/cases/${caseId}/events`, { headers });

      const docs = d.documents || d.items || [];
      const evs = e.events || e.items || [];

      setDocs(docs);
      setEvents(evs);

      const aiEvent = [...evs].reverse().find(x => x.type === "ai_expediente_result");
      setAi(aiEvent?.payload || null);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [caseId]);

  async function runAI() {
    setRunning(true);
    try {
      await fetchJson(`${API}/ai/expediente/run`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ case_id: caseId }),
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }

  async function approve() {
    await fetchJson(`${API}/ops/cases/${caseId}/approve`, {
      method: "POST",
      headers,
    });
    alert("Aprobado");
  }

  async function manual() {
    await fetchJson(`${API}/ops/cases/${caseId}/manual`, {
      method: "POST",
      headers,
    });
    alert("En revisión manual");
  }

  const familia = first(ai?.familia_detectada, ai?.familia, ai?.family);
  const confianza = first(ai?.confianza, ai?.confidence);
  const hecho = first(ai?.hecho, ai?.facts);

  return (
    <div className="p-6 max-w-5xl mx-auto">

      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">PRO — {caseId}</h1>

        <div className="flex gap-2">
          <button onClick={load}>Recargar</button>
          <button onClick={runAI}>{running ? "..." : "IA"}</button>
          <button onClick={approve}>Aprobar</button>
          <button onClick={manual}>Manual</button>
          <Link to={`/ops/case/${caseId}`}>Volver</Link>
        </div>
      </div>

      {error && <div style={{color:"red"}}>{error}</div>}

      <div style={{border:"1px solid #ddd", padding:10, marginBottom:10}}>
        <h3>Resultado IA</h3>
        {!ai && <p>Sin IA</p>}
        {ai && (
          <>
            <p><b>Familia:</b> {familia}</p>
            <p><b>Confianza:</b> {confianza}</p>
            <p><b>Hecho:</b> {hecho}</p>
          </>
        )}
      </div>

      <div style={{border:"1px solid #ddd", padding:10, marginBottom:10}}>
        <h3>Documentos ({docs.length})</h3>
        {docs.map((d,i)=><div key={i}>{d.kind}</div>)}
      </div>

      <div style={{border:"1px solid #ddd", padding:10}}>
        <h3>Eventos ({events.length})</h3>
        {events.map((e,i)=><div key={i}>{e.type}</div>)}
      </div>

    </div>
  );
}