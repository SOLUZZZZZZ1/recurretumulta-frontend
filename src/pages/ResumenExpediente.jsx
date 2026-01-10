// src/pages/ResumenExpediente.jsx — resumen claro del expediente (MVP)
import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import Seo from "../components/Seo.jsx";
import GenerateRecursoDGT from "../components/GenerateRecursoDGT.jsx";
import PagarPresentar from "../components/PagarPresentar.jsx";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function Row({ label, value }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 10, padding: "8px 0", borderBottom: "1px solid #e5e7eb" }}>
      <div className="sr-small" style={{ fontWeight: 800, color: "#374151" }}>{label}</div>
      <div className="sr-p" style={{ margin: 0, color: "#111827" }}>{value ?? <span style={{ color: "#6b7280" }}>—</span>}</div>
    </div>
  );
}

export default function ResumenExpediente() {
  const q = useQuery();
  const caseId = q.get("case") || null;

  let raw = null;
  try { raw = JSON.parse(localStorage.getItem("rtm_last_analysis") || "null"); } catch {}

  const wrapper = raw?.extracted || null;
  const extracted = wrapper?.extracted || null;

  const organismo = extracted?.organismo || null;
  const expediente = extracted?.expediente_ref || null;
  const importe = extracted?.importe != null ? `${extracted.importe} €` : null;
  const notif = extracted?.fecha_notificacion || null;
  const docDate = extracted?.fecha_documento || null;
  const tipo = extracted?.tipo_sancion || null;
  const finVia = extracted?.pone_fin_via_administrativa;
  const plazo = extracted?.plazo_recurso_sugerido || null;
  const obs = extracted?.observaciones || null;

  const suggestedTipo = finVia === true ? "reposicion" : null;

  return (
    <>
      <Seo
        title="Resumen del expediente · RecurreTuMulta"
        description="Resumen del análisis y siguientes pasos del expediente."
        canonical="https://www.recurretumulta.eu/resumen"
      />

      <main className="sr-container py-12" style={{ minHeight: "calc(100vh - 160px)" }}>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <h1 className="sr-h1">Resumen del expediente</h1>
          <Link to="/" className="sr-btn-secondary">← Volver</Link>
        </div>

        <div className="sr-card">
          <Row label="Expediente interno" value={caseId} />
          <Row label="Organismo" value={organismo} />
          <Row label="Nº expediente (DGT)" value={expediente} />
          <Row label="Importe" value={importe} />
          <Row label="Fecha notificación" value={notif} />
          <Row label="Fecha documento" value={docDate} />
          <Row label="Tipo de sanción" value={tipo} />
          <Row label="Normativa aplicable (orientativa)" value="RDL 6/2015 (Ley de Tráfico); Ley 39/2015 (Procedimiento Administrativo Común)" />
          <Row label="Pone fin vía administrativa" value={finVia === true ? "Sí" : finVia === false ? "No" : "—"} />
          <Row label="Plazo sugerido" value={plazo} />

          <div style={{ paddingTop: 10 }}>
            <div className="sr-small" style={{ fontWeight: 800, color: "#374151", marginBottom: 6 }}>Observaciones</div>
            <div className="sr-p" style={{ margin: 0 }}>{obs || <span style={{ color: "#6b7280" }}>—</span>}</div>
          </div>

          <div className="sr-small" style={{ marginTop: 12, color: "#6b7280" }}>
            Importante: si presentas alegaciones, normalmente renuncias al descuento por pronto pago del 50% (si existía).
          </div>
        </div>

        <GenerateRecursoDGT caseId={caseId} suggestedTipo={suggestedTipo} />
      </main>
      <PagarPresentar caseId={caseId} productDefault="DGT_PRESENTACION" />
    </>
  );
}
