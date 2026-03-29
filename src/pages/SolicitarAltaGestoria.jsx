import React, { useState } from "react";

export default function SolicitarAltaGestoria() {
  const [form, setForm] = useState({
    empresa: "",
    contacto: "",
    email: "",
    telefono: "",
    provincia: "",
    volumen: "",
    mensaje: "",
  });

  function setField(k, v) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function enviar() {
    const body = `
Empresa: ${form.empresa}
Contacto: ${form.contacto}
Email: ${form.email}
Teléfono: ${form.telefono}
Provincia: ${form.provincia}
Volumen: ${form.volumen}

Mensaje:
${form.mensaje}
    `;

    window.location.href =
      "mailto:soporte@recurretumulta.eu?subject=Alta asesoría&body=" +
      encodeURIComponent(body);
  }

  return (
    <div className="sr-container py-12">
      <h1 className="sr-h1">Solicitud de alta asesorías</h1>

      <div className="sr-card" style={{ maxWidth: 600 }}>
        <input placeholder="Nombre de la asesoría" onChange={(e)=>setField("empresa",e.target.value)} />
        <input placeholder="Persona de contacto" onChange={(e)=>setField("contacto",e.target.value)} />
        <input placeholder="Email" onChange={(e)=>setField("email",e.target.value)} />
        <input placeholder="Teléfono" onChange={(e)=>setField("telefono",e.target.value)} />
        <input placeholder="Provincia" onChange={(e)=>setField("provincia",e.target.value)} />
        <input placeholder="Expedientes/mes" onChange={(e)=>setField("volumen",e.target.value)} />

        <textarea placeholder="Mensaje" onChange={(e)=>setField("mensaje",e.target.value)} />

        <button className="sr-btn-primary mt-4" onClick={enviar}>
          Solicitar alta
        </button>
      </div>
    </div>
  );
}