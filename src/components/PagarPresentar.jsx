// src/components/PagarPresentar.jsx — no repite pago si ya está pagado
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
        navigate(`/pago-ok?case=${encodeURIComponent(caseId)}`);
        return;
      }

      window.location.href = data.url;
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (status?.payment_status === "paid") {
    return (
      <div className="sr-card mt-4">
        <h3 className="sr-h3">Pago confirmado</h3>
        <p className="sr-p">
          Hemos recibido tu pago correctamente. Continúa con el último paso para autorizar la
          presentación.
        </p>
        <button
          className="sr-btn-primary"
          onClick={() => navigate(`/pago-ok?case=${encodeURIComponent(caseId)}`)}
        >
          Continuar
        </button>
      </div>
    );
  }

  return (
    <div className="sr-card mt-4">
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
