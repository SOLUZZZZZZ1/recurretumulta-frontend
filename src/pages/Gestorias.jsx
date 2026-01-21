import React, { useRef, useState } from "react";
import Seo from "../components/Seo.jsx";

const API = "/api";

async function fetchJson(url, options = {}) {
  const r = await fetch(url, options);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.detail || "Error API");
  return data;
}

export default function Gestorias() {
  const [token, setToken] = useState(() => localStorage.getItem("partner_token") || "");
  const [partnerName, setPartnerName] = useState(() => localStorage.getItem("partner_name") || "");
  const authed = token && token.trim().length > 10;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [logging, setLogging] = useState(false);

  const inputRef = useRef(null);
  const [clientEmail, setClientEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  function logout() {
    localStorage.removeItem("partner_token");
    localStorage.removeItem("partner_name");
    setToken("");
    setPartnerName("");
    setEmail("");
    setPassword("");
  }

  async function login() {
    setLoginErr("");
    setLogging(true);
    try {
      const data = await fetchJson(`${API}/partner/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("partner_token", data.token);
      localStorage.setItem("partner_name", data.partner_name || "");
      setToken(data.token);
      setPartnerName(data.partner_name || "");
      setEmail("");
      setPassword("");
    } catch (e) {
      setLoginErr(e.message || "No se pudo iniciar sesión");
    } finally {
      setLogging(false);
    }
  }

  function pickFiles() {
    inputRef.current?.click();
  }

  function onFilesSelected(list) {
    const arr = Array.from(list || []).slice(0, 5);
    setFiles(arr);
    setMsg("");
    setErr("");
  }

  async function submitCase() {
    setMsg("");
    setErr("");

    if (!clientEmail.trim()) return setErr("Email del cliente obligatorio.");
    if (!clientName.trim()) return setErr("Nombre y apellidos del cliente obligatorio.");
    if (!files.length) return setErr("Sube al menos un documento.");
    if (!confirm) return setErr("Debes confirmar que el cliente ha sido informado.");

    setSending(true);
    try {
      const fd = new FormData();
      fd.append("client_email", clientEmail.trim());
      fd.append("client_name", clientName.trim());
      if (note.trim()) fd.append("partner_note", note.trim());
      fd.append("confirm_client_informed", "true");
      files.forEach((f) => fd.append("files", f));

      const r = await fetch(`${API}/partner/cases`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data?.detail || "Error al enviar expediente");

      setMsg(`✅ Expediente enviado (case_id: ${data.case_id}). El cliente recibirá un email para autorizar.`);
      setClientEmail("");
      setClientName("");
      setNote("");
      setConfirm(false);
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";
    } catch (e) {
      setErr(e.message || "No se pudo enviar el expediente.");
    } finally {
      setSending(false);
    }
  }

  if (!authed) {
    return (
      <>
        <Seo title="Gestorías · RecurreTuMulta" description="Portal privado para gestorías y asesorías." canonical="https://www.recurretumulta.eu/gestorias" />
        <main className="sr-container py-12" style={{ minHeight: "calc(100vh - 160px)" }}>
          <h1 className="sr-h1 mb-4">Portal para gestorías y asesorías</h1>
          <div className="sr-card" style={{ maxWidth: 560 }}>
            <p className="sr-p" style={{ marginTop: 0 }}>
              Acceso privado para partners. Precio para gestorías: <b>20 € + IVA</b> por expediente.
            </p>
            <div style={{ display: "grid", gap: 10 }}>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" style={{ padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 12 }} />
              <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" type="password" style={{ padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 12 }} />
              {loginErr && <div className="sr-small" style={{ color: "#991b1b" }}>❌ {loginErr}</div>}
              <button className="sr-btn-primary" onClick={login} disabled={logging}>
                {logging ? "Entrando…" : "Entrar"}
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Seo title="Gestorías · RecurreTuMulta" description="Portal privado para gestorías y asesorías." canonical="https://www.recurretumulta.eu/gestorias" />
      <main className="sr-container py-12" style={{ minHeight: "calc(100vh - 160px)" }}>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <h1 className="sr-h1">Portal gestorías</h1>
          <div className="sr-small" style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span>Partner: <b>{partnerName || "—"}</b></span>
            <button className="sr-btn-secondary" onClick={logout}>Salir</button>
          </div>
        </div>

        <div className="sr-card">
          <h2 className="sr-h2" style={{ marginTop: 0 }}>Subir expediente de cliente</h2>

          <div className="sr-card" style={{ background: "rgba(255,255,255,0.7)" }}>
            <div className="sr-small" style={{ fontWeight: 800 }}>Datos del cliente (autorizante)</div>
            <p className="sr-small" style={{ color: "#6b7280", marginTop: 6 }}>
              El cliente recibirá un email para autorizar expresamente la tramitación por RecurreTuMulta.
            </p>

            <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
              <input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="Email del cliente" style={{ padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 12 }} />
              <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nombre y apellidos del cliente" style={{ padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 12 }} />
            </div>
          </div>

          <div className="sr-card" style={{ marginTop: 12, background: "rgba(255,255,255,0.7)" }}>
            <div className="sr-small" style={{ fontWeight: 800 }}>Documento sancionador</div>

            <input ref={inputRef} type="file" multiple accept="application/pdf,image/*" style={{ display: "none" }} onChange={(e) => onFilesSelected(e.target.files)} />

            <div className="sr-cta-row" style={{ justifyContent: "flex-start", marginTop: 10 }}>
              <button className="sr-btn-primary" type="button" onClick={pickFiles}>
                Añadir documentos (máx. 5)
              </button>

              {files.length > 0 && (
                <span className="sr-small" style={{ color: "#6b7280" }}>
                  {files.length} archivo(s) seleccionado(s)
                </span>
              )}
            </div>

            {files.length > 0 && (
              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                {files.map((f, idx) => (<div key={idx} className="sr-small">• {f.name}</div>))}
              </div>
            )}
          </div>

          <div className="sr-card" style={{ marginTop: 12, background: "rgba(255,255,255,0.7)" }}>
            <div className="sr-small" style={{ fontWeight: 800 }}>Observaciones internas (opcional)</div>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej.: cliente habitual / urgente / relacionado con otro expediente…" style={{ marginTop: 8, width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 12 }} />
            <div className="sr-small" style={{ marginTop: 8, color: "#6b7280" }}>
              Estas notas no se envían al cliente ni a la Administración.
            </div>
          </div>

          <div className="sr-card" style={{ marginTop: 12, background: "rgba(255,255,255,0.7)" }}>
            <label className="sr-small" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} style={{ marginTop: 3 }} />
              <span>
                Confirmo que el cliente ha sido informado de que RecurreTuMulta gestionará la tramitación administrativa
                de su expediente y que recibirá un email para autorizar expresamente dicha tramitación.
              </span>
            </label>
          </div>

          {err && <div className="sr-small" style={{ marginTop: 12, color: "#991b1b" }}>❌ {err}</div>}
          {msg && <div className="sr-small" style={{ marginTop: 12, color: "#166534" }}>{msg}</div>}

          <div className="sr-cta-row" style={{ justifyContent: "flex-start", marginTop: 14 }}>
            <button className="sr-btn-primary" onClick={submitCase} disabled={sending}>
              {sending ? "Enviando…" : "Enviar expediente"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
