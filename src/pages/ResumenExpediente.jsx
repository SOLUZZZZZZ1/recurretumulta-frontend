// src/pages/ResumenExpediente.jsx — Resumen público (sin generación antes de pago)
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Seo from "../components/Seo.jsx";
import PagarPresentar from "../components/PagarPresentar.jsx";

const API = "/api";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

function Row({ label, value }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 10, padding: "8px 0", borderBottom: "1px solid #e5e7eb" }}>
      <div className="sr-small" style={{ fontWeight: 800 }}>{label}</div>
      <div className="sr-p" style={{ margin: 0 }}>{value ?? "—"}</div>
    </div>
  );
}

export default function ResumenExpediente() {
  const q = useQuery();
  const caseId = q.get("case");

  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("rtm_last_analysis");
      if (raw) setAnalysis(JSON.parse(raw));
    } catch {}
  }, []);

  const extracted = analysis?.extracted?.extracted || analysis?.extracted || {};

  return (
    <>
      <Seo title="Resumen del expediente · RecurreTuMulta" />

      <main className="sr-container py-12">
        <div className="flex items-center justify-between mb-4">
          <h1 className="sr-h1">Resumen del expediente</h1>
          <Link to="/" className="sr-btn-secondary">← Volver</Link>
        </div>

        <div className="sr-card">
          <Row label="Expediente interno" value={caseId} />
          <Row label="Organismo" value={extracted.organismo} />
          <Row label="Referencia" value={extracted.expediente_ref} />
          <Row label="Fecha documento" value={extracted.fecha_documento} />
          <Row label="Tipo de escrito sugerido" value={extracted.tipo_recurso_sugerido || "Recurso administrativo"} />
          <Row label="Normativa aplicable" value={extracted.normativa_aplicable || "Ley 39/2015"} />

          {extracted.observaciones && (
            <div style={{ marginTop: 10 }}>
              <div className="sr-small" style={{ fontWeight: 800 }}>Observaciones</div>
              <div className="sr-p">{extracted.observaciones}</div>
            </div>
          )}
        </div>

        {/* SOLO PAGO Y AUTORIZACIÓN */}
        <PagarPresentar caseId={caseId} />
      </main>
    </>
  );
}
