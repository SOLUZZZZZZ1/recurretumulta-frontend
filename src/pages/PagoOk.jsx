// src/pages/PagoOk.jsx — Último paso post‑pago (datos + autorización)
import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Seo from "../components/Seo.jsx";

const API = "/api";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

async function fetchJson(url, options = {}) {
  const r = await fetch(url, options);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.detail || data?.message || "Error API");
  return data;
}

export default function PagoOk() {
  const q = useQuery();
  const navigate = useNavigate();
  const caseId = q.get("case") || "";

  const [form, setForm] = useState({
    full_name: "",
    dni: "",
    address: "",
    email: "",
    phone: "",
  });
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [okMsg, setOkMsg] = useState("");
  const [err, setErr] = useState("");

  function setField(name, value) {
    setForm((p) => ({ ...p, [name]: value }));
  }

  async function submit() {
    setErr("");
    setOkMsg("");

    if (!caseId) return setErr("Falta el expediente interno.");
    if (!form.full_name.trim()) return setErr("Introduce tu nombre y apellidos.");
    if (!form.dni.trim()) return setErr("Introduce tu DNI/NIE.");
    if (!form.address.trim()) return setErr("Introduce tu domicilio a efectos de notificaciones.");
    if (!form.email.trim()) return setErr("Introduce un email válido.");
    if (!checked) return setErr("Debes marcar la casilla de autorización para continuar.");

    setLoading(true);
    try {
      // 1) Guardar datos del interesado (si el backend tiene endpoint).
      // Si aún no existe, guardamos en localStorage como fallback.
      try {
        await fetchJson(`${API}/cases/${encodeURIComponent(caseId)}/details`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } catch {
        localStorage.setItem(`rtm_details_${caseId}`, JSON.stringify(form));
      }

      // 2) Autorizar presentación (1 click)
      await fetchJson(`${API}/cases/${encodeURIComponent(caseId)}/authorize`, {
        method: "POST",
      });

      setOkMsg("✅ Datos confirmados y autorización registrada. Nuestro equipo puede presentar tu recurso.");
      setTimeout(() => {
        navigate(`/resumen?case=${encodeURIComponent(caseId)}`);
      }, 800);
    } catch (e) {
      setErr(e?.message || "No se pudo completar el último paso.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Seo
        title="Último paso · RecurreTuMulta"
        description="Confirmación de datos y autorización para presentar el recurso."
        canonical="https://www.recurretumulta.eu/pago-ok"
      />

      <main className="sr-container py-12" style={{ minHeight: "calc(100vh - 160px)" }}>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <h1 className="sr-h1">Último paso para presentar tu recurso</h1>
          <Link to="/" className="sr-btn-secondary">← Inicio</Link>
        </div>

        <div className="sr-card">
          <p className="sr-p" style={{ marginTop: 0 }}>
            Para poder presentar el recurso en tu nombre de forma correcta y conforme a la normativa, necesitamos:
          </p>
          <ul className="sr-p" style={{ marginTop: 0, paddingLeft: 18 }}>
            <li>confirmar tus datos personales</li>
            <li>y contar con tu autorización expresa</li>
          </ul>
          <p className="sr-p">
            Este paso es <strong>obligatorio</strong> y forma parte del trámite administrativo.{" "}
            <strong>No te llevará más de 1 minuto.</strong>
          </p>

          <div className="sr-small" style={{ color: "#6b7280", marginTop: 10 }}>
            Expediente interno:{" "}
            <span style={{ fontFamily: "ui-monospace, Menlo, Monaco, Consolas, monospace" }}>
              {caseId || "—"}
            </span>
          </div>

          <h3 className="sr-h3" style={{ marginTop: 18 }}>Datos del interesado</h3>
          <p className="sr-small" style={{ color: "#6b7280", marginTop: 6 }}>
            Estos datos se utilizarán exclusivamente para la presentación del recurso.
          </p>

          <div className="grid gap-3" style={{ maxWidth: 720, marginTop: 10 }}>
            <div>
              <label className="sr-small" style={{ fontWeight: 800 }}>Nombre y apellidos</label>
              <input className="sr-input" value={form.full_name} onChange={(e) => setField("full_name", e.target.value)} />
            </div>
            <div>
              <label className="sr-small" style={{ fontWeight: 800 }}>DNI / NIE</label>
              <input className="sr-input" value={form.dni} onChange={(e) => setField("dni", e.target.value.toUpperCase())} />
            </div>
            <div>
              <label className="sr-small" style={{ fontWeight: 800 }}>Domicilio a efectos de notificaciones</label>
              <input
                className="sr-input"
                placeholder="Calle, número, piso, CP, ciudad, provincia"
                value={form.address}
                onChange={(e) => setField("address", e.target.value)}
              />
              <div className="sr-small" style={{ color: "#6b7280", marginTop: 6 }}>
                Las notificaciones posteriores las recibirá directamente el interesado.
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="sr-small" style={{ fontWeight: 800 }}>Email</label>
                <input className="sr-input" type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} />
              </div>
              <div>
                <label className="sr-small" style={{ fontWeight: 800 }}>Teléfono (opcional)</label>
                <input className="sr-input" type="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
              </div>
            </div>
          </div>

          <h3 className="sr-h3" style={{ marginTop: 18 }}>Autorización</h3>

          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 10 }}>
            <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
            <span className="sr-small">
              Al continuar, confirmo que los datos facilitados son correctos y autorizo a{" "}
              <strong>LA TALAMANQUINA, S.L.</strong> (titular de RecurreTuMulta) a presentar el recurso en mi nombre y a
              gestionar el justificante oficial de registro.
            </span>
          </label>

          {err && (
            <div className="sr-small" style={{ marginTop: 12, color: "#991b1b" }}>
              ❌ {err}
            </div>
          )}
          {okMsg && (
            <div className="sr-small" style={{ marginTop: 12, color: "#166534" }}>
              {okMsg}
            </div>
          )}

          <div className="sr-cta-row" style={{ justifyContent: "flex-start", marginTop: 14 }}>
            <button className="sr-btn-primary" onClick={submit} disabled={loading}>
              {loading ? "Guardando…" : "Confirmar datos y autorizar presentación"}
            </button>
            <Link to={`/resumen?case=${encodeURIComponent(caseId)}`} className="sr-btn-secondary">
              Volver al expediente
            </Link>
          </div>

          <div className="sr-small" style={{ marginTop: 12, color: "#6b7280" }}>
            Este servicio constituye una asistencia administrativa automatizada y no sustituye el asesoramiento jurídico
            profesional ni garantiza el resultado del procedimiento.
          </div>
        </div>
      </main>
    </>
  );
}
