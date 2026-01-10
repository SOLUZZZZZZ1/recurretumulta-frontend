import React, { useEffect, useMemo, useState } from "react";

/**
 * Panel Operador — RecurreTuMulta
 * Requiere backend:
 *  - GET  /ops/queue?status=ready_to_submit
 *  - POST /ops/cases/{case_id}/mark-submitted (FormData)
 *  - POST /ops/cases/{case_id}/upload-justificante (multipart)
 *  - GET  /files/presign?case_id=...&bucket=...&key=...
 *
 * Recomendado (si lo tienes ya): GET /cases/{case_id}/documents
 * Si no lo tienes, abajo te doy alternativa para añadirlo rápido en backend.
 */

const API_BASE = import.meta.env.VITE_API_URL || ""; // ej: https://recurretumulta-backend.onrender.com

function cls(...parts) {
  return parts.filter(Boolean).join(" ");
}

function formatDate(d) {
  if (!d) return "";
  try {
    const dt = new Date(d);
    return dt.toLocaleString();
  } catch {
    return String(d);
  }
}

async function apiFetch(path, { method = "GET", token, headers, body } = {}) {
  const h = {
    ...(headers || {}),
  };
  if (token) h["X-Operator-Token"] = token;

  const res = await fetch(`${API_BASE}${path}`, { method, headers: h, body });
  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const msg =
      (payload && payload.detail && (typeof payload.detail === "string" ? payload.detail : payload.detail.message)) ||
      (typeof payload === "string" ? payload : "Error");
    const err = new Error(msg);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return payload;
}

export default function OpsDashboard() {
  const [token, setToken] = useState(() => localStorage.getItem("ops_token") || "");
  const [tokenInput, setTokenInput] = useState(token || "");

  const [status, setStatus] = useState("ready_to_submit");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsErr, setDocsErr] = useState("");

  // Submit form
  const [submitChannel, setSubmitChannel] = useState("DGT");
  const [submitRegistro, setSubmitRegistro] = useState("");
  const [submitNote, setSubmitNote] = useState("");

  // Justificante upload
  const [justFile, setJustFile] = useState(null);
  const [justKind, setJustKind] = useState("justificante_presentacion");
  const [justUploading, setJustUploading] = useState(false);

  const authed = useMemo(() => Boolean(token && token.trim().length >= 10), [token]);

  async function loadQueue() {
    setErr("");
    setLoading(true);
    try {
      const data = await apiFetch(`/ops/queue?status=${encodeURIComponent(status)}`, { token });
      setItems(data.items || []);
    } catch (e) {
      setErr(`${e.message}${e.status ? ` (HTTP ${e.status})` : ""}`);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadDocuments(caseId) {
    setDocsErr("");
    setDocsLoading(true);
    setDocs([]);
    try {
      // ✅ Opción ideal (recomendada): endpoint backend que liste documents por case_id
      // Si aún no existe, mira al final de este mensaje para añadirlo en 20 líneas.
      const data = await apiFetch(`/cases/${encodeURIComponent(caseId)}/documents`, { token });
      setDocs(data.items || []);
    } catch (e) {
      setDocsErr(
        `No se pudieron cargar documentos: ${e.message}${e.status ? ` (HTTP ${e.status})` : ""}. ` +
          `Si no tienes el endpoint /cases/{case_id}/documents, te lo dejo abajo para añadirlo.`
      );
      setDocs([]);
    } finally {
      setDocsLoading(false);
    }
  }

  async function downloadDoc(doc) {
    // doc: {bucket,key,case_id}
    try {
      const q = new URLSearchParams({
        case_id: selectedCaseId,
        bucket: doc.b2_bucket || doc.bucket,
        key: doc.b2_key || doc.key,
        expires: "900",
      }).toString();

      const data = await apiFetch(`/files/presign?${q}`, { token: null }); // presign NO requiere token operador
      const url = data.url;
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      alert(`No se pudo descargar: ${e.message}${e.status ? ` (HTTP ${e.status})` : ""}`);
    }
  }

  async function markSubmitted() {
    if (!selectedCaseId) return;
    setErr("");
    try {
      const fd = new FormData();
      fd.append("channel", submitChannel || "DGT");
      if (submitRegistro) fd.append("registro", submitRegistro);
      if (submitNote) fd.append("note", submitNote);

      await apiFetch(`/ops/cases/${encodeURIComponent(selectedCaseId)}/mark-submitted`, {
        method: "POST",
        token,
        body: fd,
      });

      // refresh queue + set status to submitted to verify
      await loadQueue();
      setSubmitRegistro("");
      setSubmitNote("");
      alert("✅ Caso marcado como PRESENTADO.");
    } catch (e) {
      alert(`Error marcando presentado: ${e.message}${e.status ? ` (HTTP ${e.status})` : ""}`);
    }
  }

  async function uploadJustificante() {
    if (!selectedCaseId) return alert("Selecciona un case_id");
    if (!justFile) return alert("Selecciona un archivo");

    setJustUploading(true);
    try {
      const fd = new FormData();
      fd.append("kind", justKind || "justificante_presentacion");
      fd.append("file", justFile);

      await apiFetch(`/ops/cases/${encodeURIComponent(selectedCaseId)}/upload-justificante`, {
        method: "POST",
        token,
        body: fd,
      });

      setJustFile(null);
      // refrescar docs
      await loadDocuments(selectedCaseId);
      alert("✅ Justificante subido y registrado.");
    } catch (e) {
      alert(`Error subiendo justificante: ${e.message}${e.status ? ` (HTTP ${e.status})` : ""}`);
    } finally {
      setJustUploading(false);
    }
  }

  useEffect(() => {
    if (authed) loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, status]);

  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-xl rounded-2xl bg-white shadow p-6">
          <h1 className="text-2xl font-semibold">Panel Operador</h1>
          <p className="mt-2 text-sm text-gray-600">
            Introduce el <span className="font-mono">OPERATOR_TOKEN</span> (header{" "}
            <span className="font-mono">X-Operator-Token</span>).
          </p>

          <div className="mt-4">
            <label className="text-sm font-medium">Token</label>
            <input
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Pega aquí el token..."
              className="mt-2 w-full rounded-xl border px-3 py-2 font-mono text-sm"
            />
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                const t = (tokenInput || "").trim();
                if (t.length < 10) return alert("Token demasiado corto");
                setToken(t);
                localStorage.setItem("ops_token", t);
              }}
              className="rounded-xl bg-black px-4 py-2 text-white text-sm"
            >
              Entrar
            </button>
            <button
              onClick={() => {
                setTokenInput("");
                setToken("");
                localStorage.removeItem("ops_token");
              }}
              className="rounded-xl border px-4 py-2 text-sm"
            >
              Limpiar
            </button>
          </div>

          <div className="mt-6 text-xs text-gray-500">
            Configura <span className="font-mono">VITE_API_URL</span> apuntando al backend (Render).
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Panel Operador</h1>
            <p className="text-sm text-gray-600 mt-1">
              Cola y presentación manual asistida. Token activo en localStorage.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                localStorage.removeItem("ops_token");
                setToken("");
                setTokenInput("");
              }}
              className="rounded-xl border px-4 py-2 text-sm bg-white"
            >
              Salir
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white shadow p-4">
            <div className="text-sm font-medium">Estado cola</div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
            >
              <option value="ready_to_submit">ready_to_submit</option>
              <option value="submitted">submitted</option>
              <option value="generated">generated</option>
              <option value="paid">paid</option>
            </select>

            <button
              onClick={loadQueue}
              disabled={loading}
              className={cls(
                "mt-3 w-full rounded-xl px-4 py-2 text-sm",
                loading ? "bg-gray-200" : "bg-black text-white"
              )}
            >
              {loading ? "Cargando..." : "Refrescar cola"}
            </button>

            {err && <div className="mt-3 text-sm text-red-600">{err}</div>}
          </div>

          <div className="rounded-2xl bg-white shadow p-4 md:col-span-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Casos ({items.length})</div>
              <div className="text-xs text-gray-500">API: {API_BASE || "(VITE_API_URL vacío)"}</div>
            </div>

            <div className="mt-3 overflow-auto border rounded-xl">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="text-left p-2">case_id</th>
                    <th className="text-left p-2">status</th>
                    <th className="text-left p-2">payment</th>
                    <th className="text-left p-2">product</th>
                    <th className="text-left p-2">email</th>
                    <th className="text-left p-2">updated</th>
                    <th className="text-left p-2">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.case_id} className={cls("border-t", selectedCaseId === it.case_id && "bg-gray-50")}>
                      <td className="p-2 font-mono text-xs">{it.case_id}</td>
                      <td className="p-2">{it.status}</td>
                      <td className="p-2">{it.payment_status}</td>
                      <td className="p-2">{it.product_code || "-"}</td>
                      <td className="p-2">{it.contact_email || "-"}</td>
                      <td className="p-2">{formatDate(it.updated_at)}</td>
                      <td className="p-2">
                        <button
                          onClick={() => {
                            setSelectedCaseId(it.case_id);
                            loadDocuments(it.case_id);
                          }}
                          className="rounded-lg border px-3 py-1 text-xs bg-white"
                        >
                          Abrir
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!items.length && (
                    <tr>
                      <td className="p-3 text-gray-500" colSpan={7}>
                        No hay casos en este estado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Case detail */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-2xl bg
