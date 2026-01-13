// src/pages/Inicio.jsx — Home (usa UploadDocumento)
import Seo from "../components/Seo.jsx";
import UploadDocumento from "../components/UploadDocumento.jsx";
import { Link } from "react-router-dom";

export default function Inicio() {
  return (
    <>
      <Seo
        title="RecurreTuMulta · Asistencia administrativa automatizada"
        description="Sube tu documento y analizamos el expediente para preparar el recurso administrativo adecuado."
        canonical="https://www.recurretumulta.eu/"
      />

      <main className="sr-hero-marmol">
        <div className="sr-hero-panel">
          <h1 className="sr-hero-title">Recurre tu trámite en minutos</h1>

          <p className="sr-hero-sub">
            Sube tu <strong>documento</strong> (foto o PDF) y analizamos el expediente para preparar
            el recurso administrativo adecuado.
          </p>

          <div className="sr-cta-row">
            <a href="#subir" className="sr-btn-primary">
              Subir documento
            </a>
            <Link to="/como-funciona" className="sr-btn-secondary">
              Ver cómo funciona
            </Link>
          </div>

          <div id="subir" style={{ marginTop: 18 }}>
            <UploadDocumento endpointAnalyze="/analyze" endpointHealth="/health" maxSizeMB={12} />
          </div>
        </div>
      </main>
    </>
  );
}
