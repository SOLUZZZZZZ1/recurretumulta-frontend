import React, { useEffect, useState } from "react";

const API = "/api";

async function fetchJson(url, options = {}) {
  const r = await fetch(url, options);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.detail || "Error API");
  return data;
}

export default function PagarPresentar({ caseId, manualReviewMode = true }) {
  const [status, setStatus] = useState(null);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!caseId) return;

    fetchJson(`${API}/billing/status/${encodeURIComponent(caseId)}`)
      .then(setStatus)
      .catch(() => setStatus(null));

    fetchJson(`${API}/billing/quote-dgt/${encodeURIComponent(caseId)}`)
      .then(setQuote)
      .catch(() => setQuote(null));
  }, [caseId]);

  async function pagar() {
    setErr("");
    setLoading(true);

    try {
      const data = await fetchJson(`${API}/billing/checkout-dgt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case_id: caseId }),
      });

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error("No se recibió la URL de pago.");
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!caseId) {
    return (
      <div className="sr-card mt-6">
        <h3 className="sr-h3">Falta el expediente</h3>
        <p className="sr-p">No se ha podido identificar el expediente.</p>
      </div>
    );
  }

  if (!status?.authorized) {
    return (
      <div className="sr-card mt-6">
        <h3 className="sr-h3">Autorización necesaria</h3>

        <p className="sr-p">
          Antes de pagar necesitamos tu autorización expresa para actuar en tu nombre y gestionar el recurso.
        </p>

        {manualReviewMode && (
          <div className="sr-card" style={{ marginTop: 12, background: "#fffbeb", border: "1px solid #fde68a" }}>
            <div className="sr-small" style={{ fontWeight: 900 }}>
              🟡 Revisión manual antes de presentar
            </div>
            <div className="sr-small" style={{ marginTop: 6 }}>
              Podrás continuar aunque la viabilidad no sea alta. Nuestro equipo revisará el expediente antes de
              presentar nada oficialmente.
            </div>
          </div>
        )}

        <div className="sr-card" style={{ marginTop: 12 }}>
          <div className="sr-small" style={{ fontWeight: 800 }}>Orden del proceso</div>
          <div className="sr-small" style={{ marginTop: 6 }}>1. Autorizar gestión</div>
          <div className="sr-small">2. Pagar</div>
          <div className="sr-small">3. Revisión manual del expediente</div>
          <div className="sr-small">4. Presentación y justificante si procede</div>
        </div>

        <div className="sr-cta-row" style={{ justifyContent: "flex-start", marginTop: 14 }}>
          <button
            className="sr-btn-primary"
            onClick={() => {
              window.location.href = `/#/autorizar?case=${encodeURIComponent(caseId)}`;
            }}
          >
            Autorizar primero
          </button>
        </div>
      </div>
    );
  }

  if (!status || status.payment_status !== "paid") {
    return (
      <div className="sr-card mt-6">
        <h3 className="sr-h3">Continuar con revisión y gestión</h3>

        <p className="sr-p">
          Ya tenemos tu autorización. Ahora puedes pagar para que revisemos manualmente el expediente y,
          si está en plazo, preparemos la presentación del recurso.
        </p>

        {manualReviewMode && (
          <div className="sr-card" style={{ marginTop: 12, background: "#ecfdf5", border: "1px solid #bbf7d0" }}>
            <div className="sr-small" style={{ fontWeight: 900, color: "#166534" }}>
              ✅ Modo revisión manual activo
            </div>
            <div className="sr-small" style={{ marginTop: 6, color: "#166534" }}>
              No bloqueamos por viabilidad baja/media. Solo bloqueamos si el plazo está vencido.
            </div>
          </div>
        )}

        {quote && quote.ok && (
          <div className="sr-card" style={{ marginTop: 12 }}>
            <div className="sr-small" style={{ fontWeight: 800 }}>Tu precio</div>
            <div className="sr-small">
              Revisión y gestión del recurso: <b>{(quote.base_cents / 100).toFixed(2)} €</b>
            </div>
            <div className="sr-small">
              Documentos extra ({quote.docs_extra} × {(quote.extra_cents / 100).toFixed(2)} €):{" "}
              <b>{((quote.docs_extra * quote.extra_cents) / 100).toFixed(2)} €</b>
            </div>
            <div className="sr-small" style={{ marginTop: 6 }}>
              Total: <b>{(quote.total_cents / 100).toFixed(2)} €</b>
            </div>
            <div className="sr-small" style={{ marginTop: 6, color: "#6b7280" }}>
              El importe se calcula automáticamente según la documentación del expediente.
            </div>
          </div>
        )}

        {err && (
          <div className="sr-small" style={{ color: "#991b1b", marginTop: 10 }}>
            ❌ {err}
          </div>
        )}

        <div className="sr-cta-row" style={{ justifyContent: "flex-start", marginTop: 14 }}>
          <button className="sr-btn-primary" onClick={pagar} disabled={loading}>
            {loading ? "Redirigiendo…" : "Pagar y enviar a revisión"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sr-card mt-6">
      <h3 className="sr-h3">Expediente en revisión manual</h3>
      <p className="sr-p">
        Pago y autorización registrados correctamente. Nuestro equipo revisará el expediente antes de presentar
        el recurso y te avisará cuando haya una decisión o justificante.
      </p>
    </div>
  );
}
