import React, { useEffect, useMemo, useState } from "react";

const API =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "/api";

function clean(value) {
  return String(value || "").trim();
}

function unwrapInterested(publicStatus) {
  return (
    publicStatus?.interested_data ||
    publicStatus?.case?.interested_data ||
    publicStatus?.authorization_snapshot ||
    {}
  );
}

function unwrapExtracted(extracted) {
  return extracted?.extracted || extracted || {};
}

function pickInitialData(publicStatus, extracted) {
  const interested = unwrapInterested(publicStatus);
  const core = unwrapExtracted(extracted);

  return {
    full_name:
      clean(interested.full_name) ||
      clean(core.full_name) ||
      clean(core.nombre_completo) ||
      clean(core.titular) ||
      clean(core.nombre) ||
      "",
    dni_nie:
      clean(interested.dni_nie) ||
      clean(interested.dni) ||
      clean(core.dni_nie) ||
      clean(core.dni) ||
      "",
    domicilio_notif:
      clean(interested.domicilio_notif) ||
      clean(interested.address) ||
      clean(interested.domicilio) ||
      clean(core.domicilio_notif) ||
      clean(core.domicilio) ||
      "",
    email:
      clean(interested.email) ||
      clean(publicStatus?.contact_email) ||
      clean(core.email) ||
      "",
    telefono:
      clean(interested.telefono) ||
      clean(interested.phone) ||
      clean(core.telefono) ||
      clean(core.phone) ||
      "",
  };
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail = data?.detail || data?.message;
    if (typeof detail === "object" && detail?.message) {
      throw new Error(detail.message);
    }
    throw new Error(typeof detail === "string" ? detail : "No se pudo completar la operación.");
  }

  return data;
}

export default function ChecklistAprobacion({
  caseId,
  extracted,
  publicStatus,
  onUpdated,
}) {
  const initialData = useMemo(
    () => pickInitialData(publicStatus, extracted),
    [publicStatus, extracted]
  );

  const [form, setForm] = useState(initialData);
  const [acceptedText, setAcceptedText] = useState(false);
  const [confirmedIdentity, setConfirmedIdentity] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [msg, setMsg] = useState("");

  const authorized = Boolean(publicStatus?.authorized);
  const paid = publicStatus?.payment_status === "paid";

  useEffect(() => {
    setForm(initialData);
  }, [initialData]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setMsg("");
  }

  function validate() {
    if (!caseId) return "No se ha encontrado el expediente.";
    if (!clean(form.full_name)) return "Indica nombre y apellidos.";
    if (!clean(form.dni_nie)) return "Indica DNI/NIE.";
    if (!clean(form.domicilio_notif)) return "Indica domicilio a efectos de notificaciones.";
    if (!clean(form.email)) return "Indica email.";
    if (!/^\S+@\S+\.\S+$/.test(clean(form.email))) return "Indica un email válido.";
    if (!acceptedText) return "Debes aceptar la autorización para continuar.";
    if (!confirmedIdentity) return "Debes confirmar que los datos son correctos.";
    return "";
  }

  async function downloadExistingAuthorization() {
    setMsg("");
    setLoading(true);

    try {
      const data = await fetchJson(`${API}/cases/${caseId}/authorization/download`);
      const url = data?.download_url || data?.url;
      if (!url) throw new Error("No se recibió enlace de descarga.");
      setDownloadUrl(url);
      window.open(url, "_blank", "noopener,noreferrer");
      setMsg("✅ Autorización abierta para descarga.");
    } catch (err) {
      setMsg(err?.message || "No se pudo descargar la autorización.");
    } finally {
      setLoading(false);
    }
  }

  async function saveAndAuthorize() {
    const error = validate();
    if (error) {
      setMsg(error);
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      await fetchJson(`${API}/cases/${caseId}/details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: clean(form.full_name),
          dni_nie: clean(form.dni_nie).toUpperCase(),
          domicilio_notif: clean(form.domicilio_notif),
          email: clean(form.email),
          telefono: clean(form.telefono) || null,
        }),
      });

      const auth = await fetchJson(`${API}/cases/${caseId}/authorize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: "v1_dgt_homologado",
          accepted_text: true,
          confirmed_identity: true,
        }),
      });

      const url = auth?.authorization_download_url || auth?.download_url || auth?.url || "";
      if (url) {
        setDownloadUrl(url);
        window.open(url, "_blank", "noopener,noreferrer");
      }

      setMsg("✅ Autorización registrada correctamente. Puedes continuar con la gestión.");
      await onUpdated?.();
    } catch (err) {
      setMsg(err?.message || "No se pudo registrar la autorización.");
    } finally {
      setLoading(false);
    }
  }

  if (paid) {
    return (
      <div className="sr-card">
        <h3 className="sr-h3" style={{ marginTop: 0 }}>Autorización completada</h3>
        <p className="sr-p">
          Pago y autorización registrados correctamente. Puedes descargar la autorización si la necesitas.
        </p>
        <button className="sr-btn-secondary" type="button" onClick={downloadExistingAuthorization} disabled={loading}>
          {loading ? "Abriendo…" : "Descargar autorización"}
        </button>
        {msg && <p className="sr-small" style={{ marginTop: 10, color: msg.startsWith("✅") ? "#166534" : "#991b1b" }}>{msg}</p>}
      </div>
    );
  }

  if (authorized) {
    return (
      <div className="sr-card" style={{ border: "1px solid #bbf7d0", background: "#ecfdf5" }}>
        <h3 className="sr-h3" style={{ marginTop: 0, color: "#065f46" }}>
          Autorización registrada
        </h3>
        <p className="sr-p" style={{ color: "#065f46" }}>
          Ya tenemos tus datos y autorización. Puedes descargar el justificante y continuar con el pago.
        </p>
        <div className="sr-cta-row" style={{ justifyContent: "flex-start" }}>
          <button className="sr-btn-secondary" type="button" onClick={downloadExistingAuthorization} disabled={loading}>
            {loading ? "Abriendo…" : "Descargar autorización"}
          </button>
          {downloadUrl && (
            <a className="sr-btn-secondary" href={downloadUrl} target="_blank" rel="noreferrer">
              Abrir PDF
            </a>
          )}
        </div>
        {msg && <p className="sr-small" style={{ marginTop: 10, color: msg.startsWith("✅") ? "#166534" : "#991b1b" }}>{msg}</p>}
      </div>
    );
  }

  return (
    <div className="sr-card">
      <h3 className="sr-h3" style={{ marginTop: 0 }}>
        Completa tus datos y autorización
      </h3>
      <p className="sr-p">
        Para iniciar la gestión necesitamos tus datos y autorización expresa para actuar en tu nombre.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12 }}>
        <Field label="Nombre y apellidos" value={form.full_name} onChange={(v) => update("full_name", v)} />
        <Field label="DNI/NIE" value={form.dni_nie} onChange={(v) => update("dni_nie", v.toUpperCase())} />
        <Field label="Email" type="email" value={form.email} onChange={(v) => update("email", v)} />
        <Field label="Teléfono (opcional)" value={form.telefono} onChange={(v) => update("telefono", v)} />
      </div>

      <label style={{ display: "block", marginTop: 12 }}>
        <span style={{ display: "block", fontWeight: 800, marginBottom: 6 }}>
          Domicilio a efectos de notificaciones
        </span>
        <textarea
          value={form.domicilio_notif}
          onChange={(e) => update("domicilio_notif", e.target.value)}
          rows={3}
          placeholder="Calle, número, CP, municipio"
          style={inputStyle}
        />
      </label>

      <div
        style={{
          marginTop: 14,
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          padding: 14,
          color: "#334155",
          lineHeight: 1.55,
        }}
      >
        Autorizo a <strong>LA TALAMANQUINA, S.L. (RecurreTuMulta)</strong> a actuar en mi nombre
        para la preparación y tramitación administrativa del expediente asociado a esta multa,
        incluyendo la presentación de alegaciones y/o recursos ante el organismo competente.
      </div>

      <label style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "flex-start" }}>
        <input type="checkbox" checked={acceptedText} onChange={(e) => setAcceptedText(e.target.checked)} style={{ marginTop: 4 }} />
        <span className="sr-small">Acepto la autorización de representación para este expediente.</span>
      </label>

      <label style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "flex-start" }}>
        <input type="checkbox" checked={confirmedIdentity} onChange={(e) => setConfirmedIdentity(e.target.checked)} style={{ marginTop: 4 }} />
        <span className="sr-small">Confirmo que los datos indicados son correctos.</span>
      </label>

      <div className="sr-cta-row" style={{ marginTop: 16, justifyContent: "flex-start" }}>
        <button className="sr-btn-primary" type="button" onClick={saveAndAuthorize} disabled={loading}>
          {loading ? "Registrando…" : "Autorizar y descargar PDF"}
        </button>
      </div>

      {msg && (
        <p className="sr-small" style={{ marginTop: 10, color: msg.startsWith("✅") ? "#166534" : "#991b1b", fontWeight: 800 }}>
          {msg}
        </p>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ display: "block", fontWeight: 800, marginBottom: 6 }}>{label}</span>
      <input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} style={inputStyle} />
    </label>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: "11px 12px",
  fontSize: 15,
  background: "#fff",
};
