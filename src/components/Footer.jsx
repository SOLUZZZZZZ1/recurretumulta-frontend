import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      className="mt-12"
      style={{
        background: "#0f172a",
        color: "white",
        padding: "28px 0",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        className="sr-container"
        style={{
          display: "grid",
          gap: 20,
          gridTemplateColumns: "repeat(2, minmax(0,1fr))",
        }}
      >
        {/* RECURRE TU MULTA */}
        <div>
          <h4 style={{ marginBottom: 8, fontSize: 16, fontWeight: 800 }}>
            RecurreTuMulta
          </h4>
          <ul style={{ listStyle: "none", padding: 0, lineHeight: 1.9 }}>
            <li><Link to="/" style={{ color: "#e5e7eb" }}>Inicio</Link></li>
            <li><Link to="/como-funciona" style={{ color: "#e5e7eb" }}>Cómo funciona</Link></li>
            <li><Link to="/precios" style={{ color: "#e5e7eb" }}>Precios</Link></li>
            <li><Link to="/contacto" style={{ color: "#e5e7eb" }}>Contacto</Link></li>
          </ul>
        </div>

        {/* LEGAL */}
        <div>
          <h4 style={{ marginBottom: 8, fontSize: 16, fontWeight: 800 }}>
            Legal
          </h4>
          <ul style={{ listStyle: "none", padding: 0, lineHeight: 1.9 }}>
            <li><Link to="/aviso-legal" style={{ color: "#e5e7eb" }}>Aviso legal</Link></li>
            <li><Link to="/privacidad" style={{ color: "#e5e7eb" }}>Privacidad</Link></li>
            <li><Link to="/cookies" style={{ color: "#e5e7eb" }}>Cookies</Link></li>
          </ul>
        </div>
      </div>

      <div
        className="sr-container"
        style={{
          marginTop: 20,
          fontSize: 12,
          opacity: 0.9,
          textAlign: "center",
          lineHeight: 1.7,
        }}
      >
        © {new Date().getFullYear()} RecurreTuMulta · Asistencia automatizada en trámites administrativos  
        <br />
        Este sitio no presta asesoramiento jurídico ni garantiza resultados.
        <br />
        www.recurretumulta.eu
      </div>
    </footer>
  );
}
