// src/components/GenerateRecursoDGT.jsx
import React, { useState } from "react";

const API = "/api";

export default function GenerateRecursoDGT({ caseId, suggestedTipo = null }) {
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState(null);
  const [msg, setMsg] = useState("");
  const [links, setLinks] = useState(null);

  async function presign(bucket, key) {
    const url = `${API}/files/presign?bucket=${encodeURIComponent(bucket)}&key=${encodeURIComponent(key)}`;
    const r = await fetch(url);
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data?.ok) throw new Error(data?.detail || data?.message || "No se pudo obtener enlace de descarga");
    return data.url;
  }

  async function onGenerate() {
    if (!caseId) return;
    setLoading(true);
    setOk(null);
    setMsg("Generando recurso…");
    setLinks(null);

    try {
      const res = await fetch(`${API}/generate/dgt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: caseId,
          tipo: suggestedTipo || null,
          interesado: {},
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.detail || data?.message || "No se pudo generar el recurso");
      }

      const docxUrl = await presign(data.docx.bucket, data.docx.key);
      const pdfUrl = await presign(data.pdf.bucket, data.pdf.key);

      setLinks({
        docx: { url: docxUrl, filename: data.docx.filename || "recurso.docx" },
        pdf: { url: pdfUrl, filename: data.pdf.filename || "recurso.pdf" },
        tipo: data.tipo,
      });

      setOk(true);
      setMsg("Recurso generado.");
    } catch (e) {
      setOk(false);
      setMsg(e?.message || "Error al generar el recurso");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sr-card" style={{ marginTop: 14 }}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="sr-h3" style={{ margin: 0 }}>Generar recurso DGT</h3>
          <div className="sr-small" style={{ opacity: 0.85, marginTop: 4 }}>
            Genera el escrito en DOCX y PDF para este expediente.
          </div>
        </div>

        <button className="sr-btn-primary" onClick={onGenerate} disabled={loading || !caseId}>
          {loading ? "Generando…" : "Generar recurso"}
        </button>
      </div>

      <div className="sr-small" style={{ marginTop: 10 }}>
        {ok === true && <span style={{ color: "#166534" }}>✅ {msg}</span>}
        {ok === false && <span style={{ color: "#991b1b" }}>❌ {msg}</span>}
        {ok === null && msg && <span style={{ opacity: 0.85 }}>{msg}</span>}
      </div>

      {links && (
        <div style={{ marginTop: 12 }} className="sr-card">
          <div className="sr-small" style={{ marginBottom: 10, opacity: 0.9 }}>
            Tipo detectado/seleccionado: <b>{links.tipo}</b>
          </div>

          <div className="sr-cta-row" style={{ justifyContent: "flex-start", marginTop: 0 }}>
            <a className="sr-btn-primary" href={links.pdf.url} target="_blank" rel="noreferrer">
              Descargar PDF
            </a>
            <a className="sr-btn-secondary" href={links.docx.url} target="_blank" rel="noreferrer">
              Descargar Word
            </a>
          </div>

          <div className="sr-small" style={{ marginTop: 10, color: "#6b7280" }}>
            Nota: el PDF es el documento recomendado para presentación.
          </div>
        </div>
      )}
    </div>
  );
}
