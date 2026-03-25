import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

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

    if (!token) {
      setError("Falta token de operador.");
      return;
    }

    setLoading(true);

    try {
      const docsRes = await fetchJson(
        `${API}/ops/cases/${caseId}/documents`,
        { headers }
      );

      const evRes = await fetchJson(
        `${API}/ops/cases/${caseId}/events`,
        { headers }
      );

      // 🔥 ESTO ES LA CLAVE
      const docs = docsRes.documents || docsRes.items || [];
      const evs = evRes.events || evRes.items || [];

      setDocuments(docs);
      setEvents(evs);

      const aiEvent = evs.find((e) => e.type === "ai_expediente_result");
      setAiResult(aiEvent?.payload || null);

    } catch (e) {
      setError(e.message || "Error cargando expediente");
      setDocuments([]);
      setEvents([]);
      setAiResult(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCase();
  }, [caseId]);

  async function runAI() {
    setError("");

    if (!token) {
      setError("Falta token de operador.");
      return;
    }

    setRunningAI(true);

    try {
      const data = await fetchJson(`${API}/ai/expediente/run`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ case_id: caseId }),
      });

      setAiResult(data);
      await loadCase();

    } catch (e) {
      setError(e.message || "Error ejecutando IA");
    } finally {
      setRunningAI(false);
    }
  }

  return (
    <div className="sr-container" style={{ paddingTop: 24, paddingBottom: 48 }}>
      
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="sr-h2" style={{ margin: 0 }}>
          Operador PRO — {caseId}
        </h1>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="sr-btn-secondary" onClick={loadCase}>
            Recargar
          </button>

          <button className="sr-btn-primary" onClick={runAI} disabled={runningAI}>
            {runningAI ? "Ejecutando IA..." : "Ejecutar IA"}
          </button>

          <Link to={`/ops/case/${caseId}`} className="sr-btn-secondary">
            Volver
          </Link>
        </div>
      </div>

      {error && (
        <div className="sr-card" style={{ marginTop: 14 }}>
          <p style={{ color: "red" }}>❌ {error}</p>
        </div>
      )}

      {/* RESULTADO IA */}
      <div className="sr-card" style={{ marginTop: 14 }}>
        <h3>Resultado IA</h3>

        {!aiResult && <p>⚠️ No hay resultado IA todavía</p>}

        {aiResult && (
          <>
            <p><b>Familia:</b> {aiResult.familia_detectada}</p>
            <p><b>Confianza:</b> {aiResult.confianza}</p>
            <p><b>Hecho:</b> {aiResult.hecho}</p>
          </>
        )}
      </div>

      {/* DOCUMENTOS */}
      <div className="sr-card" style={{ marginTop: 14 }}>
        <h3>Documentos</h3>

        {documents.length === 0 && <p>No hay documentos</p>}

        {documents.map((d, i) => (
          <div key={i}>
            {d.kind} — {fmt(d.created_at)}
          </div>
        ))}
      </div>

      {/* EVENTOS */}
      <div className="sr-card" style={{ marginTop: 14 }}>
        <h3>Eventos</h3>

        {events.length === 0 && <p>No hay eventos</p>}

        {events.map((e, i) => (
          <div key={i}>
            {e.type} — {fmt(e.created_at)}
          </div>
        ))}
      </div>

    </div>
  );
}