import React from "react";

export default function Precios() {
  return (
    <div style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>

      <h1 style={{ textAlign: "center" }}>
        Elige cómo quieres gestionar tu multa
      </h1>

      <p style={{ textAlign: "center", marginBottom: "40px" }}>
        Antes de pagar una multa, revisa si realmente tienes que hacerlo.
      </p>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>

        {/* PLAN BÁSICO */}
        <div style={{ flex: 1, border: "1px solid #ddd", padding: "20px", borderRadius: "10px" }}>
          <h2>Recurso básico</h2>
          <h3 style={{ fontSize: "28px" }}>19,90€</h3>

          <ul>
            <li>✔️ Análisis completo de la multa</li>
            <li>✔️ Detección de errores y puntos de defensa</li>
            <li>✔️ Generación del recurso profesional</li>
            <li>✔️ Descarga del documento listo para presentar</li>
          </ul>

          <button style={{ marginTop: "20px", width: "100%", padding: "10px" }}>
            Obtener recurso
          </button>
        </div>

        {/* PLAN PRO */}
        <div style={{ flex: 1, border: "2px solid black", padding: "20px", borderRadius: "10px" }}>
          <h2>Nos encargamos de todo</h2>
          <h3 style={{ fontSize: "28px" }}>49€</h3>

          <ul>
            <li>✔️ Todo lo del plan básico</li>
            <li>✔️ Preparación completa del expediente</li>
            <li>✔️ Presentación del recurso por nosotros</li>
            <li>✔️ Seguimiento del proceso</li>
            <li>✔️ Justificante de presentación</li>
          </ul>

          <button style={{ marginTop: "20px", width: "100%", padding: "10px" }}>
            Que lo hagan por mí
          </button>
        </div>

      </div>

      {/* FRASE CLAVE */}
      <p style={{ marginTop: "40px", textAlign: "center", fontWeight: "bold" }}>
        Antes de renunciar al descuento, asegúrate de que realmente tienes que pagar la multa.
      </p>

    </div>
  );
}