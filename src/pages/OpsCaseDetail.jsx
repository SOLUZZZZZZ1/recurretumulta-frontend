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

function isPdf(kind) {
  return String(kind || "").toLowerCase().includes("generated_pdf");
}

function isDocx(kind) {
  return String(kind || "").toLowerCase().includes("generated_docx");
}

export default function OpsCaseDetail() {
  const { caseId } = useParams();

  const [documents, setDocuments] = useState([]);
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

      const aiEvent = evs.find((e) => e.type === "ai_expediente_result");
      setAiResult(aiEvent?.payload || null);
    } catch (e) {
      setError(e.message || "Error cargando expediente");
      setDocuments([]);
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
    } catch (e) {
      setError(e.message || "Error ejecutando Modo Dios");
    } finally {
      setRunningAI(false);
    }
  }

  const admissibility = aiResult?.admissibility?.admissibility;
  const recommended = aiResult?.phase?.recommended_action?.action;

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

      {error && (
        <div className="sr-card" style={{ marginTop: 14 }}>
          <div className="sr-p" style={{ margin: 0, color: "#991b1b" }}>
            ❌ {error}
          </div>
        </div>
      )}

      <div className="sr-card" style={{ marginTop: 14 }}>
        <h3 className="sr-h3" style={{ marginTop: 0 }}>
          Documentos del expediente
        </h3>

        {loading && <p className="sr-p">Cargando…</p>}

        {!loading && documents.length === 0 && (
          <p className="sr-p">No hay documentos cargados (o falta token).</p>
        )}

        {!loading && documents.length > 0 && (
          <div style={{ display: "grid", gap: 10 }}>
            {documents.map((d, i) => {
              const canDownload = Boolean(d?.id);
              const downloadUrl = canDownload
                ? `${API}/ops/documents/${encodeURIComponent(d.id)}/download`
                : "";

              return (
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

                  <div className="sr-small" style={{ color: "#6b7280", marginTop: 2 }}>
                    {d.bucket}/{d.key}
                  </div>

                  <div className="sr-small" style={{ color: "#6b7280", marginTop: 2 }}>
                    {d.mime || "—"} · {d.size_bytes ? `${d.size_bytes} bytes` : "—"} ·{" "}
                    {fmt(d.created_at)}
                  </div>

                  {/* ✅ NUEVO: Descarga segura desde OPS */}
                  <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {canDownload ? (
                      <>
                        <a
                          href={downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="sr-small"
                          style={{
                            color: "#2563eb",
                            textDecoration: "underline",
                            fontWeight: 700,
                          }}
                        >
                          Descargar
                        </a>

                        {isPdf(d.kind) && (
                          <span className="sr-small" style={{ color: "#6b7280" }}>
                            (PDF)
                          </span>
                        )}
                        {isDocx(d.kind) && (
                          <span className="sr-small" style={{ color: "#6b7280" }}>
                            (DOCX)
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="sr-small" style={{ color: "#991b1b" }}>
                        ⚠️ No disponible para descarga (falta id en el backend).
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="sr-card" style={{ marginTop: 14 }}>
        <h3 className="sr-h3" style={{ marginTop: 0 }}>
          Acciones
        </h3>

        <button className="sr-btn-primary" onClick={runAI} disabled={runningAI}>
          {runningAI ? "Analizando…" : "Generar recurso ahora (Modo Dios)"}
        </button>

        <button className="sr-btn-secondary" onClick={loadCase} style={{ marginLeft: 10 }}>
          Recargar
        </button>
      </div>

      {aiResult && (
        <div className="sr-card" style={{ marginTop: 14 }}>
          <h3 className="sr-h3" style={{ marginTop: 0 }}>
            Resultado Modo Dios
          </h3>

          <p className="sr-p">
            <b>Admisibilidad:</b> {admissibility || "—"}
          </p>

          {recommended && (
            <p className="sr-p">
              <b>Acción recomendada:</b> {recommended}
            </p>
          )}

          {admissibility === "NOT_ADMISSIBLE" && (
            <p className="sr-p" style={{ color: "#991b1b" }}>
              ⚠️ El recurso no es admisible en este momento.
            </p>
          )}

          {admissibility === "ADMISSIBLE" && (
            <p className="sr-p" style={{ color: "#166534" }}>
              ✅ Recurso admisible. Listo para generar DOCX/PDF y presentar.
            </p>
          )}

          {!admissibility && (
            <p className="sr-small" style={{ color: "#6b7280" }}>
              (Sin decisión de admisibilidad en el resultado. Revisa /ai/expediente/run.)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
