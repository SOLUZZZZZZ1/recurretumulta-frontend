import React from "react";
import Seo from "../components/Seo.jsx";
import { Link } from "react-router-dom";

export default function Precios() {
  return (
    <>
      <Seo
        title="Precios · RecurreTuMulta"
        description="Servicio completo de análisis, preparación y presentación de recurso de multa en tu nombre."
        canonical="https://www.recurretumulta.eu/precios"
      />

      <main className="sr-container py-12">
        <h1 className="sr-h1" style={{ textAlign: "center" }}>
          Servicio completo para recurrir tu multa
        </h1>

        <p className="sr-p" style={{ textAlign: "center", maxWidth: 760, margin: "12px auto 32px" }}>
          No vendemos plantillas ni recursos descargables. Nos encargamos del proceso:
          análisis, preparación del recurso, presentación en tu nombre y justificante oficial.
        </p>

        <div className="sr-card" style={{ maxWidth: 720, margin: "0 auto", border: "2px solid #111827" }}>
          <div className="sr-small" style={{ fontWeight: 800, color: "#166534", marginBottom: 8 }}>
            SERVICIO RECOMENDADO
          </div>

          <h2 className="sr-h2" style={{ marginTop: 0 }}>
            Gestión completa
          </h2>

          <div style={{ fontSize: 38, fontWeight: 900, margin: "8px 0" }}>
            49€
          </div>

          <p className="sr-small" style={{ color: "#6b7280", marginBottom: 18 }}>
            Pago único. Sin suscripciones. IVA no incluido si corresponde.
          </p>

          <ul className="sr-p" style={{ lineHeight: 1.9, paddingLeft: 20 }}>
            <li>Análisis completo de la multa o expediente.</li>
            <li>Detección de errores, defectos de prueba o problemas de motivación.</li>
            <li>Preparación del recurso adaptado al caso.</li>
            <li>Presentación del recurso en tu nombre con autorización previa.</li>
            <li>Justificante oficial de presentación.</li>
          </ul>

          <div className="sr-cta-row" style={{ justifyContent: "center", marginTop: 22 }}>
            <Link to="/" className="sr-btn-primary">
              Subir multa ahora
            </Link>
          </div>
        </div>

        <div className="sr-card" style={{ marginTop: 24, background: "#f9fafb" }}>
          <h2 className="sr-h2">Antes de pagar, revisa</h2>
          <p className="sr-p">
            Muchas multas se pagan sin comprobar si existen defectos de prueba, errores formales
            o falta de motivación. Antes de renunciar al descuento por pronto pago, merece la pena
            saber si hay base para recurrir.
          </p>
        </div>

        <p className="sr-small" style={{ marginTop: 16, color: "#6b7280", textAlign: "center" }}>
          RecurreTuMulta no garantiza el resultado del procedimiento administrativo.
        </p>
      </main>
    </>
  );
}
