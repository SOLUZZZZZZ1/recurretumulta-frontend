import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function Contacto() {
  const API_BASE = useMemo(
    () => (import.meta.env.VITE_API_URL || "").replace(/\/$/, ""),
    []
  );

  const [form, setForm] = useState({
    tipo_consulta: "",
    nombre: "",
    email: "",
    mensaje: "",
  });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setStatus({ type: "", text: "" });

    try {
      const response = await fetch(`${API_BASE}/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.detail || "No se pudo enviar la consulta.");
      }

      setStatus({
        type: "success",
        text: "Consulta enviada correctamente. La revisaremos lo antes posible.",
      });

      setForm({
        tipo_consulta: "",
        nombre: "",
        email: "",
        mensaje: "",
      });
    } catch (error) {
      setStatus({
        type: "error",
        text: error.message || "Ha ocurrido un error al enviar la consulta.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ padding: "40px 20px", maxWidth: "900px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>Contacto</h1>

      <p style={{ fontSize: "18px", marginBottom: "20px", color: "#555" }}>
        Canal de contacto para consultas relacionadas con expedientes, incidencias o colaboraciones.
      </p>

      <div
        style={{
          background: "#f8f9fa",
          padding: "20px",
          borderRadius: "10px",
          marginBottom: "30px",
          border: "1px solid #e5e7eb",
        }}
      >
        <p style={{ marginBottom: "10px", fontWeight: "600" }}>Antes de contactar</p>
        <p style={{ marginBottom: "10px", color: "#555" }}>
          Si desea saber si su multa puede recurrirse, utilice directamente el proceso de análisis.
        </p>

        <Link
          to="/"
          style={{
            display: "inline-block",
            padding: "12px 18px",
            backgroundColor: "#22c55e",
            color: "white",
            textDecoration: "none",
            borderRadius: "8px",
            fontWeight: "600",
          }}
        >
          Subir mi multa ahora
        </Link>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.9)",
          padding: "25px",
          borderRadius: "12px",
          marginBottom: "30px",
        }}
      >
        <h3 style={{ marginBottom: "10px" }}>Email</h3>
        <p style={{ marginBottom: "20px" }}>info@recurretumulta.eu</p>

        <h3 style={{ marginBottom: "10px" }}>Empresa</h3>
        <p>
          LA TALAMANQUINA, S.L.
          <br />
          Calle Velázquez, 15
          <br />
          28001 Madrid (España)
        </p>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.9)",
          padding: "25px",
          borderRadius: "12px",
        }}
      >
        <h3 style={{ marginBottom: "15px" }}>Enviar consulta</h3>

        <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
          Este canal no ofrece atención inmediata. Respondemos lo antes posible en consultas justificadas.
        </p>

        <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          <select
            name="tipo_consulta"
            value={form.tipo_consulta}
            onChange={onChange}
            required
            style={{ padding: "12px", fontSize: "16px" }}
          >
            <option value="">Tipo de consulta</option>
            <option value="Incidencia con un expediente">Incidencia con un expediente</option>
            <option value="Consulta sobre un servicio contratado">Consulta sobre un servicio contratado</option>
            <option value="Colaboraciones / gestorías">Colaboraciones / gestorías</option>
            <option value="Otros (justificados)">Otros (justificados)</option>
          </select>

          <input
            type="text"
            name="nombre"
            placeholder="Nombre"
            value={form.nombre}
            onChange={onChange}
            required
            style={{ padding: "12px", fontSize: "16px" }}
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={onChange}
            required
            style={{ padding: "12px", fontSize: "16px" }}
          />

          <textarea
            name="mensaje"
            placeholder="Describe tu consulta con detalle..."
            rows="5"
            value={form.mensaje}
            onChange={onChange}
            required
            style={{ padding: "12px", fontSize: "16px" }}
          />

          <button
            type="submit"
            disabled={sending}
            style={{
              padding: "14px",
              backgroundColor: sending ? "#6b7280" : "#0b4aa2",
              color: "white",
              border: "none",
              fontSize: "16px",
              cursor: sending ? "not-allowed" : "pointer",
              borderRadius: "8px",
            }}
          >
            {sending ? "Enviando..." : "Enviar consulta"}
          </button>
        </form>

        {status.text ? (
          <div
            style={{
              marginTop: "16px",
              padding: "12px 14px",
              borderRadius: "8px",
              background: status.type === "success" ? "#ecfdf5" : "#fef2f2",
              color: status.type === "success" ? "#166534" : "#991b1b",
              border: `1px solid ${status.type === "success" ? "#bbf7d0" : "#fecaca"}`,
            }}
          >
            {status.text}
          </div>
        ) : null}
      </div>

      <p
        style={{
          marginTop: "30px",
          fontSize: "14px",
          color: "#777",
          textAlign: "center",
        }}
      >
        Este canal está destinado a consultas serias y justificadas.
      </p>
    </div>
  );
}
