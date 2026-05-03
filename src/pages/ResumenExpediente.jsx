import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Seo from "../components/Seo.jsx";
import PagarPresentar from "../components/PagarPresentar.jsx";
import AppendDocuments from "../components/AppendDocuments.jsx";
import ContactoExpediente from "../components/ContactoExpediente.jsx";

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

function isDevSandbox(searchParams) {
  const stored = window.localStorage.getItem("rtm_dev_mode") === "1";
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  return searchParams.get("dev") === "1" || stored || isLocalhost;
}

function getMockStatus(caseId) {
  try {
    const raw = window.localStorage.getItem(`rtm_mock_case_${caseId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveMockStatus(caseId, patch = {}) {
  const prev = getMockStatus(caseId) || {};
  const next = { ...prev, ...patch };
  window.localStorage.setItem(`rtm_mock_case_${caseId}`, JSON.stringify(next));
  return next;
}

function normalizeText(value = "") {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function parseSpanishDate(value) {
  if (!value) return null;
  const raw = String(value).trim();

  let m = raw.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/);
  if (m) {
    const dd = Number(m[1]);
    const mm = Number(m[2]);
    let yyyy = Number(m[3]);
    if (yyyy < 100) yyyy += 2000;
    if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12) {
      return new Date(yyyy, mm - 1, dd, 23, 59, 59);
    }
  }

  m = raw.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    const yyyy = Number(m[1]);
    const mm = Number(m[2]);
    const dd = Number(m[3]);
    if (dd >= 1 && dd <= 31 && mm >= 1 && mm <= 12) {
      return new Date(yyyy, mm - 1, dd, 23, 59, 59);
    }
  }

  return null;
}

function findDeadline(publicStatus) {
  const candidates = [
    publicStatus?.deadline,
    publicStatus?.fecha_limite,
    publicStatus?.fecha_limite_pago,
    publicStatus?.plazo_hasta,
    publicStatus?.due_date,
    publicStatus?.extracted?.fecha_limite,
    publicStatus?.extracted?.fecha_limite_pago,
    publicStatus?.extracted?.plazo_recurso_sugerido,
    publicStatus?.message,
  ];

  for (const c of candidates) {
    const parsed = parseSpanishDate(c);
    if (parsed) return parsed;
  }

  return null;
}

function isOutOfTime(publicStatus) {
  const blob = normalizeText(JSON.stringify(publicStatus || {}));

  const explicitExpired = [
    "fuera de plazo",
    "plazo vencido",
    "plazo caducado",
    "expired",
    "out_of_time",
    "deadline_passed",
    "caducado",
  ].some((x) => blob.includes(x));

  if (explicitExpired) return true;

  const deadline = findDeadline(publicStatus);
  if (!deadline) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return deadline < today;
}

function Row({ label, value }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        gap: 10,
        padding: "8px 0",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <div className="sr-small" style={{ fontWeight: 800 }}>
        {label}
      </div>
      <div className="sr-p" style={{ margin: 0 }}>
        {value ?? "—"}
      </div>
    </div>
  );
}

function ManualReviewNotice({ outOfTime }) {
  if (outOfTime) {
    return (
      <div className="sr-card" style={{ background: "#fef2f2", border: "1px solid #fecaca", marginTop: 14 }}>
        <h3 className="sr-h3" style={{ marginTop: 0, color: "#991b1b" }}>
          ❌ Este expediente parece fuera de plazo
        </h3>
        <p className="sr-p" style={{ marginBottom: 0 }}>
          No permitimos continuar automáticamente cuando el plazo aparece vencido. Si crees que hay un error
          en la fecha o tienes una notificación posterior, sube la documentación adicional para revisión.
        </p>
      </div>
    );
  }

  return (
    <div className="sr-card" style={{ background: "#fffbeb", border: "1px solid #fde68a", marginTop: 14 }}>
      <h3 className="sr-h3" style={{ marginTop: 0 }}>
        🟡 Revisión manual activada
      </h3>
      <p className="sr-p" style={{ marginBottom: 0 }}>
        Durante las primeras multas revisaremos manualmente cada expediente antes de presentarlo. La IA ayuda a
        preparar el caso, pero nuestro equipo validará plazos, datos, organismo, hecho denunciado y estrategia.
      </p>
    </div>
  );
}

export default function ResumenExpediente() {
  const q = useQuery();
  const caseId = q.get("case") || "";
  const devMode = isDevSandbox(q);

  const [publicStatus, setPublicStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function refresh(runReview = false) {
    if (!caseId) return;
    setErr("");
    setLoading(true);

    try {
      if (devMode) {
        const mock = getMockStatus(caseId) || {
          status: "manual_review",
          message: "Modo prueba: expediente creado y enviado a revisión manual.",
          payment_status: "pending",
          authorized: false,
        };
        setPublicStatus(mock);
        return;
      }

      if (runReview) {
        try {
          await fetchJson(`${API}/cases/${encodeURIComponent(caseId)}/review`, {
            method: "POST",
          });
        } catch {
          // Si la revisión automática falla, no bloqueamos el flujo manual.
        }
      }

      const st = await fetchJson(`${API}/cases/${encodeURIComponent(caseId)}/public-status`);
      setPublicStatus(st);
    } catch (e) {
      setErr(e.message || "No se pudo revisar el expediente.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!caseId) return;
    refresh(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, devMode]);

  const status = publicStatus?.status || "uploaded";
  const outOfTime = isOutOfTime(publicStatus);
  const deadline = findDeadline(publicStatus);

  function applyDevStatus(nextStatus) {
    if (!caseId) return;

    const messages = {
      uploaded: "Modo prueba: expediente creado y pendiente de revisión manual.",
      pending_documents: "Modo prueba: puedes subir más documentos, pero no se bloquea el pago salvo plazo vencido.",
      awaiting_authorization: "Modo prueba: falta autorización firmada.",
      ready_to_pay: "Modo prueba: expediente listo para autorización/pago y revisión manual.",
      paid: "Modo prueba: pago simulado correctamente.",
      out_of_time: "Modo prueba: expediente fuera de plazo.",
    };

    const patch = {
      status: nextStatus,
      message: messages[nextStatus] || "Modo prueba activo.",
      payment_status: nextStatus === "paid" ? "paid" : "pending",
      authorized: nextStatus === "ready_to_pay" || nextStatus === "paid",
    };

    const next = saveMockStatus(caseId, patch);
    setPublicStatus(next);
  }

  return (
    <>
      <Seo title="Resumen del expediente · RecurreTuMulta" />

      <main className="sr-container py-12" style={{ minHeight: "calc(100vh - 160px)" }}>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <h1 className="sr-h1">Resumen del expediente</h1>
          <Link to="/" className="sr-btn-secondary">
            ← Volver
          </Link>
        </div>

        {devMode && (
          <div className="sr-card" style={{ background: "#fffbeb", border: "1px solid #fde68a", marginBottom: 14 }}>
            <h3 className="sr-h3" style={{ marginTop: 0 }}>🧪 Sandbox de prueba</h3>
            <p className="sr-p">
              Este modo permite probar el flujo manual sin una multa real.
            </p>
            <div className="sr-cta-row" style={{ justifyContent: "flex-start", flexWrap: "wrap" }}>
              <button className="sr-btn-secondary" onClick={() => applyDevStatus("uploaded")}>Expediente creado</button>
              <button className="sr-btn-secondary" onClick={() => applyDevStatus("awaiting_authorization")}>Falta autorización</button>
              <button className="sr-btn-secondary" onClick={() => applyDevStatus("pending_documents")}>Faltan documentos</button>
              <button className="sr-btn-secondary" onClick={() => applyDevStatus("ready_to_pay")}>Listo para pago</button>
              <button className="sr-btn-secondary" onClick={() => applyDevStatus("paid")}>Pago simulado</button>
              <button className="sr-btn-secondary" onClick={() => applyDevStatus("out_of_time")}>Fuera de plazo</button>
            </div>
          </div>
        )}

        <div className="sr-card">
          <Row label="Expediente interno" value={caseId} />
          <Row label="Estado" value={outOfTime ? "Fuera de plazo" : "Revisión manual"} />
          <Row label="Estado técnico" value={status} />
          <Row label="Autorización firmada" value={publicStatus?.authorized ? "Recibida" : "Pendiente"} />
          <Row label="Pago" value={publicStatus?.payment_status || "Pendiente"} />
          <Row label="Fecha límite detectada" value={deadline ? deadline.toLocaleDateString("es-ES") : "No detectada"} />

          <div style={{ marginTop: 10 }}>
            <div className="sr-small" style={{ fontWeight: 800 }}>
              Estado del expediente
            </div>
            <div className="sr-p" style={{ margin: 0 }}>
              {loading
                ? "Revisando documentación…"
                : outOfTime
                ? "El expediente parece fuera de plazo. No se permite continuar automáticamente."
                : "Expediente recibido. Continuará a revisión manual antes de presentar."}
            </div>
          </div>

          {publicStatus?.message && !outOfTime && (
            <div className="sr-small" style={{ marginTop: 8, color: "#64748b" }}>
              Mensaje técnico: {publicStatus.message}
            </div>
          )}

          {err && (
            <div className="sr-small" style={{ marginTop: 10, color: "#991b1b" }}>
              ❌ {err}
            </div>
          )}

          <div className="sr-cta-row" style={{ justifyContent: "flex-start", marginTop: 12 }}>
            <button className="sr-btn-secondary" onClick={() => refresh(true)} disabled={loading}>
              {loading ? "Revisando…" : "Revisar de nuevo"}
            </button>
          </div>
        </div>

        <ManualReviewNotice outOfTime={outOfTime} />

        {status === "pending_documents" && !outOfTime && (
          <div style={{ marginTop: 14 }}>
            <div className="sr-card">
              <h3 className="sr-h3" style={{ marginTop: 0 }}>
                Puedes añadir más documentación
              </h3>
              <p className="sr-p" style={{ marginBottom: 0 }}>
                Si tienes una notificación posterior, resolución o foto adicional, puedes subirla. En modo revisión manual,
                esto no bloquea continuar salvo que el plazo esté vencido.
              </p>
              <ContactoExpediente caseId={caseId} publicStatus={publicStatus} onSaved={() => refresh(false)} />
            </div>
            <AppendDocuments caseId={caseId} onDone={() => refresh(true)} />
          </div>
        )}

        {!outOfTime && (
          <div style={{ marginTop: 14 }}>
            <div className="sr-card">
              <h3 className="sr-h3" style={{ marginTop: 0 }}>
                Continuar con revisión y gestión
              </h3>
              <p className="sr-p" style={{ marginBottom: 0 }}>
                Aunque la viabilidad sea baja, media o alta, puedes continuar. Solo bloqueamos automáticamente cuando
                el expediente está fuera de plazo. Antes de presentar, el equipo revisará manualmente el caso.
              </p>
            </div>

            {devMode ? (
              <div className="sr-card">
                <p className="sr-p" style={{ marginTop: 0 }}>
                  🧪 <strong>Modo prueba:</strong> el pago real está desactivado.
                </p>
                <div className="sr-cta-row" style={{ justifyContent: "flex-start" }}>
                  <button className="sr-btn-primary" onClick={() => applyDevStatus("paid")}>
                    Simular pago
                  </button>
                  <Link to={`/autorizar?case=${encodeURIComponent(caseId)}&dev=1`} className="sr-btn-secondary">
                    Ir a autorización
                  </Link>
                </div>
              </div>
            ) : (
              <PagarPresentar caseId={caseId} manualReviewMode />
            )}
          </div>
        )}

        {outOfTime && (
          <div style={{ marginTop: 14 }}>
            <AppendDocuments caseId={caseId} onDone={() => refresh(true)} />
          </div>
        )}
      </main>
    </>
  );
}
