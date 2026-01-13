// src/pages/Precios.jsx — RecurreTuMulta (modelo: pagas solo si presentamos)
import Seo from "../components/Seo.jsx";
import { Link } from "react-router-dom";

export default function Precios() {
  return (
    <>
      <Seo
        title="Precios · RecurreTuMulta"
        description="Análisis y preparación del expediente gratis. Pagas solo si presentamos el recurso por ti."
        canonical="https://www.recurretumulta.eu/precios"
      />

      <main className="sr-container" style={{ paddingTop: 28, paddingBottom: 48 }}>
        <h1 className="sr-h1" style={{ marginBottom: 10 }}>
          Precios claros y justos
        </h1>

        <p className="sr-p" style={{ maxWidth: 900, marginBottom: 18 }}>
          En RecurreTuMulta el análisis inicial del documento y la preparación del expediente son
          <b> gratuitos</b>.  
          Solo pagas si quieres que <b>presentemos el recurso por ti</b> ante la Administración y te
          entreguemos el justificante oficial de registro.
        </p>

        {/* Bloque gratis */}
        <section className="sr-card" style={{ marginTop: 14 }}>
          <h2 className="sr-h2" style={{ marginBottom: 8 }}>
            ✅ Gratis
          </h2>
          <ul className="sr-p" style={{ listStyle: "disc", paddingLeft: 18, marginBottom: 0 }}>
            <li>Subida y análisis automático de documentos (foto, PDF, DOCX)</li>
            <li>Resumen claro del expediente y del trámite en curso</li>
            <li>Detección del tipo de recurso procedente (alegaciones, reposición, alzada)</li>
          </ul>

          <div className="sr-small" style={{ marginTop: 10, color: "#6b7280" }}>
            El escrito se prepara internamente, pero no se presenta ante la Administración hasta que lo solicites.
          </div>
        </section>

        {/* Presentación (pagado) */}
        <h2 className="sr-h2" style={{ marginTop: 22, marginBottom: 10 }}>
          Presentación por nosotros
        </h2>

        <section className="sr-grid-3">
          {/* DGT */}
          <div className="sr-card">
            <h3 className="sr-h3">Tráfico (DGT)</h3>
            <p className="sr-p" style={{ fontSize: 28, fontWeight: 800, margin: "8px 0" }}>
              29,90 €
            </p>
            <ul className="sr-p" style={{ listStyle: "disc", paddingLeft: 18 }}>
              <li>Un documento principal</li>
              <li>Preparación del escrito correspondiente</li>
              <li>Presentación oficial por registro</li>
              <li>Justificante incluido</li>
            </ul>
            <Link to="/" className="sr-btn-primary" style={{ display: "inline-block", marginTop: 10 }}>
              Empezar (gratis)
            </Link>
          </div>

          {/* Ayuntamientos / CCAA */}
          <div className="sr-card" style={{ outline: "2px solid #111827" }}>
            <h3 className="sr-h3">Ayuntamientos / CCAA</h3>
            <p className="sr-p" style={{ fontSize: 28, fontWeight: 800, margin: "8px 0" }}>
              34,90 €
            </p>
            <ul className="sr-p" style={{ listStyle: "disc", paddingLeft: 18 }}>
              <li>Uno o varios documentos relacionados</li>
              <li>Revisión del procedimiento administrativo</li>
              <li>Presentación oficial por registro</li>
              <li>Justificante incluido</li>
            </ul>
            <Link to="/" className="sr-btn-primary" style={{ display: "inline-block", marginTop: 10 }}>
              Empezar (gratis)
            </Link>
          </div>

          {/* Caso complejo */}
          <div className="sr-card">
            <h3 className="sr-h3">Caso complejo</h3>
            <p className="sr-p" style={{ fontSize: 28, fontWeight: 800, margin: "8px 0" }}>
              49,90 €+
            </p>
            <ul className="sr-p" style={{ listStyle: "disc", paddingLeft: 18 }}>
              <li>Hasta 5 documentos por expediente</li>
              <li>Reconstrucción del hilo completo del procedimiento</li>
              <li>Análisis de fechas, actos y límites del trámite</li>
              <li>Recurso más extenso y preciso (ej. OEPM, alzada)</li>
              <li>Presentación + justificante oficial</li>
            </ul>
            <Link to="/contacto" className="sr-btn-secondary" style={{ display: "inline-block", marginTop: 10 }}>
              Consultar caso
            </Link>
          </div>
        </section>

        {/* Avisos legales */}
        <section className="sr-card" style={{ marginTop: 18 }}>
          <h3 className="sr-h3" style={{ marginBottom: 8 }}>
            Avisos importantes
          </h3>
          <ul className="sr-p" style={{ listStyle: "disc", paddingLeft: 18, marginBottom: 0 }}>
            <li>
              En algunos procedimientos, presentar alegaciones o recursos implica renunciar al
              descuento por pronto pago (si existía).
            </li>
            <li>
              No garantizamos el resultado del procedimiento: el servicio consiste en análisis,
              preparación y/o presentación del escrito conforme a Derecho.
            </li>
          </ul>
        </section>

        <div className="sr-small" style={{ marginTop: 14, color: "#6b7280" }}>
          Próximamente: packs para profesionales y expedientes recurrentes.
        </div>
      </main>
    </>
  );
}
