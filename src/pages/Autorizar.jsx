import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Seo from "../components/Seo.jsx";

const API = "/api";

async function fetchJson(url, options = {}) {
  const r = await fetch(url, options);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.detail?.message || data?.detail || "Error API");
  return data;
}

export default function Autorizar() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
  const caseId = params.get("case") || "";

  const [statusData, setStatusData] = useState(null);
  const [form, setForm] = useState({
    full_name: "",
    dni_nie: "",
    domicilio_notif: "",
    email: "",
    telefono: "",
  });

  const [acceptedText, setAcceptedText] = useState(false);
  const [confirmedIdentity, setConfirmedIdentity] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [okMsg, setOkMsg] = useState("");
  const [error, setError] = useState("");

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  useEffect(() => {
    if (!caseId) return;
    let cancelled = false;

    async function loadStatus() {
      setLoadingStatus(true);
      setError("");
      try {
        const data = await fetchJson(`${API}/cases/${encodeURIComponent(caseId)}/public-status`);
        if (cancelled) return;
        setStatusData(data || null);

        setForm((prev) => ({
          full_name: data?.full_name || prev.full_name || "",
          dni_nie: data?.dni_nie || prev.dni_nie || "",
          domicilio_notif: data?.domicilio_notif || prev.domicilio_notif || "",
          email: data?.email || prev.email || "",
          telefono: data?.telefono || prev.telefono || "",
        }));
      } catch (e) {
        if (!cancelled) setError(e.message || "No se pudo cargar el expediente.");
      } finally {
        if (!cancelled) setLoadingStatus(false);
      }
    }

    loadStatus();
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  async function handleAuthorize() {
    setError("");
    setOkMsg("");

    if (!caseId) return setError("Falta el expediente interno.");
    if (!form.full_name.trim()) return setError("Introduce tu nombre y apellidos.");
    if (!form.dni_nie.trim()) return setError("Introduce tu DNI / NIE.");
    if (!form.domicilio_notif.trim()) return setError("Introduce tu domicilio a efectos de notificaciones.");
    if (!form.email.trim()) return setError("Introduce un email válido.");
    if (!acceptedText) return setError("Debes aceptar el texto de autorización.");
    if (!confirmedIdentity) return setError("Debes confirmar que los datos corresponden a tu persona.");

    setLoading(true);
    try {
      await fetchJson(`${API}/cases/${encodeURIComponent(caseId)}/details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          dni_nie: form.dni_nie.trim().toUpperCase(),
          domicilio_notif: form.domicilio_notif.trim(),
          email: form.email.trim(),
          telefono: form.telefono?.trim() ? form.telefono.trim() : null,
        }),
      });

      await fetchJson(`${API}/cases/${encodeURIComponent(caseId)}/authorize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: "v1_dgt_homologado",
          accepted_text: true,
          confirmed_identity: true,
        }),
      });

      setOkMsg("✅ Autorización registrada correctamente. Ya puedes continuar al pago.");
      setTimeout(() => {
        navigate(`/resumen?case=${encodeURIComponent(caseId)}`);
      }, 900);
    } catch (e) {
      setError(e.message || "No se pudo registrar la autorización.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Seo
        title="Autorización previa al pago"
        description="Confirma tus datos y autoriza la presentación antes de pagar."
      />

      <main className="sr-container py-12">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <h1 className="sr-h1">Autorización previa al pago</h1>
          <Link to={caseId ? `/resumen?case=${encodeURIComponent(caseId)}` : "/"} className="sr-btn-secondary">
            ← Volver
          </Link>
        </div>

        <div className="sr-card">
          <p className="sr-p" style={{ marginTop: 0 }}>
            Antes de pagar, necesitamos tus datos como interesado y tu autorización expresa para poder
            presentar el recurso en tu nombre.
          </p>

          <p className="sr-p">
            <strong>Sin autorización no se permite el pago.</strong>
          </p>

          <div className="sr-small" style={{ color: "#6b7280", marginTop: 10 }}>
            Expediente interno:{" "}
            <span style={{ fontFamily: "ui-monospace, Menlo, Monaco, Consolas, monospace" }}>
              {caseId || "—"}
            </span>
          </div>

          {loadingStatus && (
            <div className="sr-small" style={{ marginTop: 12, color: "#6b7280" }}>
              Cargando expediente…
            </div>
          )}

          {error && (
            <div className="sr-small" style={{ marginTop: 12, color: "#991b1b" }}>
              ❌ {error}
            </div>
          )}

          {okMsg && (
            <div className="sr-small" style={{ marginTop: 12, color: "#166534" }}>
              {okMsg}
            </div>
          )}

          <h3 className="sr-h3" style={{ marginTop: 18 }}>Datos del interesado</h3>
          <p className="sr-small" style={{ color: "#6b7280", marginTop: 6 }}>
            Estos datos se usarán para la representación administrativa y para la presentación del recurso.
          </p>

          <div className="grid gap-3" style={{ maxWidth: 760, marginTop: 10 }}>
            <div>
              <label className="sr-small" style={{ fontWeight: 800 }}>Nombre y apellidos</label>
              <input
                className="sr-input"
                value={form.full_name}
                onChange={(e) => setField("full_name", e.target.value)}
              />
            </div>

            <div>
              <label className="sr-small" style={{ fontWeight: 800 }}>DNI / NIE / Pasaporte</label>
              <input
                className="sr-input"
                value={form.dni_nie}
                onChange={(e) => setField("dni_nie", e.target.value.toUpperCase())}
              />
            </div>

            <div>
              <label className="sr-small" style={{ fontWeight: 800 }}>Domicilio a efectos de notificaciones</label>
              <input
                className="sr-input"
                placeholder="Calle, número, piso, CP, ciudad, provincia"
                value={form.domicilio_notif}
                onChange={(e) => setField("domicilio_notif", e.target.value)}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="sr-small" style={{ fontWeight: 800 }}>Email</label>
                <input
                  className="sr-input"
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                />
              </div>
              <div>
                <label className="sr-small" style={{ fontWeight: 800 }}>Teléfono</label>
                <input
                  className="sr-input"
                  type="tel"
                  value={form.telefono}
                  onChange={(e) => setField("telefono", e.target.value)}
                />
              </div>
            </div>
          </div>

          <h3 className="sr-h3" style={{ marginTop: 18 }}>Texto de autorización</h3>

          <div className="sr-card" style={{ background: "#f9fafb" }}>
            <p className="sr-p" style={{ whiteSpace: "pre-line", margin: 0 }}>
              Yo, {form.full_name || "el/la interesado/a"}, autorizo a LA TALAMANQUINA, S.L. (RecurreTuMulta)
              a actuar en mi nombre para la tramitación administrativa del expediente asociado a este proceso,
              incluyendo la preparación y presentación de alegaciones y/o recursos ante la DGT u organismo competente,
              así como la obtención del justificante oficial de presentación.
            </p>
          </div>

          <label className="sr-small" style={{ display: "block", marginTop: 14 }}>
            <input
              type="checkbox"
              checked={acceptedText}
              onChange={(e) => setAcceptedText(e.target.checked)}
            />{" "}
            He leído y acepto el texto de autorización.
          </label>

          <label className="sr-small" style={{ display: "block", marginTop: 8 }}>
            <input
              type="checkbox"
              checked={confirmedIdentity}
              onChange={(e) => setConfirmedIdentity(e.target.checked)}
            />{" "}
            Confirmo que los datos facilitados corresponden a mi persona y son correctos.
          </label>

          <div className="sr-cta-row" style={{ justifyContent: "flex-start", marginTop: 16 }}>
            <button className="sr-btn-primary" onClick={handleAuthorize} disabled={loading}>
              {loading ? "Guardando…" : "Guardar datos y autorizar"}
            </button>

            <Link to={caseId ? `/resumen?case=${encodeURIComponent(caseId)}` : "/"} className="sr-btn-secondary">
              Volver al expediente
            </Link>
          </div>

          <div className="sr-small" style={{ marginTop: 12, color: "#6b7280" }}>
            Se registrarán la fecha, la hora, la IP y el navegador utilizado para esta autorización.
          </div>
        </div>
      </main>
    </>
  );
}
