import Seo from "../components/Seo.jsx";
import UploadExpediente from "../components/UploadExpediente.jsx";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Inicio() {
  const navigate = useNavigate();
  const [caseId, setCaseId] = useState("");
  const [msg, setMsg] = useState("");

  function goResume() {
    const v = (caseId || "").trim();
    if (!v) {
      setMsg("Introduce tu número de expediente para recuperarlo.");
      return;
    }
    setMsg("");
    navigate(`/resumen?case=${encodeURIComponent(v)}`);
  }

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
            Sube tu <strong>expediente</strong> (hasta 5 documentos). El sistema
            reconstruirá el hilo del procedimiento y propondrá el recurso
            correcto.
          </p>

          <div className="sr-cta-row">
            <a href="#subir" className="sr-btn-primary">
              Subir documentos
            </a>
            <Link to="/como-funciona" className="sr-btn-secondary">
              Ver cómo funciona
            </Link>
          </div>

          <div id="subir" style={{ marginTop: 18 }}>
            <UploadExpediente maxSizeMB={12} />

            {/* Recuperar expediente (backup del link por email) */}
            <div className="sr-card" style={{ marginTop: 12, textAlign: "left" }}>
              <h3 className="sr-h3" style={{ marginTop: 0 }}>
                ¿Ya tienes un expediente?
              </h3>

              <p className="sr-p" style={{ marginTop: 6 }}>
                Introduce tu número de expediente para añadir documentación sin
                empezar de cero.
              </p>

              <div
                className="sr-cta-row"
                style={{
                  justifyContent: "flex-start",
                  gap: 10,
                  flexWrap: "wrap",
                  marginTop: 10,
                }}
              >
                <input
                  value={caseId}
                  onChange={(e) => {
                    setCaseId(e.target.value);
                    if (msg) setMsg("");
                  }}
                  placeholder="Ej.: 71132d2c-ec4f-41ce-96d4-657b4dfd01ca"
                  style={{
                    minWidth: 320,
                    maxWidth: 560,
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.8)",
                  }}
                />

                <button type="button" className="sr-btn-secondary" onClick={goResume}>
                  Recuperar expediente
                </button>
              </div>

              {msg && (
                <div className="sr-small" style={{ marginTop: 8, color: "#991b1b" }}>
                  ❌ {msg}
                </div>
              )}

              <div className="sr-small" style={{ marginTop: 8, color: "#6b7280" }}>
                Te lo enviamos por email cuando revisamos tu documentación.
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
