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
          <h2 className="sr-h2">1️⃣ Sube tu documento</h2>
          <p className="sr-p">
            Sube una foto, un escaneo o el PDF del documento administrativo que hayas recibido.
            No importa si está torcido, borroso o con poca calidad: el sistema interpreta el
            contenido y extrae los datos clave (órgano, expediente, fechas, importe).
          </p>
          <p className="sr-small">
            Puede tratarse de <b>cualquier sanción administrativa</b>, no solo multas de tráfico.
          </p>
        </section>

        <section className="sr-card mb-6">
          <h2 className="sr-h2">2️⃣ Análisis automático</h2>
          <p className="sr-p">
            Analizamos el documento combinando inteligencia artificial y reglas administrativas:
          </p>
          <ul className="sr-p list-disc pl-5">
            <li>Detectamos el tipo de procedimiento</li>
            <li>Calculamos plazos y fechas clave</li>
            <li>Seleccionamos la vía adecuada (alegaciones, reposición, alzada, etc.)</li>
          </ul>
          <p className="sr-small mt-2">
            Si falta algún dato esencial, te lo pedimos antes de continuar.
          </p>
        </section>

        <section className="sr-card mb-6">
          <h2 className="sr-h2">3️⃣ Recurso listo (y presentación opcional)</h2>
          <p className="sr-p">
            Generamos el escrito correspondiente en PDF y Word.
          </p>
          <ul className="sr-p list-disc pl-5">
            <li>Puedes presentarlo tú con una guía clara</li>
            <li>O podemos presentarlo por ti, con registro oficial y justificante</li>
          </ul>
          <p className="sr-small mt-2">
            El análisis es gratuito. Solo pagas si decides que presentemos el recurso por ti.
          </p>
        </section>

        <section className="sr-card mb-6">
          <h2 className="sr-h2">¿Qué tipo de sanciones cubrimos?</h2>
          <p className="sr-p">
            <b>RecurreTuMulta actúa frente a sanciones y procedimientos administrativos</b>
                    emitidos por cualquier Administración pública, con independencia del organismo
            que los haya iniciado.
          </p>

          <p className="sr-p">
            Trabajamos con expedientes procedentes, entre otros, de:
          </p>

          <ul className="sr-p list-disc pl-5">
            <li>Ayuntamientos</li>
            <li>Consejos comarcales (Catalunya)</li>
            <li>Diputaciones provinciales</li>
            <li>Comunidades Autónomas</li>
            <li>Administración General del Estado</li>
          </ul>

          <p className="sr-p mt-3">
            Nuestro sistema está diseñado para analizar el expediente, calcular plazos
            y preparar los escritos adecuados en cada fase de la vía administrativa,
            hasta su agotamiento cuando corresponda.
          </p>

          <h3 className="sr-h3 mt-4">A título de ejemplo, cubrimos habitualmente:</h3>

          <ul className="sr-p list-disc pl-5">
            <li>
              <b>Tráfico y movilidad:</b> DGT y entidades locales (radares, estacionamiento,
              ZBE, velocidad, señalización, etc.).
            </li>
            <li>
              <b>Administración local y autonómica:</b> ruido y convivencia, licencias,
              actividades, urbanismo, inspecciones, consumo, sanciones municipales.
            </li>
            <li>
              <b>Hacienda y Seguridad Social:</b> sanciones, requerimientos y procedimientos
              administrativos habituales.
            </li>
          </ul>

          <p className="sr-p mt-3">
            👉 <b>Si se trata de una sanción o procedimiento administrativo</b>, normalmente
            podemos ayudarte.
          </p>
        </section>

        <section className="sr-card mb-6">
          <h2 className="sr-h2">¿Y si el caso es complejo?</h2>
          <p className="sr-p">
            En expedientes más complejos o con documentación incompleta, el sistema:
          </p>
          <ul className="sr-p list-disc pl-5">
            <li>Indica qué información falta</li>
            <li>Ayuda a decidir la vía más adecuada</li>
            <li>O recomienda no continuar si no es procedente</li>
          </ul>

          <p className="sr-small mt-2">
            Cuando el procedimiento excede la vía administrativa o requiere intervención
            judicial, te informaremos de las opciones disponibles.
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