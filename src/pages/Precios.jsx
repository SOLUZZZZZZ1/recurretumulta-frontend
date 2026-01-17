import Seo from "../components/Seo.jsx";
import { Link } from "react-router-dom";

export default function Precios() {
  return (
    <>
      <Seo
        title="Precios · RecurreTuMulta"
        description="Análisis gratuito. Pagas solo si presentamos el recurso por ti."
        canonical="https://www.recurretumulta.eu/precios"
      />

      <main className="sr-container" style={{ paddingTop: 28, paddingBottom: 48 }}>
        <h1 className="sr-h1">Precios claros y automáticos</h1>

        <p className="sr-p" style={{ maxWidth: 900, marginBottom: 18 }}>
          En RecurreTuMulta el análisis del expediente es <b>gratuito</b>. Solo
          pagas si decides que presentemos el recurso por ti ante la
          Administración.
        </p>

        <section className="sr-card">
          <h2 className="sr-h2">Presentación del recurso</h2>

          <p className="sr-p" style={{ fontSize: 28, fontWeight: 800, marginBottom: 10 }}>
            Desde 29,90 €
          </p>

          <ul className="sr-p" style={{ listStyle: "disc", paddingLeft: 18, marginTop: 0 }}>
            <li>Incluye 1 documento</li>
            <li>Presentación oficial por registro</li>
            <li>Justificante incluido</li>
          </ul>

          <p className="sr-small" style={{ marginTop: 10 }}>
            Documento adicional: <b>+5,00 €</b> por documento
          </p>

          <p className="sr-small" style={{ marginTop: 8, color: "#6b7280" }}>
            El precio final se calcula automáticamente según la documentación
            del expediente y se muestra antes de pagar.
          </p>

          <div style={{ marginTop: 14 }}>
            <Link to="/" className="sr-btn-primary">
              Empezar (gratis)
            </Link>
          </div>
        </section>

        <section className="sr-card" style={{ marginTop: 18 }}>
          <h3 className="sr-h3">Avisos importantes</h3>
          <ul className="sr-p" style={{ listStyle: "disc", paddingLeft: 18, marginBottom: 0 }}>
            <li>
              En algunos procedimientos, presentar recursos implica renunciar al
              descuento por pronto pago.
            </li>
            <li>
              No garantizamos el resultado del procedimiento; el servicio
              consiste en la preparación y presentación del escrito.
            </li>
          </ul>
        </section>
      </main>
    </>
  );
}