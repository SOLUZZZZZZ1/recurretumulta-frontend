import React from "react";
import { Link } from "react-router-dom";

export default function Contacto() {
  return (
    <div style={{ padding: "40px 20px", maxWidth: "900px", margin: "0 auto" }}>

      {/* TÍTULO */}
      <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>
        Contacto
      </h1>

      {/* SUBTEXTO */}
      <p style={{ fontSize: "18px", marginBottom: "20px", color: "#555" }}>
        Canal de contacto para consultas relacionadas con expedientes, incidencias o colaboraciones.
      </p>

      {/* AVISO IMPORTANTE */}
      <div style={{
        background: "#f8f9fa",
        padding: "20px",
        borderRadius: "10px",
        marginBottom: "30px",
        border: "1px solid #e5e7eb"
      }}>
        <p style={{ marginBottom: "10px", fontWeight: "600" }}>
          Antes de contactar
        </p>
        <p style={{ marginBottom: "10px", color: "#555" }}>
          Si desea saber si su multa puede recurrirse, utilice directamente el proceso de análisis.
        </p>

        <Link to="/" style={{
          display: "inline-block",
          padding: "12px 18px",
          backgroundColor: "#22c55e",
          color: "white",
          textDecoration: "none",
          borderRadius: "8px",
          fontWeight: "600"
        }}>
          Subir mi multa ahora
        </Link>
      </div>

      {/* DATOS EMPRESA */}
      <div style={{
        background: "rgba(255,255,255,0.9)",
        padding: "25px",
        borderRadius: "12px",
        marginBottom: "30px"
      }}>
        <h3 style={{ marginBottom: "10px" }}>Email</h3>
        <p style={{ marginBottom: "20px" }}>
          soporte@recurretumulta.com
        </p>

        <h3 style={{ marginBottom: "10px" }}>Empresa</h3>
        <p>
          LA TALAMANQUINA, S.L.<br/>
          Calle Velázquez, 15<br/>
          28001 Madrid (España)
        </p>
      </div>

      {/* FORMULARIO FILTRADO */}
      <div style={{
        background: "rgba(255,255,255,0.9)",
        padding: "25px",
        borderRadius: "12px"
      }}>
        <h3 style={{ marginBottom: "15px" }}>Enviar consulta</h3>

        <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
          Este canal no ofrece atención inmediata. Respondemos lo antes posible en consultas justificadas.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert("Mensaje enviado correctamente");
          }}
          style={{ display: "flex", flexDirection: "column", gap: "15px" }}
        >

          {/* TIPO DE CONSULTA */}
          <select
            required
            style={{ padding: "12px", fontSize: "16px" }}
          >
            <option value="">Tipo de consulta</option>
            <option>Incidencia con un expediente</option>
            <option>Consulta sobre un servicio contratado</option>
            <option>Colaboraciones / gestorías</option>
            <option>Otros (justificados)</option>
          </select>

          <input
            type="text"
            placeholder="Nombre"
            required
            style={{ padding: "12px", fontSize: "16px" }}
          />

          <input
            type="email"
            placeholder="Email"
            required
            style={{ padding: "12px", fontSize: "16px" }}
          />

          <textarea
            placeholder="Describe tu consulta con detalle..."
            rows="5"
            required
            style={{ padding: "12px", fontSize: "16px" }}
          />

          <button
            type="submit"
            style={{
              padding: "14px",
              backgroundColor: "#0b4aa2",
              color: "white",
              border: "none",
              fontSize: "16px",
              cursor: "pointer",
              borderRadius: "8px"
            }}
          >
            Enviar consulta
          </button>
        </form>
      </div>

      {/* NOTA FINAL */}
      <p style={{
        marginTop: "30px",
        fontSize: "14px",
        color: "#777",
        textAlign: "center"
      }}>
        Este canal está destinado a consultas serias y justificadas.
      </p>

    </div>
  );
}