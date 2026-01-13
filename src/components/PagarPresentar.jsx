// src/components/PagarPresentar.jsx — UX final sin bucles ni OPS
import React, { useEffect, useState } from "react";

const API = "/api";

async function fetchJson(url, options = {}) {
  const r = await fetch(url, options);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.detail || "Error API");
  return data;
}

export default function PagarPresentar({ caseId }) {
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
          product: "DGT_PRESENTACION",
          email: "cliente@ejemplo.com",
        }),
      });

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  // NO PAGADO
  if (!status || status.payment_status !== "paid") {
    return (
      <div className="sr-card mt-6">
        <h3 className="sr-h3">Presentar por nosotros</h3>
        <p className="sr-p">
          Pagas solo si presentamos el recurso en tu nombre y te entregamos el justificante oficial.
        </p>
        {err && <div className="sr-small" style={{ color: "#991b1b" }}>❌ {err}</div>}
        <button className="sr-btn-primary" onClick={pagar} disabled={loading}>
          {loading ? "Redirigiendo…" : "Pagar y presentar"}
        </button>
      </div>
    );
  }

  // PAGADO PERO NO AUTORIZADO
  if (status.payment_status === "paid" && !status.authorized) {
    return (
      <div className="sr-card mt-6">
        <h3 className="sr-h3">Último paso</h3>
        <p className="sr-p">
          Para poder presentar el recurso necesitamos confirmar tus datos y tu autorización.
        </p>
        <button
          className="sr-btn-primary"
          onClick={() => {
            window.location.href = `/#/pago-ok?case=${encodeURIComponent(caseId)}`;
          }}
        >
          Continuar
        </button>
      </div>
    );
  }

  // PAGADO + AUTORIZADO → FIN
  return (
    <div className="sr-card mt-6">
      <h3 className="sr-h3">Expediente en curso</h3>
      <p className="sr-p">
        Pago y autorización registrados correctamente.  
        Nuestro equipo procederá a presentar el recurso y te avisaremos por email.
      </p>
    </div>
  );
}
