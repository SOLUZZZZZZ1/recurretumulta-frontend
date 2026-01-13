import Seo from "../components/Seo.jsx";
import UploadExpediente from "../components/UploadExpediente.jsx";
import { Link } from "react-router-dom";

export default function Inicio() {
  return (
    <>
      <Seo
        title="RecurreTuMulta · Asistencia administrativa automatizada"
        description="Sube hasta 5 documentos y analizamos el expediente para preparar el recurso adecuado."
        canonical="https://www.recurretumulta.eu/"
      />

      <main className="sr-hero-marmol">
        <div className="sr-hero-panel">
          <h1 className="sr-hero-title">Recurre tu trámite en minutos</h1>

          <p className="sr-hero-sub">
            Sube tu <strong>expediente</strong> (hasta 5 documentos). El sistema reconstruirá el hilo del procedimiento y propondrá el recurso correcto.
          </p>

          <div className="sr-cta-row">
            <a href="#subir" className="sr-btn-primary">Subir documentos</a>
            <Link to="/como-funciona" className="sr-btn-secondary">Ver cómo funciona</Link>
          </div>

          <div id="subir" style={{ marginTop: 18 }}>
            <UploadExpediente maxSizeMB={12} />
          </div>
        </div>
      </main>
    </>
  );
}
