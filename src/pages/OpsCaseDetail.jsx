import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const DIRECT_BACKEND = "https://recurretumulta-backend.onrender.com";

const API_CANDIDATES = [
  "/api",
  import.meta.env.VITE_API_BASE_URL,
  import.meta.env.VITE_API_URL,
  DIRECT_BACKEND,
].filter(Boolean);

function buildUrl(base, path) {
  return `${String(base || "").replace(/\/$/, "")}${path}`;
}

function fmt(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return String(d);
  }
}

async function readResponse(response) {
  const text = await response.text().catch(() => "");
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    const detail = data?.detail || data?.message || text || `HTTP ${response.status}`;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }

  return data;
}

async function fetchJsonFallback(path, options = {}) {
  const errors = [];

  for (const base of API_CANDIDATES) {
    const url = buildUrl(base, path);

    try {
      const response = await fetch(url, options);
      return await readResponse(response);
    } catch (e) {
      errors.push(`${url} → ${e?.message || "Error"}`);
    }
  }

  throw new Error(errors.join(" | "));
}

function docLabel(kind = "") {
  const k = String(kind || "").toLowerCase();

  if (k.includes("authorization_signed")) return "Autorización firmada";
  if (k.includes("authorization")) return "Autorización";
  if (k.includes("submission_receipt")) return "Justificante de presentación";
  if (k.includes("original")) return "Documento original";
  if (k.includes("generated") && k.includes("pdf")) return "Recurso PDF";
  if (k.includes("generated") && k.includes("docx")) return "Recurso Word";
  if (k.includes("pdf")) return "PDF";
  if (k.includes("docx")) return "Word";

  return kind || "Documento";
}

function isResource(kind = "") {
  const k = String(kind || "").toLowerCase();
  return (
    k.includes("generated") ||
    k.includes("recurso") ||
    k.includes("pdf") ||
    k.includes("docx")
  );
}

export default function OpsCaseDetail() {
  const { caseId } = useParams();
  const token = localStorage.getItem("ops_token") || "";
  const headers = token ? { "X-Operator-Token": token } : {};

  const [docs, setDocs] = useState([]);
  const [events, setEvents] = useState([]);
  const [registro, setRegistro] = useState("");
  const [note, setNote] = useState("");
  const [justificante, setJustificante] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [debug, setDebug] = useState("");

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  async function load() {
    setLoading(true);
    setMsg("");
    setDebug("");

    try {
      const [d, e] = await Promise.all([
        fetchJsonFallback(`/ops/cases/${caseId}/documents`, { headers }),
        fetchJsonFallback(`/ops/cases/${caseId}/events`, { headers }),
      ]);

      setDocs(d.documents || d.items || []);
      setEvents(e.events || e.items || []);
    } catch (err) {
      setMsg("❌ No se pudieron cargar documentos o logs.");
      setDebug(err?.message || "");
    } finally {
      setLoading(false);
    }
  }

  async function openDocument(doc) {
    setMsg("");
    setDebug("");

    try {
      if (doc.id) {
        for (const base of API_CANDIDATES) {
          const url = buildUrl(base, `/ops/documents/${doc.id}/download`);
          try {
            const r = await fetch(url, { headers });
            if (!r.ok) continue;
            const blob = await r.blob();
            const objectUrl = URL.createObjectURL(blob);
            window.open(objectUrl, "_blank", "noopener,noreferrer");
            return;
          } catch {
            // probar siguiente
          }
        }
      }

      const bucket = doc.bucket || doc.b2_bucket;
      const key = doc.key || doc.b2_key;

      if (!bucket || !key) throw new Error("Documento sin bucket/key.");

      const data = await fetchJsonFallback(
        `/files/presign?case_id=${encodeURIComponent(caseId)}&bucket=${encodeURIComponent(bucket)}&key=${encodeURIComponent(key)}`
      );

      if (!data?.url) throw new Error("No se recibió URL de descarga.");
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setMsg("❌ No se pudo abrir el documento.");
      setDebug(err?.message || "");
    }
  }

  async function generateResourceNow() {
    setGenerating(true);
    setMsg("");
    setDebug("");

    try {
      await fetchJsonFallback("/generate/dgt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          case_id: caseId,
          interesado: {},
        }),
      });

      setMsg("✅ Recurso generado. Actualizando documentos…");
      await load();
    } catch (err) {
      setMsg("❌ No se pudo generar el recurso.");
      setDebug(err?.message || "");
    } finally {
      setGenerating(false);
    }
  }

  async function markSubmitted() {
    setMsg("");
    setDebug("");

    try {
      const fd = new FormData();
      if (registro) fd.append("registro", registro);
      if (note) fd.append("note", note);

      await fetchJsonFallback(`/ops/cases/${caseId}/mark-submitted`, {
        method: "POST",
        headers,
        body: fd,
      });

      setMsg("✅ Caso marcado como presentado.");
      await load();
    } catch (err) {
      setMsg("❌ No se pudo marcar como presentado.");
      setDebug(err?.message || "");
    }
  }

  async function uploadJustificante() {
    if (!justificante) {
      setMsg("❌ Selecciona un archivo.");
      return;
    }

    setUploading(true);
    setMsg("");
    setDebug("");

    try {
      const fd = new FormData();
      fd.append("file", justificante);

      await fetchJsonFallback(`/ops/cases/${caseId}/upload-justificante`, {
        method: "POST",
        headers,
        body: fd,
      });

      setJustificante(null);
      setMsg("✅ Justificante subido.");
      await load();
    } catch (err) {
      setMsg("❌ No se pudo subir el justificante.");
      setDebug(err?.message || "");
    } finally {
      setUploading(false);
    }
  }

  const resourceDocs = docs.filter((d) => isResource(d.kind));
  const otherDocs = docs.filter((d) => !isResource(d.kind));

  return (
    <div className="sr-container py-8">
      <Link to="/ops" className="sr-btn-secondary">
        ← Volver al panel
      </Link>

      <h1 className="sr-h2 mt-4">Expediente {caseId}</h1>

      <div
        className="sr-card mt-4"
        style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
      >
        <h3 className="sr-h3" style={{ marginTop: 0 }}>
          🟡 Revisión manual obligatoria
        </h3>
        <p className="sr-p" style={{ marginBottom: 0 }}>
          Fase inicial del producto: revisar manualmente datos, plazos, organismo,
          hecho denunciado, recurso generado y canal de presentación antes de marcar
          el caso como presentado.
        </p>
      </div>

      <div className="sr-card mt-4">
        <h3 className="sr-h3">Acciones</h3>

        <div className="grid md:grid-cols-2 gap-3 mt-3">
          <input
            placeholder="Número de registro (opcional)"
            value={registro}
            onChange={(e) => setRegistro(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          />
          <input
            placeholder="Nota interna (opcional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-3 flex-wrap mt-4">
          <button className="sr-btn-primary" onClick={generateResourceNow} disabled={generating}>
            {generating ? "Generando recurso…" : "Generar recurso ahora"}
          </button>

          <button className="sr-btn-primary" onClick={markSubmitted}>
            Marcar como presentado
          </button>

          <input
            type="file"
            onChange={(e) => setJustificante(e.target.files?.[0] || null)}
          />

          <button
            className="sr-btn-primary"
            onClick={uploadJustificante}
            disabled={uploading}
          >
            {uploading ? "Subiendo…" : "Subir justificante"}
          </button>
        </div>
      </div>

      {msg ? (
        <div
          className="sr-card mt-4"
          style={{
            color: msg.startsWith("✅") ? "#166534" : "#991b1b",
            background: msg.startsWith("✅") ? "#ecfdf5" : "#fef2f2",
            border: msg.startsWith("✅") ? "1px solid #bbf7d0" : "1px solid #fecaca",
            fontWeight: 900,
          }}
        >
          {msg}
        </div>
      ) : null}

      {debug ? (
        <div
          className="sr-card mt-4"
          style={{
            color: "#475569",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            fontSize: 12,
            wordBreak: "break-word",
          }}
        >
          Detalle: {debug}
        </div>
      ) : null}

      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <div className="sr-card">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="sr-h3">Documentos generados</h3>
            <button className="sr-btn-secondary" onClick={load} disabled={loading}>
              {loading ? "Cargando…" : "Refrescar"}
            </button>
          </div>

          {resourceDocs.length ? (
            resourceDocs.map((d, i) => (
              <button
                key={`${d.id || d.kind}-${i}`}
                onClick={() => openDocument(d)}
                className="block w-full text-left border rounded p-3 mt-2 text-sm"
                style={{ background: "#f8fafc" }}
              >
                <strong>{docLabel(d.kind)}</strong>
                <div style={{ color: "#64748b", marginTop: 3 }}>{fmt(d.created_at)}</div>
                <div style={{ color: "#64748b", marginTop: 3, wordBreak: "break-word", fontSize: 12 }}>
                  {d.key || d.b2_key || d.id}
                </div>
              </button>
            ))
          ) : (
            <div
              style={{
                marginTop: 12,
                padding: 14,
                border: "1px dashed #cbd5e1",
                borderRadius: 12,
                color: "#64748b",
              }}
            >
              Todavía no hay recurso visible. Pulsa “Generar recurso ahora”.
            </div>
          )}

          <h3 className="sr-h3" style={{ marginTop: 22 }}>Otros documentos</h3>

          {otherDocs.length ? (
            otherDocs.map((d, i) => (
              <button
                key={`${d.id || d.kind}-other-${i}`}
                onClick={() => openDocument(d)}
                className="block w-full text-left border rounded p-3 mt-2 text-sm"
              >
                <strong>{docLabel(d.kind)}</strong>
                <div style={{ color: "#64748b", marginTop: 3 }}>{fmt(d.created_at)}</div>
              </button>
            ))
          ) : (
            <div
              style={{
                marginTop: 12,
                padding: 14,
                border: "1px dashed #cbd5e1",
                borderRadius: 12,
                color: "#64748b",
              }}
            >
              No hay otros documentos visibles.
            </div>
          )}
        </div>

        <div className="sr-card">
          <h3 className="sr-h3">Logs</h3>

          {events.length ? (
            events.map((e, i) => (
              <div key={i} className="border rounded p-2 mt-2 text-xs">
                <strong>{e.type}</strong>
                <div>{fmt(e.created_at)}</div>
                {e.payload ? (
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      marginTop: 6,
                      background: "#f8fafc",
                      padding: 8,
                      borderRadius: 8,
                    }}
                  >
                    {typeof e.payload === "string" ? e.payload : JSON.stringify(e.payload, null, 2)}
                  </pre>
                ) : null}
              </div>
            ))
          ) : (
            <div
              style={{
                marginTop: 12,
                padding: 14,
                border: "1px dashed #cbd5e1",
                borderRadius: 12,
                color: "#64748b",
              }}
            >
              Todavía no hay logs visibles.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
