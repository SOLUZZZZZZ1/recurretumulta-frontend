// src/pages/Precios.jsx — RecurreTuMulta
import Seo from "../components/Seo.jsx";
import { Link } from "react-router-dom";

export default function Precios() {
  return (
    <>
      <Seo
        title="Precios · RecurreTuMulta"
        description="Precios claros para recurrir multas administrativas: generar recurso, presentación y seguimiento completo."
        canonical="https://www.recurretumulta.eu/precios"
      />

      <main className="sr-container" style={{ paddingTop: 28, paddingBottom: 48 }}>
        <h1 className="sr-h1" style={{ marginBottom: 10 }}>Precios claros</h1>
        <p className="sr-p" style={{ maxWidth: 820, marginBottom: 18 }}>
          Elige la opción que mejor se adapte a tu caso. Sin permanencias ni letra pequeña.
        </p>

        <section className="sr-grid-3" style={{ marginTop: 18 }}>
          {/* Plan 1 */}
          <div className="sr-card">
            <h2 className="sr-h3">Generar mi recurso</h2>
            <p className="sr-p" style={{ fontSize: 28, fontWeight: 800, margin: "8px 0" }}>14,90 €</p>
            <ul className="sr-p" style={{ listStyle: "disc", paddingLeft: 18 }}>
              <li>Lectura automática de la multa</li>
              <li>Identificación de plazos</li>
              <li>Recurso en PDF y Word</li>
              <li>Guía de presentación</li>
            </ul>
            <Link to="/" className="sr-btn-primary" style={{ display: "inline-block", marginTop: 10 }}>
              Subir mi multa
            </Link>
          </div>

          {/* Plan 2 */}
          <div className="sr-card" style={{ outline: "2px solid #111827" }}>
            <h2 className="sr-h3">Presentarlo por mí</h2>
            <p className="sr-p" style={{ fontSize: 28, fontWeight: 800, margin: "8px 0" }}>39,90 €</p>
            <ul className="sr-p" style={{ listStyle: "disc", paddingLeft: 18 }}>
              <li>Todo lo del plan anterior</li>
              <li>Presentación oficial en registro</li>
              <li>Justificante incluido</li>
              <li>Control de plazos</li>
            </ul>
            <Link to="/" className="sr-btn-primary" style={{ display: "inline-block", marginTop: 10 }}>
              Subir mi multa
            </Link>
          </div>

          {/* Plan 3 */}
          <div className="sr-card">
            <h2 className="sr-h3">Olvidarme del problema</h2>
            <p className="sr-p" style={{ fontSize: 28, fontWeight: 800, margin: "8px 0" }}>99 €</p>
            <ul className="sr-p" style={{ listStyle: "disc", paddingLeft: 18 }}>
              <li>Recurso inicial</li>
              <li>Seguimiento del expediente</li>
              <li>Recursos posteriores si procede</li>
              <li>Alertas de plazos</li>
            </ul>
            <Link to="/" className="sr-btn-primary" style={{ display: "inline-block", marginTop: 10 }}>
              Subir mi multa
            </Link>
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <p className="sr-p" style={{ fontSize: 13 }}>
            Nota: RecurreTuMulta es una plataforma tecnológica de asistencia administrativa. No presta asesoramiento jurídico ni garantiza resultados.
          </p>
        </section>
      </main>
    </>
  );
}
