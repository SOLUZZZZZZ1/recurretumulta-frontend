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

  if (k.includes("final_resource_pdf")) return "Recurso final PDF";
  if (k.includes("final_resource_docx")) return "Recurso final Word";
  if (k.includes("final_resource_text")) return "Recurso final texto";
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
    k.includes("final_resource") ||
    k.includes("pdf") ||
    k.includes("docx")
  );
}

function resourceStatusLabel(resource) {
  if (!resource) return "Sin borrador";
  if (resource.is_final) return `Versión final v${resource.version}`;
  return `Borrador v${resource.version}`;
}

export default function OpsCaseDetail() {
  const { caseId } = useParams();
  const token = localStorage.getItem("ops_token") || "";
  const headers = token ? { "X-Operator-Token": token } : {};
  const jsonHeaders = token
    ? { "Content-Type": "application/json", "X-Operator-Token": token }
    : { "Content-Type": "application/json" };

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

  const [resourceText, setResourceText] = useState("");
  const [resourceMeta, setResourceMeta] = useState(null);
  const [loadingResource, setLoadingResource] = useState(false);
  const [savingResource, setSavingResource] = useState(false);
  const [finalizingResource, setFinalizingResource] = useState(false);
  const [sendingComplete, setSendingComplete] = useState(false);
  const [sendDestination, setSendDestination] = useState("");
  const [sendNote, setSendNote] = useState("");

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
      await loadFinalResource(false);
    } catch (err) {
      setMsg("❌ No se pudieron cargar documentos, logs o recurso final.");
      setDebug(err?.message || "");
    } finally {
      setLoading(false);
    }
  }

  async function loadFinalResource(showMessage = true) {
    setLoadingResource(true);
    if (showMessage) {
      setMsg("");
      setDebug("");
    }

    try {
      const data = await fetchJsonFallback(`/ops/cases/${caseId}/final-resource`, { headers });
      const resource = data?.resource || null;
      setResourceMeta(resource);
      setResourceText(resource?.content || "");
      if (showMessage) setMsg(resource ? "✅ Recurso editable cargado." : "ℹ️ Aún no hay borrador guardado.");
    } catch (err) {
      if (showMessage) {
        setMsg("❌ No se pudo cargar el recurso editable.");
        setDebug(err?.message || "");
      }
    } finally {
      setLoadingResource(false);
    }
  }

  async function saveDraft() {
    const content = resourceText.trim();
    if (!content) {
      setMsg("❌ El recurso no puede estar vacío.");
      return;
    }

    setSavingResource(true);
    setMsg("");
    setDebug("");

    try {
      const data = await fetchJsonFallback(`/ops/cases/${caseId}/final-resource`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ content, created_by: "operator" }),
      });

      setResourceMeta(data.resource || null);
      setResourceText(data.resource?.content || content);
      setMsg(`✅ Borrador guardado${data.resource?.version ? ` v${data.resource.version}` : ""}.`);
      await load();
    } catch (err) {
      setMsg("❌ No se pudo guardar el borrador.");
      setDebug(err?.message || "");
    } finally {
      setSavingResource(false);
    }
  }

  async function finalizeResource() {
    const content = resourceText.trim();
    if (!content) {
      setMsg("❌ El recurso final no puede estar vacío.");
      return;
    }

    const ok = window.confirm(
      "¿Guardar como versión final? El expediente pasará a final_ready y se guardará copia documental."
    );
    if (!ok) return;

    setFinalizingResource(true);
    setMsg("");
    setDebug("");

    try {
      const data = await fetchJsonFallback(`/ops/cases/${caseId}/finalize-resource`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ content, created_by: "operator" }),
      });

      setResourceMeta(data.resource || null);
      setResourceText(data.resource?.content || content);
      const docsCount = Array.isArray(data.documents) ? data.documents.length : 0;
      setMsg(`✅ Versión final guardada. Estado: ${data.status || "final_ready"}. ${docsCount ? `Documentos finales creados: ${docsCount}.` : ""}`);
      await load();
    } catch (err) {
      setMsg("❌ No se pudo guardar la versión final.");
      setDebug(err?.message || "");
    } finally {
      setFinalizingResource(false);
    }
  }

  async function sendCompleteFile() {
    const ok = window.confirm(
      "¿Marcar el expediente completo como enviado? Debe existir una versión final guardada."
    );
    if (!ok) return;

    setSendingComplete(true);
    setMsg("");
    setDebug("");

    try {
      const data = await fetchJsonFallback(`/ops/cases/${caseId}/send-complete`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          destination: sendDestination.trim() || null,
          channel: "ops",
          note: sendNote.trim() || null,
        }),
      });

      setMsg(`✅ Expediente completo enviado/marcado como enviado. Estado: ${data.status || "sent"}.`);
      await load();
    } catch (err) {
      setMsg("❌ No se pudo enviar/marcar el expediente completo.");
      setDebug(err?.message || "");
    } finally {
      setSendingComplete(false);
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
      const data = await fetchJsonFallback("/generate/dgt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          case_id: caseId,
          interesado: {},
        }),
      });

      if (data?.cuerpo) {
        setResourceText(data.cuerpo);
        setResourceMeta(null);
        setMsg("✅ Recurso generado y cargado en el editor. Revísalo y pulsa ‘Guardar borrador’ o ‘Guardar versión final’.");
      } else {
        setMsg("✅ Recurso generado. Actualizando documentos…");
      }

      const [d, e] = await Promise.all([
        fetchJsonFallback(`/ops/cases/${caseId}/documents`, { headers }),
        fetchJsonFallback(`/ops/cases/${caseId}/events`, { headers }),
      ]);
      setDocs(d.documents || d.items || []);
      setEvents(e.events || e.items || []);
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
  const chars = resourceText.length;
  const words = resourceText.trim() ? resourceText.trim().split(/\s+/).length : 0;

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

      <div className="sr-card mt-4" style={{ border: "2px solid #1d4ed8" }}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="sr-h3" style={{ marginTop: 0 }}>💣 Nora OPS Editor Final</h3>
            <p className="sr-p" style={{ marginBottom: 0 }}>
              Edita el recurso en pantalla, guarda borrador, fija versión final y marca el expediente completo como enviado.
            </p>
          </div>
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              background: resourceMeta?.is_final ? "#dcfce7" : "#eff6ff",
              color: resourceMeta?.is_final ? "#166534" : "#1d4ed8",
              fontWeight: 900,
              fontSize: 13,
            }}
          >
            {resourceStatusLabel(resourceMeta)}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3 mt-4 text-sm">
          <div className="border rounded p-3" style={{ background: "#f8fafc" }}>
            <strong>Versión</strong>
            <div>{resourceMeta?.version || "—"}</div>
          </div>
          <div className="border rounded p-3" style={{ background: "#f8fafc" }}>
            <strong>Caracteres / palabras</strong>
            <div>{chars} / {words}</div>
          </div>
          <div className="border rounded p-3" style={{ background: "#f8fafc" }}>
            <strong>Última actualización</strong>
            <div>{fmt(resourceMeta?.updated_at) || "—"}</div>
          </div>
        </div>

        <textarea
          value={resourceText}
          onChange={(e) => setResourceText(e.target.value)}
          placeholder="Pega o redacta aquí el recurso final revisado por OPS…"
          className="border rounded px-3 py-3 text-sm mt-4"
          style={{
            width: "100%",
            minHeight: 420,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            lineHeight: 1.55,
            background: "#ffffff",
          }}
        />

        <div className="grid md:grid-cols-2 gap-3 mt-3">
          <input
            placeholder="Destino envío completo (email/gestoría/opcional)"
            value={sendDestination}
            onChange={(e) => setSendDestination(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          />
          <input
            placeholder="Nota envío completo (opcional)"
            value={sendNote}
            onChange={(e) => setSendNote(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-3 flex-wrap mt-4">
          <button className="sr-btn-secondary" onClick={() => loadFinalResource(true)} disabled={loadingResource}>
            {loadingResource ? "Cargando…" : "Cargar último borrador"}
          </button>
          <button className="sr-btn-primary" onClick={saveDraft} disabled={savingResource}>
            {savingResource ? "Guardando…" : "Guardar borrador"}
          </button>
          <button
            className="sr-btn-primary"
            onClick={finalizeResource}
            disabled={finalizingResource}
            style={{ background: "#166534" }}
          >
            {finalizingResource ? "Guardando final…" : "Guardar versión final"}
          </button>
          <button
            className="sr-btn-primary"
            onClick={sendCompleteFile}
            disabled={sendingComplete}
            style={{ background: "#7c2d12" }}
          >
            {sendingComplete ? "Enviando…" : "Enviar expediente completo"}
          </button>
        </div>
      </div>

      <div className="sr-card mt-4">
        <h3 className="sr-h3">Acciones clásicas</h3>

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
            color: msg.startsWith("✅") ? "#166534" : msg.startsWith("ℹ️") ? "#1d4ed8" : "#991b1b",
            background: msg.startsWith("✅") ? "#ecfdf5" : msg.startsWith("ℹ️") ? "#eff6ff" : "#fef2f2",
            border: msg.startsWith("✅") ? "1px solid #bbf7d0" : msg.startsWith("ℹ️") ? "1px solid #bfdbfe" : "1px solid #fecaca",
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
              Todavía no hay recurso visible. Pulsa “Generar recurso ahora” o guarda una versión final desde el editor.
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
