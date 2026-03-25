import React, { useEffect, useMemo, useState } from "react";
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

function pretty(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function firstDefined(...values) {
  for (const v of values) {
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return "";
}

function readAiFields(aiResult) {
  if (!aiResult || typeof aiResult !== "object") {
    return {
      familia: "",
      confianza: "",
      hecho: "",
      admissibility: "",
      recommended: "",
    };
  }

  return {
    familia: firstDefined(
      aiResult.familia_detectada,
      aiResult.familia,
      aiResult.family,
      aiResult?.classification?.family,
      aiResult?.classifier_result?.family,
      aiResult?.resultado?.familia
    ),
    confianza: firstDefined(
      aiResult.confianza,
      aiResult.confidence,
      aiResult?.classification?.confidence,
      aiResult?.classifier_result?.confidence,
      aiResult?.resultado?.confianza
    ),
    hecho: firstDefined(
      aiResult.hecho,
      aiResult.hecho_para_recurso,
      aiResult.facts,
      aiResult.detected_facts,
      aiResult?.resultado?.hecho
    ),
    admissibility: firstDefined(
      aiResult?.admissibility?.admissibility,
      aiResult?.admissibility,
      aiResult?.resultado?.admisibilidad
    ),
    recommended: firstDefined(
      aiResult?.phase?.recommended_action?.action,
      aiResult?.recommended_action?.action,
      aiResult?.recommended_action,
      aiResult?.resultado?.accion_recomendada
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

    if (!token) {
      setError("Falta token de operador. Accede primero al panel OPS y entra con PIN.");
      return;
    }

    setLoading(true);
    try {
      const docsRes = await fetchJson(
        `${API}/ops/cases/${encodeURIComponent(caseId)}/documents`,
        { headers }
      );

      const evRes = await fetchJson(
        `${API}/ops/cases/${encodeURIComponent(caseId)}/events`,
        { headers }
      );

      const docs = docsRes.documents || docsRes.items || [];
      const evs = evRes.events || evRes.items || [];

      setDocuments(docs);
      setEvents(evs);

      const aiEvent = [...evs].reverse().find((e) => e?.type === "ai_expediente_result");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  async function runAI() {
    setError("");

    if (!token) {
      setError("Falta token de operador. Accede primero al panel OPS y entra con PIN.");
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

  const ai = useMemo(() => readAiFields(aiResult), [aiResult]);

  return (
    <div className="sr-container" style={{ paddingTop: 24, paddingBottom: 48 }}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="sr-h2" style={{ margin: 0 }}>
          Operador PRO — {caseId}
        </h1>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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
          <div className="sr-p" style={{ margin: 0, color: "#991b1b" }}>
            ❌ {error}
          </div>
        </div>
      )}

      <div className="sr-card" style={{ marginTop: 14 }}>
        <h3 className="sr-h3" style={{ marginTop: 0 }}>
          Resultado IA
        </h3>

        {!aiResult ? (
          <p className="sr-p">⚠️ No hay resultado IA todavía</p>
        ) : (
          <>
            <p className="sr-p"><b>Familia:</b> {pretty(ai.familia)}</p>
            <p className="sr-p"><b>Confianza:</b> {pretty(ai.confianza)}</p>
            <p className="sr-p"><b>Hecho:</b> {pretty(ai.hecho)}</p>

            {ai.admissibility ? (
              <p className="sr-p"><b>Admisibilidad:</b> {pretty(ai.admissibility)}</p>
            ) : null}

            {ai.recommended ? (
              <p className="sr-p"><b>Acción recomendada:</b> {pretty(ai.recommended)}</p>
            ) : null}
          </>
        )}
      </div>

      <div className="sr-card" style={{ marginTop: 14 }}>
        <h3 className="sr-h3" style={{ marginTop: 0 }}>
          Documentos
        </h3>

        {loading && <p className="sr-p">Cargando…</p>}

        {!loading && documents.length === 0 && (
          <p className="sr-p">No hay documentos</p>
        )}

        {!loading && documents.length > 0 && (
          <div style={{ display: "grid", gap: 10 }}>
            {documents.map((d, i) => (
              <div
                key={d?.id || i}
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

      <div className="sr-card" style={{ marginTop: 14 }}>
        <h3 className="sr-h3" style={{ marginTop: 0 }}>
          Eventos
        </h3>

        {loading && <p className="sr-p">Cargando…</p>}

        {!loading && events.length === 0 && (
          <p className="sr-p">No hay eventos</p>
        )}

        {!loading && events.length > 0 && (
          <div style={{ display: "grid", gap: 10 }}>
            {events.map((e, i) => (
              <div
                key={e?.id || i}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 10,
                  background: "rgba(255,255,255,0.75)",
                }}
              >
                <div className="sr-small" style={{ fontWeight: 800 }}>
                  {e.type || "evento"}
                </div>

                <div className="sr-small" style={{ color: "#6b7280" }}>
                  {fmt(e.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {aiResult && (
        <div className="sr-card" style={{ marginTop: 14 }}>
          <h3 className="sr-h3" style={{ marginTop: 0 }}>
            Payload IA bruto
          </h3>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: 12,
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            {JSON.stringify(aiResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
