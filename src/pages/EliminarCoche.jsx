import { useMemo, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://recurretumulta-backend.onrender.com";

export default function EliminarCoche() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    plate: "",
    city: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const normalizedPlate = useMemo(
    () => form.plate.trim().toUpperCase().replace(/\s+/g, ""),
    [form.plate]
  );

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setMessage("");
  };

  const validate = () => {
    if (!form.name.trim()) return "Indica tu nombre.";
    if (!form.phone.trim()) return "Indica un teléfono de contacto.";
    if (!normalizedPlate) return "Indica la matrícula.";
    if (!form.city.trim()) return "Indica la ciudad o municipio donde está el vehículo.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const error = validate();
    if (error) {
      setMessage(error);
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_BASE}/vehicle-removal/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || null,
          plate: normalizedPlate,
          city: form.city.trim(),
          notes: form.notes.trim() || null,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.checkout_url) {
        throw new Error(data.detail || "No se ha podido iniciar el pago.");
      }

      window.location.href = data.checkout_url;
    } catch (err) {
      setMessage(err.message || "Error inesperado.");
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: "42px 18px" }}>
      <section
        style={{
          maxWidth: 980,
          margin: "0 auto",
          background: "rgba(255,255,255,0.88)",
          borderRadius: 22,
          padding: "34px 24px",
          boxShadow: "0 12px 35px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ maxWidth: 760 }}>
          <p style={{ fontWeight: 800, color: "#0b4aa2", marginBottom: 8 }}>
            Nuevo servicio RecurreTuMulta
          </p>

          <h1 style={{ fontSize: 38, lineHeight: 1.1, margin: 0 }}>
            🚗 Elimina tu coche sin problemas legales
          </h1>

          <p style={{ fontSize: 18, color: "#374151", lineHeight: 1.6, marginTop: 18 }}>
            Si tu coche está embargado, parado, sin seguro o generando impuestos,
            te ayudamos a gestionar la baja definitiva a través de un centro autorizado.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginTop: 28,
          }}
        >
          <Card title="⚠️ Riesgo real" text="Aunque no uses el coche, puedes seguir acumulando problemas por seguro, ITV o abandono." />
          <Card title="✅ Baja definitiva" text="La gestión se orienta a tramitar la baja mediante un CAT autorizado." />
          <Card title="📄 Justificante" text="El objetivo es obtener certificado y documentación para cubrirte." />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 420px)",
            gap: 24,
            marginTop: 34,
          }}
        >
          <div>
            <h2 style={{ fontSize: 26, marginTop: 0 }}>¿Qué incluye?</h2>
            <ul style={{ lineHeight: 2, color: "#374151", paddingLeft: 22 }}>
              <li>Revisión inicial del caso.</li>
              <li>Solicitud de datos del vehículo.</li>
              <li>Gestión de contacto con vía autorizada.</li>
              <li>Seguimiento hasta completar la baja o informar de impedimentos.</li>
            </ul>

            <div
              style={{
                background: "#fff7ed",
                border: "1px solid #fed7aa",
                color: "#7c2d12",
                padding: 16,
                borderRadius: 16,
                marginTop: 18,
              }}
            >
              <strong>Aviso importante:</strong> este servicio no elimina deudas,
              embargos o sanciones previas. Solo gestiona la baja/retirada del vehículo.
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{
              background: "#ffffff",
              borderRadius: 20,
              padding: 22,
              boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ marginBottom: 18 }}>
              <div style={{ color: "#0b4aa2", fontWeight: 800 }}>
                Servicio completo
              </div>
              <div style={{ fontSize: 42, fontWeight: 900 }}>39€</div>
            </div>

            <Field label="Nombre" value={form.name} onChange={(v) => update("name", v)} />
            <Field label="Teléfono" value={form.phone} onChange={(v) => update("phone", v)} />
            <Field label="Email (opcional)" value={form.email} onChange={(v) => update("email", v)} />
            <Field label="Matrícula" value={form.plate} onChange={(v) => update("plate", v)} />
            <Field label="Ciudad o municipio" value={form.city} onChange={(v) => update("city", v)} />

            <label style={{ display: "block", marginBottom: 14 }}>
              <span style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>
                Observaciones (opcional)
              </span>
              <textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                rows={3}
                placeholder="Ej. coche embargado, sin ITV, parado en la calle..."
                style={inputStyle}
              />
            </label>

            {message && (
              <div style={{ color: "#b91c1c", fontWeight: 700, marginBottom: 12 }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: loading ? "#94a3b8" : "#2bb673",
                color: "white",
                border: 0,
                borderRadius: 14,
                padding: "14px 18px",
                fontWeight: 900,
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 16,
              }}
            >
              {loading ? "Preparando pago..." : "Eliminar mi coche ahora"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

function Card({ title, text }) {
  return (
    <div style={{ background: "#fff", borderRadius: 18, padding: 18, border: "1px solid #e5e7eb" }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <p style={{ color: "#4b5563", lineHeight: 1.5 }}>{text}</p>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
      />
    </label>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #d1d5db",
  borderRadius: 12,
  padding: "11px 12px",
  fontSize: 15,
};
