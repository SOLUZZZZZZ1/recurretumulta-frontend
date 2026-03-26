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
    familia: first(ai?.classifier_result?.family, ai?.familia),
    confianza: first(ai?.classifier_result?.confidence, ai?.confianza),
    hecho: first(ai?.arguments?.hecho, ai?.hecho),
    admisibilidad: first(ai?.admissibility?.admissibility),
    accion: first(ai?.phase?.recommended_action?.action),
  };
}

export default function OpsCaseDetailPro() {
  const { caseId } = useParams();

  const [documents, setDocuments] = useState([]);
  const [events, setEvents] = useState([]);
  const [aiResult, setAiResult] = useState(null);
  const [openEvent, setOpenEvent] = useState(null);

  const [error, setError] = useState("");

  const token = localStorage.getItem("ops_token") || "";
  const headers = { "X-Operator-Token": token };

  async function loadCase() {
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
    }
  }

  useEffect(() => {
    loadCase();
  }, [caseId]);

  const ai = useMemo(() => readAi(aiResult), [aiResult]);

  const confianzaPct = ai.confianza
    ? Number(ai.confianza) <= 1
      ? `${Math.round(ai.confianza * 100)}%`
      : `${ai.confianza}%`
    : "—";

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "auto" }}>

      <h2>OPS PRO — {caseId}</h2>

      {error && <div style={{ color: "red" }}>{error}</div>}

      <div style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
        <h3>Resultado IA</h3>
        <p><b>Familia:</b> {ai.familia || "—"}</p>
        <p><b>Confianza:</b> {confianzaPct}</p>
        <p><b>Hecho:</b> {ai.hecho || "—"}</p>
        <p><b>Admisibilidad:</b> {ai.admisibilidad || "—"}</p>
        <p><b>Acción:</b> {ai.accion || "—"}</p>
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
          <div key={i} style={{ marginBottom: 10 }}>

            <div
              style={{ cursor: "pointer", fontWeight: "bold" }}
              onClick={() => setOpenEvent(openEvent === i ? null : i)}
            >
              {e.type} — {fmt(e.created_at)}
            </div>

            {openEvent === i && (
              <pre style={{ background: "#f5f5f5", padding: 10 }}>
                {JSON.stringify(e.payload, null, 2)}
              </pre>
            )}

          </div>
        ))}
      </div>

    </div>
  );
}