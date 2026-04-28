import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "https://recurretumulta-backend.onrender.com";

export default function EliminarCoche() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);

  const paidOk = params.get("success") === "1";
  const cancelled = params.get("cancelled") === "1";
  const caseId = params.get("case_id");

  const [form, setForm] = useState({
    full_name: "",
    dni_nie: "",
    phone: "",
    email: "",
    plate: "",
    city: "",
    notes: "",
  });

  const [registrationFile, setRegistrationFile] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyMsg, setVerifyMsg] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const normalizedPlate = useMemo(
    () => form.plate.trim().toUpperCase().replace(/\s+/g, ""),
    [form.plate]
  );

  const normalizedDni = useMemo(
    () => form.dni_nie.trim().toUpperCase().replace(/\s+/g, ""),
    [form.dni_nie]
  );

  const emailOk = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  }, [form.email]);

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setMessage("");
    setVerified(false);
    setVerifyResult(null);
    setVerifyMsg("");
  };

  const validateBase = () => {
    if (!form.full_name.trim()) return "Indica el nombre completo del titular.";
    if (!normalizedDni) return "Indica el DNI/NIE del titular.";
    if (!form.phone.trim()) return "Indica un teléfono de contacto.";
    if (!form.email.trim()) return "Indica un email para enviarte la confirmación y documentación.";
    if (!emailOk) return "Indica un email válido.";
    if (!normalizedPlate) return "Indica la matrícula.";
    if (!form.city.trim()) return "Indica la ciudad o municipio donde está el vehículo.";
    return "";
  };

  const verifyDocument = async () => {
    const baseError = validateBase();
    if (baseError) {
      setVerifyMsg(baseError);
      setVerified(false);
      return;
    }

    if (!registrationFile) {
      setVerifyMsg("Sube una foto o PDF del permiso de circulación.");
      setVerified(false);
      return;
    }

    setVerifying(true);
    setVerified(false);
    setVerifyResult(null);
    setVerifyMsg("");

    const formData = new FormData();
    formData.append("file", registrationFile);
    formData.append("full_name", form.full_name.trim());
    formData.append("dni_nie", normalizedDni);
    formData.append("plate", normalizedPlate);

    try {
      const res = await fetch(`${API_BASE}/vehicle-removal/verify-registration`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      setVerifyResult(data);

      if (!res.ok) {
        throw new Error(data?.detail || "No se ha podido verificar el permiso de circulación.");
      }

      if (data.can_continue) {
        setVerified(true);
        setVerifyMsg("✅ Permiso verificado correctamente. Puedes continuar al pago.");
      } else if (data.review_required) {
        setVerified(false);
        setVerifyMsg(
          "⚠️ No se ha podido confirmar claramente la coincidencia. Revisa que la foto sea legible y que nombre, DNI/NIE y matrícula correspondan al titular."
        );
      } else {
        setVerified(false);
        setVerifyMsg(
          "❌ Los datos no coinciden con el permiso de circulación. Revisa nombre completo, DNI/NIE y matrícula."
        );
      }
    } catch (err) {
      setVerified(false);
      setVerifyMsg(err.message || "Error verificando el permiso de circulación.");
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const baseError = validateBase();
    if (baseError) {
      setMessage(baseError);
      return;
    }

    if (!verified) {
      setMessage("Antes de pagar debes verificar el permiso de circulación.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_BASE}/vehicle-removal/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.full_name.trim(),
          full_name: form.full_name.trim(),
          dni_nie: normalizedDni,
          phone: form.phone.trim(),
          email: form.email.trim(),
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
          background: "rgba(255,255,255,0.9)",
          borderRadius: 22,
          padding: "34px 24px",
          boxShadow: "0 12px 35px rgba(0,0,0,0.08)",
        }}
      >
        {paidOk && (
          <div
            style={{
              marginBottom: 24,
              border: "1px solid #bbf7d0",
              background: "#ecfdf5",
              color: "#065f46",
              borderRadius: 18,
              padding: 18,
            }}
          >
            <h2 style={{ margin: "0 0 8px", fontSize: 24 }}>
              ✅ Pago realizado correctamente
            </h2>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              Hemos recibido tu solicitud. Te enviaremos la confirmación y próximos pasos por email.
            </p>
            {caseId && (
              <p style={{ margin: "10px 0 0", fontSize: 13 }}>
                Referencia interna: <strong>{caseId}</strong>
              </p>
            )}
          </div>
        )}

        {cancelled && (
          <div
            style={{
              marginBottom: 24,
              border: "1px solid #fed7aa",
              background: "#fff7ed",
              color: "#9a3412",
              borderRadius: 18,
              padding: 18,
            }}
          >
            <h2 style={{ margin: "0 0 8px", fontSize: 22 }}>
              Pago cancelado
            </h2>
            <p style={{ margin: 0 }}>
              No se ha completado el pago. Puedes volver a intentarlo cuando quieras.
            </p>
          </div>
        )}

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
          <Card title="✅ Verificación previa" text="Comprobamos que el permiso de circulación coincide con los datos indicados." />
          <Card title="📩 Email obligatorio" text="Lo necesitamos para enviarte confirmación, seguimiento y documentación." />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 430px)",
            gap: 24,
            marginTop: 34,
          }}
        >
          <div>
            <h2 style={{ fontSize: 26, marginTop: 0 }}>¿Qué incluye?</h2>
            <ul style={{ lineHeight: 2, color: "#374151", paddingLeft: 22 }}>
              <li>Revisión inicial del caso.</li>
              <li>Verificación del titular y matrícula con el permiso de circulación.</li>
              <li>Gestión de contacto con vía autorizada.</li>
              <li>Seguimiento por email hasta completar la gestión.</li>
            </ul>

            <div
              style={{
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                color: "#1e3a8a",
                padding: 16,
                borderRadius: 16,
                marginTop: 18,
              }}
            >
              <strong>Dato importante:</strong> el nombre completo y el DNI/NIE deben
              corresponder al titular/propietario que consta en la documentación del vehículo.
            </div>

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

            <Field
              label="Nombre completo del titular"
              value={form.full_name}
              onChange={(v) => update("full_name", v)}
              placeholder="Nombre y apellidos"
            />

            <Field
              label="DNI/NIE del titular"
              value={form.dni_nie}
              onChange={(v) => update("dni_nie", v)}
              placeholder="Ej. 12345678Z"
            />

            <Field
              label="Teléfono"
              value={form.phone}
              onChange={(v) => update("phone", v)}
              placeholder="Ej. 600 000 000"
            />

            <Field
              label="Email para confirmación y documentación"
              value={form.email}
              onChange={(v) => update("email", v)}
              placeholder="tu@email.com"
              type="email"
            />

            <Field
              label="Matrícula"
              value={form.plate}
              onChange={(v) => update("plate", v)}
              placeholder="Ej. 3148BSS"
            />

            <Field
              label="Ciudad o municipio"
              value={form.city}
              onChange={(v) => update("city", v)}
              placeholder="Ej. Talamanca"
            />

            <label style={{ display: "block", marginBottom: 14 }}>
              <span style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>
                Foto o PDF del permiso de circulación
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  setRegistrationFile(e.target.files?.[0] || null);
                  setVerified(false);
                  setVerifyResult(null);
                  setVerifyMsg("");
                  setMessage("");
                }}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  border: "1px solid #d1d5db",
                  borderRadius: 12,
                  padding: "10px",
                  fontSize: 14,
                  background: "#f9fafb",
                }}
              />
              <small style={{ display: "block", marginTop: 6, color: "#6b7280", lineHeight: 1.4 }}>
                Debe verse la matrícula y los datos del titular. Formatos aceptados: imagen o PDF.
              </small>
            </label>

            <button
              type="button"
              onClick={verifyDocument}
              disabled={verifying || !registrationFile}
              style={{
                width: "100%",
                background: verified ? "#059669" : verifying ? "#94a3b8" : "#0b4aa2",
                color: "white",
                border: 0,
                borderRadius: 14,
                padding: "12px 16px",
                fontWeight: 900,
                cursor: verifying || !registrationFile ? "not-allowed" : "pointer",
                fontSize: 15,
                marginBottom: 12,
              }}
            >
              {verifying ? "Verificando permiso..." : verified ? "✅ Permiso verificado" : "Verificar permiso de circulación"}
            </button>

            {verifyMsg && (
              <div
                style={{
                  marginBottom: 14,
                  borderRadius: 14,
                  padding: 12,
                  fontWeight: 700,
                  fontSize: 14,
                  color: verified ? "#065f46" : "#92400e",
                  background: verified ? "#ecfdf5" : "#fffbeb",
                  border: verified ? "1px solid #bbf7d0" : "1px solid #fde68a",
                  lineHeight: 1.5,
                }}
              >
                {verifyMsg}
              </div>
            )}

            {verifyResult?.checks && (
              <div
                style={{
                  marginBottom: 14,
                  borderRadius: 14,
                  padding: 12,
                  fontSize: 13,
                  color: "#374151",
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                  lineHeight: 1.6,
                }}
              >
                <strong>Resultado verificación:</strong>
                <br />
                Matrícula: {verifyResult.checks.plate_match ? "✅ coincide" : "❌ no coincide"}
                <br />
                DNI/NIE: {verifyResult.checks.dni_match ? "✅ coincide" : "⚠️ no detectado/no coincide"}
                <br />
                Titular: {verifyResult.checks.name_match ? "✅ coincide" : "⚠️ no detectado/no coincide"}
              </div>
            )}

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
              disabled={!verified || loading}
              style={{
                width: "100%",
                background: !verified || loading ? "#94a3b8" : "#2bb673",
                color: "white",
                border: 0,
                borderRadius: 14,
                padding: "14px 18px",
                fontWeight: 900,
                cursor: !verified || loading ? "not-allowed" : "pointer",
                fontSize: 16,
              }}
            >
              {loading ? "Preparando pago..." : verified ? "Continuar al pago" : "Verifica el permiso para continuar"}
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

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label style={{ display: "block", marginBottom: 14 }}>
      <span style={{ display: "block", fontWeight: 700, marginBottom: 6 }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || ""}
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
