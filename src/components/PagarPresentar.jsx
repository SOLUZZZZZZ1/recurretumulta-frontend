import { useEffect, useMemo, useState } from "react";

const DIRECT_BACKEND = "https://recurretumulta-backend.onrender.com";

const API_CANDIDATES = [
  "/api",
  import.meta.env.VITE_API_BASE_URL,
  import.meta.env.VITE_API_URL,
  DIRECT_BACKEND,
].filter(Boolean);

function buildUrl(base, path) {
  return `${String(base || "").replace(/\/$/, "")}${path}`;
}

async function readResponse(response) {
  const text = await response.text().catch(() => "");
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    const detail = data?.detail || data?.message || text || `HTTP ${response.status}`;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }

  return data;
}

async function fetchJsonFallback(path, options = {}) {
  const errors = [];

  for (const base of API_CANDIDATES) {
    const url = buildUrl(base, path);

    try {
      const response = await fetch(url, options);
      return await readResponse(response);
    } catch (e) {
      errors.push(`${url} → ${e?.message || "Error"}`);
    }
  }

  throw new Error(errors.join(" | "));
}

function getEmail(publicStatus) {
  return (
    publicStatus?.interested_data?.email ||
    publicStatus?.contact_email ||
    publicStatus?.email ||
    ""
  );
}

function isAuthorizedForPayment(publicStatus, billingAuthorized) {
  if (billingAuthorized) return true;
  if (!publicStatus) return false;

  const msg = String(publicStatus?.message || "").toLowerCase();
  const signedLabel = String(
    publicStatus?.authorization_signed ||
      publicStatus?.authorization_status ||
      publicStatus?.authorization_firmada ||
      ""
  ).toLowerCase();

  return (
    publicStatus?.authorized === true ||
    publicStatus?.authorized === "true" ||
    signedLabel === "true" ||
    signedLabel === "received" ||
    signedLabel === "recibida" ||
    publicStatus?.status === "ready_to_pay" ||
    publicStatus?.status === "manual_review" ||
    publicStatus?.status === "in_review" ||
    msg.includes("ya tenemos tu autorización") ||
    msg.includes("ya tenemos tu autorizacion") ||
    msg.includes("autorización firmada") ||
    msg.includes("autorizacion firmada")
  );
}

export default function PagarPresentar({ caseId, publicStatus, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [debug, setDebug] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [billingAuthorized, setBillingAuthorized] = useState(false);

  const email = useMemo(() => getEmail(publicStatus), [publicStatus]);

  const paid =
    publicStatus?.payment_status === "paid" ||
    paymentStatus === "paid";

  const canPay = isAuthorizedForPayment(publicStatus, billingAuthorized);

  useEffect(() => {
    async function loadPaymentStatus() {
      if (!caseId) return;

      try {
        const data = await fetchJsonFallback(`/billing/status/${caseId}`);
        setPaymentStatus(data?.payment_status || "");

        if (data?.authorized === true || data?.authorized === "true") {
          setBillingAuthorized(true);
        }
      } catch {
        // No bloqueamos la pantalla si este estado falla.
      }
    }

    loadPaymentStatus();
  }, [caseId]);

  async function startCheckout() {
    setMsg("");
    setDebug("");

    if (!caseId) {
      setMsg("❌ No se ha encontrado el expediente.");
      return;
    }

    if (!canPay) {
      setMsg("❌ Primero completa la autorización del expediente.");
      return;
    }

    if (!email) {
      setMsg("❌ Falta el email del interesado. Vuelve a autorización y guarda los datos.");
      return;
    }

    setLoading(true);

    try {
      const data = await fetchJsonFallback("/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          case_id: caseId,
          product: "dgt",
          email,
          locale: "es",
        }),
      });

      if (data?.already_paid) {
        setPaymentStatus("paid");
        setMsg("✅ Este expediente ya está pagado.");
        if (typeof onUpdated === "function") await onUpdated();
        return;
      }

      const url = data?.url || data?.redirect;

      if (!url) {
        throw new Error("El backend no devolvió URL de Stripe.");
      }

      window.location.assign(url);
    } catch (e) {
      setMsg("❌ No se pudo iniciar el pago.");
      setDebug(e?.message || "");
    } finally {
      setLoading(false);
    }
  }

  if (paid) {
    return (
      <div className="sr-card">
        <h3 className="sr-h3">Gestión iniciada</h3>
        <p className="sr-p">
          Pago y autorización registrados correctamente. Te avisaremos con los próximos pasos
          y el estado de la tramitación.
        </p>
      </div>
    );
  }

  return (
    <div className="sr-card">
      <h3 className="sr-h3">Continuar con la gestión</h3>

      <p className="sr-p">
        Ya tenemos tu autorización. Ahora puedes iniciar la gestión para que preparemos
        el recurso y tramitemos el caso en tu nombre.
      </p>

      {!canPay ? (
        <div
          style={{
            background: "#fff7ed",
            color: "#9a3412",
            border: "1px solid #fed7aa",
            borderRadius: 14,
            padding: 12,
            marginBottom: 14,
            fontWeight: 800,
          }}
        >
          Primero completa la autorización del expediente.
        </div>
      ) : null}

      <div className="sr-cta-row" style={{ justifyContent: "flex-start" }}>
        <button
          type="button"
          className="sr-btn-primary"
          onClick={startCheckout}
          disabled={loading}
        >
          {loading ? "Redirigiendo…" : "Pagar e iniciar gestión"}
        </button>
      </div>

      {msg ? (
        <div
          style={{
            marginTop: 14,
            color: msg.startsWith("✅") ? "#166534" : "#991b1b",
            fontWeight: 900,
          }}
        >
          {msg}
        </div>
      ) : null}

      {debug ? (
        <div
          style={{
            marginTop: 10,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 10,
            color: "#475569",
            fontSize: 12,
            wordBreak: "break-word",
          }}
        >
          Detalle: {debug}
        </div>
      ) : null}
    </div>
  );
}
