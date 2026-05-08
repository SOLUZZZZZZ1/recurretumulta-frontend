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
  if (k.includes("justificante_presentacion")) return "Justificante de presentación";
  if (k.includes("instancia_firmada")) return "Instancia firmada";
  if (k.includes("csv_registro")) return "CSV / resguardo registro";
  if (k.includes("resolucion")) return "Resolución";
  if (k.includes("requerimiento")) return "Requerimiento";
  if (k.includes("contestacion_ayuntamiento")) return "Contestación ayuntamiento";
  if (k.includes("prueba_externa")) return "Prueba externa";
  if (k.includes("documento_externo")) return "Documento externo";
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

function isExternalProcedureDoc(kind = "") {
  const k = String(kind || "").toLowerCase();
  return (
    k.includes("justificante_presentacion") ||
    k.includes("instancia_firmada") ||
    k.includes("csv_registro") ||
    k.includes("resolucion") ||
    k.includes("requerimiento") ||
    k.includes("contestacion_ayuntamiento") ||
    k.includes("prueba_externa") ||
    k.includes("documento_externo")
  );
}

function eventLabel(type = "") {
  const t = String(type || "").toLowerCase();
  if (t === "manual_submission_registered") return "Presentación manual registrada";
  if (t === "external_document_uploaded") return "Documento externo adjuntado";
  if (t === "justificante_uploaded") return "Justificante subido";
  if (t === "paid_ok") return "Pago confirmado";
  if (t === "checkout_started") return "Checkout iniciado";
  if (t === "resource_generated_auto") return "Recurso generado automáticamente";
  if (t === "ai_expediente_result") return "Análisis IA registrado";
  if (t === "case_authorized") return "Autorización registrada";
  if (t === "case_details_saved") return "Datos del interesado guardados";
  if (t === "ops_mark_submitted") return "Marcado como presentado";
  return type || "Evento";
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

  const [manualOrganismo, setManualOrganismo] = useState("Ajuntament de Terrassa");
  const [manualRegistro, setManualRegistro] = useState("");
  const [manualCsv, setManualCsv] = useState("");
  const [manualSubmittedAt, setManualSubmittedAt] = useState("");
  const [manualChannel, setManualChannel] = useState("ayuntamiento_manual");
  const [manualNote, setManualNote] = useState("");
  const [manualFile, setManualFile] = useState(null);
  const [registeringManual, setRegisteringManual] = useState(false);

  const [externalKind, setExternalKind] = useState("documento_externo");
  const [externalNote, setExternalNote] = useState("");
  const [externalFile, setExternalFile] = useState(null);
  const [uploadingExternal, setUploadingExternal] = useState(false);

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


  async function registerManualSubmission() {
    setMsg("");
    setDebug("");

    if (!manualOrganismo.trim()) {
      setMsg("❌ Indica el organismo donde se presentó.");
      return;
    }
    if (!manualRegistro.trim()) {
      setMsg("❌ Indica el número de registro de entrada.");
      return;
    }

    setRegisteringManual(true);

    try {
      const fd = new FormData();
      fd.append("organismo", manualOrganismo.trim());
      fd.append("registro", manualRegistro.trim());
      if (manualCsv.trim()) fd.append("csv", manualCsv.trim());
      if (manualSubmittedAt.trim()) fd.append("submitted_at", manualSubmittedAt.trim());
      if (manualChannel.trim()) fd.append("channel", manualChannel.trim());
      if (manualNote.trim()) fd.append("note", manualNote.trim());
      if (manualFile) fd.append("file", manualFile);

      await fetchJsonFallback(`/ops/cases/${caseId}/register-manual-submission`, {
        method: "POST",
        headers,
        body: fd,
      });

      setMsg("✅ Presentación manual registrada y expediente marcado como presentado.");
      setManualFile(null);
      await load();
    } catch (err) {
      setMsg("❌ No se pudo registrar la presentación manual.");
      setDebug(err?.message || "");
    } finally {
      setRegisteringManual(false);
    }
  }

  async function uploadExternalDocument() {
    if (!externalFile) {
      setMsg("❌ Selecciona un documento externo.");
      return;
    }

    setUploadingExternal(true);
    setMsg("");
    setDebug("");

    try {
      const fd = new FormData();
      fd.append("file", externalFile);
      fd.append("kind", externalKind);
      if (externalNote.trim()) fd.append("note", externalNote.trim());

      await fetchJsonFallback(`/ops/cases/${caseId}/upload-external-document`, {
        method: "POST",
        headers,
        body: fd,
      });

      setExternalFile(null);
      setExternalNote("");
      setMsg("✅ Documento externo adjuntado al expediente.");
      await load();
    } catch (err) {
      setMsg("❌ No se pudo adjuntar el documento externo.");
      setDebug(err?.message || "");
    } finally {
      setUploadingExternal(false);
    }
  }

  const resourceDocs = docs.filter((d) => isResource(d.kind));
  const externalDocs = docs.filter((d) => isExternalProcedureDoc(d.kind));
  const otherDocs = docs.filter((d) => !isResource(d.kind) && !isExternalProcedureDoc(d.kind));

  const timelineEvents = [...events].sort((a, b) => {
    const da = new Date(a.created_at || 0).getTime();
    const db = new Date(b.created_at || 0).getTime();
    return db - da;
  });

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

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <div
          className="sr-card"
          style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
        >
          <h3 className="sr-h3" style={{ marginTop: 0 }}>
            📌 Registrar presentación manual
          </h3>
          <p className="sr-p" style={{ marginBottom: 12 }}>
            Para ayuntamientos o presentaciones hechas fuera de OPS. Guarda el registro, CSV,
            justificante y cambia el estado a presentado_manual_ayuntamiento.
          </p>

          <div className="grid gap-3">
            <input
              placeholder="Organismo (ej. Ajuntament de Terrassa)"
              value={manualOrganismo}
              onChange={(e) => setManualOrganismo(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              placeholder="Número de registro de entrada"
              value={manualRegistro}
              onChange={(e) => setManualRegistro(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              placeholder="CSV / código seguro de verificación (opcional)"
              value={manualCsv}
              onChange={(e) => setManualCsv(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              placeholder="Fecha/hora presentación (opcional, ej. 2026-05-07 10:43:34)"
              value={manualSubmittedAt}
              onChange={(e) => setManualSubmittedAt(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
            <select
              value={manualChannel}
              onChange={(e) => setManualChannel(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="ayuntamiento_manual">Ayuntamiento manual</option>
              <option value="registro_general_manual">Registro general manual</option>
              <option value="gestoria_manual">Gestoría / tercero</option>
              <option value="otro_manual">Otro canal manual</option>
            </select>
            <input
              placeholder="Observaciones internas (opcional)"
              value={manualNote}
              onChange={(e) => setManualNote(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.docx,.xml"
              onChange={(e) => setManualFile(e.target.files?.[0] || null)}
            />
          </div>

          <button
            className="sr-btn-primary mt-4"
            onClick={registerManualSubmission}
            disabled={registeringManual}
          >
            {registeringManual ? "Registrando…" : "📌 Registrar presentación manual"}
          </button>
        </div>

        <div
          className="sr-card"
          style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
        >
          <h3 className="sr-h3" style={{ marginTop: 0 }}>
            📎 Adjuntar documentación externa
          </h3>
          <p className="sr-p" style={{ marginBottom: 12 }}>
            Añade resoluciones, requerimientos, instancias, justificantes o pruebas externas
            al expediente completo.
          </p>

          <div className="grid gap-3">
            <select
              value={externalKind}
              onChange={(e) => setExternalKind(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="documento_externo">Documento externo</option>
              <option value="justificante_presentacion">Justificante de presentación</option>
              <option value="instancia_firmada">Instancia firmada</option>
              <option value="csv_registro">CSV / resguardo registro</option>
              <option value="resolucion">Resolución</option>
              <option value="requerimiento">Requerimiento</option>
              <option value="contestacion_ayuntamiento">Contestación ayuntamiento</option>
              <option value="prueba_externa">Prueba externa</option>
              <option value="recurso_presentado">Recurso presentado</option>
              <option value="multa_presentada">Multa presentada</option>
              <option value="autorizacion_presentada">Autorización presentada</option>
            </select>
            <input
              placeholder="Nota del documento (opcional)"
              value={externalNote}
              onChange={(e) => setExternalNote(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            />
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.docx,.xml"
              onChange={(e) => setExternalFile(e.target.files?.[0] || null)}
            />
          </div>

          <button
            className="sr-btn-primary mt-4"
            onClick={uploadExternalDocument}
            disabled={uploadingExternal}
          >
            {uploadingExternal ? "Adjuntando…" : "📎 Adjuntar documento externo"}
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

          <h3 className="sr-h3" style={{ marginTop: 22 }}>Documentación externa / procedimiento</h3>

          {externalDocs.length ? (
            externalDocs.map((d, i) => (
              <button
                key={`${d.id || d.kind}-external-${i}`}
                onClick={() => openDocument(d)}
                className="block w-full text-left border rounded p-3 mt-2 text-sm"
                style={{ background: "#f0fdf4", borderColor: "#bbf7d0" }}
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
                border: "1px dashed #bbf7d0",
                borderRadius: 12,
                color: "#166534",
                background: "#f0fdf4",
              }}
            >
              Todavía no hay documentación externa del procedimiento.
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
          <h3 className="sr-h3">🕒 Timeline jurídico</h3>

          {timelineEvents.length ? (
            timelineEvents.map((e, i) => (
              <div key={i} className="border rounded p-2 mt-2 text-xs">
                <strong>{eventLabel(e.type)}</strong>
                <div style={{ color: "#64748b" }}>{e.type}</div>
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
              Todavía no hay eventos visibles.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
