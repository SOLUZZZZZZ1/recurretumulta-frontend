import React, { useState } from "react";

const API = "/api";

export default function SolicitarAltaGestoria() {
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState("");

  function setField(k, v) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function enviar() {
    try {
      await fetch(`${API}/partner/signup`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(form)
      });

      setMsg("Solicitud enviada correctamente ✔");
    } catch {
      setMsg("Error al enviar solicitud");
    }
  }

  return (
    <div className="sr-container py-12">
      <h1>Alta asesorías</h1>

      <input placeholder="Empresa" onChange={e=>setField("empresa",e.target.value)} />
      <input placeholder="Contacto" onChange={e=>setField("contacto",e.target.value)} />
      <input placeholder="Email" onChange={e=>setField("email",e.target.value)} />
      <input placeholder="Teléfono" onChange={e=>setField("telefono",e.target.value)} />
      <input placeholder="Provincia" onChange={e=>setField("provincia",e.target.value)} />
      <input placeholder="Expedientes/mes" onChange={e=>setField("volumen",e.target.value)} />

      <textarea placeholder="Mensaje" onChange={e=>setField("mensaje",e.target.value)} />

      <button onClick={enviar}>Solicitar alta</button>

      {msg && <div>{msg}</div>}
    </div>
  );
}