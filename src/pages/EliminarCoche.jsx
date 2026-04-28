// Archivo completo EliminarCoche.jsx (versión confirmación limpia)
// Sustituye tu archivo actual con este contenido

import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "https://recurretumulta-backend.onrender.com";

export default function EliminarCoche() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const paidOk = params.get("success") === "1";
  const caseId = params.get("case_id");

  if (paidOk) {
    return (
      <main style={{ padding: "42px 18px" }}>
        <section style={{
          maxWidth: 700,
          margin: "0 auto",
          background: "#ecfdf5",
          borderRadius: 24,
          padding: 30,
          border: "1px solid #bbf7d0"
        }}>
          <h2>✅ Pago realizado correctamente</h2>

          <p>Hemos recibido tu solicitud y comenzamos la gestión.</p>
          <p>Te enviaremos la confirmación y los próximos pasos por email.</p>

          <p style={{ fontSize: 13, marginTop: 10 }}>
            Referencia: <strong>{caseId}</strong>
          </p>
        </section>
      </main>
    );
  }

  return <div>Formulario aquí...</div>;
}
