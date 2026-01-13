// src/components/UploadDocumento.jsx — Subir y analizar documento (abre el expediente)
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "/api";

async function fetchJson(url, options = {}) {
  const r = await fetch(url, options);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.detail || "Error al analizar el documento");
  return data;
}

export default function UploadDocumento() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [analysis, setAnalysis] = useState(null);

  async function analyze() {
    if (!file) {
      setMsg("Selecciona un documento.");
      return;
    }

    setLoading(true);
    setMsg("");
    setAnalysis(null);

    const fd = new FormData();
    fd.append("file", file);

    try {
      // 1) Analizar documento
      const data = await fetchJson(`${API}/analyze`, {
        method: "POST",
        body: fd,
      });

      // Guardamos el análisis para el resumen
      localStorage.setItem("rtm_last_analysis", JSON.stringify(data));

      setAnalysis(data);
      setMsg("Documento analizado correctamente.");

      // 2) Redirigir al resumen del expediente
      const caseId =
        data?.case_id ||
        data?.caseId ||
        data?.id ||
        data?.extracted?.case_id ||
        data?.extracted?.id;

      if (caseId) {
        navigate(`/resumen?case=${encodeURIComponent(caseId)}`);
      } else {
        setMsg(
          "Documento analizado, pero no se pudo abrir el expediente automáticamente."
        );
      }
    } catch (e) {
      setMsg(e.message || "Error al analizar el documento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sr-card">
      <h2 className="sr-h2">Subir documento</h2>

      <p className="sr-p">
        Sube una foto, escaneo o PDF del documento que quieras recurrir.
      </p>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <div className="sr-cta-row" style={{ marginTop: 12 }}>
        <button
          className="sr-btn-primary"
          onClick={analyze}
          disabled={loading}
        >
          {loading ? "Analizando…" : "Analizar documento"}
        </button>

        {msg && (
          <span className="sr-small" style={{ marginLeft: 8 }}>
            {msg}
          </span>
        )}
      </div>

      {/* Vista mínima del análisis (opcional, informativa) */}
      {analysis && (
        <div className="sr-small" style={{ marginTop: 10, color: "#6b7280" }}>
          Expediente creado. Abriendo resumen…
        </div>
      )}
    </div>
  );
}
