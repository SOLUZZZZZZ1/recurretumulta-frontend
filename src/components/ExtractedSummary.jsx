// src/components/ExtractedSummary.jsx
import React from "react";

function Row({ label, value }) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"220px 1fr",gap:10,padding:"8px 0",borderBottom:"1px solid #e5e7eb"}}>
      <div className="sr-small" style={{fontWeight:800,color:"#374151"}}>{label}</div>
      <div className="sr-p" style={{margin:0}}>{value ?? <span style={{color:"#6b7280"}}>—</span>}</div>
    </div>
  );
}

function Badge({ children }) {
  return (
    <span style={{padding:"4px 10px",borderRadius:9999,background:"rgba(15,23,42,.08)",fontSize:12,fontWeight:800}}>
      {children}
    </span>
  );
}

export default function ExtractedSummary({ data }) {
  const wrapper = data?.extracted;
  const extracted = wrapper?.extracted;
  const storage = wrapper?.storage;
  const caseId = data?.case_id;

  if (!extracted) return null;

  return (
    <div className="sr-card" style={{marginTop:14}}>
      <div className="flex justify-between items-center mb-3 gap-2 flex-wrap">
        <div>
          <h3 className="sr-h3">Resultado del análisis</h3>
          <div className="sr-small">Expediente interno: <code>{caseId}</code></div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {extracted.organismo && <Badge>{extracted.organismo}</Badge>}
          {extracted.plazo_recurso_sugerido && <Badge>Plazo: {extracted.plazo_recurso_sugerido}</Badge>}
        </div>
      </div>

      <Row label="Organismo" value={extracted.organismo} />
      <Row label="Nº expediente" value={extracted.expediente_ref} />
      <Row label="Importe" value={extracted.importe ? `${extracted.importe} €` : null} />
      <Row label="Fecha notificación" value={extracted.fecha_notificacion} />
      <Row label="Fecha documento" value={extracted.fecha_documento} />
      <Row label="Tipo sanción" value={extracted.tipo_sancion} />
      <Row label="Normativa aplicable"
           value="Real Decreto Legislativo 6/2015 (Ley de Tráfico); Ley 39/2015            (Procedimiento Administrativo Común)"
     />


      <div style={{marginTop:10}}>
        <div className="sr-small" style={{fontWeight:800}}>Observaciones</div>
        <div className="sr-p">{extracted.observaciones || "—"}</div>
      </div>

      {storage && (
        <div className="sr-small" style={{marginTop:10,color:"#6b7280"}}>
          Archivo guardado: <code>{storage.bucket}/{storage.key}</code>
        </div>
      )}
    </div>
  );
}
