import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Seo from "../components/Seo.jsx";

const API = "/api";

export default function Inicio() {
  const nav = useNavigate();

  const [file, setFile] = useState(null);
  const [caseId, setCaseId] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleUpload() {
    setErr("");

    if (!file) {
      setErr("Selecciona primero la multa o notificación que quieres analizar.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API}/analyze`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.detail || data?.message || "No se pudo analizar el documento.");
      }

      const newCaseId = data?.case_id || data?.caseId || data?.id;

      if (!newCaseId) {
        throw new Error("El análisis se completó, pero no se recibió número de expediente.");
      }

      nav(`/resultado/${newCaseId}`);
    } catch (e) {
      setErr(e.message || "Error al subir el documento.");
    } finally {
      setLoading(false);
    }
  }

  function continueCase() {
    const clean = caseId.trim();

    if (!clean) {
      setErr("Introduce el número de expediente para continuar.");
      return;
    }

    nav(`/caso/${encodeURIComponent(clean)}`);
  }

  return (
    <>
      <Seo
        title="Recurrir multas de tráfico · RecurreTuMulta"
        description="Sube tu multa, la analizamos y, si merece la pena, preparamos y presentamos el recurso por ti."
        canonical="https://www.recurretumulta.eu/"
      />

      <main style={{ background: "#f8fafc", minHeight: "calc(100vh - 120px)" }}>
        <section
          style={{
            background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #0f766e 100%)",
            color: "#fff",
            padding: "70px 20px 56px",
          }}
        >
          <div className="sr-container" style={{ maxWidth: 1120, margin: "0 auto" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 0.9fr)",
                gap: 28,
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    padding: "7px 12px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.14)",
                    border: "1px solid rgba(255,255,255,0.24)",
                    fontWeight: 800,
                    marginBottom: 18,
                  }}
                >
                  Revisión inicial gratuita
                </div>

                <h1
                  style={{
                    fontSize: "clamp(34px, 5vw, 58px)",
                    lineHeight: 1.04,
                    margin: "0 0 18px",
                    letterSpacing: "-0.04em",
                    fontWeight: 950,
                  }}
                >
                  ¿Te ha llegado una multa de tráfico?
                </h1>

                <p
                  style={{
                    fontSize: 20,
                    lineHeight: 1.55,
                    margin: "0 0 24px",
                    color: "rgba(255,255,255,0.88)",
                    maxWidth: 690,
                  }}
                >
                  Súbela y la revisamos. Si se puede defender bien, preparamos el recurso
                  adaptado a tu caso y lo presentamos en tu nombre con autorización previa.
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: 12,
                    maxWidth: 720,
                  }}
                >
                  {[
                    "Análisis completo",
                    "Recurso adaptado",
                    "Presentación incluida",
                  ].map((x) => (
                    <div
                      key={x}
                      style={{
                        background: "rgba(255,255,255,0.12)",
                        border: "1px solid rgba(255,255,255,0.20)",
                        borderRadius: 16,
                        padding: 14,
                        fontWeight: 850,
                      }}
                    >
                      ✔ {x}
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  background: "#fff",
                  color: "#0f172a",
                  borderRadius: 26,
                  padding: 24,
                  boxShadow: "0 24px 70px rgba(15,23,42,0.30)",
                }}
              >
                <h2 style={{ fontSize: 26, margin: "0 0 8px", fontWeight: 950 }}>
                  Sube tu multa
                </h2>

                <p style={{ color: "#64748b", lineHeight: 1.5, marginBottom: 18 }}>
                  Acepta PDF, imagen o documento. Primero analizamos si el caso tiene recorrido.
                </p>

                <label
                  style={{
                    display: "block",
                    border: "2px dashed #cbd5e1",
                    borderRadius: 18,
                    padding: 22,
                    textAlign: "center",
                    background: "#f8fafc",
                    cursor: "pointer",
                    marginBottom: 14,
                  }}
                >
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    style={{ display: "none" }}
                  />

                  <div style={{ fontSize: 34, marginBottom: 8 }}>📄</div>
                  <div style={{ fontWeight: 900 }}>
                    {file ? file.name : "Seleccionar documento"}
                  </div>
                  <div style={{ color: "#64748b", fontSize: 14, marginTop: 4 }}>
                    Multa, notificación o resolución
                  </div>
                </label>

                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={loading}
                  style={{
                    width: "100%",
                    border: 0,
                    borderRadius: 14,
                    padding: "15px 18px",
                    background: loading ? "#64748b" : "#16a34a",
                    color: "#fff",
                    fontWeight: 950,
                    fontSize: 17,
                    cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: "0 14px 28px rgba(22,163,74,0.28)",
                  }}
                >
                  {loading ? "Analizando…" : "Analizar multa gratis"}
                </button>

                <div style={{ marginTop: 14, color: "#64748b", fontSize: 14, lineHeight: 1.45 }}>
                  Sin compromiso. Si no merece la pena recurrirla, te lo decimos claro.
                </div>

                {err ? (
                  <div
                    style={{
                      marginTop: 14,
                      padding: 12,
                      borderRadius: 12,
                      background: "#fef2f2",
                      color: "#991b1b",
                      fontWeight: 700,
                    }}
                  >
                    {err}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section style={{ padding: "34px 20px" }}>
          <div className="sr-container" style={{ maxWidth: 1120, margin: "0 auto" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 0.78fr)",
                gap: 18,
              }}
            >
              <div
                style={{
                  background: "#fff",
                  borderRadius: 24,
                  padding: 26,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 12px 34px rgba(15,23,42,0.06)",
                }}
              >
                <h2 style={{ marginTop: 0, fontSize: 28, fontWeight: 950 }}>
                  ¿Qué incluye el servicio?
                </h2>

                <div style={{ display: "grid", gap: 14 }}>
                  {[
                    "Análisis completo de la multa o expediente.",
                    "Detección de errores, defectos de prueba o problemas de motivación.",
                    "Preparación del recurso adaptado al caso.",
                    "Presentación del recurso en tu nombre con autorización previa.",
                    "Seguimiento del recurso y plazos.",
                    "Justificante oficial de presentación.",
                  ].map((item) => (
                    <div
                      key={item}
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                        fontSize: 16,
                        lineHeight: 1.45,
                      }}
                    >
                      <span
                        style={{
                          minWidth: 26,
                          height: 26,
                          borderRadius: 999,
                          background: "#dcfce7",
                          color: "#166534",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 950,
                        }}
                      >
                        ✓
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  background: "#fff",
                  borderRadius: 24,
                  padding: 26,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 12px 34px rgba(15,23,42,0.06)",
                }}
              >
                <h2 style={{ marginTop: 0, fontSize: 24, fontWeight: 950 }}>
                  Añadir documento al expediente
                </h2>

                <p style={{ color: "#64748b", lineHeight: 1.5 }}>
                  Si ya tienes un expediente iniciado, introduce el número para subir una nueva
                  notificación, resolución o documento adicional.
                </p>

                <input
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  placeholder="Ej. 390700943475"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    border: "1px solid #cbd5e1",
                    borderRadius: 14,
                    padding: "14px 15px",
                    fontSize: 16,
                    marginBottom: 12,
                  }}
                />

                <button
                  type="button"
                  onClick={continueCase}
                  style={{
                    width: "100%",
                    border: 0,
                    borderRadius: 14,
                    padding: "14px 18px",
                    background: "#0f172a",
                    color: "#fff",
                    fontWeight: 950,
                    cursor: "pointer",
                  }}
                >
                  Buscar expediente
                </button>

                <div style={{ color: "#64748b", fontSize: 13, marginTop: 12, lineHeight: 1.45 }}>
                  Útil cuando el expediente quedó incompleto o llega una resolución posterior.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ padding: "10px 20px 54px" }}>
          <div className="sr-container" style={{ maxWidth: 1120, margin: "0 auto" }}>
            <div
              style={{
                background: "#0f172a",
                color: "#fff",
                borderRadius: 26,
                padding: 28,
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 18,
              }}
            >
              {[
                ["1", "Sube la multa", "Analizamos el documento y localizamos posibles defectos."],
                ["2", "Decidimos si compensa", "Si no vemos recorrido, te lo decimos sin venderte nada."],
                ["3", "Recurso y presentación", "Con autorización, preparamos y presentamos el escrito."],
              ].map(([num, title, text]) => (
                <div key={num}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      background: "#16a34a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 950,
                      marginBottom: 12,
                    }}
                  >
                    {num}
                  </div>
                  <div style={{ fontWeight: 950, fontSize: 18, marginBottom: 6 }}>{title}</div>
                  <div style={{ color: "rgba(255,255,255,0.76)", lineHeight: 1.5 }}>{text}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
