import React, { useState } from "react";

const API = "/api";

export default function PagarPresentar({ caseId, productDefault = "DGT_PRESENTACION" }) {
  const [email, setEmail] = useState("");
  const [product, setProduct] = useState(productDefault);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function goCheckout() {
    setMsg("");
    if (!caseId) return setMsg("Falta el expediente interno.");
    if (!email.trim()) return setMsg("Introduce un email válido.");

    setLoading(true);
    try {
      const r = await fetch(`${API}/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case_id: caseId, product, email, locale: "es" }),
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data?.ok || !data?.url) {
        throw new Error(data?.detail || data?.message || "No se pudo iniciar el pago.");
      }

      window.location.href = data.url;
    } catch (e) {
      setMsg(e?.message || "Error al iniciar el pago.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sr-card" style={{ marginTop: 14 }}>
      <h3 className="sr-h3" style={{ marginTop: 0 }}>Presentar por nosotros</h3>
      <p className="sr-p">
        Pagas solo si presentamos el recurso en tu nombre y te entregamos el justificante oficial.
      </p>

      <div className="grid gap-4" style={{ maxWidth: 520 }}>
        <div>
          <label className="sr-small" style={{ fontWeight: 800 }}>Email</label>
          <input
            className="sr-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@ejemplo.com"
            type="email"
          />
        </div>

        <div>
          <label className="sr-small" style={{ fontWeight: 800 }}>Servicio</label>
          <select className="sr-input" value={product} onChange={(e) => setProduct(e.target.value)}>
            <option value="DGT_PRESENTACION">DGT — 29,90 €</option>
            <option value="AYTO_PRESENTACION">Ayuntamiento/CCAA — 34,90 €</option>
            <option value="CASO_COMPLEJO">Caso complejo — 49,90 €+</option>
          </select>
        </div>

        <button className="sr-btn-primary" onClick={goCheckout} disabled={loading}>
          {loading ? "Redirigiendo a pago…" : "Pagar y presentar"}
        </button>

        {msg && (
          <div className="sr-small" style={{ color: "#991b1b" }}>
            ❌ {msg}
          </div>
        )}

        <div className="sr-small" style={{ color: "#6b7280" }}>
          Importante: el pago desbloquea la presentación. El resultado del recurso no está garantizado.
        </div>
      </div>
    </div>
  );
}
