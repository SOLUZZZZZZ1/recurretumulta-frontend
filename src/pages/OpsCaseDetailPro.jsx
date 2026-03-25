import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API = "/api";

async function fetchJson(url, options = {}) {
  const r = await fetch(url, options);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.detail || `Error HTTP ${r.status}`);
  return data;
}

function fmt(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return String(d);
  }
}

function first(...v) {
  return v.find((x) => x !== undefined && x !== null && x !== "") || "";
}

function readAi(ai) {
  if (!ai || typeof ai !== "object") {
    return { familia: "", confianza: "", hecho: "", admisibilidad: "", accion: "" };
  }

  return {
    familia: first(
      ai?.classifier_result?.family,
      ai?.familia_detectada,
      ai?.familia,
      ai?.family
    ),
    confianza: first(
      ai?.classifier_result?.confidence,
      ai?.confianza,
      ai?.confidence
    ),
    hecho: first(
      ai?.arguments?.hecho,
      ai?.hecho,
      ai?.hecho_para_recurso,
      ai?.facts
    ),
    admisibilidad: first(
      ai?.admissibility?.admissibility,
      ai?.admissibility
    ),
    accion: first(
      ai?.phase?.recommended_action?.action,
      ai?.recommended_action
    ),
  };
}

export default function OpsCaseDetailPro() {
  const { caseId } = useParams();

  const [documents, setDocuments] = useState([]);
  const [events, setEvents] = useState([]);
  const [aiResult, setAiResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [runningAI, setRunningAI] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("ops_token") || "";
  const headers = { "X-Operator-Token": token };

  async function loadCase() {
    setError("");
    setLoading(true);

    try {
      const docsRes = await fetchJson(`${API}/ops/cases/${caseId}/documents`, { headers });
      const evRes = await fetchJson(`${API}/ops/cases/${caseId}/events`, { headers });

      const docs = docsRes.documents || [];
      const evs = evRes.events || [];

      setDocuments(docs);
      setEvents(evs);

      const aiEvent = [...evs].reverse().find(e => e.type === "ai_expediente_result");
      setAiResult(aiEvent?.payload || null);

    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCase();
  }, [caseId]);

  async function runAI() {
    setRunningAI(true);
    try {
      await fetchJson(`${API}/ai/expediente/run`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ case_id: caseId }),
      });

      await loadCase();

    } catch (e) {
      setError(e.message);
    } finally {
      setRunningAI(false);
    }
  }

  const ai = useMemo(() => readAi(aiResult), [aiResult]);

  const confianzaPct = ai.confianza
    ? Number(ai.confianza) <= 1
      ? `${Math.round(ai.confianza * 100)}%`
      : `${ai.confianza}%`
    : "—";

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "auto" }}>

      <h2>OPS PRO — {caseId}</h2>

      <div style={{ marginBottom: 20 }}>
        <button onClick={loadCase}>Recargar</button>
        <button onClick={runAI} disabled={runningAI}>
          {runningAI ? "Ejecutando..." : "Ejecutar IA"}
        </button>
        <Link to={`/ops/case/${caseId}`}>Volver</Link>
      </div>

      {error && <div style={{ color: "red" }}>{error}</div>}

      <div style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
        <h3>Resultado IA</h3>
        <p><b>Familia:</b> {ai.familia}</p>
        <p><b>Confianza:</b> {confianzaPct}</p>
        <p><b>Hecho:</b> {ai.hecho}</p>
        <p><b>Admisibilidad:</b> {ai.admisibilidad}</p>
        <p><b>Acción:</b> {ai.accion}</p>
      </div>

      <div style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
        <h3>Documentos ({documents.length})</h3>
        {documents.map((d, i) => (
          <div key={i}>{d.kind}</div>
        ))}
      </div>

      <div style={{ border: "1px solid #ccc", padding: 10 }}>
        <h3>Eventos ({events.length})</h3>
        {events.map((e, i) => (
          <div key={i}>{e.type}</div>
        ))}
      </div>

    </div>
  );
}