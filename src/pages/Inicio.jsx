// src/pages/Inicio.jsx — RecurreTuMulta (con upload integrado)
import Seo from "../components/Seo.jsx";
import UploadMulta from "../components/UploadMulta.jsx";
import { Link } from "react-router-dom";

export default function Inicio() {
  return (
    <>
      <Seo
        title="RecurreTuMulta · Recurre multas administrativas en minutos"
        description="Sube tu multa y genera el recurso automáticamente. Tráfico, ayuntamientos y Hacienda."
        canonical="https://www.recurretumulta.eu/"
      />

      <main className="sr-hero-marmol">
        <div className="sr-hero-panel">
          <h1 className="sr-hero-title">Recurre tu multa en minutos</h1>

          <p className="sr-hero-sub">
            Sube tu multa (foto o PDF) y generamos el recurso correcto, con control de plazos y opción
            de presentarlo por ti.
          </p>

          <div className="sr-cta-row">
            <a href="#subir" className="sr-btn-primary">
              Subir mi multa
            </a>
            <Link to="/como-funciona" className="sr-btn-secondary">
              Ver cómo funciona
            </Link>
          </div>

          <div id="subir" style={{ marginTop: 18 }}>
            {/* Endpoint actual: /api/analyze (proxy). Si aún no existe, mostrará el error sin romper la web. */}
            <UploadMulta endpointAnalyze="/analyze" endpointHealth="/health" maxSizeMB={12} />
          </div>
        </div>
      </main>
    </>
  );
}
