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

  // Cliente (contacto)
  const [clientEmail, setClientEmail] = useState("");
  const [clientName, setClientName] = useState("");

  // Interesado (para el recurso)
  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [domicilio, setDomicilio] = useState("");
  const [localidad, setLocalidad] = useState("");

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
    if (!clientName.trim()) return setErr("Nombre del cliente obligatorio.");
    if (!nombre.trim()) return setErr("Nombre del interesado obligatorio.");
    if (!dni.trim()) return setErr("DNI/NIE del interesado obligatorio.");
    if (!files.length) return setErr("Sube al menos un documento.");
    if (!confirm) return setErr("Debes confirmar que el cliente ha sido informado.");

    const interesado = {
      nombre: nombre.trim(),
      dni: dni.trim(),
      domicilio: domicilio.trim(),
      localidad: localidad.trim(),
    };

    setSending(true);
    try {
      const fd = new FormData();
      fd.append("client_email", clientEmail.trim());
      fd.append("client_name", clientName.trim());
      fd.append("interesado_json", JSON.stringify(interesado));
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

      setMsg(`✅ Expediente enviado (case_id: ${data.case_id}).`);
      setClientEmail("");
      setClientName("");
      setNombre("");
      setDni("");
      setDomicilio("");
      setLocalidad("");
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
        <Seo title="Asesorías · RecurreTuMulta" description="Acceso profesional para asesorías y gestorías." />
        <main className="sr-container py-12">
          <h1 className="sr-h1 mb-4">Acceso profesional para asesorías</h1>
          <div className="sr-card" style={{ maxWidth: 560 }}>
            <p className="sr-p">
              Portal B2B · <b>Facturación mensual</b> · <b>20 € + IVA</b> por expediente estándar.
            </p>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" type="password" />
            {loginErr && <div className="sr-small" style={{ color: "#991b1b" }}>❌ {loginErr}</div>}
            <button className="sr-btn-primary" onClick={login} disabled={logging}>
              {logging ? "Entrando…" : "Entrar"}
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Seo title="Asesorías · RecurreTuMulta" description="Portal profesional para asesorías." />
      <main className="sr-container py-12">
        <div className="flex items-center justify-between mb-4">
          <h1 className="sr-h1">Portal asesorías</h1>
          <div className="sr-small">
            Partner: <b>{partnerName || "—"}</b>{" "}
            <button className="sr-btn-secondary" onClick={logout}>Salir</button>
          </div>
        </div>

        <div className="sr-card">
          <h2 className="sr-h2">Subir expediente</h2>

          <h3 className="sr-h3">Datos del cliente</h3>
          <input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="Email del cliente" />
          <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Nombre del cliente" />

          <h3 className="sr-h3" style={{ marginTop: 12 }}>Datos del interesado</h3>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre y apellidos" />
          <input value={dni} onChange={(e) => setDni(e.target.value)} placeholder="DNI / NIE" />
          <input value={domicilio} onChange={(e) => setDomicilio(e.target.value)} placeholder="Domicilio" />
          <input value={localidad} onChange={(e) => setLocalidad(e.target.value)} placeholder="Localidad" />

          <h3 className="sr-h3" style={{ marginTop: 12 }}>Documentos</h3>
          <input ref={inputRef} type="file" multiple accept="application/pdf,image/*" style={{ display: "none" }} onChange={(e) => onFilesSelected(e.target.files)} />
          <button className="sr-btn-primary" type="button" onClick={pickFiles}>Añadir documentos (máx. 5)</button>
          {files.length > 0 && files.map((f, i) => <div key={i} className="sr-small">• {f.name}</div>)}

          <h3 className="sr-h3" style={{ marginTop: 12 }}>Observaciones internas</h3>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota interna (opcional)" />

          <label className="sr-small" style={{ display: "block", marginTop: 12 }}>
            <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />{" "}
            Confirmo que el cliente ha sido informado y autoriza la tramitación.
          </label>

          {err && <div className="sr-small" style={{ color: "#991b1b" }}>❌ {err}</div>}
          {msg && <div className="sr-small" style={{ color: "#166534" }}>{msg}</div>}

          <button className="sr-btn-primary" onClick={submitCase} disabled={sending}>
            {sending ? "Enviando…" : "Enviar expediente"}
          </button>
        </div>
      </main>
    </>
  );
}
