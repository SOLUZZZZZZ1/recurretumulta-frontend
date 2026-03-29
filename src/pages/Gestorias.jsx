import React, { useRef, useState, useEffect } from "react";
import Seo from "../components/Seo.jsx";
import { useNavigate } from "react-router-dom";

const API = "/api";

async function fetchJson(url, options = {}) {
  const r = await fetch(url, options);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.detail || "Error API");
  return data;
}

export default function Gestorias() {
  const nav = useNavigate();

  const [token, setToken] = useState(() => localStorage.getItem("partner_token") || "");
  const [partnerName, setPartnerName] = useState(() => localStorage.getItem("partner_name") || "");
  const authed = token && token.trim().length > 10;

  const mustChange = (localStorage.getItem("partner_must_change") || "0") === "1";

  const [email, setEmail] = useState(() => localStorage.getItem("partner_email") || "");
  const [password, setPassword] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [logging, setLogging] = useState(false);

  const inputRef = useRef(null);

  const [clientEmail, setClientEmail] = useState("");
  const [clientName, setClientName] = useState("");

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

  useEffect(() => {
    if (mustChange) nav("/partner/change-password");
  }, []);

  function logout() {
    localStorage.clear();
    setToken("");
    setPartnerName("");
  }

  async function login() {
    setLoginErr("");
    setLogging(true);
    try {
      const data = await fetchJson(`${API}/partner/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem("partner_token", data.token);
      localStorage.setItem("partner_name", data.partner_name || "");
      setToken(data.token);
      setPartnerName(data.partner_name || "");
      setPassword("");
    } catch (e) {
      setLoginErr(e.message);
    } finally {
      setLogging(false);
    }
  }

  function pickFiles() {
    inputRef.current?.click();
  }

  function onFilesSelected(list) {
    setFiles(Array.from(list || []).slice(0, 5));
  }

  async function submitCase() {
    setErr("");
    if (!clientEmail || !clientName || !nombre || !dni || !files.length || !confirm) {
      setErr("Completa todos los campos obligatorios");
      return;
    }

    const fd = new FormData();
    fd.append("client_email", clientEmail);
    fd.append("client_name", clientName);

    fd.append("interesado_json", JSON.stringify({
      nombre, dni, domicilio, localidad
    }));

    fd.append("confirm_client_informed", "true");
    files.forEach(f => fd.append("files", f));

    try {
      const r = await fetch(`${API}/partner/cases`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data.detail);

      setMsg("Expediente creado ✔");
    } catch (e) {
      setErr(e.message);
    }
  }

  if (!authed) {
    return (
      <main className="sr-container py-12">
        <h1>Acceso asesorías</h1>

        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email"/>
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password"/>

        <button onClick={login}>{logging ? "Entrando..." : "Entrar"}</button>

        {loginErr && <div style={{color:"red"}}>{loginErr}</div>}

        {/* 🔥 SOLICITAR ALTA */}
        <div style={{marginTop:20}}>
          <button onClick={()=>{
            window.location.href = "mailto:soporte@recurretumulta.eu?subject=Alta asesoría";
          }}>
            Solicitar alta
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="sr-container py-12">

      <h1>Portal asesorías</h1>

      <button onClick={()=>nav("/partner/panel")}>
        Ver mis expedientes
      </button>

      <button onClick={logout}>Salir</button>

      <h2>Subir expediente</h2>

      <input placeholder="Email cliente" onChange={e=>setClientEmail(e.target.value)}/>
      <input placeholder="Nombre cliente" onChange={e=>setClientName(e.target.value)}/>

      <input placeholder="Nombre interesado" onChange={e=>setNombre(e.target.value)}/>
      <input placeholder="DNI" onChange={e=>setDni(e.target.value)}/>
      <input placeholder="Domicilio" onChange={e=>setDomicilio(e.target.value)}/>
      <input placeholder="Localidad" onChange={e=>setLocalidad(e.target.value)}/>

      <input ref={inputRef} type="file" multiple style={{display:"none"}} onChange={e=>onFilesSelected(e.target.files)}/>

      <button onClick={pickFiles}>Añadir documentos</button>

      <label>
        <input type="checkbox" onChange={e=>setConfirm(e.target.checked)}/>
        Confirmo autorización
      </label>

      <button onClick={submitCase}>Enviar expediente</button>

      {msg && <div style={{color:"green"}}>{msg}</div>}
      {err && <div style={{color:"red"}}>{err}</div>}

    </main>
  );
}