import React from "react";
import UploadExpediente from "../components/UploadExpediente";
import AppendDocuments from "../components/AppendDocuments";

export default function Inicio() {
  return (
    <div style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>

      {/* HERO */}
      <h1 style={{ fontSize: "32px", marginBottom: "20px" }}>
        No pagues una multa sin revisarla antes
      </h1>

      <p style={{ fontSize: "18px", marginBottom: "30px" }}>
        Analizamos tu multa con tecnología jurídica especializada y te indicamos si puedes recurrirla.
        Si es viable, generamos el recurso o nos encargamos de todo por ti.
      </p>

      {/* BLOQUE PRINCIPAL: SUBIR MULTA */}
      <div style={{ marginBottom: "40px" }}>
        <h2>Analizar multa</h2>
        <UploadExpediente />
      </div>

      {/* BLOQUE SECUNDARIO: AÑADIR DOCUMENTOS */}
      <div style={{ marginBottom: "40px" }}>
        <h3>¿Ya tienes un expediente en curso?</h3>

        <p style={{ marginBottom: "10px" }}>
          Si ya has iniciado un caso, puedes añadir más documentos aquí:
        </p>

        <AppendDocuments />
      </div>

      {/* BENEFICIOS */}
      <ul style={{ lineHeight: "1.8", marginBottom: "30px" }}>
        <li>✔️ Análisis técnico en minutos</li>
        <li>✔️ Sin desplazamientos ni papeleo</li>
        <li>✔️ Recurso profesional listo para presentar</li>
        <li>✔️ O nos encargamos nosotros por ti</li>
      </ul>

      {/* TECNOLOGÍA */}
      <h2>Tecnología jurídica aplicada a tu favor</h2>

      <p>
        Nuestro sistema analiza cada multa con criterios técnicos y jurídicos,
        detectando errores, inconsistencias y puntos de defensa que a simple vista pasan desapercibidos.
      </p>

      {/* FRASE CLAVE */}
      <p style={{ marginTop: "30px", fontWeight: "bold" }}>
        La mayoría de multas se pagan sin revisarse. Muchas pueden recurrirse.
      </p>

    </div>
  );
}