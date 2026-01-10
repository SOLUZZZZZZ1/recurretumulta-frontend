// src/pages/Precios.jsx — RecurreTuMulta (modelo: pagas solo si presentamos)
import Seo from "../components/Seo.jsx";
import { Link } from "react-router-dom";

export default function Precios() {
  return (
    <>
      <Seo
        title="Precios · RecurreTuMulta"
        description="Análisis y generación de recurso gratis. Pagas solo si presentamos tu recurso por ti."
        canonical="https://www.recurretumulta.eu/precios"
      />

      <main className="sr-container" style={{ paddingTop: 28, paddingBottom: 48 }}>
        <h1 className="sr-h1" style={{ marginBottom: 10 }}>
          Precios claros
        </h1>

        <p className="sr-p" style={{ maxWidth: 900, marginBottom: 18 }}>
          En RecurreTuMulta el análisis y la generación del recurso son <b>gratuitos</b>.
          Solo pagas si quieres que <b>presentemos el recurso por ti</b> y te entreguemos el justificante oficial.
        </p>

        {/* Bloque gratis */}
        <section className="sr-card" style={{ marginTop: 14 }}>
          <h2 className="sr-h2" style={{ marginBottom: 8 }}>
            ✅ Gratis
          </h2>
          <ul className="sr-p" style={{ listStyle: "disc", paddingLeft: 18, marginBottom: 0 }}>
            <li>Análisis automático (foto/PDF/DOCX)</li>
            <li>Resumen claro del expediente</li>
            <li>Generación del recurso (DOCX + PDF)</li>
          </ul>

          <div className="sr-small" style={{ marginTop: 10, color: "#6b7280" }}>
            Nota: El recurso se genera, pero no se presenta ante la Administración hasta que lo solicites.
          </div>
        </section>

        {/* Presentación (pagado) */}
        <h2 className="sr-h2" style={{ marginTop: 22, marginBottom: 10 }}>
          Presentación por nosotros
        </h2>

        <section className="sr-grid-3">
          <div className="sr-card">
            <h3 className="sr-h3">DGT (Tráfico)</h3>
            <p className="sr-p" style={{ fontSize: 28, fontWeight: 800, margin: "8px 0" }}>
              29,90 €
            </p>
            <ul className="sr-p" style={{ listStyle: "disc", paddingLeft: 18 }}>
              <li>Presentación oficial por registro</li>
              <li>Justificante incluido</li>
              <li>Guardado seguro del expediente</li>
            </ul>
            <Link to="/" className="sr-btn-primary" style={{ display: "inline-block", marginTop: 10 }}>
              Empezar (gratis)
            </Link>
          </div>

          <div className="sr-card" style={{ outline: "2px solid #111827" }}>
            <h3 className="sr-h3">Ayuntamientos / CCAA</h3>
            <p className="sr-p" style={{ fontSize: 28, fontWeight: 800, margin: "8px 0" }}>
              34,90 €
            </p>
            <ul className="sr-p" style={{ listStyle: "disc", paddingLeft: 18 }}>
              <li>Presentación oficial por registro</li>
              <li>Justificante incluido</li>
              <li>Seguimiento básico</li>
            </ul>
            <Link to="/" className="sr-btn-primary" style={{ display: "inline-block", marginTop: 10 }}>
              Empezar (gratis)
            </Link>
          </div>

          <div className="sr-card">
            <h3 className="sr-h3">Caso complejo</h3>
            <p className="sr-p" style={{ fontSize: 28, fontWeight: 800, margin: "8px 0" }}>
              49,90 €+
            </p>
            <ul className="sr-p" style={{ listStyle: "disc", paddingLeft: 18 }}>
              <li>Revisión adicional del expediente</li>
              <li>Recurso más extenso / anexos</li>
              <li>Presentación + justificante</li>
            </ul>
            <Link to="/contacto" className="sr-btn-secondary" style={{ display: "inline-block", marginTop: 10 }}>
              Consultar
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
              Si presentas alegaciones o recurso, normalmente renuncias al descuento por pronto pago (si existía).
            </li>
            <li>
              No garantizamos el resultado: el servicio consiste en análisis, preparación y/o presentación del escrito.
            </li>
          </ul>
        </section>

        {/* Packs (futuro) */}
        <div className="sr-small" style={{ marginTop: 14, color: "#6b7280" }}>
          Próximamente: packs y suscripción para usuarios con varias sanciones al año.
        </div>
      </main>
    </>
  );
}
