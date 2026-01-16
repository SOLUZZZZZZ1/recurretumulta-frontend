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

export default function ResumenExpediente() {
  const q = useQuery();
  const caseId = q.get("case") || "";

  const [analysis, setAnalysis] = useState(null);
  const [publicStatus, setPublicStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("rtm_last_analysis");
      if (raw) setAnalysis(JSON.parse(raw));
    } catch {}
  }, []);

  const extracted = analysis?.extracted?.extracted || analysis?.extracted || {};

  async function refresh(runReview = false) {
    if (!caseId) return;
    setErr("");
    setLoading(true);
    try {
      if (runReview) {
        await fetchJson(`${API}/cases/${encodeURIComponent(caseId)}/review`, {
          method: "POST",
        });
      }
      const st = await fetchJson(
        `${API}/cases/${encodeURIComponent(caseId)}/public-status`
      );
      setPublicStatus(st);
    } catch (e) {
      setErr(e.message || "No se pudo revisar el expediente.");
    } finally {
      setLoading(false);
    }
  }

  // Revisión automática al entrar
  useEffect(() => {
    if (!caseId) return;
    refresh(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  const status = publicStatus?.status || "uploaded";

  return (
    <>
      <Seo title="Resumen del expediente · RecurreTuMulta" />

      <main
        className="sr-container py-12"
        style={{ minHeight: "calc(100vh - 160px)" }}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <h1 className="sr-h1">Resumen del expediente</h1>
          <Link to="/" className="sr-btn-secondary">
            ← Volver
          </Link>
        </div>

        <div className="sr-card">
          <Row label="Expediente interno" value={caseId} />
          <Row label="Organismo" value={extracted.organismo || "—"} />
          <Row label="Referencia" value={extracted.expediente_ref || "—"} />
          <Row
            label="Tipo de escrito sugerido"
            value={extracted.tipo_recurso_sugerido || "Recurso administrativo"}
          />
          <Row
            label="Normativa aplicable"
            value={extracted.normativa_aplicable || "Ley 39/2015"}
          />

          <div style={{ marginTop: 10 }}>
            <div className="sr-small" style={{ fontWeight: 800 }}>
              Estado del expediente
            </div>
            <div className="sr-p" style={{ margin: 0 }}>
              {loading
                ? "Revisando documentación…"
                : publicStatus?.message || "—"}
            </div>
          </div>

          {err && (
            <div
              className="sr-small"
              style={{ marginTop: 10, color: "#991b1b" }}
            >
              ❌ {err}
            </div>
          )}

          <div
            className="sr-cta-row"
            style={{ justifyContent: "flex-start", marginTop: 12 }}
          >
            <button
              className="sr-btn-secondary"
              onClick={() => refresh(true)}
              disabled={loading}
            >
              {loading ? "Revisando…" : "Revisar de nuevo"}
            </button>
          </div>
        </div>

        {status === "pending_documents" && (
          <div style={{ marginTop: 14 }}>
            <div className="sr-card">
              <h3 className="sr-h3" style={{ marginTop: 0 }}>
                Expediente pendiente de documentación
              </h3>
              <p className="sr-p">
                Aún no se puede presentar el recurso. Si recibes una nueva
                notificación o resolución, súbela para completar el expediente.
              </p>
            

            <ContactoExpediente caseId={caseId} publicStatus={publicStatus} onSaved={() => refresh(false)} />
</div>

            <AppendDocuments caseId={caseId} onDone={() => refresh(true)} />
          </div>
        )}

        {status === "ready_to_pay" && (
          <div style={{ marginTop: 14 }}>
            <div className="sr-card">
              <h3 className="sr-h3" style={{ marginTop: 0 }}>
                Tu recurso puede presentarse ahora
              </h3>
              <p className="sr-p">
                Hemos revisado tu documentación y el recurso es viable en este
                momento. Si quieres, podemos presentarlo en tu nombre.
              </p>
            </div>

            <PagarPresentar caseId={caseId} />
          </div>
        )}

        {status !== "pending_documents" && status !== "ready_to_pay" && (
          <div style={{ marginTop: 14 }} className="sr-card">
            <h3 className="sr-h3" style={{ marginTop: 0 }}>
              Expediente en revisión
            </h3>
            <p className="sr-p">
              Estamos revisando tu documentación. Te indicaremos cuándo se puede
              presentar correctamente.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
