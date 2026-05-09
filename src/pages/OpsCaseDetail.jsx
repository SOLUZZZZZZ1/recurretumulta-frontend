import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

const DIRECT_BACKEND = "https://recurretumulta-backend.onrender.com";

const API_CANDIDATES = [
  "/api",
  import.meta.env.VITE_API_BASE_URL,
  import.meta.env.VITE_API_URL,
  DIRECT_BACKEND,
].filter(Boolean);

const EXTERNAL_KINDS = [
  { value: "justificante_presentacion", label: "Justificante de presentación" },
  { value: "instancia_firmada", label: "Instancia firmada" },
  { value: "csv_registro", label: "CSV / registro" },
  { value: "resolucion", label: "Resolución" },
  { value: "requerimiento", label: "Requerimiento" },
  { value: "contestacion_ayuntamiento", label: "Contestación del Ayuntamiento" },
  { value: "prueba_externa", label: "Prueba externa" },
  { value: "recurso_presentado", label: "Recurso presentado" },
  { value: "multa_presentada", label: "Multa presentada" },
  { value: "autorizacion_presentada", label: "Autorización presentada" },
  { value: "documento_externo", label: "Documento externo" },
];

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

function safeText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function prettyBytes(size) {
  const n = Number(size || 0);
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
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
  if (k.includes("authorization") || k.includes("autorizacion")) return "Autorización";
  if (k.includes("submission_receipt")) return "Justificante de presentación";
  if (k.includes("justificante")) return "Justificante de presentación";
  if (k.includes("instancia")) return "Instancia firmada";
  if (k.includes("resolucion")) return "Resolución";
  if (k.includes("requerimiento")) return "Requerimiento";
  if (k.includes("contestacion")) return "Contestación";
  if (k.includes("prueba")) return "Prueba externa";
  if (k.includes("original")) return "Documento original";
  if (k.includes("recurso_pdf")) return "Recurso PDF";
  if (k.includes("recurso_docx")) return "Recurso Word";
  if (k.includes("generated") && k.includes("pdf")) return "Recurso PDF";
  if (k.includes("generated") && k.includes("docx")) return "Recurso Word";
  if (k.includes("recurso")) return "Recurso";
  if (k.includes("multa")) return "Multa";
  if (k.includes("csv")) return "CSV / registro";
  if (k.includes("pdf")) return "PDF";
  if (k.includes("docx")) return "Word";

  return kind || "Documento";
}

function docGroup(kind = "") {
  const k = String(kind || "").toLowerCase();
  if (k.includes("recurso") || k.includes("generated")) return "resource";
  if (k.includes("justificante") || k.includes("instancia") || k.includes("csv") || k.includes("resolucion") || k.includes("requerimiento") || k.includes("contestacion")) return "external";
  return "other";
}

function isResource(kind = "") {
  return docGroup(kind) === "resource";
}

function isExternal(kind = "") {
  return docGroup(kind) === "external";
}

function eventLabel(type = "") {
  const t = String(type || "").toLowerCase();
  if (t.includes("manual_submission_registered")) return "📌 Presentación manual registrada";
  if (t.includes("external_document_uploaded")) return "📎 Documento externo adjuntado";
  if (t.includes("justificante_uploaded")) return "📄 Justificante subido";
  if (t.includes("paid")) return "💳 Pago confirmado";
  if (t.includes("checkout")) return "💳 Pago iniciado";
  if (t.includes("authorized")) return "✍️ Autorización";
  if (t.includes("resource_generated") || t.includes("generated")) return "🧾 Recurso generado";
  if (t.includes("submitted")) return "✅ Presentado";
  if (t.includes("review")) return "🔎 Revisión";
  if (t.includes("note")) return "📝 Nota";
  return type || "Evento";
}

function Card({ children, className = "", style = {} }) {
  return (
    <div className={`sr-card ${className}`} style={style}>
      {children}
    </div>
  );
}

function StatusBox({ msg, debug }) {
  if (!msg && !debug) return null;

  return (
    <>
      {msg ? (
        <Card
          className="mt-4"
          style={{
            color: msg.startsWith("✅") ? "#166534" : "#991b1b",
            background: msg.startsWith("✅") ? "#ecfdf5" : "#fef2f2",
            border: msg.startsWith("✅") ? "1px solid #bbf7d0" : "1px solid #fecaca",
            fontWeight: 900,
          }}
        >
          {msg}
        </Card>
      ) : null}

      {debug ? (
        <Card
          className="mt-4"
          style={{
            color: "#475569",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            fontSize: 12,
            wordBreak: "break-word",
          }}
        >
          Detalle: {debug}
        </Card>
      ) : null}
    </>
  );
}

function DocumentRow({ doc, onOpen }) {
  return (
    <button
      onClick={() => onOpen(doc)}
      className="block w-full text-left border rounded p-3 mt-2 text-sm"
      style={{ background: "#f8fafc" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div style={{ minWidth: 0 }}>
          <strong>{docLabel(doc.kind)}</strong>
          <div style={{ color: "#64748b", marginTop: 3 }}>{fmt(doc.created_at)}</div>
          <div style={{ color: "#64748b", marginTop: 3, fontSize: 12 }}>
            {doc.mime || "application/octet-stream"} {doc.size_bytes ? `· ${prettyBytes(doc.size_bytes)}` : ""}
          </div>
          <div style={{ color: "#94a3b8", marginTop: 3, wordBreak: "break-word", fontSize: 11 }}>
            {doc.key || doc.b2_key || doc.id}
          </div>
        </div>
        <span className="sr-btn-secondary" style={{ whiteSpace: "nowrap" }}>
          Descargar
        </span>
      </div>
    </button>
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

  const [manualOrganismo, setManualOrganismo] = useState("Ajuntament / organismo");
  const [manualRegistro, setManualRegistro] = useState("");
  const [manualCsv, setManualCsv] = useState("");
  const [manualDate, setManualDate] = useState("");
  const [manualChannel, setManualChannel] = useState("ayuntamiento_manual");
  const [manualNote, setManualNote] = useState("");
  const [manualFile, setManualFile] = useState(null);
  const [manualSubmitting, setManualSubmitting] = useState(false);

  const [externalKind, setExternalKind] = useState("documento_externo");
  const [externalNote, setExternalNote] = useState("");
  const [externalFile, setExternalFile] = useState(null);
  const [externalUploading, setExternalUploading] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const resourceDocs = useMemo(() => docs.filter((d) => isResource(d.kind)), [docs]);
  const externalDocs = useMemo(() => docs.filter((d) => isExternal(d.kind)), [docs]);
  const otherDocs = useMemo(() => docs.filter((d) => !isResource(d.kind) && !isExternal(d.kind)), [docs]);

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
            // probar siguiente base
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
    if (!manualOrganismo.trim()) {
      setMsg("❌ Indica el organismo.");
      return;
    }
    if (!manualRegistro.trim()) {
      setMsg("❌ Indica el número de registro.");
      return;
    }

    setManualSubmitting(true);
    setMsg("");
    setDebug("");

    try {
      const fd = new FormData();
      fd.append("organismo", manualOrganismo.trim());
      fd.append("registro", manualRegistro.trim());
      if (manualCsv.trim()) fd.append("csv", manualCsv.trim());
      if (manualDate.trim()) fd.append("submitted_at", manualDate.trim());
      if (manualChannel.trim()) fd.append("channel", manualChannel.trim());
      if (manualNote.trim()) fd.append("note", manualNote.trim());
      if (manualFile) fd.append("file", manualFile);

      await fetchJsonFallback(`/ops/cases/${caseId}/register-manual-submission`, {
        method: "POST",
        headers,
        body: fd,
      });

      setMsg("✅ Presentación manual registrada en el expediente.");
      setManualRegistro("");
      setManualCsv("");
      setManualDate("");
      setManualNote("");
      setManualFile(null);
      await load();
    } catch (err) {
      setMsg("❌ No se pudo registrar la presentación manual.");
      setDebug(err?.message || "");
    } finally {
      setManualSubmitting(false);
    }
  }

  async function uploadExternalDocument() {
    if (!externalFile) {
      setMsg("❌ Selecciona un documento externo.");
      return;
    }

    setExternalUploading(true);
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
      setExternalUploading(false);
    }
  }

  return (
    <div className="sr-container py-8">
      <Link to="/ops" className="sr-btn-secondary">
        ← Volver al panel
      </Link>

      <h1 className="sr-h2 mt-4">Expediente {caseId}</h1>

      <Card
        className="mt-4"
        style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
      >
        <h3 className="sr-h3" style={{ marginTop: 0 }}>
          🟡 Revisión manual obligatoria
        </h3>
        <p className="sr-p" style={{ marginBottom: 0 }}>
          Revisa datos, plazos, organismo, hecho denunciado, recurso generado y canal de presentación.
          Para ayuntamientos, usa presentación manual asistida y registra el justificante aquí.
        </p>
      </Card>

      <Card className="mt-4">
        <h3 className="sr-h3">Acciones rápidas</h3>

        <div className="grid md:grid-cols-2 gap-3 mt-3">
          <input
            placeholder="Número de registro automático/manual (opcional)"
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
            Marcar como presentado automático
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
      </Card>

      <StatusBox msg={msg} debug={debug} />

      <Card className="mt-4" style={{ border: "1px solid #bbf7d0", background: "#f0fdf4" }}>
        <h3 className="sr-h3" style={{ marginTop: 0 }}>📌 Registrar presentación manual</h3>
        <p className="sr-p">
          Para ayuntamientos o presentaciones hechas fuera de OPS. Guarda el registro, CSV y justificante sin pasar por submitters.
        </p>

        <div className="grid md:grid-cols-2 gap-3 mt-3">
          <input
            placeholder="Organismo: Ajuntament de Terrassa"
            value={manualOrganismo}
            onChange={(e) => setManualOrganismo(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          />
          <input
            placeholder="Número registro: E-AJT-..."
            value={manualRegistro}
            onChange={(e) => setManualRegistro(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          />
          <input
            placeholder="CSV / código verificación"
            value={manualCsv}
            onChange={(e) => setManualCsv(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          />
          <input
            placeholder="Fecha/hora presentación: 2026-05-07 10:43"
            value={manualDate}
            onChange={(e) => setManualDate(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          />
          <input
            placeholder="Canal"
            value={manualChannel}
            onChange={(e) => setManualChannel(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          />
          <input
            placeholder="Nota interna"
            value={manualNote}
            onChange={(e) => setManualNote(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-3 flex-wrap items-center mt-4">
          <input
            type="file"
            onChange={(e) => setManualFile(e.target.files?.[0] || null)}
          />
          <button
            className="sr-btn-primary"
            onClick={registerManualSubmission}
            disabled={manualSubmitting}
          >
            {manualSubmitting ? "Registrando…" : "Registrar presentación manual"}
          </button>
        </div>
      </Card>

      <Card className="mt-4" style={{ border: "1px solid #bfdbfe", background: "#eff6ff" }}>
        <h3 className="sr-h3" style={{ marginTop: 0 }}>📎 Adjuntar documentación externa</h3>
        <p className="sr-p">
          Añade resoluciones, requerimientos, instancias, justificantes, contestaciones o pruebas externas al expediente.
        </p>

        <div className="grid md:grid-cols-2 gap-3 mt-3">
          <select
            value={externalKind}
            onChange={(e) => setExternalKind(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            {EXTERNAL_KINDS.map((k) => (
              <option key={k.value} value={k.value}>{k.label}</option>
            ))}
          </select>
          <input
            placeholder="Nota del documento (opcional)"
            value={externalNote}
            onChange={(e) => setExternalNote(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-3 flex-wrap items-center mt-4">
          <input
            type="file"
            onChange={(e) => setExternalFile(e.target.files?.[0] || null)}
          />
          <button
            className="sr-btn-primary"
            onClick={uploadExternalDocument}
            disabled={externalUploading}
          >
            {externalUploading ? "Adjuntando…" : "Adjuntar documento externo"}
          </button>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <Card>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="sr-h3">📂 Documentos del expediente</h3>
            <button className="sr-btn-secondary" onClick={load} disabled={loading}>
              {loading ? "Cargando…" : "Refrescar"}
            </button>
          </div>

          <h4 className="font-bold mt-4">Recursos generados</h4>
          {resourceDocs.length ? (
            resourceDocs.map((d, i) => (
              <DocumentRow key={`${d.id || d.kind}-${i}`} doc={d} onOpen={openDocument} />
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

          <h4 className="font-bold mt-5">Documentación externa / presentación</h4>
          {externalDocs.length ? (
            externalDocs.map((d, i) => (
              <DocumentRow key={`${d.id || d.kind}-external-${i}`} doc={d} onOpen={openDocument} />
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
              No hay documentación externa todavía.
            </div>
          )}

          <h4 className="font-bold mt-5">Otros documentos</h4>
          {otherDocs.length ? (
            otherDocs.map((d, i) => (
              <DocumentRow key={`${d.id || d.kind}-other-${i}`} doc={d} onOpen={openDocument} />
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
        </Card>

        <Card>
          <h3 className="sr-h3">🕒 Timeline jurídico</h3>

          {events.length ? (
            events.map((e, i) => (
              <div key={i} className="border rounded p-2 mt-2 text-xs">
                <strong>{eventLabel(e.type)}</strong>
                <div style={{ color: "#64748b", marginTop: 3 }}>{fmt(e.created_at)}</div>
                <div style={{ color: "#334155", marginTop: 3 }}>{e.type}</div>
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
        </Card>
      </div>
    </div>
  );
}
