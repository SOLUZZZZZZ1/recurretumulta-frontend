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

export default function OpsCaseDetail() {
  const { caseId } = useParams();

  const [documents, setDocuments] = useState([]);
  const [events, setEvents] = useState([]);
  const [aiResult, setAiResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const token = localStorage.getItem("ops_token") || "";

  const headers = {
    "X-Operator-Token": token,
  };

  async function loadAll() {
    setErr("");
    if (!token) {
      setErr("Falta token de operador. Entra primero en /#/ops e inicia sesión con PIN.");
      return;
    }

    try {
      const docsRes = await fetchJson(`${API}/ops/cases/${encodeURIComponent(caseId)}/documents`, {
        headers,
      });

      const evRes = await fetchJson(`${API}/ops/cases/${encodeURIComponent(caseId)}/events`, {
        headers,
      });

      const docs = docsRes.documents || docsRes.items || [];
      const evs = evRes.events || evRes.items || [];

      setDocuments(docs);
      setEvents(evs);

      // Si existe resultado Modo Dios guardado en events, lo mostramos
      const ai = evs.find((e) => e.type === "ai_expediente_result");
      if (ai?.payload) setAiResult(ai.payload);
    } catch (e) {
      setErr(e.message || "Error cargando expediente");
      setDocuments([]);
      setEvents([]);
      setAiResult(null);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  async function runAI() {
    setErr("");
    if (!token) {
      setErr("Falta token de operador. Entra primero en /#/ops e inicia sesión con PIN.");
      return;
    }

    setLoading(true);
    try {
      const data = await fetchJson(`${API}/ai/expediente/run`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ case_id: caseId }),
      });
      setAiResult(data);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      setErr(e.message || "Error ejecutando Modo Dios");
    }
  }

  const admissibility = aiResult?.admissibility?.admissibility;

  return (
    <div className="sr-container" style={{ paddingTop: 24, paddingBottom: 48 }}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="sr-h2" style={{ margin: 0 }}>
          Expediente {caseId}
        </h1>
        <Link to="/ops" className="sr-btn-secondary">
          ← Volver a OPS
        </Link>
      </div>

      {err && (
        <div className="sr-card" style={{ marginTop: 14 }}>
          <div className="sr-p" style={{ color: "#991b1b", margin: 0 }}>
            ❌ {err}
          </div>
        </div>
      )}

      {/* Documentos */}
      <div className="sr-card" style={{ marginTop: 14 }}>
        <h3 className="sr-h3" style={{ marginTop: 0 }}>
          Documentos del expediente
        </h3>

        {documents.length === 0 ? (
          <p className="sr-p">No hay documentos cargados (o no tienes permisos/token).</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {documents.map((d, i) => (
              <div
                key={i}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 10,
                  background: "rgba(255,255,255,0.75)",
                }}
              >
                <div className="sr-small" style={{ fontWeight: 800 }}>
                  {d.kind || "documento"}
                </div>
                <div className="sr-small" style={{ color: "#6b7280" }}>
                  {d.bucket}/{d.key}
                </div>
                <div className="sr-small" style={{ color: "#6b7280" }}>
                  {d.mime || "—"} · {d.size_bytes ? `${d.size_bytes} bytes` : "—"} · {fmt(d.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="sr-card" style={{ marginTop: 14 }}>
        <h3 className="sr-h3" style={{ marginTop: 0 }}>
          Acciones
        </h3>

        <button className="sr-btn-primary" onClick={runAI} disabled={loading}>
          {loading ? "Analizando…" : "Generar recurso ahora (Modo Dios)"}
        </button>

        <button className="sr-btn-secondary" onClick={loadAll} style={{ marginLeft: 10 }}>
          Recargar
        </button>
      </div>

      {/* Resultado IA */}
      {aiResult && (
        <div className="sr-card" style={{ marginTop: 14 }}>
          <h3 className="sr-h3" style={{ marginTop: 0 }}>
            Resultado Modo Dios
          </h3>

          <p className="sr-p">
            <b>Admisibilidad:</b> {admissibility || "—"}
          </p>

          {aiResult?.phase?.recommended_action?.action && (
            <p className="sr-p">
              <b>Acción recomendada:</b> {aiResult.phase.recommended_action.action}
            </p>
          )}

          {admissibility === "NOT_ADMISSIBLE" && (
            <div className="sr-small" style={{ color: "#991
