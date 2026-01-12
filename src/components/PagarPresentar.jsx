// PagarPresentar.jsx — lógica final sin bucles
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "/api";

async function fetchJson(url, options = {}) {
  const r = await fetch(url, options);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.detail || "Error API");
  return data;
}

export default function PagarPresentar({ caseId, productDefault = "DGT_PRESENTACION" }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!caseId) return;
    fetchJson(`${API}/billing/status/${encodeURIComponent(caseId)}`)
      .then(setStatus)
      .catch(() => setStatus(null));
  }, [caseId]);

  async function pagar() {
    setErr("");
    setLoading(true);
    try {
      const data = await fetchJson(`${API}/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: caseId,
          product: productDefault,
          email: status?.contact_email || "cliente@ejemplo.com",
        }),
      });

      if (data.already_paid) {
        navigate(`/resumen?case=${encodeURIComponent(caseId)}`);
        return;
      }
      window.location.href = data.url;
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  // 1) No pagado
  if (!status || status.payment_status !== "paid") {
    return (
      <div className="sr-card mt-4">
        <h3 className="sr-h3">Presentar por nosotros</h3>
        <p className="sr-p">Pagas solo si presentamos el recurso en tu nombre.</p>
        {err && <div className="sr-small" style={{ color: "#991b1b" }}>❌ {err}</div>}
        <button className="sr-btn-primary" onClick={pagar} disabled={loading}>
          {loading ? "Redirigiendo…" : "Pagar y presentar"}
        </button>
      </div>
    );
  }

  // 2) Pagado pero NO autorizado → ir UNA sola vez a PagoOk
  if (status.payment_status === "paid" && status.authorized === false) {
    return (
      <div className="sr-card mt-4">
        <h3 className="sr-h3">Pago confirmado</h3>
        <p className="sr-p">Último paso: confirmar datos y autorizar la presentación.</p>
        <button
          className="sr-btn-primary"
          onClick={() => navigate(`/pago-ok?case=${encodeURIComponent(caseId)}`)}
        >
          Continuar
        </button>
      </div>
    );
  }

  // 3) Pagado Y autorizado → nunca volver a PagoOk
  return (
    <div className="sr-card mt-4">
      <h3 className="sr-h3">Listo para presentar</h3>
      <p className="sr-p">Pago y autorización registrados. Nuestro equipo procederá.</p>
      <button
        className="sr-btn-secondary"
        onClick={() => navigate(`/resumen?case=${encodeURIComponent(caseId)}`)}
      >
        Ver estado del expediente
      </button>
    </div>
  );
}
