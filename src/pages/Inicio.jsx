import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Inicio() {
  const nav = useNavigate();

  const [caseId, setCaseId] = useState("");
  const [file, setFile] = useState(null);

  const handleUpload = async () => {
    if (!file) return alert("Sube una multa");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data?.case_id) {
        nav(`/resultado/${data.case_id}`);
      } else {
        alert("Error procesando la multa");
      }
    } catch (err) {
      alert("Error subiendo archivo");
    }
  };

  const goToCase = () => {
    if (!caseId) return;
    nav(`/caso/${caseId}`);
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      
      {/* HERO */}
      <h1 style={{ fontSize: 32, marginBottom: 10 }}>
        ¿Te ha llegado una multa?
      </h1>

      <p style={{ fontSize: 18, marginBottom: 30 }}>
        Te la reviso gratis y te digo si merece la pena recurrirla.
      </p>

      {/* UPLOAD */}
      <div style={{ border: "1px solid #ddd", padding: 20, borderRadius: 8, marginBottom: 30 }}>
        <h2>Sube tu multa</h2>

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ marginBottom: 10 }}
        />

        <br />

        <button onClick={handleUpload}>
          Analizar multa
        </button>

        <p style={{ marginTop: 10, fontSize: 14 }}>
          ✔️ Revisión gratuita <br />
          ✔️ Sin compromiso
        </p>
      </div>

      {/* CONTINUAR CASO */}
      <div style={{ border: "1px solid #ddd", padding: 20, borderRadius: 8, marginBottom: 30 }}>
        <h2>Continuar un caso</h2>

        <p style={{ fontSize: 14 }}>
          Si ya empezaste un caso, introduce tu número de expediente para añadir más documentos.
        </p>

        <input
          type="text"
          placeholder="Número de expediente"
          value={caseId}
          onChange={(e) => setCaseId(e.target.value)}
          style={{ marginRight: 10 }}
        />

        <button onClick={goToCase}>
          Ir al caso
        </button>
      </div>

      {/* VALOR */}
      <div style={{ marginBottom: 30 }}>
        <h2>¿Cómo funciona?</h2>

        <ol>
          <li>Subes la multa</li>
          <li>Te digo si se puede recurrir</li>
          <li>Si merece la pena, preparo y presento el recurso por 20€</li>
        </ol>
      </div>

      {/* CONFIANZA */}
      <div style={{ fontSize: 14, color: "#555" }}>
        <p>
          Muchas multas están mal hechas o mal justificadas.
        </p>
        <p>
          Aquí no pierdes nada: primero se revisa, luego decides.
        </p>
      </div>

    </div>
  );
}