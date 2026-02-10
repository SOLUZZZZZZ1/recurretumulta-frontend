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

function guessFilename(doc) {
  const key = doc?.key || "";
  const fromKey = key.split("/").pop();
  if (fromKey) return fromKey;
  const kind = (doc?.kind || "documento").toLowerCase();
  if (kind.includes("pdf")) return "documento.pdf";
  if (kind.includes("docx")) return "documento.docx";
  return "documento.bin";
}

export default function OpsCaseDetail() {
  const { caseId } = useParams();

  const [documents, setDocuments] = useState([]);
  const [aiResult, setAiResult] = useState(null);

  const [loading, setLoading] = useState(false);
  const [runningAI, setRunningAI] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
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
      // refresca docs después de generar
      await loadCase();
    } catch (e) {
      setError(e.message || "Error ejecutando Modo Dios");
    } finally {
      setRunningAI(false);
    }
  }

  async function downloadDoc(doc) {
    setError("");
    if (!token) {
      setError("Falta token de operador. Accede primero al panel OPS y entra con PIN.");
      return;
    }
    if (!doc?.id) {
      setError("Este documento no tiene id (no se puede descargar).");
      return;
    }

    const url = `${API}/ops/documents/${encodeURIComponent(doc.id)}/download`;
    const filename = guessFilename(doc);

    setDownloadingId(doc.id);
    try {
      const r = await fetch(url, { headers });
      if (!r.ok) {
        // intenta leer JSON de error
        const data = await r.json().catch(() => ({}));
        throw new Error(data?.detail || `Error descargando (HTTP ${r.status})`);
      }

      const blob = await r.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      setError(e.message || "Error descargando documento");
    } finally {
      setDownloadingId(null);
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
                  {d.mime || "—"} · {d.size_bytes ? `${d.size_bytes} bytes` : "—"} ·{" "}
                  {fmt(d.created_at)}
                </div>

                <div style={{ marginTop: 8 }}>
                  <button
                    className="sr-btn-secondary"
                    onClick={() => downloadDoc(d)}
                    disabled={!d?.id || downloadingId === d?.id}
                    style={{ padding: "8px 12px" }}
                  >
                    {downloadingId === d?.id ? "Descargando…" : "Descargar"}
                  </button>

                  {!d?.id && (
                    <span className="sr-small" style={{ marginLeft: 10, color: "#991b1b" }}>
                      (falta id: no descargable)
                    </span>
                  )}
                </div>
              </div>
            ))}
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
