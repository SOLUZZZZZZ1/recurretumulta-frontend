import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API = "/api";

async function fetchJson(url, options = {}) {
  const r = await fetch(url, options);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.detail || "Error API");
  return data;
}

export default function OpsCaseDetail() {
  const { caseId } = useParams();

  const [caseData, setCaseData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!caseId) return;

    // 1) Cargar documentos del expediente
    fetchJson(`${API}/ops/cases/${caseId}/documents`)
      .then((res) => setDocuments(res.documents || []))
      .catch(() => {});

    // 2) Cargar eventos para ver estado (paid / authorized / ai)
    fetchJson(`${API}/ops/cases/${caseId}/events`)
      .then((res) => {
        const events = res.events || [];
        const ai = events.find((e) => e.type === "ai_expediente_result");
        if (ai) setAiResult(ai.payload);
        setCaseData({ events });
      })
      .catch(() => {});
  }, [caseId]);

  async function runAI() {
    setMsg("");
    setLoading(true);
    try {
      const data = await fetchJson(`${API}/ai/expediente/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case_id: caseId }),
      });
      setAiResult(data);
      setMsg("✅ Análisis Modo Dios completado.");
    } catch (e) {
      setMsg(e.message || "Error al ejecutar Modo Dios");
    } finally {
      setLoading(false);
    }
  }

  const admissibility = aiResult?.admissibility?.admissibility;

  return (
    <div className="sr-container" style={{ paddingTop: 24, paddingBottom: 48 }}>
      <h1 className="sr-h1">Expediente {caseId}</h1>

      {/* DOCUMENTOS */}
      <div className="sr-card" style={{ marginTop: 16 }}>
        <h3 className="sr-h3">Documentos del expediente</h3>

        {documents.length === 0 && (
          <p className="sr-p">No hay documentos cargados.</p>
        )}

        {documents.map((d, i) => (
          <div key={i} className="sr-small" style={{ marginBottom: 6 }}>
            📄 {d.kind} — {d.b2_key}
          </div>
        ))}
      </div>

      {/* BOTÓN MANUAL */}
      <div className="sr-card" style={{ marginTop: 16 }}>
        <h3 className="sr-h3">Acciones</h3>

        <button
          className="sr-btn-primary"
          onClick={runAI}
          disabled={loading}
        >
          {loading ? "Analizando…" : "Generar recurso ahora"}
        </button>

        {msg && (
          <div
            className="sr-small"
            style={{ marginTop: 8, color: msg.startsWith("✅") ? "#166534" : "#991b1b" }}
          >
            {msg}
          </div>
        )}
      </div>

      {/* RESULTADO IA */}
      {aiResult && (
        <div className="sr-card" style={{ marginTop: 16 }}>
          <h3 className="sr-h3">Resultado Modo Dios</h3>

          <p className="sr-p">
            <b>Admisibilidad:</b>{" "}
            {admissibility || "—"}
          </p>

          {admissibility === "NOT_ADMISSIBLE" && (
            <p className="sr-p">
              ⚠️ El recurso no es admisible en este momento.
            </p>
          )}

          {admissibility === "ADMISSIBLE" && (
            <p className="sr-p">
              ✅ Recurso admisible. Listo para generar PDF/DOCX y presentar.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
