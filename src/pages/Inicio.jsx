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
        title="RecurreTuMulta · Revisa tu multa antes de pagar"
        description="Sube tu multa o expediente. Analizamos la documentación con tecnología jurídica especializada y preparamos el recurso si existen motivos para recurrir."
        canonical="https://www.recurretumulta.eu/"
      />

      <main className="sr-hero-marmol">
        <div className="sr-hero-panel">
          <h1 className="sr-hero-title">
            No pagues una multa sin revisarla antes
          </h1>

          <p className="sr-hero-sub">
            Sube tu <strong>multa o expediente</strong> y revisaremos la documentación
            con criterios técnicos y jurídicos para detectar posibles errores,
            inconsistencias o puntos de defensa.
          </p>

          <p className="sr-hero-sub" style={{ marginTop: 10 }}>
            Si el caso es viable, preparamos el recurso y nos
            encargamos de presentarlo por ti.
          </p>

          <div className="sr-cta-row">
            <Link to="/como-funciona" className="sr-btn-secondary">
              Ver cómo funciona
            </Link>
          </div>

          <div
            className="sr-card"
            id="subir"
            style={{ marginTop: 24, textAlign: "left" }}
          >
            <h2 className="sr-h2" style={{ marginTop: 0 }}>
              Analizar una multa
            </h2>

            <p className="sr-p" style={{ marginTop: 6 }}>
              Sube hasta 5 documentos relacionados con la multa: denuncia,
              notificación, resolución, justificantes o cualquier documento que
              ayude a reconstruir el expediente.
            </p>

            <UploadExpediente maxSizeMB={12} />
          </div>

          <div className="sr-card" style={{ marginTop: 16, textAlign: "left" }}>
            <h3 className="sr-h3" style={{ marginTop: 0 }}>
              ¿Ya tienes un expediente en curso?
            </h3>

            <p className="sr-p" style={{ marginTop: 6 }}>
              Introduce tu número de expediente para recuperar el caso y añadir
              una nueva notificación, resolución o documento sin empezar de cero.
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
              El número de expediente se muestra al iniciar el caso y también puede
              enviarse por email durante el proceso.
            </div>
          </div>

          <div
            className="sr-card"
            style={{
              marginTop: 18,
              textAlign: "left",
              background: "rgba(255,255,255,0.72)",
            }}
          >
            <h3 className="sr-h3" style={{ marginTop: 0 }}>
              Tecnología jurídica aplicada a tu favor
            </h3>

            <p className="sr-p" style={{ marginTop: 6 }}>
              Nuestro sistema revisa cada detalle del expediente con criterios
              técnicos y jurídicos, buscando fallos de forma, errores de prueba,
              incoherencias y defectos de motivación que podrían servir para
              defender tu caso.
            </p>

            <ul className="sr-p" style={{ lineHeight: 1.8, paddingLeft: 20 }}>
              <li>Análisis técnico en minutos.</li>
              <li>Revisión de documentos y notificaciones.</li>
              <li>Recurso profesional si existen motivos para recurrir.</li>
              <li>Opción de presentación por nuestra parte con autorización previa.</li>
            </ul>
          </div>

          <p className="sr-small" style={{ marginTop: 16, color: "#4b5563" }}>
            La mayoría de multas se pagan sin revisarse. Muchas pueden contener
            defectos o puntos de defensa que conviene comprobar antes de pagar.
          </p>
        </div>
      </main>
    </>
  );
}
