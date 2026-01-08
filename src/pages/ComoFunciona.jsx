// src/pages/ComoFunciona.jsx — RecurreTuMulta
import Seo from "../components/Seo.jsx";
import { Link } from "react-router-dom";

export default function ComoFunciona() {
  return (
    <>
      <Seo
        title="Cómo funciona · RecurreTuMulta"
        description="Sube tu multa, la analizamos automáticamente y generamos el recurso con plazos y opción de presentación."
        canonical="https://www.recurretumulta.eu/como-funciona"
      />

      <main className="sr-container" style={{ paddingTop: 28, paddingBottom: 40 }}>
        <h1 className="sr-h1" style={{ marginBottom: 10 }}>
          Cómo funciona
        </h1>
        <p className="sr-p" style={{ maxWidth: 820, marginBottom: 18 }}>
          RecurreTuMulta convierte un documento administrativo (foto, escaneo o PDF) en un
          expediente estructurado, calcula los plazos y genera el escrito correcto. Tú decides
          si lo presentas tú o lo presentamos por ti.
        </p>

        {/* Pasos */}
        <section className="sr-grid-3" style={{ marginTop: 18 }}>
          <div className="sr-card">
            <h2 className="sr-h3" style={{ marginBottom: 6 }}>
              1) Sube tu multa
            </h2>
            <p className="sr-p" style={{ marginBottom: 0 }}>
              Sube una foto, un escaneo o el PDF. No importa si está torcido o con poca calidad:
              el sistema lo interpreta y extrae los datos clave (órgano, expediente, fechas, importe).
            </p>
          </div>

          <div className="sr-card">
            <h2 className="sr-h3" style={{ marginBottom: 6 }}>
              2) Análisis automático (IA + reglas)
            </h2>
            <p className="sr-p" style={{ marginBottom: 0 }}>
              Detectamos el tipo de sanción y la fase del procedimiento, calculamos plazos y
              seleccionamos la vía adecuada (alegaciones, reposición, alzada, etc.).
              Si falta un dato esencial, te lo pedimos antes de generar nada.
            </p>
          </div>

          <div className="sr-card">
            <h2 className="sr-h3" style={{ marginBottom: 6 }}>
              3) Recurso listo (y opcionalmente presentado)
            </h2>
            <p className="sr-p" style={{ marginBottom: 0 }}>
              Generamos el escrito en PDF y Word. Puedes presentarlo tú con una guía clara,
              o podemos presentarlo por ti (con justificante) si eliges esa opción.
            </p>
          </div>
        </section>

        {/* Qué cubrimos */}
        <section style={{ marginTop: 26 }}>
          <h2 className="sr-h2" style={{ marginBottom: 10 }}>
            Qué multas cubrimos
          </h2>

          <div className="sr-grid-3">
            <div className="sr-card">
              <h3 className="sr-h3">Tráfico y movilidad</h3>
              <p className="sr-p" style={{ marginBottom: 0 }}>
                DGT y ayuntamientos: radares, estacionamiento, ZBE, etc.
              </p>
            </div>

            <div className="sr-card">
              <h3 className="sr-h3">Ayuntamientos y CCAA</h3>
              <p className="sr-p" style={{ marginBottom: 0 }}>
                Ruido, convivencia, terrazas, actividades, urbanismo, inspecciones.
              </p>
            </div>

            <div className="sr-card">
              <h3 className="sr-h3">Hacienda y Seguridad Social</h3>
              <p className="sr-p" style={{ marginBottom: 0 }}>
                Sanciones, requerimientos y procedimientos tributarios habituales.
              </p>
            </div>
          </div>

          <p className="sr-p" style={{ marginTop: 12, maxWidth: 860 }}>
            Si es una sanción administrativa, normalmente podemos ayudarte. En casos complejos o con
            documentación insuficiente, el sistema te indicará qué falta o qué opción conviene.
          </p>
        </section>

        {/* Confianza */}
        <section style={{ marginTop: 26 }}>
          <h2 className="sr-h2" style={{ marginBottom: 10 }}>
            Transparente y sin promesas imposibles
          </h2>

          <div className="sr-grid-3">
            <div className="sr-card">
              <h3 className="sr-h3">Sin inventar hechos</h3>
              <p className="sr-p" style={{ marginBottom: 0 }}>
                El recurso se redacta con los datos del documento y la información que tú confirmas.
              </p>
            </div>
            <div className="sr-card">
              <h3 className="sr-h3">Plazos controlados</h3>
              <p className="sr-p" style={{ marginBottom: 0 }}>
                Calculamos fechas clave y te avisamos del siguiente paso cuando corresponda.
              </p>
            </div>
            <div className="sr-card">
              <h3 className="sr-h3">Tú decides</h3>
              <p className="sr-p" style={{ marginBottom: 0 }}>
                Puedes descargar el escrito o pedir que lo presentemos por ti con justificante.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ marginTop: 28, textAlign: "center" }}>
          <div className="sr-card" style={{ maxWidth: 920, margin: "0 auto" }}>
            <h2 className="sr-h2" style={{ marginBottom: 8 }}>
              ¿Listo para recurrir?
            </h2>
            <p className="sr-p" style={{ marginBottom: 14 }}>
              Empieza subiendo tu multa. En menos de un minuto tendrás el primer análisis.
            </p>

            <div className="sr-cta-row" style={{ marginTop: 0 }}>
              <Link to="/" className="sr-btn-primary">
                Subir mi multa
              </Link>
              <Link to="/precios" className="sr-btn-secondary">
                Ver precios
              </Link>
            </div>

            <p className="sr-p" style={{ marginTop: 14, fontSize: 13 }}>
              Nota: RecurreTuMulta es una plataforma tecnológica de asistencia administrativa.
              No presta asesoramiento jurídico ni garantiza resultados.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
