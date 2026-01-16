// src/components/ContactoExpediente.jsx
import React, { useEffect, useState } from "react";

const API = "/api";

async function fetchJson(url, options = {}) {
  const r = await fetch(url, options);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.detail || data?.message || "Error API");
  return data;
}

export default function ContactoExpediente({ caseId, publicStatus, onSaved }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Precarga desde API si viene en publicStatus, o desde localStorage como fallback
  useEffect(() => {
    const n = publicStatus?.contact_name || publicStatus?.contactName || "";
    const e = publicStatus?.contact_email || publicStatus?.contactEmail || "";
    if (n || e) {
      setName(n);
      setEmail(e);
      return;
    }
    try {
      const raw = localStorage.getItem(`rtm_contact_${caseId}`);
      if (raw) {
        const j = JSON.parse(raw);
        if (j?.name) setName(j.name);
        if (j?.email) setEmail(j.email);
      }
    } catch {}
  }, [caseId, publicStatus]);

  function validEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());
  }

  async function save() {
    setMsg("");
    const n = (name || "").trim();
    const e = (email || "").trim();

    if (!n) {
      setMsg("Escribe tu nombre para poder asociarlo al expediente.");
      return;
    }
    if (!validEmail(e)) {
      setMsg("Introduce un correo válido (ej.: nombre@correo.com).");
      return;
    }
    if (!caseId) {
      setMsg("Falta el número de expediente.");
      return;
    }

    setSaving(true);
    try {
      // Endpoint recomendado: POST /cases/{case_id}/contact
      const data = await fetchJson(`${API}/cases/${encodeURIComponent(caseId)}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n, email: e }),
      });

      // Guardamos también en localStorage como respaldo
      try {
        localStorage.setItem(`rtm_contact_${caseId}`, JSON.stringify({ name: n, email: e }));
      } catch {}

      setMsg("✅ Datos guardados. Te avisaremos por email sobre este expediente.");
      onSaved?.(data);
    } catch (err) {
      // Si aún no existe el endpoint, al menos no rompemos el UX:
      try {
        localStorage.setItem(`rtm_contact_${caseId}`, JSON.stringify({ name: n, email: e }));
      } catch {}
      setMsg(
        (err?.message || "No se pudo guardar ahora mismo.") +
          " (Hemos guardado tus datos en este dispositivo como respaldo.)"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sr-card" style={{ marginTop: 14, textAlign: "left" }}>
      <h3 className="sr-h3" style={{ marginTop: 0 }}>
        ¿Dónde te avisamos sobre este expediente?
      </h3>

      <p className="sr-p" style={{ marginTop: 6 }}>
        Déjanos tu <b>nombre</b> y <b>correo</b> para enviarte avisos importantes (por ejemplo, si falta
        documentación o cuando el recurso pueda presentarse).
      </p>

      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr 1fr" }}>
        <div>
          <div className="sr-small" style={{ fontWeight: 800, marginBottom: 6 }}>
            Nombre
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              background: "rgba(255,255,255,0.8)",
            }}
          />
        </div>

        <div>
          <div className="sr-small" style={{ fontWeight: 800, marginBottom: 6 }}>
            Correo
          </div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            inputMode="email"
            autoComplete="email"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              background: "rgba(255,255,255,0.8)",
            }}
          />
        </div>
      </div>

      <div className="sr-cta-row" style={{ justifyContent: "flex-start", marginTop: 12 }}>
        <button type="button" className="sr-btn-secondary" onClick={save} disabled={saving}>
          {saving ? "Guardando…" : "Guardar datos"}
        </button>

        {msg && (
          <span
            className="sr-small"
            style={{ alignSelf: "center", color: msg.startsWith("✅") ? "#166534" : "#991b1b" }}
          >
            {msg}
          </span>
        )}
      </div>

      <div className="sr-small" style={{ marginTop: 8, color: "#6b7280" }}>
        Solo avisos relacionados con este expediente. No enviamos spam.
      </div>
    </div>
  );
}
