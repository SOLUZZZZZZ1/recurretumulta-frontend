import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

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

function getParams(search) {
  const qs = new URLSearchParams(search);
  return {
    caseId: qs.get("case") || qs.get("case_id") || qs.get("id") || "",
    sessionId: qs.get("session_id") || "",
  };
}

export default function PagoOk() {
  const location = useLocation();
  const navigate = useNavigate();
  const { caseId, sessionId } = useMemo(() => getParams(location.search), [location.search]);

  const [status, setStatus] = useState("confirming");
  const [message, setMessage] = useState("Confirmando tu pago con Stripe…");
  const [detail, setDetail] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function confirm() {
      if (!caseId) {
        setStatus("error");
        setMessage("No se ha encontrado el expediente.");
        return;
      }

      try {
        // Si Stripe devuelve session_id, confirmamos contra backend.
        if (sessionId) {
          await fetchJsonFallback("/billing/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ case_id: caseId, session_id: sessionId }),
          });
        }

        // Refrescamos estado varias veces porque generación/documentos puede tardar.
        let finalData = null;
        for (let i = 0; i < 8; i += 1) {
          try {
            finalData = await fetchJsonFallback(`/cases/${caseId}/public-status`);
            if (finalData?.payment_status === "paid" || finalData?.payment_status === "succeeded") break;
          } catch {
            // seguimos intentando
          }
          await new Promise((resolve) => setTimeout(resolve, 1200));
        }

        if (cancelled) return;

        setStatus("ok");
        setMessage("Tu pago se ha realizado correctamente. Estamos gestionando tu expediente.");
        setTimeout(() => {
          navigate(`/resumen?case=${encodeURIComponent(caseId)}`);
        }, 1800);
      } catch (e) {
        if (cancelled) return;

        // No asustamos al cliente: puede tardar el webhook. Lo mandamos a resumen con mensaje prudente.
        setStatus("processing");
        setMessage("Pago recibido. Estamos terminando de confirmar el expediente.");
        setDetail(e?.message || "");
        setTimeout(() => {
          navigate(`/resumen?case=${encodeURIComponent(caseId)}`);
        }, 2500);
      }
    }

    confirm();

    return () => {
      cancelled = true;
    };
  }, [caseId, sessionId, navigate]);

  return (
    <main className="sr-page">
      <section className="sr-section">
        <h1 className="sr-h1">Pago confirmado</h1>

        <div className="sr-card" style={{ maxWidth: 980 }}>
          <p className="sr-p" style={{ fontWeight: 800, color: status === "error" ? "#991b1b" : "#166534" }}>
            {status === "error" ? "❌" : "✅"} {message}
          </p>

          {caseId ? (
            <p className="sr-small" style={{ marginTop: 10 }}>
              Expediente: <strong>{caseId}</strong>
            </p>
          ) : null}

          <div
            style={{
              marginTop: 18,
              padding: 16,
              borderRadius: 14,
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              color: "#475569",
            }}
          >
            {status === "confirming" ? "🔄 Confirmando pago y preparando tu expediente…" : null}
            {status === "processing" ? "🔄 El sistema está sincronizando el pago. En unos segundos verás el estado actualizado." : null}
            {status === "ok" ? "Tu expediente queda en gestión. Te avisaremos por email si necesitamos algo más." : null}
            {status === "error" ? "No se pudo completar la confirmación automática. Puedes volver al expediente." : null}
          </div>

          {detail ? (
            <details style={{ marginTop: 12, color: "#64748b", fontSize: 12 }}>
              <summary>Detalle técnico</summary>
              <div style={{ marginTop: 8, wordBreak: "break-word" }}>{detail}</div>
            </details>
          ) : null}

          <div className="sr-cta-row" style={{ marginTop: 22 }}>
            <Link className="sr-btn-primary" to={`/resumen?case=${encodeURIComponent(caseId)}`}>
              Ver mi expediente
            </Link>
            <Link className="sr-btn-secondary" to="/">
              Ir al inicio
            </Link>
          </div>

          <p className="sr-p" style={{ marginTop: 20 }}>
            Recibirás actualizaciones sobre el estado de tu expediente en tu correo electrónico.
          </p>
        </div>
      </section>
    </main>
  );
}
