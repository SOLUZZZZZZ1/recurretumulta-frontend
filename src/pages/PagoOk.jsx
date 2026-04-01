// PagoOk.jsx — confirmación post-pago (SIN autorización)

import React from "react";
import { Link, useLocation } from "react-router-dom";
import Seo from "../components/Seo.jsx";

function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

export default function PagoOk() {
  const q = useQuery();
  const caseId = q.get("case") || "";

  return (
    <>
      <Seo
        title="Pago confirmado · RecurreTuMulta"
        description="Tu pago se ha realizado correctamente. Estamos tramitando tu recurso."
      />

      <main className="sr-container py-12">
        <h1 className="sr-h1">Pago confirmado</h1>

        <div className="sr-card">
          <p className="sr-p" style={{ marginTop: 0 }}>
            ✅ Tu pago se ha realizado correctamente.
          </p>

          <p className="sr-p">
            Estamos procesando tu expediente y generando tu recurso automáticamente.
          </p>

          <div className="sr-small" style={{ color: "#6b7280", marginTop: 10 }}>
            Expediente:{" "}
            <span style={{ fontFamily: "monospace" }}>
              {caseId || "—"}
            </span>
          </div>

          <div className="sr-card" style={{ background: "#f9fafb", marginTop: 14 }}>
            <p className="sr-p" style={{ margin: 0 }}>
              🔄 Nuestro sistema está generando tu recurso en este momento.
            </p>
            <p className="sr-p" style={{ margin: 0 }}>
              En unos segundos estará disponible para revisión.
            </p>
          </div>

          <div className="sr-cta-row" style={{ marginTop: 16 }}>
            <Link
              to={`/resumen?case=${encodeURIComponent(caseId)}`}
              className="sr-btn-primary"
            >
              Ver mi expediente
            </Link>

            <Link to="/" className="sr-btn-secondary">
              Ir al inicio
            </Link>
          </div>

          <div className="sr-small" style={{ marginTop: 12, color: "#6b7280" }}>
            Recibirás actualizaciones sobre el estado de tu expediente en tu correo electrónico.
          </div>
        </div>
      </main>
    </>
  );
}