import Seo from "../components/Seo.jsx";
import { Link } from "react-router-dom";

export default function ComoFunciona() {
  return (
    <>
      <Seo
        title="Cómo funciona · RecurreTuMulta"
        description="Analizamos cualquier sanción administrativa y preparamos el recurso adecuado."
        canonical="https://www.recurretumulta.eu/como-funciona"
      />

      <main className="sr-container py-12">
        <h1 className="sr-h1 mb-4">Cómo funciona</h1>

        <p className="sr-p mb-6">
          <b>RecurreTuMulta</b> convierte cualquier documento sancionador de la Administración
          (foto, escaneo o PDF) en un expediente estructurado, calcula los plazos
          y genera el escrito correcto. Tú decides si lo presentas tú o lo presentamos por ti.
        </p>

        <section className="sr-card mb-6">
          <h2 className="sr-h2">¿Qué tipo de sanciones cubrimos?</h2>
          <p className="sr-p">
            <b>RecurreTuMulta actúa frente a sanciones y procedimientos administrativos emitidos</b> por cualquier
            Administración pública, con independencia del organismo que los haya iniciado.
          </p>
        </section>

        <section className="sr-card text-center">
          <h2 className="sr-h2 mb-2">¿Listo para recurrir?</h2>
          <p className="sr-p mb-4">
            Empieza subiendo tu documento. En menos de un minuto tendrás el primer análisis.
          </p>
          <Link to="/" className="sr-btn-primary mr-3">
            Subir mi documento
          </Link>
          <Link to="/precios" className="sr-btn-secondary">
            Ver precios
          </Link>
        </section>

        <p className="sr-small mt-6">
          Nota: RecurreTuMulta es una plataforma tecnológica de asistencia administrativa.
          No presta asesoramiento jurídico ni garantiza resultados.
        </p>
      </main>
    </>
  );
}